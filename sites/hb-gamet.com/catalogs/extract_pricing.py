import pandas as pd
import json
import math

BASE   = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\pricing'
OUT_JS = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\pricing.js'

def safe_float(v):
    try:
        f = float(str(v).replace(',','.').strip())
        return None if math.isnan(f) else round(f, 2)
    except:
        return None

df = pd.read_excel(f'{BASE}\\pricing.xlsx', sheet_name='Sheet1', header=None)

# Row 0-2 are headers; columns are:
# 0=Part Number, 1=Plain, 2=C (Flanged), 3=P (Spring), 4=G, 5=H, 6=GE (spacered G), 7=HE (spacered H)
TYPE_COLS = {
    'Plain': 1, 'C': 2, 'P': 3, 'G': 4, 'H': 5, 'GE': 6, 'HE': 7
}

GBP_MULT  = 5      # to get 2026 cost
MARKUP    = 1.35   # selling price over cost
INR_MULT  = 150    # cost GBP to INR
USD_RATE  = 1.27   # GBP sell to USD

pricing_data = {}

for i, row in df.iterrows():
    if i < 4:
        continue  # skip header rows
    part_raw = safe_float(row[0]) if pd.isna(row[0]) else str(row[0]).strip()
    if not part_raw or str(part_raw) in ('nan', ''):
        continue

    part_str = str(part_raw).strip()
    if part_str in ('nan', ''):
        continue

    prices = {}
    for type_name, col_idx in TYPE_COLS.items():
        orig = None
        try:
            cell = row[col_idx]
            if str(cell).strip() not in ('-', 'nan', '') and cell is not None:
                orig = safe_float(cell)
        except:
            pass

        if orig is not None:
            cost_gbp = round(orig * GBP_MULT, 2)
            sell_gbp = round(cost_gbp * MARKUP, 2)
            sell_inr = round(cost_gbp * INR_MULT, 0)
            sell_usd = round(sell_gbp * USD_RATE, 2)
            prices[type_name] = {
                'orig_gbp': orig,
                'cost_gbp': cost_gbp,
                'sell_gbp': sell_gbp,
                'sell_inr': int(sell_inr),
                'sell_usd': sell_usd
            }

    if prices:
        pricing_data[part_str] = prices

print(f"Pricing entries: {len(pricing_data)}")
print("Sample:")
for k, v in list(pricing_data.items())[:3]:
    print(f"  {k}: {v}")

with open(OUT_JS, 'w') as f:
    f.write('const pricingData = ')
    json.dump(pricing_data, f)
    f.write(';')

print(f"Saved pricing.js")
