"""FastAPI application for the Credit Risk Dashboard."""

from __future__ import annotations

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

# Import our AI Agent & PDF Generator
from backend.dqa_agent import generate_agentic_dqa_insights, generate_single_feature_dossier, chat_with_copilot
from backend.report_generator import generate_executive_pdf

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
    """
    Receives the full analysis payload, generates a PDF, and returns it.
    Deletes the PDF from the server immediately after sending.
    """
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
    persona: str = "Credit Risk Analyst" # Added persona routing

@app.post("/chat")
async def copilot_chat(payload: ChatPayload):
    try:
        msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
        reply = await chat_with_copilot(msgs, payload.context_summary, payload.persona)
        return {"reply": reply}
    except Exception as e:
        print("CHAT ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# ── NEW: Single Feature On-Demand Dossier Endpoint ───────────────────────
class SingleFeaturePayload(BaseModel):
    feature_name: str
    anomaly_type: str      # Changed from issue_type to match React
    dataset_profile: dict  # Changed from stats to match React

@app.post("/generate-dossier")
async def generate_dossier(payload: SingleFeaturePayload):
    try:
        result = await generate_single_feature_dossier(
            payload.feature_name, 
            payload.anomaly_type, 
            payload.dataset_profile
        )
        return result # Return raw dict so React can read it directly
    except Exception as e:
        print("DOSSIER ERROR:", repr(e))
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

@app.post("/data-quality")
async def data_quality(file: UploadFile = File(...)) -> JSONResponse:
    try:
        dataframe = await _read_uploaded_dataframe(file)
        dqa_raw_report = build_dqa_report(dataframe)
        
        # This will now only grab the top 5 for the initial load!
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