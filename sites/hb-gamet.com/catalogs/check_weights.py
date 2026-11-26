import pandas as pd
import math

xl = pd.ExcelFile(r'Complete Dimensions.xlsx')

def sf(v):
    if v is None: return None
    try:
        s = str(v).replace(',', '.').strip()
        f = float(s)
        return None if (math.isnan(f) or math.isinf(f)) else round(f, 4)
    except:
        return None

for sheet_name in xl.sheet_names:
    print(f'\n=== {sheet_name} ===')
    if 'H' in sheet_name and 'Flange' in sheet_name:
        df = pd.read_excel(xl, sheet_name=sheet_name, header=1)
    else:
        df = pd.read_excel(xl, sheet_name=sheet_name)
    df.columns = [str(c).strip() for c in df.columns]
    if 'kg' in df.columns:
        samples = df['kg'].dropna().head(8)
        for v in samples:
            converted = sf(v)
            print(f'  raw={repr(v)} -> sf={converted}')
