// Drawing GIFs per bearing type
const DRAWING_FILES = {
  'Plain': 'drawing/plain.gif',
  'C': 'drawing/type_c.gif',
  'G': 'drawing/type_g.gif',
  'H': 'drawing/type_h.gif',
  'P': 'drawing/type_p.gif',
};

// Product images per bearing type
const PRODUCT_IMAGES = {
  'Plain': 'gamet_types/gamet-plain.png',
  'C': 'gamet_types/gamet-c.png',
  'G': 'gamet_types/gamet-g.png',
  'H': 'gamet_types/gamet-h.png',
  'P': 'gamet_types/gamet-p.png',
};

// SVG icon for red PDF download button
const PDF_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {

  const searchQuery = document.getElementById('searchQuery');
  const boreSize = document.getElementById('boreSize');
  const outerSize = document.getElementById('outerSize');
  const tableBody = document.getElementById('tableBody');
  const resultsTable = document.getElementById('resultsTable');
  const resultsCount = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');
  const loadingState = document.getElementById('loadingState');
  const currencySelect = document.getElementById('currencySelect');
  const pagePrev = document.getElementById('pagePrev');
  const pageNext = document.getElementById('pageNext');
  const pageInfo = document.getElementById('pageInfo');
  const mobileCards = document.getElementById('mobileCards');

  if (!tableBody) return;

  const PAGE_SIZE = 50;
  let catalogData = [];
  let filteredData = [];
  let activeTypeFilter = 'all';
  let activeCurrency = 'GBP';
  let currentPage = 1;

  // Sort state
  let sortColumn = null;
  let sortDirection = null; // 'asc' or 'desc'

  // ============ Init ============
  function init() {
    showState('loading');
    try {
      if (typeof gametData === 'undefined') throw new Error('gametData not loaded');
      catalogData = gametData.filter(item => item.part_number && item.part_number !== 'nan');
      setupSortHeaders();
      applyFilters();
    } catch (e) {
      console.error(e);
      showState('empty');
    }
  }

  // ============ State ============
  function showState(state) {
    const fullLoader = document.getElementById('fullPageLoader');
    [resultsTable, mobileCards, emptyState, loadingState].forEach(el => el && el.classList.add('hidden'));
    
    if (state === 'loading') {
      if (loadingState) loadingState.classList.remove('hidden');
      if (fullLoader) {
        fullLoader.classList.remove('hidden');
        const text = document.getElementById('loaderText');
        if (text) text.textContent = 'Loading Database...';
      }
    }
    else {
      if (fullLoader) fullLoader.classList.add('hidden');
      if (state === 'empty' && emptyState) emptyState.classList.remove('hidden');
      else if (state === 'table') {
        if (resultsTable) resultsTable.classList.remove('hidden');
        if (mobileCards) mobileCards.classList.remove('hidden');
      }
    }
  }

  // ============ Sorting ============
  function setupSortHeaders() {
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (sortColumn === col) {
          sortDirection = sortDirection === 'asc' ? 'desc' : (sortDirection === 'desc' ? null : 'asc');
          if (sortDirection === null) sortColumn = null;
        } else {
          sortColumn = col;
          sortDirection = 'asc';
        }
        // Update visual indicators
        document.querySelectorAll('.data-table th.sortable').forEach(h => {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        if (sortDirection && sortColumn === col) {
          th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
        sortAndRender();
      });
    });
  }

  function getSortValue(item, col) {
    if (col === 'price') {
      const price = getPrice(item.part_number, item.type_suffix);
      if (!price) return -Infinity;
      switch (activeCurrency) {
        case 'GBP': return price.sell_gbp || 0;
        case 'USD': return price.sell_usd || 0;
        case 'INR': return price.sell_inr || 0;
        default: return 0;
      }
    }
    if (col === 'T') return item.T || item.B_total_width || 0;
    const val = item[col];
    if (val === undefined || val === null) return col === 'part_number' || col === 'type_suffix' ? '' : -Infinity;
    return val;
  }

  function sortAndRender() {
    if (sortColumn && sortDirection) {
      filteredData.sort((a, b) => {
        let va = getSortValue(a, sortColumn);
        let vb = getSortValue(b, sortColumn);
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        let cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDirection === 'desc' ? -cmp : cmp;
      });
    }
    currentPage = 1;
    renderPage();
  }

  // ============ Pricing (optimized O(1) lookup) ============
  let priceLookup = null;
  function buildPriceLookup() {
    if (priceLookup || typeof pricingData === 'undefined') return;
    priceLookup = {};
    for (const [key, prices] of Object.entries(pricingData)) {
      const cone = key.split('/')[0].trim().toUpperCase();
      const normalized = key.replace(/\s/g, '').toUpperCase();
      priceLookup[cone] = priceLookup[cone] || prices;
      priceLookup[normalized] = prices;
    }
  }

  function getPrice(partNumber, typeSuffix) {
    if (typeof pricingData === 'undefined') return null;
    if (!priceLookup) buildPriceLookup();
    const cone = partNumber.split('/')[0].trim().toUpperCase();
    const normalized = partNumber.replace(/\s/g, '').toUpperCase();
    const prices = priceLookup[normalized] || priceLookup[cone];
    if (!prices) return null;
    const typeKey = typeSuffix === 'Plain' ? 'Plain' : typeSuffix;
    return prices[typeKey] || Object.values(prices)[0] || null;
  }

  function formatPrice(price, currency) {
    if (!price) return '—';
    switch (currency) {
      case 'GBP': return '£' + Math.round(price.sell_gbp).toLocaleString();
      case 'USD': return '$' + Math.round(price.sell_usd).toLocaleString();
      case 'INR': return '₹' + Math.round(price.sell_inr).toLocaleString();
      default: return '—';
    }
  }

  // ============ PDF Download (browser-generated) ============
  // Cache for base64 images to avoid re-fetching
  const imageCache = {};
  async function toBase64Cached(url) {
    if (imageCache[url]) return imageCache[url];
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const result = await new Promise(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result); rd.readAsDataURL(blob); });
      imageCache[url] = result;
      return result;
    } catch (e) { return url; }
  }

  async function generatePDF(item, btnElement) {
    const price = getPrice(item.part_number, item.type_suffix);
    const drawingFile = DRAWING_FILES[item.type_suffix] || DRAWING_FILES['Plain'];
    const productFile = PRODUCT_IMAGES[item.type_suffix] || PRODUCT_IMAGES['Plain'];
    const T = item.T || item.B_total_width;

    const imgUrl = new URL(drawingFile, window.location.href).href;
    const prodUrl = new URL(productFile, window.location.href).href;
    const logoUrl = new URL('images/new_logo.jpg', window.location.href).href;

    const [base64Img, base64Prod, base64Logo] = await Promise.all([
      toBase64Cached(imgUrl), toBase64Cached(prodUrl), toBase64Cached(logoUrl)
    ]);

    const win = window.open('', '_blank', 'width=800,height=900');

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Gamet Bearing Datasheet — ${item.part_number}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Inter, sans-serif; background: white; color: #0f172a; padding: 24px 36px; }
  .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #1d4ed8; padding-bottom:14px; margin-bottom:16px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand img { height:28px; width:auto; border-radius:3px; }
  .brand-text h1 { font-size:16px; font-weight:800; color:#1d4ed8; }
  .brand-text p { font-size:9px; color:#64748b; margin-top:2px; }
  .part-title { font-size:22px; font-weight:800; color:#0f172a; margin-bottom:3px; }
  .type-badge { display:inline-block; background:#1d4ed8; color:white; font-size:9px; font-weight:700; padding:2px 10px; border-radius:999px; text-transform:uppercase; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:14px; }
  .dim-table { width:100%; border-collapse:collapse; font-size:11px; }
  .dim-table th { background:#f1f5f9; padding:5px 8px; text-align:left; font-weight:700; color:#475569; font-size:9px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; }
  .dim-table td { padding:4px 8px; border-bottom:1px solid #f1f5f9; }
  .dim-table tr:nth-child(even) td { background:#f8fafc; }
  .img-row { display:flex; gap:16px; margin-bottom:14px; }
  .drawing-box { flex:1; text-align:center; border:1px solid #e2e8f0; border-radius:6px; padding:14px; background:#f8fafc; }
  .drawing-box img { max-width:100%; max-height:320px; object-fit:contain; }
  .drawing-box p { font-size:8px; color:#64748b; margin-top:6px; font-weight:600; text-transform:uppercase; }
  .price-section { background:#f1f5f9; border-radius:6px; padding:10px 16px; margin-bottom:10px; display:flex; gap:28px; align-items:center; }
  .price-item label { font-size:9px; font-weight:700; text-transform:uppercase; color:#64748b; display:block; }
  .price-item span { font-size:15px; font-weight:800; color:#1d4ed8; }
  .footer-note { border-top:1px solid #e2e8f0; padding-top:10px; font-size:9px; color:#94a3b8; display:flex; justify-content:space-between; }
  .notice { background:#fff7ed; border:1px solid #fdba74; border-radius:4px; padding:6px 10px; font-size:9px; color:#78350f; margin-bottom:10px; }
  @media print { body { padding:16px 24px; } .print-btn { display:none !important; } @page { margin: 10mm; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${base64Logo}" alt="Gamet Logo" onerror="this.style.display='none'">
      <div class="brand-text">
        <h1>GAMET/HB Bearings</h1>
        <p>Super Precision Tapered Roller Bearings</p>
        <p style="color:#94a3b8;">Authorised India Partner: Jinharsh Industrial Solutions Pvt. Ltd.</p>
      </div>
    </div>
    <div style="text-align:right;">
      <div class="part-title">${item.part_number}</div>
      <div class="type-badge">${item.type_suffix} Type</div>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px;">Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
    </div>
  </div>

  <div class="grid">
    <div>
      <table class="dim-table">
        <thead><tr><th colspan="2">Dimensions (mm)</th></tr></thead>
        <tbody>
          <tr><td><strong>Bore (d)</strong></td><td>${item.d_bore ? item.d_bore.toFixed(3) : '—'} mm</td></tr>
          <tr><td><strong>Outer Dia (D)</strong></td><td>${item.D_outer ? item.D_outer.toFixed(3) : '—'} mm</td></tr>
          <tr><td><strong>Width (T/B)</strong></td><td>${T ? T.toFixed(2) : '—'} mm</td></tr>
          <tr><td><strong>Cup Width (C)</strong></td><td>${item.C_cup_width ? item.C_cup_width.toFixed(2) : '—'} mm</td></tr>
          ${item.F ? `<tr><td><strong>Flange (F)</strong></td><td>${item.F.toFixed(2)} mm</td></tr>` : ''}
          ${item.da ? `<tr><td><strong>da</strong></td><td>${item.da.toFixed(2)} mm</td></tr>` : ''}
          ${item.Da ? `<tr><td><strong>L / Da</strong></td><td>${item.Da.toFixed(2)} mm</td></tr>` : ''}
          <tr><td><strong>Weight</strong></td><td>${item.weight_kg ? item.weight_kg + ' kg' : '—'}</td></tr>
        </tbody>
      </table>
    </div>
    <div>
      ${item.max_rpm || item.C_load ? `
      <table class="dim-table">
        <thead><tr><th colspan="2">Performance</th></tr></thead>
        <tbody>
          ${item.max_rpm ? `<tr><td><strong>Max Speed</strong></td><td>${item.max_rpm.toLocaleString()} rpm</td></tr>` : ''}
          ${item.C_load ? `<tr><td><strong>Dynamic Load (C)</strong></td><td>${item.C_load.toLocaleString()} daN</td></tr>` : ''}
          ${item.C0_load ? `<tr><td><strong>Static Load (C0)</strong></td><td>${item.C0_load.toLocaleString()} daN</td></tr>` : ''}
        </tbody>
      </table>` : ''}
      <table class="dim-table" style="margin-top:8px;">
        <thead><tr><th colspan="2">Part Reference</th></tr></thead>
        <tbody>
          <tr><td><strong>Cone</strong></td><td>${item.cone || '—'}</td></tr>
          <tr><td><strong>Cup</strong></td><td>${item.cup || '—'}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="img-row">
    <div class="drawing-box">
      <img src="${base64Prod}" alt="${item.type_suffix} Type Product" onerror="this.style.display='none'">
      <p>Product — ${item.type_suffix} Type</p>
    </div>
    <div class="drawing-box">
      <img src="${base64Img}" alt="${item.type_suffix} Type Drawing" onerror="this.style.display='none'">
      <p>Drawing — ${item.type_suffix} Type</p>
    </div>
  </div>

  ${price ? `
  <div class="price-section">
    <div class="price-item"><label>GBP</label><span>£${Math.round(price.sell_gbp).toLocaleString()}</span></div>
    <div class="price-item"><label>USD</label><span>$${Math.round(price.sell_usd).toLocaleString()}</span></div>
    <div class="price-item"><label>INR</label><span>₹${Math.round(price.sell_inr).toLocaleString()}</span></div>
  </div>
  <div class="notice">⚠️ Indicative list prices for budgeting only. Actual discounted prices on inquiry. Q Spec = +25%, QK Spec = +50%.</div>
  ` : ''}

  <div class="footer-note">
    <span>Gamet Super Precision Tapered Roller Bearings — hb-gamet.com</span>
    <span>Authorised Partner: Jinharsh Industrial Solutions Pvt. Ltd.</span>
  </div>

  <div style="text-align:center;margin-top:16px;">
    <button class="print-btn" onclick="window.print()" style="background:#1d4ed8;color:white;border:none;padding:8px 24px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">🖨 Print / Save as PDF</button>
  </div>

</body></html>`);
    win.document.close();
  }

  // ============ Render Page ============
  function renderPage() {
    const total = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, total);
    const pageData = filteredData.slice(start, end);

    if (resultsCount) resultsCount.textContent = `${total} item${total !== 1 ? 's' : ''} found`;

    if (total === 0) { showState('empty'); updatePagination(0, 0, 0); return; }

    const typeColors = {
      'Plain': '#475569', 'C': '#2563eb', 'G': '#d97706', 'H': '#7c3aed', 'P': '#059669'
    };

    // Desktop table
    const fragment = document.createDocumentFragment();
    pageData.forEach(item => {
      const row = document.createElement('tr');
      const color = typeColors[item.type_suffix] || '#475569';
      const T = item.T || item.B_total_width;
      const dStr = item.d_bore ? item.d_bore.toFixed(2) : '—';
      const Dstr = item.D_outer ? item.D_outer.toFixed(2) : '—';
      const Tstr = T ? T.toFixed(2) : '—';
      const Cstr = item.C_cup_width ? item.C_cup_width.toFixed(2) : '—';
      const wStr = item.weight_kg ? item.weight_kg + ' kg' : '—';

      const price = getPrice(item.part_number, item.type_suffix);
      const priceStr = formatPrice(price, activeCurrency);
      const hasPrice = !!price;

      let spacerNote = '';
      if (item.part_number && (item.part_number.includes('HE') || item.part_number.includes('GE'))) {
        spacerNote = `<span style="font-size:0.68rem;color:var(--accent-primary);display:block;margin-top:2px;" title="Spacer variant">↔ Spacer</span>`;
      }

      const itemIdx = filteredData.indexOf(item);

      row.innerHTML = `
                <td style="font-family:'Courier New',monospace;font-size:0.82rem;font-weight:600;">${item.part_number}${spacerNote}</td>
                <td><span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;background:${color}18;color:${color};">${item.type_suffix}</span></td>
                <td>${dStr}</td>
                <td>${Dstr}</td>
                <td>${Tstr}</td>
                <td>${Cstr}</td>
                <td>${wStr}</td>
                <td style="font-weight:${hasPrice ? '600' : '400'};color:${hasPrice ? 'var(--accent-primary)' : 'var(--text-muted)'};">${priceStr}</td>
                <td><button onclick="downloadPDF(${itemIdx}, this)" class="pdf-download-btn" title="Download PDF Drawing with Price">${PDF_ICON_SVG} PDF</button></td>
            `;
      fragment.appendChild(row);
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);

    // Mobile cards
    if (mobileCards) {
      const mobileFragment = document.createDocumentFragment();
      pageData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        const color = typeColors[item.type_suffix] || '#475569';
        const T = item.T || item.B_total_width;
        const dStr = item.d_bore ? item.d_bore.toFixed(2) : '—';
        const Dstr = item.D_outer ? item.D_outer.toFixed(2) : '—';
        const Tstr = T ? T.toFixed(2) : '—';
        const wStr = item.weight_kg ? item.weight_kg + ' kg' : '—';
        const price = getPrice(item.part_number, item.type_suffix);
        const priceStr = formatPrice(price, activeCurrency);
        const itemIdx = filteredData.indexOf(item);

        card.innerHTML = `
          <div class="mobile-card-header">
            <div class="mobile-card-part">${item.part_number}</div>
            <span class="mobile-card-type" style="background:${color}18;color:${color};">${item.type_suffix}</span>
          </div>
          <dl class="mobile-card-dims">
            <div><dt>Bore (d)</dt><dd>${dStr} mm</dd></div>
            <div><dt>OD (D)</dt><dd>${Dstr} mm</dd></div>
            <div><dt>Width</dt><dd>${Tstr} mm</dd></div>
            <div><dt>Weight</dt><dd>${wStr}</dd></div>
          </dl>
          <div class="mobile-card-footer">
            <div class="mobile-card-price">${priceStr}</div>
            <button onclick="downloadPDF(${itemIdx}, this)" class="mobile-pdf-btn">${PDF_ICON_SVG} Download PDF</button>
          </div>
        `;
        mobileFragment.appendChild(card);
      });
      mobileCards.innerHTML = '';
      mobileCards.appendChild(mobileFragment);
    }

    showState('table');
    updatePagination(currentPage, totalPages, total, start + 1, end);
  }

  // Make PDF download accessible globally with loading feedback
  window.downloadPDF = function (idx, btnEl) {
    if (!filteredData[idx]) return;
    // Find the clicked button
    const btn = btnEl || event.currentTarget;
    if (btn && !btn.disabled) {
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="pdf-spinner"></span> Preparing…`;
      btn.style.opacity = '0.7';

      const fullLoader = document.getElementById('fullPageLoader');
      if (fullLoader) {
        fullLoader.classList.remove('hidden');
        const text = document.getElementById('loaderText');
        if (text) text.textContent = 'Preparing PDF Document...';
      }

      // Small arbitrary delay just to allow the UI to paint the spinner and loader
      // before heavy processing blocks the thread
      setTimeout(() => {
        generatePDF(filteredData[idx], btn).finally(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.opacity = '';
          if (fullLoader) fullLoader.classList.add('hidden');
        });
      }, 50);
    }
  };

  function updatePagination(page, totalPages, total, start, end) {
    if (!pageInfo) return;
    if (total === 0) {
      pageInfo.textContent = 'No results';
      if (pagePrev) pagePrev.disabled = true;
      if (pageNext) pageNext.disabled = true;
      return;
    }
    pageInfo.textContent = `${start}–${end} of ${total}`;
    if (pagePrev) pagePrev.disabled = page <= 1;
    if (pageNext) pageNext.disabled = page >= totalPages;
  }

  // ============ Search / Filter ============
  function applyFilters() {
    const q = (searchQuery ? searchQuery.value : '').toLowerCase().trim();
    const d = parseFloat(boreSize ? boreSize.value : '');
    const D = parseFloat(outerSize ? outerSize.value : '');

    filteredData = catalogData.filter(item => {
      const matchPart = q === '' || (item.part_number && item.part_number.toLowerCase().includes(q));
      const matchBore = isNaN(d) || (item.d_bore && Math.abs(item.d_bore - d) <= 0.5);
      const matchOuter = isNaN(D) || (item.D_outer && Math.abs(item.D_outer - D) <= 0.5);
      const matchType = activeTypeFilter === 'all' || item.type_suffix === activeTypeFilter;
      return matchPart && matchBore && matchOuter && matchType;
    });

    // Re-apply sort if active
    if (sortColumn && sortDirection) {
      filteredData.sort((a, b) => {
        let va = getSortValue(a, sortColumn);
        let vb = getSortValue(b, sortColumn);
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        let cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDirection === 'desc' ? -cmp : cmp;
      });
    }

    currentPage = 1;
    renderPage();
  }

  // ============ Type Filter ============
  window.setTypeFilter = function (type, btn) {
    activeTypeFilter = type;
    document.querySelectorAll('.type-pill').forEach(b => { b.className = 'type-pill'; });
    if (btn) btn.classList.add('on');
    applyFilters();
  };

  // ============ Currency ============
  if (currencySelect) {
    currencySelect.addEventListener('change', () => {
      activeCurrency = currencySelect.value;
      const labels = { GBP: 'Price (GBP £)', USD: 'Price (USD $)', INR: 'Price (INR ₹)' };
      const hdr = document.getElementById('priceColHeader');
      if (hdr) hdr.textContent = labels[activeCurrency] || 'Price';
      renderPage();
    });
  }

  // ============ Pagination ============
  if (pagePrev) pagePrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(); window.scrollTo(0, 400); } });
  if (pageNext) pageNext.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderPage(); window.scrollTo(0, 400); }
  });

  // ============ Events ============
  let timeout = null;
  [searchQuery, boreSize, outerSize].forEach(input => {
    if (input) input.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(applyFilters, 280);
    });
  });

  init();
});
