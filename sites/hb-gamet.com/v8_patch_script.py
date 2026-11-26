import os
import re

html_files = ['catalog.html', 'types.html', 'nomenclature.html', 'oem.html', 'installation.html', 'genuine.html']

btn_extra_html = '''                <div id="btn-extra">
                    <span></span>
                    <span></span>
                </div>'''

overlay_html = '''    <!-- overlay content begin -->
    <div id="extra-wrap">
        <div id="btn-close">
            <span></span>
            <span></span>
        </div>

        <div id="extra-content">
            <img src="images/new_logo.jpg" alt="Gamet Bearings" style="max-width: 180px; margin-bottom: 30px; border-radius: 4px;">

            <div class="spacer-30-line"></div>

            <h5>Technical Resources</h5>
            <ul style="list-style: none; padding: 0;">
                <li><a href="catalog.html">Catalog Search</a></li>
                <li><a href="nomenclature.html">Part Number Nomenclature</a></li>
                <li><a href="installation.html">Installation Guide</a></li>
                <li><a href="oem.html">OEM Machines List</a></li>
            </ul>

            <div class="spacer-30-line"></div>

            <h5>Contact Jinharsh</h5>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #cbd5e1;">
                <i data-lucide="clock" style="width: 18px; height: 18px; opacity: 0.5;"></i> Monday - Saturday 10:00 - 18:00
            </div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #cbd5e1;">
                <i data-lucide="map-pin" style="width: 18px; height: 18px; opacity: 0.5;"></i> Mumbai, India
            </div>
            <div style="display: flex; align-items: center; gap: 12px; color: #cbd5e1;">
                <i data-lucide="mail" style="width: 18px; height: 18px; opacity: 0.5;"></i> gamet@jinharsh.com
            </div>

            <div class="spacer-30-line"></div>

            <h5>About Gamet</h5>
            <p>Established in 1956, Gamet Bearings manufactures exclusively super precision tapered roller bearings. Engineered for the world's most demanding machine tools with guaranteed sub-micron accuracy.</p>
        </div>
    </div>

    <script>
        lucide.createIcons();

        // Slide-out panel logic
        document.addEventListener('DOMContentLoaded', () => {
            const btnExtra = document.getElementById('btn-extra');
            const btnClose = document.getElementById('btn-close');
            const extraWrap = document.getElementById('extra-wrap');

            if (btnExtra && btnClose && extraWrap) {
                btnExtra.addEventListener('click', () => {
                    extraWrap.classList.add('open');
                });

                btnClose.addEventListener('click', () => {
                    extraWrap.classList.remove('open');
                });
            }
        });
    </script>
</body>'''

footer_html = '''    <footer class="footer">
        <div class="container footer-content">
            <div class="footer-brand">
                <div class="logo" style="display: flex; align-items: center; gap: 20px;">
                    <div style="text-align: center;">
                        <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">New Brand Mark</span>
                        <img src="images/new_logo.jpg" alt="Gamet New Logo" style="height:32px;width:auto; border-radius: 4px;">
                    </div>
                    <div style="text-align: center;">
                        <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Original Heritage Mark</span>
                        <img src="images/Old Gamet Logo.jpg" alt="Gamet Old Logo" style="height:32px;width:auto; border-radius: 4px; filter: grayscale(100%); opacity: 0.8;">
                    </div>
                </div>
                <p>High precision tapered roller bearings for demanding applications.</p>
            </div>
            
            <div class="footer-links">
                <h4>Authorized Partners</h4>
                <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7;">
                    <strong>Jinharsh Industrial Solutions Pvt. Ltd.</strong><br>
                    Branches: Mumbai &bull; Nagpur &bull; Surat &bull; Raipur &bull; Goa &bull; Sri Lanka
                </div>
            </div>

            <div class="footer-links">
                <h4>Navigation</h4>
                <a href="index.html">Home</a>
                <a href="types.html">Bearing Types</a>
                <a href="nomenclature.html">Nomenclature</a>
                <a href="oem.html">OEM Machines</a>
                <a href="catalog.html">Catalog Search</a>
                <a href="genuine.html">Buy Genuine</a>
            </div>
            <div class="footer-links">
                <h4>Technical</h4>
                <a href="installation.html">Installation Guide</a>
                <a href="catalogs/Bearings Catalog Gamet TRB.pdf" download>Download PDF Catalog</a>
            </div>
        </div>
        <div class="footer-bottom container">
            <p>&copy; 2026 Gamet Bearings. Authorized Partner: Jinharsh Industrial Solutions Pvt. Ltd.</p>
        </div>
    </footer>'''

for filename in html_files:
    if not os.path.exists(filename):
        print(f"Skipping {filename} - not found.")
        continue
        
    print(f"Patching {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update logo header to generic plain text Gamet
    content = re.sub(
        r'<a href="index\.html" class="logo">.*?</a>', 
        '<a href="index.html" class="logo" style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--heading-font-color); text-decoration: none;">GAMET</a>', 
        content, 
        flags=re.DOTALL
    )

    # 2. Inject hamburger into navbar if missing
    if 'id="btn-extra"' not in content:
        content = re.sub(r'(<a href="genuine\.html"[^>]*>Buy Genuine</a>)', r'\g<1>\n' + btn_extra_html, content)
        
    # 3. Inject slide-out wrap and JS logic if missing
    if 'id="extra-wrap"' not in content:
        content = re.sub(r'<script>\s*lucide\.createIcons\(\);\s*</script>\s*</body>', overlay_html, content, flags=re.DOTALL)
        
    # 4. Replace footer wholesale with our new structured footer
    content = re.sub(r'<footer class="footer">.*?</footer>', footer_html, content, flags=re.DOTALL)
        
    # 5. Fix remaining static old emails
    content = content.replace('sales@jinharsh.com', 'gamet@jinharsh.com')
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

# Separately, patch ONLY the footer and logo of index.html, since we already did its sidebar manually
print("Patching index.html (header/footer only)...")
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()
    
index_content = re.sub(
    r'<a href="index\.html" class="logo">.*?</a>', 
    '<a href="index.html" class="logo" style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--heading-font-color); text-decoration: none;">GAMET</a>', 
    index_content, 
    flags=re.DOTALL
)
index_content = re.sub(r'<footer class="footer">.*?</footer>', footer_html, index_content, flags=re.DOTALL)
index_content = index_content.replace('sales@jinharsh.com', 'gamet@jinharsh.com')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_content)

print('Global structural patches applied successfully.')
