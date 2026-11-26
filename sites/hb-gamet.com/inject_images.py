import os
import re

files = {
    'types.html': 'envato/computerized-metal-milling-2026-01-09-08-12-01-utc.jpg',
    'nomenclature.html': 'envato/industrial-factory-with-cnc-machines-2026-01-09-06-44-50-utc.jpg',
    'oem.html': 'envato/young-man-working-on-a-cnc-machine-in-a-factory-2026-01-08-22-57-04-utc.jpg',
    'genuine.html': 'envato/technicians-inspect-the-workpiece-of-an-angle-grin-2026-01-08-06-51-39-utc.JPG',
    'installation.html': 'envato/professional-technician-checking-and-repairing-par-2026-01-09-12-23-26-utc.jpg',
    'catalog.html': 'envato/asian-engineer-man-wearing-safety-helmet-checking-2026-01-11-10-42-35-utc.jpg',
    'index.html': 'envato/industrial-factory-with-cnc-machines-2026-01-05-00-12-44-utc.jpg'
}

for fname, img in files.items():
    if not os.path.exists(fname): 
        print(f"{fname} not found!")
        continue
        
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    bg_style = f"background: linear-gradient(rgba(15, 23, 42, 0.8), rgba(30, 58, 95, 0.85)), url('{img}') center/cover no-repeat; padding: 100px 0 120px; color: white;"
    
    if fname == 'index.html':
        old_img = "url('images/GAMET - Product_Super Precision TRB_page2_image3.jpg')"
        new_img = f"url('{img}')"
        html = html.replace(old_img, new_img)
    else:
        # Match the opening tag of page-header
        def repl(m):
            tag_start = m.group(1)
            # Remove existing style attribute
            clean_start = re.sub(r'\s*style="[^"]*"', '', tag_start)
            return f'{clean_start} style="{bg_style}">'

        html = re.sub(r'(<(?:section|div)\s+[^>]*class="[^"]*page-header[^"]*"[^>]*)>', repl, html, count=1)
        
        # Make sure inside texts are visible (var(--text-secondary) to white/lighter)
        header_match = re.search(r'(<.*class="[^"]*page-header[^"]*".*?>.*?)(</(?:section|div)>)', html, re.DOTALL)
        if header_match:
            header_content = header_match.group(1)
            header_end = header_match.group(2)
            
            hc = header_content.replace('color: var(--text-secondary);', 'color: #cbd5e1;')
            hc = hc.replace('color:var(--text-secondary);', 'color:#cbd5e1;')
            hc = hc.replace('color: var(--text-muted);', 'color: #94a3b8;')
            hc = hc.replace('color:var(--text-muted);', 'color:#94a3b8;')
            hc = hc.replace('color: var(--text-main);', 'color: white;')
            hc = hc.replace('color:var(--text-main);', 'color:white;')
            
            html = html[:header_match.start()] + hc + header_end + html[header_match.end():]

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated {fname}")

print("All headers updated successfully.")
