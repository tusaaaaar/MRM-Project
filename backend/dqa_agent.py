"""
Agentic AI module for the Data Quality Assessment.
Configured for Enterprise Azure OpenAI infrastructure with domain-agnostic analysis.
"""

import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import AsyncAzureOpenAI 

load_dotenv()

# ── 1. Structured Output Schemas (The API Contract) ───────────────────────
# Forced JSON formatting structure that maps seamlessly to any analytics dataset.

class RemediationRecommendation(BaseModel):
    column: str = Field(description="The exact name of the column analyzed.")
    strategy: str = Field(description="The recommended remediation strategy (e.g., KNN Imputation, Mode, Exclude, Cap Values).")
    justification: str = Field(description="The general technical and business rationale for this recommendation.")

class AIQualityAssessment(BaseModel):
    executive_summary: str = Field(description="A 3-sentence board-ready assessment of the dataset's structural modeling health.")
    business_impacts: list[str] = Field(description="A list of specific analytical risks this data quality poses to downstream logic or model training.")
    ai_recommendations: list[RemediationRecommendation] = Field(description="Context-aware fixing actions.")


# ── 2. The Agent Logic ───────────────────────────────────────────────────

async def generate_agentic_dqa_insights(
    dataset_profile: dict, 
    missing_value_log: list, 
    duplicate_log: list,
    outlier_log: list 
) -> dict:
    """
    Passes the statistical dataset report to Azure OpenAI to generate domain-agnostic risk insights.
    """
    
    # 1. Fetch Corporate Azure Credentials
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    deployment_name = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
    
    # Safety Check: Fallback to empty dict if credentials aren't loaded yet
    if not all([endpoint, api_key, deployment_name]):
        print("SYSTEM LOG: Missing Azure OpenAI credentials in .env file. Bypassing AI.")
        return {}

    # 2. Initialize the Secure Azure Client
    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version
    )

    # 3. THE CONTEXT DIET: Filter the data before sending to the LLM
    actionable_missing = [m for m in missing_value_log if m.get("missing_percentage", 0) > 0]
    truncated_duplicates = duplicate_log[:5] 
    actionable_outliers = outlier_log[:5] if outlier_log else [] 

    # 4. THE PAYLOAD: Assemble the condensed data
    payload = {
        "profile": dataset_profile,
        "missing_data": actionable_missing,
        "outliers_detected": actionable_outliers, 
        "duplicates": {
            "total_unique_ids_duplicated": len(duplicate_log),
            "sample_patterns": truncated_duplicates
        }
    }

    # 5. THE System PROMPT: Standard Data Science Persona
    prompt = f"""
    Analyze the following statistical data quality report generated from a newly ingested tabular dataset:
    
    {payload}
    
    Provide context-aware remediation strategies. Infer the semantic meaning of the features based on their column names.
    Do not give completely generic advice. State exactly how these specific data anomalies (missing values, duplicates, or extreme outliers) 
    will skew downstream metrics, aggregations, reporting data, or machine learning models if left untreated.
    """

    try:
        # 6. Execute Secure Azure OpenAI Call with Pydantic Enforcement
        response = await client.beta.chat.completions.parse(
            model=deployment_name, 
            messages=[
                {"role": "system", "content": "You are an expert Lead Data Scientist and Core Systems Data Quality Auditor."},
                {"role": "user", "content": prompt}
            ],
            response_format=AIQualityAssessment, 
            # temperature=0.2
        )
        
        # Extract the structured data and send it back to FastAPI
        return response.choices[0].message.parsed.model_dump()

    except Exception as exc:
        print(f"Azure AI Generation Failed: {exc}")
        return {}