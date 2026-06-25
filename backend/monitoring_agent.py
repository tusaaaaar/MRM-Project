import os
import json
from openai import AsyncAzureOpenAI

async def generate_monitoring_report(history: list[dict]) -> str:
    """
    Acts as an autonomous SR 11-7 Validator Agent. 
    Analyzes multi-quarter drift and generates a corporate Markdown report
    using Azure OpenAI, perfectly aligned with the Stage 1 KPI Rubric.
    """
    # Fetch Azure credentials from environment
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")

    if not all([endpoint, api_key, deployment_name, api_version]):
        return "⚠️ **Error:** Azure OpenAI credentials are missing from your .env file."

    client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version
    )

    # --- THE "GOD-MODE" STAGE 1 PROMPT ---
    system_prompt = """
    Role: You are an Agentic AI Model Monitoring Co-Pilot for a Chief Risk Officer.
    
    Context: You are analyzing a Stage 1 Dashboard KPI summary spanning multiple quarters of historical data.
    
    Task: Do not just list numbers. Provide a punchy, executive-level diagnostic summary exactly matching these 4 areas. Use these exact markdown headers:
    
    ### 1. Trend Analysis
    State whether model performance is improving or deteriorating quarter-over-quarter. Quantify the exact drop in Gini and KS statistics from the baseline quarter to the current quarter.
    
    ### 2. Calibration Health
    State whether calibration is broadly aligned at the aggregate portfolio level, or if the Average Predicted PD is drifting away from the Actual Default Rate.
    
    ### 3. Regulatory Thresholds
    Identify if any KPI has breached a regulatory monitoring threshold. Note: A Gini >= 0.55 is Green, 0.50-0.55 is Amber, and < 0.50 is a Red breach.
    
    ### 4. Traffic Light Status & Action Plan
    State the overall traffic-light status of the model based on the latest quarter (Green, Amber, or Red). Give one immediate recommendation on what area the data science team should focus on next (e.g., "Proceed to Stage 2: Segment-level drill-down to identify root cause" or "Variable drift analysis").
    
    Tone: Highly professional, objective, authoritative, and concise.
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
            # max_completion_tokens=1500  
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
    
async def monitoring_chat_copilot(messages: list[dict], context_summary: str = "", persona: str = "Model Validator") -> str:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION")
    
    if not all([endpoint, api_key, deployment_name]):
        return "SYSTEM OFFLINE: Azure OpenAI credentials missing."

    client = AsyncAzureOpenAI(azure_endpoint=endpoint, api_key=api_key, api_version=api_version)

    if persona == "Lead Data Scientist":
        persona_instructions = "Speak to a Data Scientist. Focus on statistical thresholding, ROC curves, feature drift (PSI), and model retraining strategies."
    else:
        persona_instructions = "Speak to an MRM Validator. Focus on SR 11-7 compliance, overall risk exposure, governance, and business impact."

    system_prompt = f"""
    You are an AI Model Risk Management (MRM) Copilot specializing in predictive model monitoring.
    
    CURRENT USER PERSONA: {persona}
    {persona_instructions}
    
    RULES:
    1. Maximum 3 sentences per response (unless providing a short code block).
    2. Base your answers heavily on the Dashboard Context provided below.
    3. At the very end of your response, you MUST provide exactly two logical follow-up questions the user could ask next. Append them using the exact delimiter `|||` like this:
       [Your main response text here]|||[First suggested question?]|||[Second suggested question?]
    
    Dashboard Context: {context_summary}
    """
    
    formatted_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        response = await client.chat.completions.create(
            model=deployment_name, 
            messages=formatted_messages,
        )
        return response.choices[0].message.content
    except Exception as exc:
        print(f"Monitoring Chat failed: {exc}")
        return "Connection error to the Azure backend."