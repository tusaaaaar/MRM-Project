import pandas as pd
import numpy as np

# Point this to your newly uploaded dataset file
BASE_FILE = "Simulated_PD_Model_Output.xlsx" 

print(f"Reading base file: {BASE_FILE}")
df = pd.read_excel(BASE_FILE)

if "probability_of_default" not in df.columns or "actual_default" not in df.columns:
    print("Error: Dataset must contain 'probability_of_default' and 'actual_default' columns.")
    exit()

quarters = ["Q1", "Q2", "Q3", "Q4", "Q5"]

for i, q in enumerate(quarters):
    df_q = df.copy()
    
    if i > 0:
        # --- 1. SIMULATE DATA DRIFT (Features Worsen over time) ---
        
        # A. Inflation / Credit Utilization rises by ~3% to 6% per quarter
        inflation_factor = 1.0 + (i * 0.04) 
        for col in ['BILL_AMT1', 'BILL_AMT2', 'BILL_AMT3', 'BILL_AMT4', 'BILL_AMT5', 'BILL_AMT6']:
            df_q[col] = df_q[col] * np.random.uniform(1.0, inflation_factor, len(df_q))
        
        # B. People start missing payments (PAY variables shift higher)
        # We randomly select a small % of the portfolio and worsen their payment status
        distress_rate = i * 0.05 # Up to 20% of people face distress by Q5
        distress_mask = np.random.rand(len(df_q)) < distress_rate
        for col in ['PAY_0', 'PAY_2', 'PAY_3', 'PAY_4', 'PAY_5', 'PAY_6']:
            # If they are in distress, increase their late payment status by 1 or 2 months
            df_q.loc[distress_mask, col] = df_q.loc[distress_mask, col] + np.random.randint(0, 3, sum(distress_mask))
            # Cap it at a max of 8 months late to keep it realistic
            df_q[col] = df_q[col].clip(-2, 8) 
            
        # --- 2. SIMULATE CONCEPT DRIFT (Model breaks down) ---
        
        # C. Because the inputs changed, the old model's PD is now slightly wrong.
        # We add some statistical noise to the probability.
        noise = np.random.normal(0, i * 0.03, len(df_q))
        df_q["probability_of_default"] = df_q["probability_of_default"] + noise
        
        # D. The actual defaults rise because the underlying features worsened
        # If someone's PAY_0 got worse, they have a much higher chance of defaulting
        new_defaults = (df_q['PAY_0'] > 2) & (np.random.rand(len(df_q)) < 0.4)
        df_q.loc[new_defaults, "actual_default"] = 1

    # Cleanup math bounds
    df_q["probability_of_default"] = df_q["probability_of_default"].clip(0, 1)
    if "prediction" in df_q.columns:
        df_q["prediction"] = (df_q["probability_of_default"] > 0.5).astype(int)

    filename = f"{q}_Data.xlsx"
    df_q.to_excel(filename, index=False)
    print(f"Generated {filename} (Data Drift Level: {i}/4)")

print("All 5 Realistic Quarters Generated Successfully!")