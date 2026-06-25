"""FastAPI application for the Credit Risk Dashboard."""

from __future__ import annotations

import uuid
from fastapi.responses import FileResponse, JSONResponse

GLOBAL_DF = None

import json
import os
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
from dotenv import load_dotenv 
from fastapi import FastAPI, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from backend.validator import validate_dataset
from backend.pipeline import CreditRiskPipeline, PipelineError
from backend.dqa import build_dqa_report

# Import our AI Agents & PDF Generator
from backend.dqa_agent import generate_agentic_dqa_insights, generate_single_feature_dossier, chat_with_copilot
from backend.report_generator import generate_executive_pdf
from backend.monitoring_agent import generate_monitoring_report, generate_chart_insight, generate_threshold_optimization, monitoring_chat_copilot
load_dotenv()

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}

app = FastAPI(
    title="Credit Risk Dashboard API",
    description="API for credit-risk validation, prediction, and segmentation.",
    version="1.0.0",
)

allowed_origin = os.environ.get("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@lru_cache(maxsize=1)
def get_pipeline() -> CreditRiskPipeline:
    return CreditRiskPipeline()

@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Credit Risk Dashboard API Running"}


# ── PDF Export Endpoint ──────────────────────────────────────────────────
@app.post("/export-pdf")
async def export_pdf(payload: dict, background_tasks: BackgroundTasks):
    try:
        pdf_path = generate_executive_pdf(payload)
        background_tasks.add_task(os.remove, pdf_path)
        return FileResponse(
            path=pdf_path, 
            filename="Executive_Audit_Report.pdf", 
            media_type="application/pdf"
        )
    except Exception as exc:
        print("PDF GENERATION ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {exc}")


# ── Chatbot & Persona Endpoint ───────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    messages: list[ChatMessage]
    context_summary: str = ""
    persona: str = "Credit Risk Analyst"

@app.post("/chat")
async def copilot_chat(payload: ChatPayload):
    global GLOBAL_DF
    try:
        msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
        reply = await chat_with_copilot(msgs, payload.context_summary, payload.persona)
        
        # --- THE MAGIC INTERCEPTOR ---
        if "|||ACTION:BIN_DATA|||" in reply and GLOBAL_DF is not None:
            df_binned = GLOBAL_DF.copy()
            numeric_cols = df_binned.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                col_to_bin = numeric_cols[0]
                df_binned[f"{col_to_bin}_Risk_Bands"] = pd.qcut(df_binned[col_to_bin], q=3, labels=["Low Risk", "Medium Risk", "High Risk"], duplicates='drop')
                
                file_id = str(uuid.uuid4())
                os.makedirs("tmp", exist_ok=True)
                df_binned.to_csv(f"tmp/remediated_{file_id}.csv", index=False)
                reply = reply.replace("|||ACTION:BIN_DATA|||", f"|||DOWNLOAD_FILE:{file_id}|||")

        elif "|||ACTION:IMPUTE_MISSING|||" in reply and GLOBAL_DF is not None:
            df_imputed = GLOBAL_DF.copy()
            
            # Find columns with nulls and fill with median
            cols_with_nulls = df_imputed.columns[df_imputed.isnull().any()]
            for col in cols_with_nulls:
                if pd.api.types.is_numeric_dtype(df_imputed[col]):
                    df_imputed[col] = df_imputed[col].fillna(df_imputed[col].median())
            
            file_id = str(uuid.uuid4())
            os.makedirs("tmp", exist_ok=True)
            df_imputed.to_csv(f"tmp/remediated_{file_id}.csv", index=False)
            reply = reply.replace("|||ACTION:IMPUTE_MISSING|||", f"|||DOWNLOAD_FILE:{file_id}|||")
        
        return {"reply": reply}
    except Exception as e:
        print("CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# ── Single Feature On-Demand Dossier Endpoint ───────────────────────
class SingleFeaturePayload(BaseModel):
    feature_name: str
    anomaly_type: str      
    dataset_profile: dict  

@app.post("/generate-dossier")
async def generate_dossier(payload: SingleFeaturePayload):
    try:
        result = await generate_single_feature_dossier(
            payload.feature_name, 
            payload.anomaly_type, 
            payload.dataset_profile
        )
        return result 
    except Exception as e:
        print("DOSSIER ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# ── NEW: Dedicated Monitoring Agent Endpoint ─────────────────────────────
class MonitoringPayload(BaseModel):
    history: list[dict]

@app.post("/agents/monitoring")
async def run_monitoring_agent(payload: MonitoringPayload):
    """Triggers the SR 11-7 Model Evaluation Agent."""
    try:
        report = await generate_monitoring_report(payload.history)
        return {"report_markdown": report}
    except Exception as e:
        print("MONITORING AGENT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

class ChartInsightPayload(BaseModel):
    chart_type: str
    chart_data: Any

@app.post("/agents/chart-insight")
async def get_chart_insight(payload: ChartInsightPayload):
    """Generates a micro-insight for a specific chart on demand."""
    try:
        insight = await generate_chart_insight(payload.chart_type, payload.chart_data)
        return {"insight": insight}
    except Exception as e:
        print("CHART INSIGHT API ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
class ThresholdPayload(BaseModel):
    confusion_matrix: dict

@app.post("/agents/optimize-threshold")
async def optimize_threshold_endpoint(payload: ThresholdPayload):
    """Generates a prescriptive threshold shift recommendation."""
    try:
        recommendation = await generate_threshold_optimization(payload.confusion_matrix)
        return {"recommendation": recommendation}
    except Exception as e:
        print("OPTIMIZATION API ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/chat-monitoring")
async def chat_monitoring_endpoint(payload: ChatPayload):
    try:
        msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
        reply = await monitoring_chat_copilot(msgs, payload.context_summary, payload.persona)
        return {"reply": reply}
    except Exception as e:
        print("MONITORING CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# ── Main Data Quality Endpoints ──────────────────────────────────────────
def build_data_quality_report(validation_result: dict[str, Any]) -> dict[str, Any]:
    issue_log = []
    recommendations = []

    if validation_result.get("missing_columns"):
        issue_log.append({
            "issue": "Missing Columns",
            "detail": f"Required column(s) absent: {', '.join(validation_result['missing_columns'])}.",
            "severity": "Critical",
        })
        recommendations.append({
            "issue": "Missing Columns",
            "severity": "Critical",
            "recommendation": "Schema correction required. Ensure all required columns are present.",
        })

    if validation_result.get("duplicate_rows", 0) > 0:
        issue_log.append({
            "issue": "Duplicate Rows",
            "detail": f"{validation_result['duplicate_rows']:,} duplicate row(s) found.",
            "severity": "High",
        })
        recommendations.append({
            "issue": "Duplicate Rows",
            "severity": "High",
            "recommendation": "Remove duplicate records before modeling.",
        })

    if validation_result.get("missing_values", 0) > 0:
        issue_log.append({
            "issue": "Missing Values",
            "detail": f"{validation_result['missing_values']:,} missing value(s) detected.",
            "severity": "Medium",
        })
        recommendations.append({
            "issue": "Missing Values",
            "severity": "Medium",
            "recommendation": "Impute or remove missing values before modeling.",
        })

    return {
        "data_quality_report": validation_result,
        "issue_log": issue_log,
        "recommendations": recommendations,
    }

@app.get("/download/{file_id}")
async def download_remediated_file(file_id: str):
    file_path = f"tmp/remediated_{file_id}.csv"
    if os.path.exists(file_path):
        return FileResponse(path=file_path, filename="AI_Remediated_Portfolio.csv", media_type='text/csv')
    raise HTTPException(status_code=404, detail="File not found.")

@app.post("/data-quality")
async def data_quality(file: UploadFile = File(...)) -> JSONResponse:
    global GLOBAL_DF
    try:
        dataframe = await _read_uploaded_dataframe(file)
        GLOBAL_DF = dataframe.copy()
        dqa_raw_report = build_dqa_report(dataframe)
        
        ai_insights = await generate_agentic_dqa_insights(
            dataset_profile=dqa_raw_report.get("dataset_profile", {}),
            missing_value_log=dqa_raw_report.get("missing_value_analysis", []),
            duplicate_log=dqa_raw_report.get("duplicate_analysis", []),
            outlier_log=dqa_raw_report.get("outlier_analysis", [])
        )
        
        response_body = {
            "dataset_profile":        dqa_raw_report.get("dataset_profile"),
            "missing_value_analysis": dqa_raw_report.get("missing_value_analysis"),
            "duplicate_analysis":     dqa_raw_report.get("duplicate_analysis"),
            "outlier_analysis":       dqa_raw_report.get("outlier_analysis"),
            "issue_log":              dqa_raw_report.get("issue_log"),
            "recommendations":        dqa_raw_report.get("recommendations"),
            "deterministic_assessment": dqa_raw_report.get("dqa_assessment"),
        }
        
        if ai_insights:
            response_body["ai_assessment"] = ai_insights
            
        return JSONResponse(content=response_body)
        
    except HTTPException:
        raise
    except Exception as exc:
        print("ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    prediction_threshold: float = Form(0.50),
    good_threshold: float = Form(0.30),
    bad_threshold: float = Form(0.70),
) -> JSONResponse:
    try:
        dataframe = await _read_uploaded_dataframe(file)
        result = get_pipeline().run(
            dataframe,
            prediction_threshold=prediction_threshold,
            good_threshold=good_threshold,
            bad_threshold=bad_threshold,
        )
        response_body = _build_response(result)

        metrics = result.get("metrics", {})
        gini = metrics.get("gini", 0)
        auc = metrics.get("auc", 0)
        avg_pd = dataframe["probability_of_default"].mean() if "probability_of_default" in dataframe.columns else 0
        default_rate = dataframe["actual_default"].mean() if "actual_default" in dataframe.columns else 0

        baseline_q1 = {
            "quarter": "Q1",
            "total_accounts": len(dataframe),
            "avg_pd": round(float(avg_pd), 4),
            "default_rate": round(float(default_rate), 4),
            "gini": round(float(gini), 4),
            "auc": round(float(auc), 4),
        }
        save_history([baseline_q1]) 
        response_body["history"] = [baseline_q1]

        return JSONResponse(content=response_body)
    except HTTPException:
        raise
    except PipelineError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        print("ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc

async def _read_uploaded_dataframe(file: UploadFile) -> pd.DataFrame:
    filename = file.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    buffer = BytesIO(content)

    try:
        if extension == ".csv":
            dataframe = pd.read_csv(buffer)
        else:
            dataframe = pd.read_excel(buffer)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to read file: {exc}") from exc

    if dataframe.empty:
        raise HTTPException(status_code=400, detail="Uploaded file does not contain any data rows.")

    return dataframe


def _build_response(result: dict[str, Any]) -> dict[str, Any]:
    segment_summary = result["segment_summary"]
    segment_summary_payload = (
        segment_summary.to_dict(orient="records")
        if isinstance(segment_summary, pd.DataFrame)
        else segment_summary
    )

    predictions_df = result["predictions"]

    pd_values = (
        predictions_df["probability_of_default"].round(4).tolist()
        if "probability_of_default" in predictions_df.columns
        else []
    )

    return {
        "validation_report":  result["validation_report"],
        "metrics":            result.get("metrics"),
        "roc_data":           result.get("roc_data"),
        "confusion_matrix":   result.get("confusion_matrix"),
        "segment_summary":    segment_summary_payload,
        "pd_values":          pd_values,
        "pd_decile_analysis": result.get("pd_decile_analysis"),
        "scorecard_data": (
            predictions_df[
                [col for col in ["probability_of_default", "prediction", "actual_default"]
                 if col in predictions_df.columns]
            ].to_dict(orient="records")
            if "probability_of_default" in predictions_df.columns
            else []
        ),
        "score_band_analysis": result.get("score_band_analysis"),
    }

HISTORY_FILE = "model_history.json"

def load_history() -> list[dict]:
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return []

def save_history(history: list[dict]):
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=4)

@app.post("/upload-quarter")
async def upload_quarter(
    file: UploadFile = File(...),
    quarter_label: str = Form(...) 
) -> JSONResponse:
    try:
        dataframe = await _read_uploaded_dataframe(file)
        result = get_pipeline().run(dataframe)
        
        metrics = result.get("metrics", {})
        gini = metrics.get("gini", 0)
        auc = metrics.get("auc", 0)
        avg_pd = dataframe["probability_of_default"].mean() if "probability_of_default" in dataframe else 0
        default_rate = dataframe["actual_default"].mean() if "actual_default" in dataframe else 0
        
        quarter_data = {
            "quarter": quarter_label,
            "total_accounts": len(dataframe),
            "avg_pd": round(float(avg_pd), 4),
            "default_rate": round(float(default_rate), 4),
            "gini": round(float(gini), 4),
            "auc": round(float(auc), 4),
        }
        
        history = load_history()
        history = [h for h in history if h["quarter"] != quarter_label]
        history.append(quarter_data)
        save_history(history)
        
        full_response = _build_response(result)
        full_response["history"] = history
        full_response["message"] = f"{quarter_label} processed successfully"
        
        return JSONResponse(content=full_response)
        
    except Exception as exc:
        print("QUARTER UPLOAD ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/monitoring-history")
def get_monitoring_history():
    return JSONResponse(content={"history": load_history()})

@app.delete("/clear-history")
def clear_monitoring_history():
    save_history([])
    return JSONResponse(content={"message": "History cleared."})