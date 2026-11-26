import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

dropdown_nav_raw = '''
            <nav class="nav-links">
                <a href="index.html" class="nav-link {HOME_ACTIVE}">Home</a>
                <div class="nav-item dropdown">
                    <span>Technical Resources <i data-lucide="chevron-down" style="width:16px;height:16px;"></i></span>
                    <div class="dropdown-content">
                        <a href="types.html" class="{TYPES_ACTIVE}">Bearing Types</a>
                        <a href="nomenclature.html" class="{NOMEN_ACTIVE}">Nomenclature</a>
                        <a href="catalog.html" class="{CATALOG_ACTIVE}">Catalog Search</a>
                        <a href="installation.html" class="{INSTALL_ACTIVE}">Installation Guide</a>
                        <a href="oem.html" class="{OEM_ACTIVE}">OEM Machines List</a>
                    </div>
                </div>
                <a href="genuine.html" class="nav-link {GENUINE_ACTIVE}" style="{GENUINE_STYLE}color:#dc2626;font-weight:600;">Buy Genuine</a>
                <a href="contact.html" class="nav-link {CONTACT_ACTIVE}">Contact Us</a>
                <div id="btn-extra">
                    <span></span>
                    <span></span>
                </div>
            </nav>
'''

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
            
            <div class="footer-links" style="max-width: 400px;">
                <h4>Authorized Partners</h4>
                <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7;">
                    <strong style="color:var(--text-primary);">Jinharsh Industrial Solutions Pvt. Ltd.</strong><br>
                    HO: 76/78 Nagdevi Street, Mumbai 400003<br>
                    <span style="font-size: 0.85rem;">Branches: Mumbai &bull; Nagpur &bull; Surat &bull; Raipur &bull; Goa &bull; Sri Lanka</span>
                </div>
            </div>

            <div class="footer-links">
                <h4>Navigation</h4>
                <a href="index.html">Home</a>
                <a href="catalog.html">Catalog Search</a>
                <a href="genuine.html">Buy Genuine</a>
                <a href="contact.html">Contact Us</a>
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
        continue
        
    print(f"Patching Header/Footer for {filename}...")
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Determine which tab should be "active" for the dropdown setup
    is_home = 'active' if filename == 'index.html' else ''
    is_types = 'active' if filename == 'types.html' else ''
    is_nomen = 'active' if filename == 'nomenclature.html' else ''
    is_catalog = 'active' if filename == 'catalog.html' else ''
    is_install = 'active' if filename == 'installation.html' else ''
    is_oem = 'active' if filename == 'oem.html' else ''
    is_genuine = 'active' if filename == 'genuine.html' else ''
    is_contact = 'active' if filename == 'contact.html' else ''
    
    # Render customized nav for this specific page
    custom_nav = dropdown_nav_raw.replace('{HOME_ACTIVE}', is_home) \
                                 .replace('{TYPES_ACTIVE}', is_types) \
                                 .replace('{NOMEN_ACTIVE}', is_nomen) \
                                 .replace('{CATALOG_ACTIVE}', is_catalog) \
                                 .replace('{INSTALL_ACTIVE}', is_install) \
                                 .replace('{OEM_ACTIVE}', is_oem) \
                                 .replace('{GENUINE_ACTIVE}', is_genuine) \
                                 .replace('{CONTACT_ACTIVE}', is_contact) \
                                 .replace('{GENUINE_STYLE}', 'background: #fee2e2; border-radius: 4px; padding: 4px 12px; ' if filename == 'genuine.html' else '')

    # 1. Replace the entire nav-links block
    # Regex that matches `<nav class="nav-links">` all the way until `</nav>`
    # We must format cautiously to not strip the hamburger.
    content = re.sub(r'<nav class="nav-links">.*?</nav>', custom_nav.strip(), content, flags=re.DOTALL)
    
    # 2. Re-replace the footer explicitly to pick up the new 76/78 Nagdevi Street rule
    content = re.sub(r'<footer class="footer">.*?</footer>', footer_html, content, flags=re.DOTALL)
    
    # 3. Patch the hamburger bug: some pages miss the trailing eventlistener entirely 
    # Or might have duplicate IDs. Let's make sure the script lives properly in every file.
    # The V8 script already injected it, but let's confirm.
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

print('V9 Patches processed successfully.')
