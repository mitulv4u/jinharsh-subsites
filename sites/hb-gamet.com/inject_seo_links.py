import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

html_content = """
<!-- SEO Indexable Catalog Links -->
<div style="display: none;" id="seo-catalog-index">
    <h2>Gamet Tapered Roller Bearings Full Catalog Index</h2>
    <ul>
"""

for item in data:
    if 'part_number' in item and str(item['part_number']) != 'nan':
        pn = item['part_number']
        bore = item.get('d_bore', '')
        od = item.get('D_outer', '')
        # Adding a title/description for SEO value
        html_content += f'        <li><a href="?searchQuery={pn}" title="Gamet Tapered Roller Bearing {pn}">Gamet Bearing Part Number {pn} - Bore: {bore}mm, Outer Diameter: {od}mm</a></li>\n'

html_content += """
    </ul>
</div>
"""

with open('catalog.html', 'r', encoding='utf-8') as f:
    catalog = f.read()

# Make sure we don't double inject
if 'seo-catalog-index' not in catalog:
    catalog = catalog.replace('</body>', html_content + '\n</body>')
    with open('catalog.html', 'w', encoding='utf-8') as f:
        f.write(catalog)
    print("Injected SEO links successfully.")
else:
    print("SEO links already exist.")
