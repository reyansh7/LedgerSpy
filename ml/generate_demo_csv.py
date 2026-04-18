import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# ==========================================
# 1. SETUP BASE VARIABLES
# ==========================================
start_date = datetime(2024, 1, 1)
base_vendors = [
    "ABC Corp", "QuickFix IT", "Global Supplies", "TechNova",
    "Summit Group", "Apex Holdings", "BlueWave Media", "Zenith Logistics"
]

# The "Ghost Vendor" Trap (Similarities designed to hit the 75-95% threshold)
ghost_vendors = [
    "A.B.C. Corp", "ABC Corporation", "ABC Corp.",           # Matches ABC Corp
    "QuickFix I.T.", "Quick Fix IT", "QuickFix IT Solutions",# Matches QuickFix IT
    "Global Supply Co.", "Global Supplies Inc",              # Matches Global Supplies
    "Tech Nova Ltd", "TechNova L.T.D.", "TechNova Inc",      # Matches TechNova
    "Apex Holding", "Apex Holdings LLC"                      # Matches Apex Holdings
]

data = []

# ==========================================
# 2. GENERATE NORMAL BEHAVIOR (~809 rows)
# ==========================================
# We generate a large baseline that naturally follows Benford's Law
# plus enough rows to reach exactly 1,000 total records.
TOTAL_ROWS = 1000
GHOST_ROWS = 80
PADDING_ROWS = 100
INTEGRITY_ROWS = 9
OUTLIER_ROWS = 2
BASELINE_ROWS = TOTAL_ROWS - (GHOST_ROWS + PADDING_ROWS + INTEGRITY_ROWS + OUTLIER_ROWS)

print("Generating baseline transactions...")
for i in range(BASELINE_ROWS):
    tx_id = f"TXN{10000 + i}"
    date = (start_date + timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    leading_digit = np.random.choice([1, 2, 3, 4, 5, 6, 7], p=[0.30, 0.20, 0.15, 0.10, 0.10, 0.10, 0.05])
    amount = float(f"{leading_digit}{random.randint(10, 999)}.{random.randint(0, 99):02d}")
    source = random.choice(["Finance Dept", "HR Dept", "Admin Dept", "IT Dept", "Operations"])
    dest = random.choice(base_vendors)
    data.append([tx_id, date, amount, source, dest])

# ==========================================
# 3. INJECT THE HACKATHON TRAPS (~200 rows)
# ==========================================
print("Injecting Ghost Vendors, Invoice Padding, and Data Corruption...")

for i in range(GHOST_ROWS):
    tx_id = f"TXN{20000 + i}"
    date = (start_date + timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    amount = round(random.uniform(2000, 5000), 2)
    data.append([tx_id, date, amount, "Finance Dept", random.choice(ghost_vendors)])

for i in range(PADDING_ROWS):
    tx_id = f"TXN{30000 + i}"
    date = (start_date + timedelta(days=random.randint(0, 90))).strftime("%Y-%m-%d")
    amount = float(f"{random.choice([8, 9])}{random.randint(100, 999)}.{random.randint(0, 99):02d}")
    data.append([tx_id, date, amount, "Admin Dept", "Summit Group"])

# Data integrity trap rows
integrity_rows = [
    ["TXN40001", "2024-02-14", np.nan, "HR Dept", "TechNova"],
    ["TXN40002", "2024-02-15", 500.00, "IT Dept", np.nan],
    ["TXN40003", "2024-02-15", 750.00, np.nan, "ABC Corp"],
    ["TXN10005", "2024-02-16", 1200.00, "Finance Dept", "ABC Corp"],
    ["TXN10005", "2024-02-16", 1200.00, "Finance Dept", "ABC Corp"],
    ["TXN40004", "2024-02-17", "Five Thousand", "Admin Dept", "QuickFix IT"],
    ["TXN40005", "2024-02-18", "1,200.50", "Admin Dept", "QuickFix IT"],
    ["TXN40006", "Not-A-Date", 800.00, "HR Dept", "Global Supplies"],
    ["TXN40007", "15-14-2024", 900.00, "HR Dept", "Global Supplies"],
]

data.extend(integrity_rows)

# Anomaly detection trap rows
anomaly_rows = [
    ["TXN50001", "2024-01-07", 995000.00, "Finance Dept", "TechNova L.T.D."],
    ["TXN50002", "2024-01-14", 850000.00, "Operations", "Apex Holding"],
]

data.extend(anomaly_rows)

# ==========================================
# 4. FORMAT, SHUFFLE, AND EXPORT
# ==========================================
df = pd.DataFrame(data, columns=["transaction_id", "timestamp", "amount", "source_entity", "destination_entity"])
assert len(df) == TOTAL_ROWS, f"Expected {TOTAL_ROWS} rows but generated {len(df)}"

output_filename = "spit_demo_ledger_1000.csv"
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv(output_filename, index=False)

print(f"✅ Success! {len(df)} rows generated and saved to '{output_filename}'.")
print("🔥 The traps are set. Upload this 1,000-row monster to your dashboard!")
