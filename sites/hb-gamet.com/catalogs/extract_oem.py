import pandas as pd
import json

OEM_PATH = r"c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\India OEM's v Gamet Bearings.xls"
OUT_JS   = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\oem_data.js'

df = pd.read_excel(OEM_PATH, sheet_name='Sheet1', header=None)

def clean(v):
    s = str(v).strip() if v is not None else ''
    return None if s in ('nan', '') else s

# COMPANY-CITY MAP
# From our raw dump we know exactly:
# Row 4:  ACE DESIGNERS + bearing, Row 5: Bangalore + bearing (city of ACE)
# Row 11: Askar Microns + bearing, Row 12: (alias) + bearing [no city]
# Row 15: HMT Machine Tools + bearing, Row 16: Cochin + bearing (city of HMT)
# Row 47: HMT Machine Tools + bearing, Row 48: Ajmer + ... (city of this HMT branch = Ajmer)
# Row 54: PMT Machine Tools + bearing, Row 55: Pune + bearing (city of PMT)
# Row 73: Proteck Circuits & Systems + bearing, Row 74: Chennai + bearing (city)
# Row 87: Kennametal + bearing, Row 88: Bangalore (city-only, no c2)
# Row 92: The Mysore Kirloskar Ltd + bearing, Row 93: Mysore + bearing (city)
#
# Key rule: c0 is city IF c0 is short (single word, no capitals implying company abbreviation)
# AND we're still in early rows of current company (no blank row separation yet)

CITY_WORDS = {'bangalore', 'cochin', 'pune', 'ajmer', 'mysore', 'chennai', 'delhi', 
              'mumbai', 'hyderabad', 'kolkata', 'ahmedabad', 'pune', 'coimbatore'}

def is_city(name, cur_company_set):
    if not name: return False
    if name.startswith('('): return False
    words = name.strip().split()
    # Single word and matches known city or is short lowercase-ish
    if len(words) == 1 and name.lower() in CITY_WORDS:
        return True
    # Two words max and all proper nouns typical of cities
    if len(words) <= 2 and name.lower() in CITY_WORDS:
        return True
    return False

def is_company_name(name):
    if not name: return False
    if name.startswith('('): return False
    # Company names tend to be multi-word or contain uppercase abbreviations
    # City-only row for Kennametal/Bangalore case: city with no c2
    return True  # default, refined by context

records = []  # flat list: {company, city, app, bearings[]}

cur_company = None
cur_city = None
cur_app = None
cur_bearings = []

company_assigned_city = False  # whether we already got a city for cur company

def flush_record():
    if cur_company and cur_bearings:
        records.append({
            'company': cur_company,
            'city': cur_city,
            'application': cur_app,
            'bearings': cur_bearings[:]
        })

for i, row in df.iterrows():
    if i < 3:
        continue
    c0 = clean(row[0])
    c2 = clean(row[2])
    c4 = clean(row[4])
    all_blank = all(str(v).strip() in ('nan', '') for v in row.values)

    # Skip alias rows
    if c0 and c0.startswith('('):
        if c2:
            cur_bearings.append(c2)
        continue

    # Blank row = machine separator
    if all_blank:
        flush_record()
        cur_bearings = []
        cur_app = None
        continue

    # c0 + c2: identify if c0 is company or city
    if c0 and c2:
        if cur_company and not company_assigned_city and is_city(c0, {}):
            # c0 is city for current company, c2 continues same machine
            cur_city = c0
            company_assigned_city = True
            if c4:
                flush_record()
                cur_bearings = []
                cur_app = c4
            cur_bearings.append(c2)
        elif cur_company and is_city(c0, {}) and company_assigned_city:
            # Still a city-like string but we already have city → new company with city name
            flush_record()
            cur_bearings = []
            cur_company = c0
            cur_city = None
            company_assigned_city = False
            cur_app = c4
            cur_bearings.append(c2)
        else:
            # New company
            flush_record()
            cur_bearings = []
            cur_company = c0
            cur_city = None
            company_assigned_city = False
            if c4:
                cur_app = c4
            cur_bearings.append(c2)

    elif c0 and not c2:
        # City-only row (e.g., Kennametal → Bangalore on next row)
        if cur_company and not cur_city and is_city(c0, {}):
            cur_city = c0
            company_assigned_city = True

    elif c2 and not c0:
        # Continuation bearing in same block
        if c4:
            flush_record()
            cur_bearings = []
            cur_app = c4
        cur_bearings.append(c2)

flush_record()

# Now group records by company
companies_dict = {}
for r in records:
    key = r['company']
    if key not in companies_dict:
        companies_dict[key] = {'company': key, 'city': r['city'], 'machines': []}
    if r['city'] and not companies_dict[key]['city']:
        companies_dict[key]['city'] = r['city']
    if r['bearings']:
        companies_dict[key]['machines'].append({
            'application': r['application'],
            'bearings': r['bearings']
        })

# Merge HMT entries (two separated sections = two cities)
# Keep them separate with city differentiation

companies = list(companies_dict.values())

print(f"Extracted {len(companies)} companies")
for c in companies:
    print(f"\n  {c['company']} ({c.get('city','?')}) — {len(c['machines'])} machine(s)")
    for m in c['machines']:
        print(f"    [{m['application']}]: {m['bearings']}")

with open(OUT_JS, 'w') as f:
    f.write('const oemData = ')
    json.dump(companies, f, indent=2)
    f.write(';')
print(f"\nSaved oem_data.js")
