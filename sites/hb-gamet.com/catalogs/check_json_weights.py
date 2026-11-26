import json
with open(r'c:\Users\mitul\OneDrive\Desktop\Downloads\GametWebsite\data.json') as f:
    data = json.load(f)
bad = [(d['part_number'], d['weight_kg']) for d in data if d.get('weight_kg') and d['weight_kg'] > 100]
print(f'Entries with weight > 100 kg: {len(bad)}')
for b in bad[:10]:
    print(b)
# Show weight distribution
weights = sorted([d['weight_kg'] for d in data if d.get('weight_kg') and d['weight_kg'] is not None])
print(f'Min: {min(weights)}, Max: {max(weights)}')
print('Top 5 weights:', weights[-5:])
print('First 5 weights:', weights[:5])
