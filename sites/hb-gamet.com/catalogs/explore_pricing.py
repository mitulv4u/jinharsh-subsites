import pandas as pd

pricing_path = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\pricing\pricing.xlsx'

try:
    xl = pd.ExcelFile(pricing_path)
    print("Pricing sheets:", xl.sheet_names)
    for s in xl.sheet_names:
        df = pd.read_excel(xl, sheet_name=s, header=None, nrows=20)
        print(f"\n-- Sheet: {s}")
        print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
