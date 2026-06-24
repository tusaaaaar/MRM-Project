import os
import json
from openai import AsyncAzureOpenAI

async def generate_monitoring_report(history: list[dict]) -> str:
    """
    Acts as an autonomous SR 11-7 Validator Agent. 
    Analyzes multi-quarter drift and generates a corporate Markdown report
    using Azure OpenAI.
    """
    # Fetch Azure credentials from environment
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")

    if not all([endpoint, api_key, deployment_name, api_version]):
        return "⚠️ **Error:** Azure OpenAI credentials are missing from your .env file."

    # Initialize the asynchronous Azure OpenAI Client
    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version
    )

    # The strict persona and formatting instructions
    system_prompt = """
    You are an expert Chief Risk Officer and SR 11-7 Model Validator at a top-tier bank.
    Your objective is to analyze the provided multi-quarter credit risk model tracking data.
    
    You must identify:
    1. Concept Drift (Is the Gini coefficient degrading?)
    2. Macroeconomic Shifts (Is the actual default rate rising?)
    
    Structure your response strictly in Markdown using the following sections:
    - **Executive Summary** (1 paragraph)
    - **Drift Diagnostics** (Bullet points on key quarter-over-quarter drops)
    - **Portfolio Health** (Commentary on default rates vs predicted PD)
    - **Actionable Recommendation** (Do we Retrain, Recalibrate, or Monitor?)
    
    Do NOT output raw JSON. Keep the tone highly professional, objective, and urgent if the Gini drops below 0.25.
    """

    user_prompt = f"Here is the multi-quarter model performance data:\n{json.dumps(history, indent=2)}"

    try:
        response = await client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # temperature=0.2, 
            # max_completion_tokens=1500  # <--- UPDATED HERE
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"AZURE OPENAI AGENT ERROR: {repr(e)}")
        return "⚠️ **Agent Failure:** Unable to connect to Azure OpenAI to generate the validation report at this time."


async def generate_chart_insight(chart_type: str, chart_data: dict | list) -> str:
    """
    Generates a 2-sentence micro-insight for a specific chart.
    """
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")

    if not all([endpoint, api_key, deployment_name, api_version]):
        return "⚠️ Azure API keys missing."

    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version
    )

    system_prompt = f"""
    You are a Credit Risk AI Co-Pilot. The user is looking at the '{chart_type}' chart for the current quarter.
    Analyze the provided JSON data for this chart and write exactly 2 concise sentences explaining the business impact to a non-technical executive. 
    Focus on risk, revenue, or model accuracy. Do not use markdown headers.
    """

    user_prompt = f"Chart Data: {json.dumps(chart_data)}"

    try:
        response = await client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # temperature=0.2,
            # max_completion_tokens=150  # <--- UPDATED HERE
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"CHART INSIGHT ERROR: {repr(e)}")
        return "Unable to generate insight at this time."
    
async def generate_threshold_optimization(cm_data: dict) -> str:
    """
    Acts as a Prescriptive AI. Analyzes the confusion matrix and recommends 
    a strategic threshold shift to balance False Positives and False Negatives.
    """
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")

    if not all([endpoint, api_key, deployment_name, api_version]):
        return "⚠️ Azure API keys missing."

    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version
    )

    system_prompt = """
    You are an AI Risk Strategist. The current default probability cutoff threshold is 0.50.
    Look at the provided Confusion Matrix. 
    - If False Positives (Type I) are overwhelming True Positives, the model is too conservative. Recommend RAISING the threshold (e.g., 0.55 - 0.60) to stop rejecting good customers.
    - If False Negatives (Type II) are too high, the model is too risky. Recommend LOWERING the threshold (e.g., 0.40 - 0.45) to catch more defaults.
    
    Write exactly 2-3 sentences. Start with a direct recommendation (e.g., "Action Required: Shift approval threshold to 0.58."). Be authoritative and quantitative. Do not use markdown headers.
    """

    user_prompt = f"Current Confusion Matrix: {json.dumps(cm_data)}"

    try:
        response = await client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            # temperature=0.2
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OPTIMIZATION ERROR: {repr(e)}")
        return "⚠️ Unable to generate optimization strategy at this time."