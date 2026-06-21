
"""
Agentic AI module for the Data Quality Assessment.
Configured for Enterprise Azure OpenAI infrastructure with domain-agnostic analysis.
"""

import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI 

load_dotenv()

# ── 1. Upgraded Structured Output Schemas ────────────────────────────────

class RemediationRecommendation(BaseModel):
    column: str = Field(description="The exact name of the column analyzed.")
    strategy: str = Field(description="A short, punchy 5-7 word title for the fix (e.g., 'Constrained KNN Temporal Regression').")
    justification: str = Field(description="Exactly 2 to 3 crisp bullet points explaining why this is better than the baseline.")
    confidence_level: str = Field(description="AI confidence percentage (e.g., '95%').")
    risk_impact: str = Field(description="Risk if left untreated: 'High', 'Medium', or 'Low'.")
    expected_outcome: str = Field(description="What happens after applying this fix (e.g., 'Retains 98% of variance').")

class AIQualityAssessment(BaseModel):
    executive_summary: str = Field(description="A 2-sentence board-ready assessment of the dataset's health.")
    business_impact: str = Field(description="How these data issues affect downstream business decisions and bottom line.")
    risk_implications: str = Field(description="Specific compliance and model stability risks (e.g., SR 11-7 warnings).")
    prioritized_action_plan: str = Field(description="A numbered, 3-step action plan for the data engineering team.")
    ai_recommendations: list[RemediationRecommendation] = Field(description="Context-aware fixing actions.")


# ── 2. The Dashboard Agent Logic (Batch / Initial Load) ──────────────────

async def generate_agentic_dqa_insights(
    dataset_profile: dict, 
    missing_value_log: list, 
    duplicate_log: list,
    outlier_log: list 
) -> dict:
    
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    deployment_name = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
    
    if not all([endpoint, api_key, deployment_name]):
        print("SYSTEM LOG: Missing Azure OpenAI credentials. Bypassing AI.")
        return {}

    client = AsyncAzureOpenAI(azure_endpoint=endpoint, api_key=api_key, api_version=api_version)

    actionable_missing = [m for m in missing_value_log if m.get("missing_percentage", 0) > 0]
    truncated_duplicates = duplicate_log[:5] 
    actionable_outliers = outlier_log[:5] if outlier_log else [] 

    payload = {
        "profile": dataset_profile,
        "missing_data": actionable_missing,
        "outliers_detected": actionable_outliers, 
        "duplicates": {
            "total_unique_ids_duplicated": len(duplicate_log),
            "sample_patterns": truncated_duplicates
        }
    }

    prompt = f"""
    Analyze the following statistical data quality report:
    {payload}
    
    1. Generate a comprehensive executive narrative (business impact, risk implications, action plan).
    2. Provide highly specific, context-aware remediation strategies. 
    3. Formatting Rule: Your 'strategy' MUST be a short 5-7 word title. Your 'justification' MUST be 2-3 crisp bullet points starting with a dash (-).
    """

    try:
        response = await client.beta.chat.completions.parse(
            model=deployment_name, 
            messages=[
                {"role": "system", "content": "You are a Lead Data Scientist and Core Systems Data Quality Auditor."},
                {"role": "user", "content": prompt}
            ],
            response_format=AIQualityAssessment, 
            # temperature=0.2
        )
        return response.choices[0].message.parsed.model_dump()
    except Exception as exc:
        print(f"Azure AI Generation Failed: {exc}")
        return {}


# ── 3. On-Demand Dossier Logic (Single Feature) ─────────────────────

async def generate_single_feature_dossier(feature_name: str, anomaly_type: str, dataset_profile: dict) -> dict:
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    deployment_name = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
    
    if not all([endpoint, api_key, deployment_name]):
        return {}

    client = AsyncAzureOpenAI(azure_endpoint=endpoint, api_key=api_key, api_version=api_version)

    prompt = f"""
    Analyze the '{anomaly_type}' data quality issue for the specific column '{feature_name}'.
    Dataset Context: {dataset_profile}
    
    Provide a highly specific, context-aware remediation strategy.
    Formatting Rule: Your 'strategy' MUST be a short 5-7 word title. Your 'justification' MUST be 2-3 crisp bullet points starting with a dash (-) explaining why it is better than a baseline dropna() approach.
    """

    try:
        response = await client.beta.chat.completions.parse(
            model=deployment_name, 
            messages=[
                {"role": "system", "content": "You are a Lead Data Scientist resolving data anomalies for credit risk modeling."},
                {"role": "user", "content": prompt}
            ],
            response_format=RemediationRecommendation, 
            # temperature=0.2
        )
        return response.choices[0].message.parsed.model_dump()
    except Exception as exc:
        print(f"Azure AI Single Feature Generation Failed: {exc}")
        return {}


# ── 4. The Upgraded Persona-Driven Chat Logic ────────────────────────────

async def chat_with_copilot(messages: list[dict], context_summary: str = "", persona: str = "Credit Risk Analyst") -> str:
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    deployment_name = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
    
    if not all([endpoint, api_key, deployment_name]):
        return "SYSTEM OFFLINE: Azure OpenAI credentials missing."

    client = AsyncAzureOpenAI(azure_endpoint=endpoint, api_key=api_key, api_version=api_version)

    if persona == "Data Quality Engineer":
        persona_instructions = "Speak to an engineer. Focus on actionable Python/pandas code, ETL pipelines, imputation logic, and technical implementation."
    else:
        persona_instructions = "Speak to an analyst. Focus on statistical modeling impact (Gini, IV, PD), SR 11-7 compliance, and downstream business risk."

    system_prompt = f"""
    You are an AI Model Risk Management (MRM) Auditor Copilot.
    
    CURRENT USER PERSONA: {persona}
    {persona_instructions}
    
    RULES:
    1. Maximum 3 sentences per response (unless providing a short code block).
    2. Use bullet points if listing more than two items.
    3. Be crisp, direct, and action-oriented. No fluff.
    4. Base your answers heavily on the Dashboard Context provided below.
    5. CRITICAL INSTRUCTION: At the very end of your response, you MUST provide exactly two logical follow-up questions the user could ask next. Append them using the exact delimiter `|||` like this:
       [Your main response text here]|||[First suggested question?]|||[Second suggested question?]
    
    Dashboard Context: {context_summary}
    """
    
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        response = await client.chat.completions.create(
            model=deployment_name, 
            messages=formatted_messages,
            # temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as exc:
        print(f"Chat failed: {exc}")
        return "Connection error to the Azure backend."