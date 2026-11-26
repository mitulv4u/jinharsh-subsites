import pandas as pd
import json

OEM_PATH = r"c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\India OEM's v Gamet Bearings.xls"
OUT_JS   = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\oem_data.js'

df = pd.read_excel(OEM_PATH, sheet_name='Sheet1', header=None)

def clean(v):
    s = str(v).strip() if v is not None else ''
    return None if s in ('nan', '') else s

# Print all rows first for inspection
print("=== RAW ROWS ===")
for i, row in df.iterrows():
    c0, c2, c4 = clean(row[0]), clean(row[2]), clean(row[4])
    if i >= 3 and (c0 or c2):
        print(f"Row {i:3d}: c0={repr(c0):<40} c2={repr(c2):<35} c4={repr(c4)}")
