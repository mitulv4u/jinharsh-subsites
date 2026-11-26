import pandas as pd
import json
import os

base = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs'

# 1) Complete Dimensions - show ALL sheets and all columns
xl = pd.ExcelFile(os.path.join(base, 'Complete Dimensions.xlsx'))
print("=== COMPLETE DIMENSIONS ===")
for sheet in xl.sheet_names:
    df = pd.read_excel(xl, sheet_name=sheet)
    print(f"\n-- Sheet: {sheet} | rows: {len(df)} | cols: {list(df.columns)}")
    print(df.head(3).to_string())

# 2) India OEM file
oem_path = os.path.join(base, "India OEM's v Gamet Bearings.xls")
xl2 = pd.ExcelFile(oem_path)
print("\n\n=== OEM FILE SHEETS ===", xl2.sheet_names)
for s in xl2.sheet_names:
    df2 = pd.read_excel(xl2, sheet_name=s)
    print(f"\n-- Sheet: {s} | rows: {len(df2)} | cols: {list(df2.columns)}")
    print(df2.head(20).to_string())
