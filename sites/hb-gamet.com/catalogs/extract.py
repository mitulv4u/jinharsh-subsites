import pandas as pd
import json
import math

file_path = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\Complete Dimensions.xlsx'
out_path = r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\catalogs\gamet_data.json'

try:
    xl = pd.ExcelFile(file_path)
    all_data = []

    for sheet in xl.sheet_names:
        print(f'Processing sheet: {sheet}')
        df = pd.read_excel(file_path, sheet_name=sheet)
        
        # Basic cleaning
        df = df.dropna(how='all')
        
        for index, row in df.iterrows():
            try:
                # Core dimensions
                d = row.get('d (Bore)')
                D = row.get('D')
                
                if pd.isna(d) or pd.isna(D):
                    continue
                    
                item = {
                    'sheet': sheet,
                    'd_bore': float(d),
                    'D_outer': float(D),
                    'B_total_width': float(row.get('B (Total Width)')) if not pd.isna(row.get('B (Total Width)')) else None,
                    'C_cup_width': float(row.get('C')) if not pd.isna(row.get('C')) else None,
                    'T_total_width_p_type': float(row.get('T')) if 'T' in row and not pd.isna(row.get('T')) else None, 
                }
                
                # Part numbers
                cone = str(row.get('Cone', '')).replace('.0', '').strip()
                cup = str(row.get('Cup', '')).replace('.0', '').strip()
                
                if cone != 'nan' and cone:
                    item['cone'] = cone
                if cup != 'nan' and cup:
                    item['cup'] = cup
                    
                if 'cone' in item and 'cup' in item:
                     item['part_number'] = f"{item['cone']}/{item['cup']}"
                elif 'cone' in item:
                     item['part_number'] = item['cone']
                elif 'cup' in item:
                     item['part_number'] = item['cup']
                else:
                     continue # need at least a part number identifier
                     
                all_data.append(item)
                
            except Exception as e:
                # Skip headers or malformed rows
                pass

    print(f'Total extracted items: {len(all_data)}')
    
    with open(out_path, 'w') as f:
        json.dump(all_data, f, indent=2)
    print(f'Saved to {out_path}')

except Exception as e:
    print(f'Error: {e}')
