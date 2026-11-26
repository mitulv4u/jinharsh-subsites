import pandas as pd
import json
import math

BASE = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs'
OUT_JSON = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\data.json'
OUT_JS   = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\data.js'

xl = pd.ExcelFile(f'{BASE}\\Complete Dimensions.xlsx')

def sf(v, is_dim=False):
    if v is None: return None
    try:
        s = str(v).replace(',', '.').strip()
        f = float(s)
        if math.isnan(f) or math.isinf(f): return None
        if is_dim and f >= 1000:
            f = f / 1000.0
        return round(f, 4)
    except:
        return None

def ss(v):
    s = str(v).strip() if v is not None else ''
    return None if s in ('nan', '', 'None') else s

all_data = []

# SHEET 1: Single Row (Plain & C)
df = pd.read_excel(xl, sheet_name='Single Row Plain and Flange')
df.columns = [str(c).strip() for c in df.columns]
for _, row in df.iterrows():
    d = sf(row.get('d (Bore)'), True); D = sf(row.get('D'), True)
    cone = ss(row.get('Cone')); cup = ss(row.get('Cup'))
    if d is None or D is None or not cone: continue
    type_col = ss(row.get('Type')) or ''
    type_suffix = 'C' if 'FLANGED' in type_col.upper() or type_col.upper() == 'C' else 'Plain'
    if cup and cup.upper().endswith('C') and type_suffix == 'Plain': type_suffix = 'C'
    pn = f"{cone}/{cup}" if cup else cone
    all_data.append({
        'part_number': pn, 'cone': cone, 'cup': cup,
        'sheet': 'Single Row', 'type_suffix': type_suffix,
        'd_bore': d, 'D_outer': D,
        'T': sf(row.get('T'), True), 'C_cup_width': sf(row.get('C'), True),
        'B_total_width': sf(row.get('B (Total Width)'), True), 'F': sf(row.get('F'), True),
        'da': sf(row.get('da'), True), 'Da': sf(row.get('Da-'), True),
        'weight_kg': sf(row.get('kg'), True),
        'C_load': sf(row.get('Column8')), 'C0_load': sf(row.get('Column9')),
        'max_rpm': sf(row.get('rpm max')),
    })

# SHEET 2: Double Row Plain G
df2 = pd.read_excel(xl, sheet_name='Double Row Plain G')
df2.columns = [str(c).strip() for c in df2.columns]
for _, row in df2.iterrows():
    d = sf(row.get('d'), True); D = sf(row.get('D-') or row.get('D'), True)
    cone = ss(row.get('Cone')); cup = ss(row.get('Cup'))
    if d is None or D is None or not cone: continue
    pn = f"{cone}/{cup}" if cup else cone
    all_data.append({
        'part_number': pn, 'cone': cone, 'cup': cup,
        'sheet': 'Double Row G', 'type_suffix': 'G',
        'd_bore': d, 'D_outer': D,
        'T': sf(row.get('T'), True), 'C_cup_width': sf(row.get('C'), True),
        'B_total_width': None, 'F': sf(row.get('F'), True),
        'da': sf(row.get('da'), True), 'Da': sf(row.get('L'), True),
        'weight_kg': sf(row.get('kg'), True),
        'C_load': sf(row.get('* daN\nRad.')), 'C0_load': sf(row.get('* daN\nAxi.')),
        'max_rpm': sf(row.get('rpm Max')),
    })

# SHEET 3: Double Row Flange H (header at row 1)
df3_h = pd.read_excel(xl, sheet_name='Double Row Flange H', header=1)
df3_h.columns = [str(c).strip() for c in df3_h.columns]
print("H cols:", [c for c in df3_h.columns if 'Unnamed' not in c])
for _, row in df3_h.iterrows():
    total_brg = ss(row.get('Total Brg'))
    cone_raw = ss(row.get('cone'))
    cup_raw  = ss(row.get('cup'))
    d = sf(row.get('d'), True); D = sf(row.get('D2') or row.get('D'), True)
    if d is None or D is None: continue
    if cone_raw:
        cone = str(cone_raw).replace('.0','').strip()
        cup  = str(cup_raw).replace(' / ','').replace('/','').strip() if cup_raw else None
        pn = f"{cone}/{cup}" if cup else cone
    elif total_brg and '/' in str(total_brg):
        pn = total_brg
        parts = pn.split('/')
        cone = parts[0].strip(); cup = parts[1].strip()
    else:
        continue
    all_data.append({
        'part_number': pn, 'cone': cone, 'cup': cup,
        'sheet': 'Double Row H', 'type_suffix': 'H',
        'd_bore': d, 'D_outer': D,
        'T': sf(row.get('T'), True), 'C_cup_width': sf(row.get('C'), True),
        'B_total_width': None, 'F': sf(row.get('F'), True),
        'da': sf(row.get('da'), True), 'Da': sf(row.get('L'), True),
        'weight_kg': sf(row.get('kg'), True),
        'C_load': sf(row.get('* daN \nRad.') or row.get('* daN\nRad.')),
        'C0_load': sf(row.get('* daN\nAxi.')),
        'max_rpm': sf(row.get('max rpm')),
    })

# SHEET 4: P Type
df4 = pd.read_excel(xl, sheet_name='P Type')
df4.columns = [str(c).strip() for c in df4.columns]
for _, row in df4.iterrows():
    d_val = sf(row.get('d'), True)
    D_val = None
    for col in df4.columns:
        if col == 'd.1': D_val = sf(row[col], True); break
    if D_val is None: D_val = sf(row.get('D'), True)
    total_brg = ss(row.get('Total Brg'))
    cone = ss(row.get('Cone')); cup = ss(row.get('Cup'))
    if d_val is None or D_val is None: continue
    if cone:
        pn = f"{cone}/{cup}" if cup else cone
    elif total_brg and '/' in str(total_brg):
        pn = total_brg; parts = pn.split('/')
        cone = parts[0].strip(); cup = parts[1].strip() if len(parts)>1 else None
    else:
        continue
    all_data.append({
        'part_number': pn, 'cone': cone, 'cup': cup,
        'sheet': 'P Type', 'type_suffix': 'P',
        'd_bore': d_val, 'D_outer': D_val,
        'T': sf(row.get('t'), True), 'C_cup_width': sf(row.get('C'), True),
        'B_total_width': sf(row.get('B'), True), 'F': sf(row.get('F'), True),
        'da': sf(row.get('da'), True), 'Da': None,
        'weight_kg': sf(row.get('kg'), True),
        'C_load': sf(row.get('P\ndaN')), 'C0_load': sf(row.get('† \ndaN')),
        'max_rpm': None,
    })

all_data = [x for x in all_data if x['part_number'] and x['part_number'] != 'nan']

from collections import Counter
c = Counter(d['type_suffix'] for d in all_data)
print(f"\nTotal extracted: {len(all_data)}")
print("By type:", dict(c))
print("Sample H:", [d['part_number'] for d in all_data if d['type_suffix']=='H'][:5])

with open(OUT_JSON, 'w') as f:
    json.dump(all_data, f, indent=2)
with open(OUT_JS, 'w') as f:
    f.write('const gametData = ')
    json.dump(all_data, f)
    f.write(';')
print("Done.")
