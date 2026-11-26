import pandas as pd

# Check full OEM data
oem_path = r"c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\India OEM's v Gamet Bearings.xls"
df = pd.read_excel(oem_path, sheet_name='Sheet1', header=None)
print(f"Total rows: {len(df)}")
# Print all non-null rows
for i, row in df.iterrows():
    if any(str(v).strip() not in ['nan', ''] for v in row.values):
        print(f"Row {i}: {list(row.values)}")
