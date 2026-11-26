import pandas as pd

xl = pd.ExcelFile(r'Complete Dimensions.xlsx')

# Check G sheet
df2 = pd.read_excel(xl, sheet_name='Double Row Plain G')
df2.columns = [str(c).strip() for c in df2.columns]
print('G sheet kg samples:')
for i in range(min(10, len(df2))):
    print(f"  raw={repr(df2.iloc[i].get('kg'))}")

# Check H sheet
df3 = pd.read_excel(xl, sheet_name='Double Row Flange H', header=1)
df3.columns = [str(c).strip() for c in df3.columns]
print('H sheet kg samples:')
for i in range(min(10, len(df3))):
    print(f"  raw={repr(df3.iloc[i].get('kg'))}")

# Check P sheet
df4 = pd.read_excel(xl, sheet_name='P Type')
df4.columns = [str(c).strip() for c in df4.columns]
print('P sheet kg samples:')
for i in range(min(10, len(df4))):
    print(f"  raw={repr(df4.iloc[i].get('kg'))}")
