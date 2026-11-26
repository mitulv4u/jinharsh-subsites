document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  renderFloatingChat();
  initScrollAnimations();
});

function renderNavbar() {
  const headerElem = document.getElementById('main-header');
  if (!headerElem) return;

  headerElem.innerHTML = `
    <nav class="fixed w-full z-50 bg-white border-b border-[#E7E7E7] transition-all duration-300 top-0 left-0">
      <div class="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
          <div class="flex-shrink-0 flex items-center">
            <a href="index.html" class="flex items-center">
              <img src="public/images/logo/logo-horizontal.png" alt="Jinharsh Logo" class="h-12 object-contain" />
            </a>
          </div>

          <!-- Desktop Menu -->
          <div class="hidden lg:flex space-x-6 items-center h-full">
            <a href="about.html" class="text-[13px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] transition-colors duration-200 uppercase whitespace-nowrap">
              ABOUT US
            </a>

            <!-- Markets Dropdown -->
            <div class="relative group h-full flex items-center">
              <button class="flex items-center text-[13px] font-bold tracking-[0.15em] text-[#121212] group-hover:text-[var(--color-accent)] transition-colors duration-200 uppercase whitespace-nowrap">
                MARKETS
                <svg class="w-4 h-4 ml-1 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div class="dropdown-menu absolute top-20 left-0 w-48 bg-white border-b border-x border-[#E7E7E7] shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex flex-col py-2 origin-top">
                <a href="industries.html" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">INDUSTRIES</a>
                <a href="verticals.html" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">VERTICALS</a>
              </div>
            </div>

            <!-- Catalog Dropdown -->
            <div class="relative group h-full flex items-center">
              <button class="flex items-center text-[13px] font-bold tracking-[0.15em] text-[#121212] group-hover:text-[var(--color-accent)] transition-colors duration-200 uppercase whitespace-nowrap">
                CATALOG
                <svg class="w-4 h-4 ml-1 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div class="dropdown-menu absolute top-20 left-0 w-64 bg-white border-b border-x border-[#E7E7E7] shadow-[0_10px_40px_rgba(0,0,0,0.06)] flex flex-col py-2 origin-top">
                <a href="brands.html" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">OUR BRANDS</a>
                <a href="technical-catalog.html" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">TECHNICAL CATALOG</a>
                <a href="https://catalog.jinharsh.com" target="_blank" rel="noopener" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">INTERACTIVE PDF HUB ↗</a>
                <a href="portfolio.html" class="px-5 py-3 text-[12px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">PORTFOLIO</a>
              </div>
            </div>

            <a href="contact.html" class="text-[13px] font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] transition-colors duration-200 uppercase whitespace-nowrap">
              CONTACT
            </a>
          </div>

          <!-- Desktop Right Actions -->
          <div class="hidden lg:flex items-center space-x-6">
            <div class="relative group flex items-center">
              <input type="text" id="nav-search-input" placeholder="Search..." class="w-40 xl:w-64 px-4 py-2 text-sm border border-[#E7E7E7] rounded-full focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[#121212]" onkeydown="if(event.key==='Enter') location.href='technical-catalog.html?search='+encodeURIComponent(this.value)" />
              <svg class="absolute right-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>

            <a href="quote.html" class="relative text-[#121212] hover:text-[var(--color-accent)] transition-colors pl-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span class="quote-badge absolute -top-2 -right-2 bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full items-center justify-center min-w-[20px]" style="display:none;">0</span>
            </a>

            <a href="quote.html" class="indust-button px-6 py-2.5 text-[12px] font-bold tracking-widest uppercase text-white hover:text-white shrink-0">
              REQUEST QUOTE
            </a>
          </div>

          <!-- Mobile Menu Button -->
          <div class="lg:hidden flex items-center space-x-4">
            <a href="quote.html" class="relative text-[#121212] transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span class="quote-badge absolute -top-2 -right-2 bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full items-center justify-center min-w-[20px]" style="display:none;">0</span>
            </a>
            <button id="mobile-menu-toggle" class="text-[#121212] hover:text-[var(--color-accent)] focus:outline-none">
              <svg id="hamburger-icon" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu Panel -->
      <div id="mobile-menu" class="hidden lg:hidden bg-white border-b border-[#E7E7E7] h-[calc(100vh-80px)] overflow-y-auto">
        <div class="px-4 pt-2 pb-6 flex flex-col">
          <a href="about.html" class="block px-3 py-3 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">ABOUT US</a>
          
          <div class="px-3 py-2 text-[10px] font-black tracking-[0.2em] text-[#888] uppercase mt-2">MARKETS</div>
          <a href="industries.html" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">INDUSTRIES</a>
          <a href="verticals.html" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">VERTICALS</a>

          <div class="px-3 py-2 text-[10px] font-black tracking-[0.2em] text-[#888] uppercase mt-4">CATALOG</div>
          <a href="brands.html" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">OUR BRANDS</a>
          <a href="technical-catalog.html" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">TECHNICAL CATALOG</a>
          <a href="https://catalog.jinharsh.com" target="_blank" rel="noopener" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">INTERACTIVE PDF HUB ↗</a>
          <a href="portfolio.html" class="block px-6 py-2 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">PORTFOLIO</a>

          <div class="border-t border-[#E7E7E7] my-4 mx-3"></div>

          <a href="contact.html" class="block px-3 py-3 text-sm font-bold tracking-[0.15em] text-[#121212] hover:text-[var(--color-accent)] hover:bg-[#F8F8F8] transition-colors uppercase">CONTACT</a>
          <a href="quote.html" class="mt-4 mx-3 block text-center indust-button py-4 text-[14px] font-bold tracking-widest uppercase text-white">Request Quote</a>
        </div>
      </div>
    </nav>
  `;

  // Attach mobile toggle event
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

function renderFooter() {
  const footerElem = document.getElementById('main-footer');
  if (!footerElem) return;

  footerElem.innerHTML = `
    <footer class="bg-white border-t border-[#E7E7E7] pt-20 pb-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div class="col-span-1 md:col-span-2">
            <a href="index.html" class="inline-block mb-6">
              <img src="public/images/logo/logo-horizontal.png" alt="Jinharsh Logo" class="h-12 object-contain" />
            </a>
            <p class="text-[#5a5a5a] text-sm leading-relaxed max-w-sm font-light mt-4">
              Providing cutting-edge industrial solutions, equipment, and services since 1985. Partnering with global leaders to ensure operational excellence.
            </p>
          </div>

          <div>
            <h4 class="text-[#121212] font-bold text-lg mb-6 uppercase tracking-wide">Quick Links</h4>
            <ul class="space-y-3">
              <li><a href="index.html" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">Home</a></li>
              <li><a href="about.html" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">About Us</a></li>
              <li><a href="https://catalog.jinharsh.com" target="_blank" rel="noopener" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">Interactive Catalog Hub ↗</a></li>
              <li><a href="https://borewell.jinharsh.com" target="_blank" rel="noopener" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">Borewell Rig Solutions ↗</a></li>
              <li><a href="brands.html" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">Our Brands</a></li>
              <li><a href="contact.html" class="text-[#5a5a5a] text-sm hover:text-[var(--color-accent)] transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-[#121212] font-bold text-lg mb-6 uppercase tracking-wide">Contact</h4>
            <ul class="space-y-3 text-[#5a5a5a] text-sm leading-relaxed">
              <li>📍 76/78 Nagdevi Street, Mumbai – 400003</li>
              <li>✉️ crm@jinharsh.com</li>
              <li>📞 +91-22-40 900000</li>
            </ul>
          </div>
        </div>

        <div class="border-t border-[#E7E7E7] pt-8 flex flex-col md:flex-row justify-between items-center bg-[#F8F8F8] px-8 py-6">
          <p class="text-[#999999] text-xs font-bold uppercase tracking-widest mb-4 md:mb-0">
            © ${new Date().getFullYear()} Jinharsh. All rights reserved.
          </p>
          <div class="flex space-x-6 text-[#999999] text-xs font-bold uppercase tracking-widest">
            <a href="#" class="hover:text-[var(--color-accent)] transition-colors">Privacy</a>
            <a href="#" class="hover:text-[var(--color-accent)] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function renderFloatingChat() {
  const container = document.getElementById('floating-chat-container');
  if (!container) return;

  container.innerHTML = `
    <div class="fixed bottom-6 right-6 z-50">
      <a href="https://wa.me/912240900000" target="_blank" class="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <svg class="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981z"/></svg>
      </a>
    </div>
  `;
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
}
