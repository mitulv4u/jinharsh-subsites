// main.js - Authorized GROZ Distributor
// Unified Industrial B2B Logic & Modern Industrial Precision Product Engine

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. DATA TAXONOMY & PRODUCT MATCHING ENGINE
    // =========================================================================

    const CATEGORY_DEFINITIONS = [
        {
            id: 'c1',
            name: 'LUBRICATION',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg',
            rawCategories: ['FLUID HANDLING EQUIPMENT', 'OILING EQUIPMENT', 'WASTE OIL HANDLING', 'DRUM HANDLING', 'HOSE REELS'],
            subs: [
                { id: 'c1-1', name: 'Grease Handling', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.58.13 PM.jpeg', keywords: ['grease', 'greasing'] },
                { id: 'c1-2', name: 'Oil Handling', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.58.45 PM.jpeg', keywords: ['oil', 'oiling', 'oms', 'funnel', 'measure', 'suction', 'drain pan'] },
                { id: 'c1-3', name: 'Waste Oil Handling', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.59.04 PM.jpeg', keywords: ['waste oil', 'drain'] },
                { id: 'c1-4', name: 'Drum Handling', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.59.28 PM.jpeg', keywords: ['drum', 'cradle', 'dolly', 'trolley'] },
                { id: 'c1-5', name: 'Hose Reels', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 12.59.46 PM.jpeg', keywords: ['hose reel', 'reels'] },
                { id: 'c1-6', name: 'Air Operated Pumps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.00.04 PM.jpeg', keywords: ['aodd', 'air operated'] }
            ]
        },
        {
            id: 'c2',
            name: 'FUEL & DEF',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.00.43 PM.jpeg',
            rawCategories: ['DEF HANDLING EQUIPMENT', 'FUEL HANDLING EQUIPMENT', 'SPECIALITY PUMPS'],
            subs: [
                { id: 'c2-1', name: 'Fuel Pumps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.00.25 PM.jpeg', keywords: ['fuel pump', 'explosion proof', 'fuel handling'] },
                { id: 'c2-2', name: 'Fuel Accessories', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.01.03 PM.jpeg', keywords: ['fuel nozzle', 'fuel meter', 'fuel hose', 'fuel filter'] },
                { id: 'c2-3', name: 'DEF Pumps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.01.22 PM.jpeg', keywords: ['def pump', 'def kit', 'def handling', 'def transfer'] },
                { id: 'c2-4', name: 'DEF Accessories', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.01.48 PM.jpeg', keywords: ['def nozzle', 'def swivel', 'def hose'] },
                { id: 'c2-5', name: 'Speciality Pumps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.06 PM.jpeg', keywords: ['rotary', 'siphon', 'bilge', 'lever action', 'vertical lift', 'battery operated pump', 'speciality pump'] }
            ]
        },
        {
            id: 'c3',
            name: 'AIR TOOLS',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.20 PM.jpeg',
            rawCategories: ['AIR LINE ACCESSORIES', 'IMPACT & RATCHET WRENCHES'],
            subs: [
                { id: 'c3-1', name: 'Impact Wrenches & Ratchets', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.37 PM.jpeg', keywords: ['impact wrench', 'ratchet wrench', 'drive'] },
                { id: 'c3-2', name: 'Air Blow Guns', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.56 PM.jpeg', keywords: ['blow gun'] },
                { id: 'c3-3', name: 'Air Control Units', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.03.57 PM.jpeg', keywords: ['filter', 'regulator', 'lubricator', 'frclm', 'air line'] }
            ]
        },
        {
            id: 'c4',
            name: 'LIGHTING',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.04.16 PM.jpeg',
            rawCategories: ['FLASHLIGHTS', 'FLOODLIGHTS', 'HEADLAMPS', 'LED LIGHT BARS', 'LED WORKLIGHTS'],
            subs: [
                { id: 'c4-1', name: 'Worklights', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.04.43 PM.jpeg', keywords: ['worklight', 'inspection', 'work light'] },
                { id: 'c4-2', name: 'Underhood Lights', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.04.56 PM.jpeg', keywords: ['underhood', 'bonnet'] },
                { id: 'c4-3', name: 'Flashlights', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.05.10 PM.jpeg', keywords: ['flashlight', 'torch', 'penlight'] },
                { id: 'c4-4', name: 'Head Lamps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.05.37 PM.jpeg', keywords: ['headlamp', 'head lamp'] },
                { id: 'c4-5', name: 'Floodlights', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.05.52 PM.jpeg', keywords: ['floodlight', 'site light'] },
                { id: 'c4-6', name: 'Lightbars', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.06.12 PM.jpeg', keywords: ['light bar', 'lightbar'] }
            ]
        },
        {
            id: 'c5',
            name: 'HAND TOOLS',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.06.28 PM.jpeg',
            rawCategories: ['STRIKING TOOLS', 'HEXAGON KEY SETS', 'SCREWDRIVERS & HEX KEYS', 'SPANNERS & PLIERS'],
            subs: [
                { id: 'c5-1', name: 'Hammers', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.06.47 PM.jpeg', keywords: ['hammer', 'sledge', 'mallet', 'striking'] },
                { id: 'c5-2', name: 'Punches and Chisels', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.07.06 PM.jpeg', keywords: ['punch', 'chisel'] },
                { id: 'c5-3', name: 'Vices and Clamps', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.07.24 PM.jpeg', keywords: ['vice', 'clamp'] },
                { id: 'c5-4', name: 'Screwdrivers and Hex Keys', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.07.38 PM.jpeg', keywords: ['screwdriver', 'hex key', 'hexagon'] },
                { id: 'c5-5', name: 'Spanners and Wrenches', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.07.53 PM.jpeg', keywords: ['spanner', 'wrench'] },
                { id: 'c5-6', name: 'Pliers and Cutters', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.08.22 PM.jpeg', keywords: ['plier', 'cutter'] }
            ]
        },
        {
            id: 'c6',
            name: 'MECHANIC\'S TOOLS',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.08.35 PM.jpeg',
            rawCategories: [
                'HAND SOCKET SETS IN BLOW MOULDED CASES',
                'IMPACT SOCKETS',
                'RATCHET HANDLES',
                'SOCKET SETS IN METAL CASES',
                'SOCKETS & SOCKET ACCESSORIES',
                'TOOL STORAGE & ASSORTMENTS',
                'TORQUE TOOLS',
                'AUTOMOTIVE TOOLS & ACCESSORIES'
            ],
            subs: [
                { id: 'c6-1', name: 'Sockets and Socket Accessories', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.08.51 PM.jpeg', keywords: ['socket', 'ratchet'] },
                { id: 'c6-2', name: 'Lifting Equipment', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.09.09 PM.jpeg', keywords: ['jack', 'stand', 'lifting', 'bearing puller', 'puller'] },
                { id: 'c6-3', name: 'Tools Storage & Assortments', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.09.22 PM.jpeg', keywords: ['cabinet', 'tool kit', 'tool bag', 'box', 'storage'] },
                { id: 'c6-4', name: 'Torque Tools', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.09.34 PM.jpeg', keywords: ['torque'] },
                { id: 'c6-5', name: 'Service Tools', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.09.46 PM.jpeg', keywords: ['automotive', 'service'] }
            ]
        },
        {
            id: 'c7',
            name: 'POWER TOOLS',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.09.59 PM.jpeg',
            rawCategories: ['CORDLESS TOOLS'],
            subs: [
                { id: 'c7-1', name: 'Cordless Tools', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.10.12 PM.jpeg', keywords: ['cordless', 'impact drill', 'battery'] }
            ]
        },
        {
            id: 'c-spares',
            name: 'SPARE PARTS',
            image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.06 PM.jpeg',
            rawCategories: ['SPARE PARTS'],
            subs: [
                { id: 'c-spares-1', name: 'Genuine Replacement Spares', image: 'assets/groz images/WhatsApp Image 2026-10-29 at 1.02.06 PM.jpeg', keywords: ['spare', 'kit', 'service'] }
            ]
        }
    ];

    window.CATEGORY_DEFINITIONS = CATEGORY_DEFINITIONS;

    // Helper: Map a product to one of the 7 main categories
    function getProductMainCategory(product) {
        if (!product) return null;
        const rawCat = (product.category || '').toUpperCase();
        for (const catDef of CATEGORY_DEFINITIONS) {
            if (catDef.rawCategories.includes(rawCat) || catDef.name.toUpperCase() === rawCat) {
                return catDef;
            }
        }
        return null;
    }

    // Helper: Test if product matches a subcategory
    function matchesSubcategory(product, subDef) {
        if (!subDef || !product) return false;
        const target = `${product.productName || ''} ${product.subcategory || ''} ${product.partNo || ''}`.toLowerCase();
        return subDef.keywords.some(kw => target.includes(kw.toLowerCase()));
    }

    // =========================================================================
    // 2. GLOBAL CART STATE & TOAST NOTIFICATION SYSTEM
    // =========================================================================

    // Update Cart Badge across all pages
    window.updateCartBadge = function() {
        let cart = [];
        try {
            const cartStr = localStorage.getItem('groz_cart');
            cart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            cart = [];
        }

        const badge = document.getElementById('cart-badge');
        const countBadge = document.getElementById('cart-count-badge');

        let totalQty = 0;
        cart.forEach(item => {
            totalQty += (parseInt(item.qty, 10) || 1);
        });

        if (badge) {
            if (totalQty > 0) {
                badge.style.display = 'inline-flex';
                badge.textContent = totalQty;
            } else {
                badge.style.display = 'none';
            }
        }

        if (countBadge) {
            countBadge.textContent = `${totalQty} ITEM${totalQty === 1 ? '' : 'S'}`;
        }
    };

    // Global Industrial Toast Notification
    window.showToast = function(message, linkText = 'VIEW CART', linkHref = 'cart.html') {
        let container = document.getElementById('b2b-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'b2b-toast-container';
            container.className = 'b2b-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'b2b-toast';
        toast.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <div class="b2b-toast-text">${message}</div>
            ${linkText ? `<a href="${linkHref}" class="b2b-toast-link">${linkText}</a>` : ''}
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(12px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, 3600);
    };

    // Add Product to Cart Storage (with full data model & duplicate prevention)
    window.addToCart = function(product, qtyToAdd = 1) {
        if (!product) return;
        let cart = [];
        try {
            const cartStr = localStorage.getItem('groz_cart');
            cart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            cart = [];
        }

        const partNo = product.partNo || 'GROZ-ITEM';
        const slug = product.slug || (partNo ? partNo.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'item');

        const existingIndex = cart.findIndex(c =>
            (c.partNo && c.partNo.toLowerCase() === partNo.toLowerCase()) ||
            (c.slug && c.slug === slug)
        );

        const addQty = parseInt(qtyToAdd, 10) || 1;

        if (existingIndex > -1) {
            cart[existingIndex].qty = (parseInt(cart[existingIndex].qty, 10) || 1) + addQty;
        } else {
            cart.push({
                id: product.id || Date.now(),
                partNo: partNo,
                name: product.productName || product.name || 'GROZ Industrial Tool',
                category: product.category || 'Industrial Equipment',
                subcategory: product.subcategory || 'General',
                specifications: product.specifications || 'Standard Industrial Specification',
                price: parseInt(product.price, 10) || 0,
                qty: addQty,
                slug: slug,
                image: product.image || (window.getProductImage ? window.getProductImage(product) : 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg')
            });
        }

        localStorage.setItem('groz_cart', JSON.stringify(cart));
        window.updateCartBadge();
        window.showToast(`Added <strong>${product.productName || product.name || partNo}</strong> to quote list.`);

        // Close modal if open
        if (typeof window.closeProductModal === 'function') {
            window.closeProductModal();
        }

        // Re-render cart if on cart page
        if (typeof window.renderCart === 'function') {
            window.renderCart();
        }
    };

    window.updateCartBadge();

    // =========================================================================
    // 3. HEADER, MOBILE MENU & SCROLL ELEVATION
    // =========================================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('show');
        });
    }

    const siteHeader = document.querySelector('header');
    if (siteHeader) {
        const updateHeaderGlass = () => {
            if (window.scrollY > 15) {
                siteHeader.classList.add('header-scrolled');
            } else {
                siteHeader.classList.remove('header-scrolled');
            }
        };
        window.addEventListener('scroll', updateHeaderGlass, { passive: true });
        updateHeaderGlass();
    }

    // Centralized GROZ Catalogs Registry
    window.GROZ_CATALOGS = [
        {
            title: "Workshop tools mini catalog",
            filename: "Workshop tools mini catalog.pdf",
            path: "groz main catalogs/Workshop tools mini catalog.pdf",
            format: "PDF",
            size: "16.5 MB",
            badge: "PDF • 16.5 MB"
        },
        {
            title: "ToolsandEquipmentCI-37",
            filename: "ToolsandEquipmentCI-37.pdf",
            path: "groz main catalogs/ToolsandEquipmentCI-37.pdf",
            format: "PDF",
            size: "25.6 MB",
            badge: "PDF • 25.6 MB"
        },
        {
            title: "GREASE RATIO PUMP RANGE DOMESTIC",
            filename: "GREASE RATIO PUMP RANGE DOMESTIC.pdf",
            path: "groz main catalogs/GREASE RATIO PUMP RANGE DOMESTIC.pdf",
            format: "PDF",
            size: "18.5 MB",
            badge: "PDF • 18.5 MB"
        },
        {
            title: "Impact Wrenches",
            filename: "Impact Wrenches.pdf",
            path: "groz main catalogs/Impact Wrenches.pdf",
            format: "PDF",
            size: "7.1 MB",
            badge: "PDF • 7.1 MB"
        },
        {
            title: "Lifting Equipment",
            filename: "Lifting Equipment.pdf",
            path: "groz main catalogs/Lifting Equipment.pdf",
            format: "PDF",
            size: "4.0 MB",
            badge: "PDF • 4.0 MB"
        },
        {
            title: "Torque Tools",
            filename: "Torque Tools.pdf",
            path: "groz main catalogs/Torque Tools.pdf",
            format: "PDF",
            size: "2.7 MB",
            badge: "PDF • 2.7 MB"
        },
        {
            title: "Groz_Tool_Trolley_V2_Spread",
            filename: "Groz_Tool_Trolley_V2_Spread.pdf",
            path: "groz main catalogs/Groz_Tool_Trolley_V2_Spread.pdf",
            format: "PDF",
            size: "1.7 MB",
            badge: "PDF • 1.7 MB"
        },
        {
            title: "Cordless Drill- Brochure",
            filename: "Cordless Drill- Brochure.pdf",
            path: "groz main catalogs/Cordless Drill- Brochure.pdf",
            format: "PDF",
            size: "1.0 MB",
            badge: "PDF • 1.0 MB"
        },
        {
            title: "Cordless Impact Wrenches",
            filename: "Cordless Impact Wrenches.pdf",
            path: "groz main catalogs/Cordless Impact Wrenches.pdf",
            format: "PDF",
            size: "841 KB",
            badge: "PDF • 841 KB"
        },
        {
            title: "Data Sheet Groz Hammer",
            filename: "Data Sheet Groz Hammer.pdf",
            path: "groz main catalogs/Data Sheet Groz Hammer.pdf",
            format: "PDF",
            size: "675 KB",
            badge: "PDF • 675 KB"
        }
    ];

    // Resources Header Dropdown Interactivity
    const resourcesItem = document.getElementById('nav-resources-item');
    const resourcesToggle = document.getElementById('resources-dropdown-toggle');
    const resourcesMenu = document.getElementById('resources-dropdown-menu');

    if (resourcesToggle && resourcesItem) {
        resourcesToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = resourcesItem.classList.toggle('is-open');
            resourcesToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.addEventListener('click', (e) => {
            if (!resourcesItem.contains(e.target)) {
                resourcesItem.classList.remove('is-open');
                resourcesToggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && resourcesItem.classList.contains('is-open')) {
                resourcesItem.classList.remove('is-open');
                resourcesToggle.setAttribute('aria-expanded', 'false');
                resourcesToggle.focus();
            }
        });

        if (resourcesMenu) {
            resourcesMenu.querySelectorAll('.nav-resource-item, .nav-catalog-link').forEach(link => {
                link.addEventListener('click', () => {
                    resourcesItem.classList.remove('is-open');
                    resourcesToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }


    // =========================================================================
    // 4. UNIVERSAL PRODUCT DETAILS MODAL
    // =========================================================================
    let modalOverlay = document.getElementById('product-details-modal');
    let modalContent = document.getElementById('modal-product-content');

    // Create modal DOM dynamically if missing on page
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'product-details-modal';
        modalOverlay.className = 'b2b-modal-overlay';
        modalOverlay.style.display = 'none';
        modalOverlay.setAttribute('role', 'dialog');
        modalOverlay.setAttribute('aria-modal', 'true');
        modalOverlay.innerHTML = `
            <div class="b2b-modal-container">
                <button type="button" class="b2b-modal-close" id="modal-close-btn" aria-label="Close details modal">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div id="modal-product-content" class="b2b-modal-content"></div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        modalContent = document.getElementById('modal-product-content');
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => window.closeProductModal());
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) window.closeProductModal();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeProductModal();
            window.closeEnquiryDrawer();
        }
    });

    window.findProductByIdentifier = function(identifier) {
        if (!identifier || !window.GROZ_PRODUCTS) return null;
        const clean = String(identifier).trim().toLowerCase();
        return window.GROZ_PRODUCTS.find(p =>
            p.slug.toLowerCase() === clean ||
            p.partNo.toLowerCase() === clean ||
            String(p.id) === clean
        ) || null;
    };

    window.openProductModal = function(slugOrPart) {
        const product = window.findProductByIdentifier(slugOrPart);
        if (!product || !modalContent) return;

        const formattedPrice = Number(product.price).toLocaleString('en-IN');
        const specs = product.specs || {};
        const specKeys = Object.keys(specs).filter(k => k !== 'Includes / Notes');

        let specsHtml = '';
        if (specKeys.length > 0) {
            specsHtml = `
                <div class="modal-specs-section-compact">
                    <div class="specs-section-title">Technical Specifications</div>
                    <div class="modal-specs-compact-grid">
                        ${specKeys.map(k => {
                            const val = String(specs[k] || '');
                            const isLong = val.length > 35;
                            return `
                                <div class="modal-spec-compact-item ${isLong ? 'spec-span-full' : ''}">
                                    <span class="spec-k">${k}:</span>
                                    <span class="spec-v">${val}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else if (product.specifications) {
            specsHtml = `
                <div class="modal-specs-section-compact">
                    <div class="specs-section-title">Technical Specifications</div>
                    <div class="modal-specs-compact-single">
                        <span class="spec-k">Specifications:</span>
                        <span class="spec-v">${product.specifications}</span>
                    </div>
                </div>
            `;
        }

        const includesNote = specs['Includes / Notes'] || product.fullSpec || product.commonFeatures;
        const safePart = product.partNo.replace(/'/g, "\\'");
        const safeName = product.productName.replace(/'/g, "\\'");
        const safeSlug = product.slug.replace(/'/g, "\\'");

        // Related products from same subcategory or category
        const relatedProducts = (window.GROZ_PRODUCTS || [])
            .filter(p => p.partNo !== product.partNo && (p.subcategory === product.subcategory || p.category === product.category))
            .slice(0, 3);

        let relatedHtml = '';
        if (relatedProducts.length > 0) {
            relatedHtml = `
                <div class="modal-related-section">
                    <div class="modal-related-title"><i class="fa-solid fa-shapes"></i> Related ${product.subcategory || product.category} Equipment</div>
                    <div class="modal-related-grid">
                        ${relatedProducts.map(rel => {
                            const relSafeSlug = rel.slug.replace(/'/g, "\\'");
                            const relPrice = Number(rel.price).toLocaleString('en-IN');
                            return `
                                <div class="modal-related-item" onclick="window.openProductModal('${relSafeSlug}')" title="View ${rel.productName}">
                                    <img src="${rel.image || 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'}" alt="${rel.productName}" class="modal-related-thumb" loading="lazy" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                                    <div class="modal-related-info">
                                        <span class="modal-related-part">${rel.partNo}</span>
                                        <span class="modal-related-name">${rel.productName}</span>
                                        <span class="modal-related-price">₹ ${relPrice}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        modalContent.innerHTML = `
            <div class="modal-header-compact">
                <div class="modal-info-compact">
                    <div class="modal-top-meta">
                        <span class="modal-auth-tag"><i class="fa-solid fa-shield-halved"></i> GROZ AUTHORIZED</span>
                        <span class="table-cat-badge">${product.category}</span>
                        <span class="modal-subcat-text">${product.subcategory}</span>
                    </div>
                    <h2 class="modal-part-no-compact" id="modal-part-no-heading">${product.partNo}</h2>
                    <h3 class="modal-prod-name-compact">${product.productName}</h3>
                    <div class="modal-price-compact">
                        <span class="price-lbl">Catalogue Price (MRP):</span>
                        <span class="price-val">₹ ${formattedPrice}</span>
                    </div>
                </div>
                <div class="modal-thumb-compact">
                    <img src="${product.image || 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'}" alt="${product.productName}" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                </div>
            </div>

            ${specsHtml}

            ${includesNote ? `
                <div class="modal-summary-compact">
                    <strong>Note:</strong> ${includesNote.replace(/\|/g, ' &bull; ')}
                </div>
            ` : ''}

            ${relatedHtml}

            <div class="modal-actions-compact">
                <button type="button" class="modal-btn-add-quote" onclick="window.addToCart(window.findProductByIdentifier('${safeSlug}'))">
                    <i class="fa-solid fa-cart-plus"></i> ADD TO QUOTE
                </button>
                <button type="button" class="modal-btn-inquire" onclick="window.closeProductModal(); window.openEnquiryDrawer({ name: '${safeName}', partNo: '${safePart}' });">
                    <i class="fa-regular fa-paper-plane"></i> INQUIRE
                </button>
                <button type="button" class="modal-btn-close" onclick="window.closeProductModal()">
                    CLOSE
                </button>
            </div>
        `;

        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        if (window.history && window.history.pushState) {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('product', product.slug);
            window.history.pushState({ productSlug: product.slug }, '', currentUrl.toString());
        }
    };

    window.closeProductModal = function() {
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
        if (window.history && window.history.pushState) {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.has('product')) {
                currentUrl.searchParams.delete('product');
                window.history.pushState({}, '', currentUrl.toString());
            }
        }
    };

    // Check direct product URL param on page load
    const urlParams = new URLSearchParams(window.location.search);
    const directProductParam = urlParams.get('product') || urlParams.get('p');
    if (directProductParam) {
        setTimeout(() => window.openProductModal(directProductParam), 200);
    }

    // =========================================================================
    // 5. PRODUCTS PAGE: MODERN INDUSTRIAL PRECISION CATALOGUE VIEW
    // =========================================================================
    const catalogueContainer = document.getElementById('catalogue-view');
    const catalogueBreadcrumbs = document.getElementById('catalogue-breadcrumbs-container');

    if (catalogueContainer && window.GROZ_PRODUCTS) {
        let activeCatId = 'all';
        let activeSubId = 'all';
        let searchQuery = '';
        let sortOption = 'default';
        let cataloguePage = 1;
        const productsPerPage = 24;

        // Mega-menu state
        let isMegaMenuOpen = false;
        let previewCatId = 'c1';

        // Helper for category icons
        function getCategoryIcon(catId) {
            switch(catId) {
                case 'c1': return 'fa-solid fa-oil-can';
                case 'c2': return 'fa-solid fa-gas-pump';
                case 'c3': return 'fa-solid fa-wind';
                case 'c4': return 'fa-solid fa-lightbulb';
                case 'c5': return 'fa-solid fa-hammer';
                case 'c6': return 'fa-solid fa-wrench';
                case 'c7': return 'fa-solid fa-bolt';
                case 'c-spares': return 'fa-solid fa-gears';
                default: return 'fa-solid fa-folder-open';
            }
        }

        // Check URL parameters for cat or search
        const initialCat = urlParams.get('cat') || urlParams.get('category');
        const initialSearch = urlParams.get('search') || urlParams.get('q');
        if (initialCat) {
            activeCatId = initialCat;
            previewCatId = initialCat;
        }
        if (initialSearch) searchQuery = initialSearch;

        // Helper to render right column of mega-menu (subcategories)
        function renderMegaSubcategoriesHtml(catDef) {
            if (!catDef) return '';
            const catCount = window.GROZ_PRODUCTS.filter(p => catDef.rawCategories.includes(p.category)).length;

            return `
                <div class="mega-sub-header">
                    <div class="mega-sub-title-wrap">
                        <img src="${catDef.image}" alt="${catDef.name}" class="mega-sub-thumb" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                        <div class="mega-sub-title-info">
                            <h4>${catDef.name}</h4>
                            <span>${catCount} Industrial Tools Available</span>
                        </div>
                    </div>
                    <button type="button" class="btn-view-all-cat" onclick="window.selectCategory('${catDef.id}')">
                        <span>View All ${catDef.name}</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

                <div class="mega-sub-grid">
                    ${catDef.subs.map(s => {
                        const subCount = window.GROZ_PRODUCTS.filter(p => catDef.rawCategories.includes(p.category) && matchesSubcategory(p, s)).length;
                        const isSubActive = activeCatId === catDef.id && activeSubId === s.id;
                        return `
                            <button type="button" class="mega-sub-card ${isSubActive ? 'current-active' : ''}" onclick="window.selectCategoryAndSub('${catDef.id}', '${s.id}')">
                                <span class="mega-sub-card-name">${s.name}</span>
                                <span class="mega-sub-card-count">${subCount}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Function: Render Category Navigation Bar with Mega-Menu (Zero Scrollbar)
        function renderCategoryTabs() {
            const activeCat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
            const activeSub = activeCat && activeSubId !== 'all' ? activeCat.subs.find(s => s.id === activeSubId) : null;
            const currentPreviewCat = CATEGORY_DEFINITIONS.find(c => c.id === previewCatId) || CATEGORY_DEFINITIONS[0];

            let tabsHtml = `
                <div class="catalogue-category-tabs-bar">
                    <div class="cat-nav-left">
                        <!-- 1. ALL PRODUCTS BUTTON -->
                        <button type="button" class="cat-tab-btn ${activeCatId === 'all' ? 'active' : ''}" id="btn-catalogue-all" onclick="window.selectCategory('all')">
                            <i class="fa-solid fa-boxes-stacked"></i> ALL PRODUCTS
                            <span class="cat-tab-count">${window.GROZ_PRODUCTS.length}</span>
                        </button>

                        <!-- 2. PRODUCT CATEGORIES (MEGA-MENU TOGGLE) -->
                        <div class="cat-mega-dropdown-wrapper" id="cat-mega-dropdown-wrapper">
                            <button type="button" class="cat-mega-toggle-btn ${activeCatId !== 'all' ? 'active-cat-selected' : ''} ${isMegaMenuOpen ? 'is-open' : ''}" id="btn-mega-toggle">
                                <i class="fa-solid fa-layer-group"></i>
                                <span>${activeCat ? activeCat.name : 'PRODUCT CATEGORIES'}</span>
                                <i class="fa-solid fa-chevron-down toggle-chevron"></i>
                            </button>

                            <!-- MEGA-MENU FLYOUT (Left categories, Right subcategories beside) -->
                            <div class="cat-mega-menu" id="cat-mega-menu" style="display: ${isMegaMenuOpen ? 'block' : 'none'};">
                                <div class="mega-menu-inner">
                                    <!-- Left Column: 8 Categories -->
                                    <div class="mega-categories-column">
                                        <div class="mega-col-header">
                                            <i class="fa-solid fa-list-check"></i> GROZ CATEGORIES
                                        </div>
                                        <div class="mega-cat-list">
                                            ${CATEGORY_DEFINITIONS.map(c => {
                                                const cCount = window.GROZ_PRODUCTS.filter(p => c.rawCategories.includes(p.category)).length;
                                                const isPreview = currentPreviewCat.id === c.id;
                                                const isCurr = activeCatId === c.id;
                                                return `
                                                    <div class="mega-cat-item ${isPreview ? 'active-preview' : ''} ${isCurr ? 'current-active' : ''}" data-mega-cat="${c.id}">
                                                        <div class="mega-cat-item-left">
                                                            <i class="${getCategoryIcon(c.id)}"></i>
                                                            <span class="mega-cat-name">${c.name}</span>
                                                        </div>
                                                        <div class="mega-cat-item-right">
                                                            <span class="mega-cat-count">${cCount}</span>
                                                            <i class="fa-solid fa-chevron-right mega-arrow"></i>
                                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>

                                    <!-- Right Column: Subcategories beside the selected category -->
                                    <div class="mega-subcategories-column" id="mega-subcategories-column">
                                        ${renderMegaSubcategoriesHtml(currentPreviewCat)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. ACTIVE FILTER PILL (if category selected) -->
                        ${activeCat ? `
                            <div class="active-category-pill">
                                <span class="pill-cat-name">${activeCat.name}</span>
                                ${activeSub ? `<span class="pill-divider">/</span><span class="pill-sub-name">${activeSub.name}</span>` : ''}
                                <button type="button" class="btn-pill-remove" onclick="window.selectCategory('all')" title="Reset to All Products">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="cat-nav-right">
                        <span class="cat-total-status">
                            Filtered: <strong>${getFilteredCatalogueProducts().length}</strong> of <strong>${window.GROZ_PRODUCTS.length}</strong>
                        </span>
                    </div>
                </div>
            `;
            return tabsHtml;
        }

        // Function: Render Subcategory Bar if active category is selected
        function renderSubcategoryBar() {
            if (activeCatId === 'all') return '';
            const cat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
            if (!cat || !cat.subs || cat.subs.length === 0) return '';

            const catTotal = window.GROZ_PRODUCTS.filter(p => cat.rawCategories.includes(p.category)).length;

            let subHtml = `
                <div class="catalogue-subcat-bar">
                    <span class="subcat-bar-label"><i class="fa-solid fa-filter"></i> ${cat.name} GROUPS:</span>
                    <button type="button" class="subcat-pill-btn ${activeSubId === 'all' ? 'active' : ''}" onclick="window.selectSubcategory('all')">
                        All ${cat.name} (${catTotal})
                    </button>
            `;

            cat.subs.forEach(s => {
                const subCount = window.GROZ_PRODUCTS.filter(p => cat.rawCategories.includes(p.category) && matchesSubcategory(p, s)).length;
                subHtml += `
                    <button type="button" class="subcat-pill-btn ${activeSubId === s.id ? 'active' : ''}" onclick="window.selectSubcategory('${s.id}')">
                        ${s.name} <span class="subcat-count" style="font-size:10px; opacity:0.8;">(${subCount})</span>
                    </button>
                `;
            });

            subHtml += `</div>`;
            return subHtml;
        }

        // Function: Filter & Sort Products
        function getFilteredCatalogueProducts() {
            let list = window.GROZ_PRODUCTS.slice();

            // Category filter
            if (activeCatId !== 'all') {
                const cat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
                if (cat) {
                    list = list.filter(p => cat.rawCategories.includes(p.category));
                }
            }

            // Subcategory filter
            if (activeSubId !== 'all') {
                const cat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
                if (cat) {
                    const sub = cat.subs.find(s => s.id === activeSubId);
                    if (sub) {
                        list = list.filter(p => matchesSubcategory(p, sub));
                    }
                }
            }

            // Keyword search filter
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.trim().toLowerCase();
                list = list.filter(p =>
                    p.partNo.toLowerCase().includes(q) ||
                    p.productName.toLowerCase().includes(q) ||
                    (p.category && p.category.toLowerCase().includes(q)) ||
                    (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
                    (p.specifications && p.specifications.toLowerCase().includes(q))
                );
            }

            // Sort
            if (sortOption === 'part-asc') {
                list.sort((a, b) => a.partNo.localeCompare(b.partNo));
            } else if (sortOption === 'name-asc') {
                list.sort((a, b) => a.productName.localeCompare(b.productName));
            } else if (sortOption === 'price-low') {
                list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
            } else if (sortOption === 'price-high') {
                list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
            }

            return list;
        }

        // Function: Render the Complete Catalogue Screen
        window.renderCatalogue = function() {
            const filtered = getFilteredCatalogueProducts();
            const totalCount = filtered.length;
            const totalPages = Math.ceil(totalCount / productsPerPage) || 1;
            if (cataloguePage > totalPages) cataloguePage = 1;

            const startIndex = (cataloguePage - 1) * productsPerPage;
            const endIndex = Math.min(startIndex + productsPerPage, totalCount);
            const pageItems = filtered.slice(startIndex, endIndex);

            // Breadcrumbs
            if (catalogueBreadcrumbs) {
                const cat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
                let crumbHtml = `
                    <div class="breadcrumb-nav">
                        <ul class="breadcrumb-list">
                            <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                            <li class="breadcrumb-divider">/</li>
                            <li class="breadcrumb-item ${activeCatId === 'all' ? 'active' : ''}">
                                ${activeCatId === 'all' ? 'Product Catalogue' : `<a href="javascript:void(0)" onclick="selectCategory('all')">Product Catalogue</a>`}
                            </li>
                `;
                if (cat) {
                    crumbHtml += `
                        <li class="breadcrumb-divider">/</li>
                        <li class="breadcrumb-item ${activeSubId === 'all' ? 'active' : ''}">${cat.name}</li>
                    `;
                    if (activeSubId !== 'all') {
                        const sub = cat.subs.find(s => s.id === activeSubId);
                        if (sub) {
                            crumbHtml += `
                                <li class="breadcrumb-divider">/</li>
                                <li class="breadcrumb-item active">${sub.name}</li>
                            `;
                        }
                    }
                }
                crumbHtml += `</ul></div>`;
                catalogueBreadcrumbs.innerHTML = crumbHtml;
            }

            // Top Category Tabs & Subcategory Bar
            let fullHtml = renderCategoryTabs();
            fullHtml += renderSubcategoryBar();

            // Category / Subcategory Hero Spotlight
            if (activeCatId !== 'all') {
                const activeCat = CATEGORY_DEFINITIONS.find(c => c.id === activeCatId);
                if (activeCat) {
                    const activeSub = activeSubId !== 'all' ? activeCat.subs.find(s => s.id === activeSubId) : null;
                    const heroImg = activeSub ? activeSub.image : activeCat.image;
                    const heroTitle = activeSub ? `${activeCat.name} &rsaquo; ${activeSub.name}` : activeCat.name;
                    const heroSubtitle = activeSub 
                        ? `Verified GROZ ${activeSub.name} industrial equipment and precision tools.` 
                        : `Complete genuine GROZ ${activeCat.name} equipment line direct from factory supply chain.`;

                    fullHtml += `
                        <div class="catalogue-category-hero fade-up">
                            <div class="cat-hero-thumb-wrapper">
                                <img src="${heroImg}" alt="${heroTitle}" class="cat-hero-thumb" loading="lazy" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                            </div>
                            <div class="cat-hero-text">
                                <span class="cat-hero-eyebrow"><i class="fa-solid fa-certificate"></i> OFFICIAL GROZ RANGE</span>
                                <h2 class="cat-hero-title">${heroTitle}</h2>
                                <p class="cat-hero-desc">${heroSubtitle}</p>
                                <div class="cat-hero-badge-wrap">
                                    <span class="cat-hero-count-badge">${totalCount} Verified Products</span>
                                    <span class="cat-hero-oem-badge"><i class="fa-solid fa-shield-halved"></i> 100% Genuine OEM</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            // Discovery Controls Bar (Result Count, Sort, Clear)
            const isFiltered = activeCatId !== 'all' || activeSubId !== 'all' || searchQuery.trim().length > 0;
            fullHtml += `
                <div class="catalogue-controls-bar">
                    <div class="catalogue-results-count">
                        Showing <strong>${totalCount === 0 ? 0 : startIndex + 1}–${endIndex}</strong> of <strong>${totalCount}</strong> Products
                        ${searchQuery ? `for "<strong>${searchQuery}</strong>"` : ''}
                    </div>
                    <div class="catalogue-controls-right">
                        ${isFiltered ? `
                            <button type="button" class="btn-clear-filters" id="btn-clear-cat-filters">
                                <i class="fa-solid fa-xmark"></i> CLEAR FILTERS
                            </button>
                        ` : ''}
                        <select class="catalogue-sort-select" id="catalogue-sort-select">
                            <option value="default" ${sortOption === 'default' ? 'selected' : ''}>Sort: Default</option>
                            <option value="part-asc" ${sortOption === 'part-asc' ? 'selected' : ''}>Part No. (A-Z)</option>
                            <option value="name-asc" ${sortOption === 'name-asc' ? 'selected' : ''}>Product Name (A-Z)</option>
                            <option value="price-low" ${sortOption === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
                            <option value="price-high" ${sortOption === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
                        </select>
                    </div>
                </div>
            `;

            // Product Cards Grid
            if (pageItems.length === 0) {
                fullHtml += `
                    <div class="catalogue-empty-state">
                        <i class="fa-solid fa-box-open"></i>
                        <h3>NO MATCHING PRODUCTS FOUND</h3>
                        <p>No products match your current category and search criteria. Try removing filters or searching by a broader keyword.</p>
                        <button type="button" class="btn btn-secondary" onclick="resetCatalogueFilters()">RESET ALL FILTERS</button>
                    </div>
                `;
            } else {
                fullHtml += `<div class="products-grid">`;
                pageItems.forEach(p => {
                    const formattedPrice = Number(p.price).toLocaleString('en-IN');
                    const safeSlug = p.slug.replace(/'/g, "\\'");
                    const safePart = p.partNo.replace(/'/g, "\\'");

                    fullHtml += `
                        <div class="product-card">
                            <div class="product-card-img-wrap" onclick="window.openProductModal('${safeSlug}')">
                                <img src="${p.image || 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'}" alt="${p.productName}" loading="lazy" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                            </div>
                            <div class="product-card-body">
                                <div class="product-card-meta">
                                    <span class="product-part-badge">${p.partNo}</span>
                                    <span class="product-category-tag" title="${p.category}">${p.category}</span>
                                </div>
                                <h3 class="product-card-title" onclick="window.openProductModal('${safeSlug}')" title="${p.productName}">
                                    ${p.productName}
                                </h3>
                                <div class="product-card-specs" title="${p.specifications || ''}">
                                    ${p.specifications || 'Industrial Engineering Specification'}
                                </div>
                                <div class="product-card-price-row">
                                    <span class="product-card-price-label">Catalogue Price</span>
                                    <span class="product-card-price">₹ ${formattedPrice}</span>
                                </div>
                                <div class="product-card-actions">
                                    <button type="button" class="btn-card-details" onclick="window.openProductModal('${safeSlug}')">
                                        <i class="fa-solid fa-circle-info"></i> Details
                                    </button>
                                    <button type="button" class="btn-card-add-quote" onclick="window.addToCart(window.findProductByIdentifier('${safeSlug}'))">
                                        <i class="fa-solid fa-plus"></i> Add Quote
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                fullHtml += `</div>`;

                // Pagination
                if (totalPages > 1) {
                    fullHtml += `
                        <div class="catalogue-pagination">
                            <div class="pagination-info">
                                Page <strong>${cataloguePage}</strong> of <strong>${totalPages}</strong> (${totalCount} total items)
                            </div>
                            <div class="pagination-btn-group">
                                <button type="button" class="pagination-btn" onclick="goToCataloguePage(${cataloguePage - 1})" ${cataloguePage === 1 ? 'disabled' : ''}>
                                    <i class="fa-solid fa-chevron-left"></i> PREV
                                </button>
                                <button type="button" class="pagination-btn" onclick="goToCataloguePage(${cataloguePage + 1})" ${cataloguePage === totalPages ? 'disabled' : ''}>
                                    NEXT <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
            }

            catalogueContainer.innerHTML = fullHtml;

            // Mega-Menu Toggle Handler
            const megaToggle = document.getElementById('btn-mega-toggle');
            const megaMenu = document.getElementById('cat-mega-menu');
            if (megaToggle && megaMenu) {
                megaToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    isMegaMenuOpen = !isMegaMenuOpen;
                    megaMenu.style.display = isMegaMenuOpen ? 'block' : 'none';
                    megaToggle.classList.toggle('is-open', isMegaMenuOpen);
                });
            }

            // Mega-Menu Category Preview Switcher (Hover & Click)
            document.querySelectorAll('.mega-cat-item').forEach(item => {
                const switchPreview = () => {
                    const catId = item.getAttribute('data-mega-cat');
                    if (!catId || catId === previewCatId) return;
                    previewCatId = catId;

                    document.querySelectorAll('.mega-cat-item').forEach(el => {
                        el.classList.toggle('active-preview', el.getAttribute('data-mega-cat') === catId);
                    });

                    const subCol = document.getElementById('mega-subcategories-column');
                    const targetCat = CATEGORY_DEFINITIONS.find(c => c.id === catId);
                    if (subCol && targetCat) {
                        subCol.innerHTML = renderMegaSubcategoriesHtml(targetCat);
                    }
                };

                item.addEventListener('mouseenter', switchPreview);
                item.addEventListener('click', switchPreview);
            });

            // Close mega-menu on click outside
            document.addEventListener('click', (e) => {
                const wrapper = document.getElementById('cat-mega-dropdown-wrapper');
                if (wrapper && !wrapper.contains(e.target)) {
                    if (isMegaMenuOpen) {
                        isMegaMenuOpen = false;
                        const menu = document.getElementById('cat-mega-menu');
                        const btn = document.getElementById('btn-mega-toggle');
                        if (menu) menu.style.display = 'none';
                        if (btn) btn.classList.remove('is-open');
                    }
                }
            });

            // Close mega-menu on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && isMegaMenuOpen) {
                    isMegaMenuOpen = false;
                    const menu = document.getElementById('cat-mega-menu');
                    const btn = document.getElementById('btn-mega-toggle');
                    if (menu) menu.style.display = 'none';
                    if (btn) btn.classList.remove('is-open');
                }
            });

            const sortSelect = document.getElementById('catalogue-sort-select');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    sortOption = e.target.value;
                    cataloguePage = 1;
                    window.renderCatalogue();
                });
            }

            const clearBtn = document.getElementById('btn-clear-cat-filters');
            if (clearBtn) {
                clearBtn.addEventListener('click', resetCatalogueFilters);
            }
        };

        window.selectCategory = function(catId) {
            activeCatId = catId;
            activeSubId = 'all';
            previewCatId = (catId !== 'all') ? catId : 'c1';
            isMegaMenuOpen = false;
            cataloguePage = 1;
            window.renderCatalogue();
        };

        window.selectSubcategory = function(subId) {
            activeSubId = subId;
            isMegaMenuOpen = false;
            cataloguePage = 1;
            window.renderCatalogue();
        };

        window.selectCategoryAndSub = function(catId, subId) {
            activeCatId = catId;
            activeSubId = subId;
            previewCatId = catId;
            isMegaMenuOpen = false;
            cataloguePage = 1;
            window.renderCatalogue();
        };

        window.goToCataloguePage = function(p) {
            cataloguePage = p;
            window.renderCatalogue();
            window.scrollTo({ top: catalogueContainer.offsetTop - 80, behavior: 'smooth' });
        };

        window.resetCatalogueFilters = function() {
            activeCatId = 'all';
            activeSubId = 'all';
            searchQuery = '';
            sortOption = 'default';
            cataloguePage = 1;
            const searchInput = document.querySelector('.header-part-search-form input[name="search"]');
            if (searchInput) searchInput.value = '';
            window.renderCatalogue();
        };

        // Listen for search form submission on products.html
        const prodSearchForm = document.querySelector('.header-part-search-form');
        if (prodSearchForm) {
            prodSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const inp = prodSearchForm.querySelector('input[name="search"]');
                if (inp) {
                    searchQuery = inp.value;
                    cataloguePage = 1;
                    window.renderCatalogue();
                }
            });

            const searchInput = prodSearchForm.querySelector('input[name="search"]');
            if (searchInput) {
                if (searchQuery) searchInput.value = searchQuery;
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    cataloguePage = 1;
                    window.renderCatalogue();
                });
            }
        }

        // Initial render
        window.renderCatalogue();
    }

    // =========================================================================
    // 6. PART NO. PAGE: TECHNICAL LOOKUP & RESPONSIVE TABLE ENGINE
    // =========================================================================
    const partSearchInput = document.getElementById('part-no-input');
    const partSearchBtn = document.getElementById('search-btn');
    const partCategoryFilter = document.getElementById('part-category-filter');
    const partSearchResults = document.getElementById('search-results-container');
    const partSearchForm = document.getElementById('part-search-form');

    if (partSearchResults && window.GROZ_PRODUCTS) {
        let partCurrentList = [];
        let partCurrentPage = 1;
        const partItemsPerPage = 25;

        // Populate Category Dropdown
        if (partCategoryFilter) {
            const catCounts = {};
            window.GROZ_PRODUCTS.forEach(p => {
                catCounts[p.category] = (catCounts[p.category] || 0) + 1;
            });

            const sortedCats = Object.keys(catCounts).sort();
            let optionsHtml = `<option value="ALL">All Categories (${window.GROZ_PRODUCTS.length} Products)</option>`;
            sortedCats.forEach(cat => {
                optionsHtml += `<option value="${cat}">${cat} (${catCounts[cat]})</option>`;
            });
            partCategoryFilter.innerHTML = optionsHtml;
        }

        // Render Product Table
        function renderPartTable(products, page = 1) {
            partCurrentList = products;
            partCurrentPage = page;

            if (products.length === 0) {
                partSearchResults.innerHTML = `
                    <div class="catalogue-empty-state">
                        <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-primary-orange);"></i>
                        <h3>NO PART NUMBERS FOUND</h3>
                        <p>No matching product found in the official GROZ 2026 Price List. Check your part code spelling or select a broader category.</p>
                        <button type="button" class="btn btn-secondary" onclick="resetPartSearch()">RESET SEARCH</button>
                    </div>
                `;
                return;
            }

            const totalItems = products.length;
            const totalPages = Math.ceil(totalItems / partItemsPerPage);
            const startIndex = (page - 1) * partItemsPerPage;
            const endIndex = Math.min(startIndex + partItemsPerPage, totalItems);
            const pageItems = products.slice(startIndex, endIndex);

            let rowsHtml = '';
            pageItems.forEach(p => {
                const formattedPrice = Number(p.price).toLocaleString('en-IN');
                const safeSlug = p.slug.replace(/'/g, "\\'");
                const safePart = p.partNo.replace(/'/g, "\\'");

                rowsHtml += `
                    <tr>
                        <td data-label="PART NO.">
                            <div class="table-part-no-wrapper">
                                <span class="table-part-no">${p.partNo}</span>
                                <button type="button" class="btn-copy-part" title="Copy Part Number" onclick="copyPartNumberToClipboard('${safePart}', this)">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </td>
                        <td data-label="PRODUCT NAME">
                            <div class="table-prod-name" onclick="window.openProductModal('${safeSlug}')" style="cursor: pointer;">${p.productName}</div>
                        </td>
                        <td data-label="CATEGORY / SUBCAT">
                            <div><span class="table-cat-badge">${p.category}</span></div>
                            <div class="table-subcat">${p.subcategory}</div>
                        </td>
                        <td data-label="SPECIFICATIONS">
                            <div class="table-specs">${p.specifications || 'Standard Industrial Specification'}</div>
                        </td>
                        <td data-label="PRICE">
                            <div class="table-price">₹ ${formattedPrice}</div>
                        </td>
                        <td data-label="ACTION">
                            <div class="table-actions">
                                <button type="button" class="btn-table-details" onclick="window.openProductModal('${safeSlug}')">
                                    <i class="fa-solid fa-circle-info"></i> Details
                                </button>
                                <button type="button" class="btn-table-add-quote" onclick="window.addToCart(window.findProductByIdentifier('${safeSlug}'))">
                                    <i class="fa-solid fa-plus"></i> Quote
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            // Pagination HTML
            let paginationHtml = '';
            if (totalPages > 1) {
                paginationHtml = `
                    <div class="table-pagination">
                        <span>Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> matching parts</span>
                        <div class="pagination-btn-group">
                            <button type="button" class="pagination-btn" onclick="goToPartPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>
                                <i class="fa-solid fa-chevron-left"></i> PREV
                            </button>
                            <span>Page ${page} of ${totalPages}</span>
                            <button type="button" class="pagination-btn" onclick="goToPartPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>
                                NEXT <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                `;
            }

            partSearchResults.innerHTML = `
                <div class="product-table-wrapper">
                    <div class="table-results-bar">
                        <span>FOUND <strong>${totalItems}</strong> GROZ PRODUCT${totalItems === 1 ? '' : 'S'}</span>
                        <span>PAGE <strong>${page}</strong> OF <strong>${totalPages}</strong></span>
                    </div>
                    <div class="product-table-container">
                        <table class="product-table">
                            <thead>
                                <tr>
                                    <th style="width: 160px;">PART NO.</th>
                                    <th style="min-width: 240px;">PRODUCT NAME</th>
                                    <th style="min-width: 180px;">CATEGORY / SUBCAT</th>
                                    <th style="min-width: 220px;">SPECIFICATIONS</th>
                                    <th style="width: 120px;">PRICE</th>
                                    <th style="width: 170px;">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    ${paginationHtml}
                </div>
            `;
        }

        window.goToPartPage = function(page) {
            renderPartTable(partCurrentList, page);
            window.scrollTo({ top: partSearchResults.offsetTop - 80, behavior: 'smooth' });
        };

        window.copyPartNumberToClipboard = function(partNo, btnElement) {
            if (!partNo) return;
            navigator.clipboard.writeText(partNo).then(() => {
                const originalHtml = btnElement.innerHTML;
                btnElement.innerHTML = `<i class="fa-solid fa-check" style="color: var(--color-success);"></i>`;
                window.showToast(`Copied part number <strong>${partNo}</strong> to clipboard.`, '', '');
                setTimeout(() => {
                    btnElement.innerHTML = originalHtml;
                }, 2000);
            }).catch(() => {
                window.showToast(`Part number: ${partNo}`, '', '');
            });
        };

        function filterPartProducts() {
            const query = (partSearchInput ? partSearchInput.value : '').trim().toLowerCase();
            const selectedCat = partCategoryFilter ? partCategoryFilter.value : 'ALL';

            const filtered = window.GROZ_PRODUCTS.filter(p => {
                const matchCat = (selectedCat === 'ALL') || (p.category === selectedCat);
                const matchQuery = !query ||
                    p.partNo.toLowerCase().includes(query) ||
                    p.productName.toLowerCase().includes(query) ||
                    (p.category && p.category.toLowerCase().includes(query)) ||
                    (p.subcategory && p.subcategory.toLowerCase().includes(query)) ||
                    (p.specifications && p.specifications.toLowerCase().includes(query));
                return matchCat && matchQuery;
            });

            renderPartTable(filtered, 1);
        }

        window.resetPartSearch = function() {
            if (partSearchInput) partSearchInput.value = '';
            if (partCategoryFilter) partCategoryFilter.value = 'ALL';
            renderPartTable(window.GROZ_PRODUCTS, 1);
        };

        if (partSearchForm) {
            partSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                filterPartProducts();
            });
        }

        if (partSearchInput) {
            partSearchInput.addEventListener('input', () => {
                filterPartProducts();
            });
        }

        if (partCategoryFilter) {
            partCategoryFilter.addEventListener('change', () => {
                filterPartProducts();
            });
        }

        // Check search query parameter on load
        const partQueryParam = urlParams.get('search') || urlParams.get('q') || urlParams.get('part');
        if (partQueryParam && partSearchInput) {
            partSearchInput.value = partQueryParam;
            filterPartProducts();
        } else {
            renderPartTable(window.GROZ_PRODUCTS, 1);
        }
    }

    // =========================================================================
    // 7. CART / REQUEST FOR QUOTE PAGE ENGINE
    // =========================================================================
    const cartItemsContainer = document.getElementById('cart-items-container');

    window.renderCart = function() {
        if (!cartItemsContainer) return;

        let cart = [];
        try {
            const cartStr = localStorage.getItem('groz_cart');
            cart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            cart = [];
        }

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <i class="fa-solid fa-dolly empty-icon"></i>
                    <h3>YOUR QUOTE LIST IS EMPTY</h3>
                    <p>You haven't added any products yet. Browse our official catalogue or search by part number to generate an official commercial quotation.</p>
                    <div class="empty-cart-actions">
                        <a href="products.html" class="btn btn-primary">
                            <span>BROWSE PRODUCTS</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                        <a href="part-no.html" class="btn btn-secondary">
                            <span>FIND BY PART NO.</span>
                        </a>
                    </div>
                </div>
            `;
            window.updateCartBadge();
            syncCartToQuoteForm([]);
            return;
        }

        let html = '';
        let totalCartValue = 0;

        cart.forEach((item, index) => {
            const qty = parseInt(item.qty, 10) || 1;
            const price = parseInt(item.price, 10) || 0;
            const subtotal = price * qty;
            totalCartValue += subtotal;

            const imgSrc = item.image || (window.getProductImage ? window.getProductImage(item) : 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg');
            const partNo = item.partNo || 'GROZ-CAT';
            const slug = item.slug || (partNo ? partNo.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'item');
            const formattedPrice = price.toLocaleString('en-IN');
            const formattedSubtotal = subtotal.toLocaleString('en-IN');

            html += `
                <div class="cart-item-row">
                    <img src="${imgSrc}" alt="${item.name}" class="cart-item-thumb" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <div class="cart-item-meta">
                            <span class="cart-part-badge">Part: ${partNo}</span>
                            <span style="color: var(--color-text-secondary); font-size: 11px;">${item.category || ''}</span>
                        </div>
                        <div class="cart-item-prices">
                            <span class="cart-unit-price">Unit: ₹ ${formattedPrice}</span>
                            <span>&bull;</span>
                            <span class="cart-subtotal-val">Subtotal: ₹ ${formattedSubtotal}</span>
                        </div>
                        <div class="cart-controls-row">
                            <div class="cart-qty-picker">
                                <button type="button" class="cart-qty-btn" onclick="updateItemQty(${index}, -1)">-</button>
                                <span class="cart-qty-num">${qty}</span>
                                <button type="button" class="cart-qty-btn" onclick="updateItemQty(${index}, 1)">+</button>
                            </div>
                            <button type="button" class="cart-remove-link" onclick="removeCartItem(${index})">
                                <i class="fa-solid fa-trash-can"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Summary footer
        html += `
            <div class="cart-total-footer">
                <div>
                    <span class="cart-total-label">ESTIMATED QUOTATION TOTAL</span>
                    <p style="font-size: 11px; color: var(--color-text-secondary); margin: 0;">Excluding freight &amp; volume commercial discounts</p>
                </div>
                <div class="cart-total-amount">₹ ${totalCartValue.toLocaleString('en-IN')}</div>
            </div>
        `;

        cartItemsContainer.innerHTML = html;
        window.updateCartBadge();
        syncCartToQuoteForm(cart, totalCartValue);
    };

    function syncCartToQuoteForm(cart, totalVal = 0) {
        const reqField = document.getElementById('rfq-additional');
        if (!reqField) return;

        if (cart.length === 0) {
            reqField.placeholder = "Enter your shipping location, required timeline, specific delivery requirements, or GST number...";
            return;
        }

        let summaryText = `Commercial Quotation Request for ${cart.length} Selected Item(s):\n\n`;
        cart.forEach((c, i) => {
            summaryText += `${i + 1}. Part No: ${c.partNo} | Product: ${c.name} | Qty: ${c.qty} | Price: ₹ ${Number(c.price).toLocaleString('en-IN')}\n`;
        });
        summaryText += `\nEstimated Catalogue Total: ₹ ${Number(totalVal).toLocaleString('en-IN')}`;
    }

    window.updateItemQty = function(index, delta) {
        let cart = [];
        try {
            const cartStr = localStorage.getItem('groz_cart');
            cart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            cart = [];
        }

        if (cart[index]) {
            cart[index].qty = (parseInt(cart[index].qty, 10) || 1) + delta;
            if (cart[index].qty <= 0) {
                cart.splice(index, 1);
            }
            localStorage.setItem('groz_cart', JSON.stringify(cart));
            window.renderCart();
        }
    };

    window.removeCartItem = function(index) {
        let cart = [];
        try {
            const cartStr = localStorage.getItem('groz_cart');
            cart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            cart = [];
        }

        if (cart[index]) {
            const removed = cart.splice(index, 1);
            localStorage.setItem('groz_cart', JSON.stringify(cart));
            window.renderCart();
            if (removed[0]) {
                window.showToast(`Removed <strong>${removed[0].name}</strong> from quote.`, '', '');
            }
        }
    };

    if (cartItemsContainer) {
        window.renderCart();
    }

    // RFQ Form Submission
    const quoteRequestForm = document.getElementById('quote-request-form');
    if (quoteRequestForm) {
        quoteRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;
            const name = document.getElementById('rfq-name');
            const company = document.getElementById('rfq-company');
            const country = document.getElementById('rfq-country');
            const phone = document.getElementById('rfq-phone');
            const email = document.getElementById('rfq-email');
            const additional = document.getElementById('rfq-additional');

            const validate = (el, condition, errId) => {
                const err = document.getElementById(errId);
                if (!condition) {
                    if (el) el.classList.add('invalid');
                    if (err) err.classList.add('visible');
                    isValid = false;
                } else {
                    if (el) el.classList.remove('invalid');
                    if (err) err.classList.remove('visible');
                }
            };

            validate(name, name && name.value.trim().length >= 2, 'err-rfq-name');
            validate(company, company && company.value.trim().length >= 2, 'err-rfq-company');
            validate(country, country && country.value.trim().length >= 2, 'err-rfq-country');
            validate(phone, phone && phone.value.trim().length >= 6, 'err-rfq-phone');
            validate(email, email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'err-rfq-email');

            if (isValid) {
                const submitBtn = quoteRequestForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>SUBMITTING QUOTE REQUEST...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
                }

                let cart = [];
                try {
                    const cartStr = localStorage.getItem('groz_cart');
                    cart = cartStr ? JSON.parse(cartStr) : [];
                } catch (err) {
                    cart = [];
                }

                let cartDetails = '';
                let totalEstimatedVal = 0;
                if (cart.length > 0) {
                    cart.forEach((c, idx) => {
                        const lineTotal = (Number(c.price) || 0) * (Number(c.qty) || 1);
                        totalEstimatedVal += lineTotal;
                        cartDetails += `${idx + 1}. [Part: ${c.partNo || 'N/A'}] ${c.name} | Qty: ${c.qty} | Price: ₹${Number(c.price || 0).toLocaleString('en-IN')} | Total: ₹${Number(lineTotal).toLocaleString('en-IN')}\n`;
                    });
                    cartDetails += `\nEstimated Quote Total: ₹${Number(totalEstimatedVal).toLocaleString('en-IN')}`;
                } else {
                    cartDetails = 'General Specification Request (No items currently in quote cart)';
                }

                const payload = {
                    '_subject': `Commercial RFQ: ${company.value.trim()} (${name.value.trim()})`,
                    '_replyto': email.value.trim(),
                    'Full Name': name.value.trim(),
                    'Company Name': company.value.trim(),
                    'Country': country.value.trim(),
                    'Contact Number': phone.value.trim(),
                    'Business Email': email.value.trim(),
                    'Additional Information': additional && additional.value.trim() ? additional.value.trim() : 'None provided',
                    'Selected Equipment Items': cartDetails,
                    '_template': 'table',
                    '_captcha': 'false'
                };

                const finishRFQ = () => {
                    quoteRequestForm.style.display = 'none';
                    let successBox = document.getElementById('rfq-success-message');
                    if (!successBox) {
                        successBox = document.createElement('div');
                        successBox.id = 'rfq-success-message';
                        successBox.className = 'rfq-success-box';
                        quoteRequestForm.parentNode.appendChild(successBox);
                    }
                    successBox.innerHTML = `
                        <i class="fa-solid fa-circle-check"></i>
                        <h3>QUOTE REQUEST SUBMITTED</h3>
                        <p>Thank you, <strong>${name.value.trim()}</strong>. Your quotation request has been received by our commercial sales desk. An official proforma quotation will be dispatched to <strong>${email.value.trim()}</strong>.</p>
                        <a href="products.html" class="btn btn-primary">RETURN TO CATALOGUE</a>
                    `;
                    successBox.style.display = 'block';

                    localStorage.removeItem('groz_cart');
                    window.updateCartBadge();
                    if (typeof window.renderCart === 'function') {
                        window.renderCart();
                    }
                };

                fetch('https://formsubmit.co/ajax/enquiry@groz.tools', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(() => finishRFQ())
                .catch(() => finishRFQ());
            }
        });

        ['rfq-name', 'rfq-company', 'rfq-country', 'rfq-phone', 'rfq-email'].forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.addEventListener('input', () => {
                    field.classList.remove('invalid');
                    const err = document.getElementById('err-' + id);
                    if (err) err.classList.remove('visible');
                });
            }
        });
    }

    // =========================================================================
    // 8. RIGHT-SIDE ENQUIRY DRAWER CONTROLLER
    // =========================================================================
    let drawerOverlay = document.getElementById('enquiry-drawer-overlay');
    let drawerAside = document.getElementById('enquiry-drawer');

    // Create drawer dynamically if missing on any page
    if (!drawerAside) {
        drawerOverlay = document.createElement('div');
        drawerOverlay.id = 'enquiry-drawer-overlay';
        drawerOverlay.className = 'enquiry-drawer-overlay';
        document.body.appendChild(drawerOverlay);

        drawerAside = document.createElement('aside');
        drawerAside.id = 'enquiry-drawer';
        drawerAside.className = 'enquiry-drawer';
        drawerAside.setAttribute('role', 'dialog');
        drawerAside.setAttribute('aria-modal', 'true');
        drawerAside.setAttribute('aria-labelledby', 'enquiry-drawer-title');
        drawerAside.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-header-text">
                    <h2 id="enquiry-drawer-title" class="drawer-title">Send an Inquiry</h2>
                    <p class="drawer-subtitle">Have a technical query or bulk requirement? Share your details and our sales team will respond promptly.</p>
                </div>
                <button type="button" class="btn-drawer-close" id="btn-drawer-close" aria-label="Close inquiry drawer">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="drawer-body">
                <form id="enquiry-sidebar-form" class="enquiry-form" novalidate>
                    <div class="drawer-field-group">
                        <label for="inquiry-name" class="drawer-label">Full Name <span class="req-star">*</span></label>
                        <input type="text" id="inquiry-name" name="Full Name" class="drawer-input" placeholder="e.g. John Doe" required autocomplete="name">
                        <span class="inquiry-field-error" id="err-inquiry-name">Please enter your full name.</span>
                    </div>

                    <div class="drawer-field-group">
                        <label for="inquiry-company" class="drawer-label">Company Name <span class="req-star">*</span></label>
                        <input type="text" id="inquiry-company" name="Company Name" class="drawer-input" placeholder="e.g. Precision Engineering Ltd." required autocomplete="organization">
                        <span class="inquiry-field-error" id="err-inquiry-company">Please enter your company name.</span>
                    </div>

                    <div class="drawer-field-group">
                        <label for="inquiry-country" class="drawer-label">Country <span class="req-star">*</span></label>
                        <input type="text" id="inquiry-country" name="Country" class="drawer-input" placeholder="e.g. India, United Arab Emirates, USA" required>
                        <span class="inquiry-field-error" id="err-inquiry-country">Please enter your country.</span>
                    </div>

                    <div class="drawer-field-group">
                        <label for="inquiry-phone" class="drawer-label">Contact Number <span class="req-star">*</span></label>
                        <input type="tel" id="inquiry-phone" name="Contact Number" class="drawer-input" placeholder="e.g. +91 98765 43210" required autocomplete="tel">
                        <span class="inquiry-field-error" id="err-inquiry-phone">Please enter your contact number.</span>
                    </div>

                    <div class="drawer-field-group">
                        <label for="inquiry-email" class="drawer-label">Business Email <span class="req-star">*</span></label>
                        <input type="email" id="inquiry-email" name="Business Email" class="drawer-input" placeholder="e.g. procurement@company.com" required autocomplete="email">
                        <span class="inquiry-field-error" id="err-inquiry-email">Please enter a valid business email.</span>
                    </div>

                    <div class="drawer-field-group">
                        <label for="inquiry-message" class="drawer-label">Message / Requirements <span class="req-star">*</span></label>
                        <textarea id="inquiry-message" name="Message" class="drawer-textarea" rows="4" placeholder="Detail your equipment inquiry, part numbers, quantity needs, or project scope..." required></textarea>
                        <span class="inquiry-field-error" id="err-inquiry-message">Please enter your message or inquiry.</span>
                    </div>

                    <button type="submit" class="btn-drawer-submit" id="btn-drawer-submit">
                        <span>Submit Inquiry</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(drawerAside);
    }

    window.openEnquiryDrawer = function(prefillData) {
        if (!drawerAside) return;
        if (drawerOverlay) {
            drawerOverlay.classList.add('active');
            drawerOverlay.classList.add('open');
        }
        drawerAside.classList.add('active');
        drawerAside.classList.add('open');
        document.body.style.overflow = 'hidden';

        if (prefillData && prefillData.partNo) {
            const msgBox = document.getElementById('inquiry-message');
            if (msgBox) {
                msgBox.value = `I am inquiring about GROZ Part No: ${prefillData.partNo} (${prefillData.name || ''}). Please share quotation, availability, and lead time.`;
            }
        }
    };

    window.closeEnquiryDrawer = function() {
        if (drawerOverlay) {
            drawerOverlay.classList.remove('active');
            drawerOverlay.classList.remove('open');
        }
        if (drawerAside) {
            drawerAside.classList.remove('active');
            drawerAside.classList.remove('open');
        }
        document.body.style.overflow = '';
    };

    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', window.closeEnquiryDrawer);
    }

    const closeBtn = document.getElementById('btn-drawer-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', window.closeEnquiryDrawer);
    }

    // Enquiry Drawer Form Validation & Submission
    const drawerForm = document.getElementById('enquiry-sidebar-form');
    if (drawerForm) {
        drawerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;
            const name = document.getElementById('inquiry-name');
            const company = document.getElementById('inquiry-company');
            const country = document.getElementById('inquiry-country');
            const phone = document.getElementById('inquiry-phone');
            const email = document.getElementById('inquiry-email');
            const msg = document.getElementById('inquiry-message');

            const validateField = (el, condition, errId) => {
                const err = document.getElementById(errId);
                if (!condition) {
                    if (el) el.classList.add('invalid');
                    if (err) err.classList.add('visible');
                    isValid = false;
                } else {
                    if (el) el.classList.remove('invalid');
                    if (err) err.classList.remove('visible');
                }
            };

            validateField(name, name && name.value.trim().length >= 2, 'err-inquiry-name');
            validateField(company, company && company.value.trim().length >= 2, 'err-inquiry-company');
            validateField(country, country && country.value.trim().length >= 2, 'err-inquiry-country');
            validateField(phone, phone && phone.value.trim().length >= 6, 'err-inquiry-phone');
            validateField(email, email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'err-inquiry-email');
            validateField(msg, msg && msg.value.trim().length >= 5, 'err-inquiry-message');

            if (isValid) {
                const submitBtn = document.getElementById('btn-drawer-submit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span>Submitting Inquiry...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
                }

                const payload = {
                    '_subject': `Inquiry: ${company.value.trim()} - ${name.value.trim()}`,
                    '_replyto': email.value.trim(),
                    'Full Name': name.value.trim(),
                    'Company Name': company.value.trim(),
                    'Country': country.value.trim(),
                    'Contact Number': phone.value.trim(),
                    'Business Email': email.value.trim(),
                    'Message': msg.value.trim(),
                    '_template': 'table',
                    '_captcha': 'false'
                };

                const finishSubmit = () => {
                    const body = drawerAside.querySelector('.drawer-body');
                    if (body) {
                        body.innerHTML = `
                            <div class="rfq-success-box" style="margin-top: var(--space-6);">
                                <i class="fa-solid fa-circle-check"></i>
                                <h3>Inquiry Received</h3>
                                <p>Thank you, <strong>${name.value.trim()}</strong>. Our industrial equipment sales desk has received your inquiry and will reply to <strong>${email.value.trim()}</strong> shortly.</p>
                                <button type="button" class="btn btn-secondary" onclick="window.closeEnquiryDrawer()">Close</button>
                            </div>
                        `;
                    }
                };

                fetch('https://formsubmit.co/ajax/enquiry@groz.tools', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(() => finishSubmit())
                .catch(() => finishSubmit());
            }
        });

        ['inquiry-name', 'inquiry-company', 'inquiry-country', 'inquiry-phone', 'inquiry-email', 'inquiry-message'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    el.classList.remove('invalid');
                    const err = document.getElementById('err-' + id);
                    if (err) err.classList.remove('visible');
                });
            }
        });
    }

    // =========================================================================
    // 9. STANDALONE PRODUCT PAGE LOGIC (IF ON product.html)
    // =========================================================================
    const standaloneContainer = document.getElementById('standalone-product-content');
    if (standaloneContainer && window.GROZ_PRODUCTS) {
        const prodParam = urlParams.get('product') || urlParams.get('p') || urlParams.get('part');
        let prod = window.findProductByIdentifier(prodParam);
        if (!prod && window.GROZ_PRODUCTS.length > 0) {
            prod = window.GROZ_PRODUCTS[0];
        }

        if (prod) {
            const pageTitle = document.getElementById('page-product-title');
            if (pageTitle) {
                pageTitle.innerHTML = `${prod.productName} <span class="highlight-accent">[${prod.partNo}]</span>`;
            }

            const formattedPrice = Number(prod.price).toLocaleString('en-IN');
            const safeSlug = prod.slug.replace(/'/g, "\\'");
            const safePart = prod.partNo.replace(/'/g, "\\'");

            const specs = prod.specs || {};
            const specKeys = Object.keys(specs).filter(k => k !== 'Includes / Notes');
            let specsHtml = '';
            if (specKeys.length > 0) {
                specsHtml = `
                    <div class="modal-specs-section-compact">
                        <div class="specs-section-title">Technical Specifications</div>
                        <div class="modal-specs-compact-grid">
                            ${specKeys.map(k => {
                                const val = String(specs[k] || '');
                                const isLong = val.length > 35;
                                return `
                                    <div class="modal-spec-compact-item ${isLong ? 'spec-span-full' : ''}">
                                        <span class="spec-k">${k}:</span>
                                        <span class="spec-v">${val}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // Related equipment from same subcategory or category
            const relatedStandalone = (window.GROZ_PRODUCTS || [])
                .filter(p => p.partNo !== prod.partNo && (p.subcategory === prod.subcategory || p.category === prod.category))
                .slice(0, 4);

            let standaloneRelatedHtml = '';
            if (relatedStandalone.length > 0) {
                standaloneRelatedHtml = `
                    <div class="modal-related-section" style="margin-top: 18px;">
                        <div class="modal-related-title" style="font-size: 13px;"><i class="fa-solid fa-shapes"></i> Related ${prod.subcategory || prod.category} Equipment</div>
                        <div class="modal-related-grid">
                            ${relatedStandalone.map(rel => {
                                const relSafeSlug = rel.slug.replace(/'/g, "\\'");
                                const relPrice = Number(rel.price).toLocaleString('en-IN');
                                return `
                                    <div class="modal-related-item" onclick="window.location.href='product.html?product=${relSafeSlug}'" title="View ${rel.productName}">
                                        <img src="${rel.image || 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'}" alt="${rel.productName}" class="modal-related-thumb" loading="lazy" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                                        <div class="modal-related-info">
                                            <span class="modal-related-part">${rel.partNo}</span>
                                            <span class="modal-related-name">${rel.productName}</span>
                                            <span class="modal-related-price">₹ ${relPrice}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            standaloneContainer.innerHTML = `
                <div class="modal-header-compact">
                    <div class="modal-info-compact">
                        <div class="modal-top-meta">
                            <span class="modal-auth-tag"><i class="fa-solid fa-shield-halved"></i> GROZ AUTHORIZED</span>
                            <span class="table-cat-badge">${prod.category}</span>
                            <span class="modal-subcat-text">${prod.subcategory}</span>
                        </div>
                        <h2 class="modal-part-no-compact">${prod.partNo}</h2>
                        <h3 class="modal-prod-name-compact">${prod.productName}</h3>
                        <div class="modal-price-compact">
                            <span class="price-lbl">Catalogue Price (MRP):</span>
                            <span class="price-val">₹ ${formattedPrice}</span>
                        </div>
                    </div>
                    <div class="modal-thumb-compact" style="width: 120px; height: 120px;">
                        <img src="${prod.image || 'assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'}" alt="${prod.productName}" style="max-height: 110px; max-width: 110px;" onerror="this.src='assets/groz images/WhatsApp Image 2026-10-29 at 12.57.41 PM.jpeg'">
                    </div>
                </div>

                ${specsHtml}

                ${standaloneRelatedHtml}

                <div class="modal-actions-compact" style="margin-top: 16px;">
                    <button type="button" class="modal-btn-add-quote" onclick="window.addToCart(window.findProductByIdentifier('${safeSlug}'))">
                        <i class="fa-solid fa-cart-plus"></i> ADD TO QUOTE
                    </button>
                    <button type="button" class="modal-btn-inquire" onclick="window.openEnquiryDrawer({ name: '${prod.productName.replace(/'/g, "\\'")}', partNo: '${safePart}' })">
                        <i class="fa-regular fa-paper-plane"></i> INQUIRE PRODUCT
                    </button>
                </div>
            `;
        }
    }

    // Target Application Sectors (.industry-card) touch/tap handler for mobile
    const industryCards = document.querySelectorAll('.industry-card');
    if (industryCards.length > 0) {
        industryCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // If user tapped directly on a link or button, allow standard navigation
                if (e.target.closest('a') || e.target.closest('button')) return;
                
                // On mobile or touch devices (window width <= 992px)
                if (window.innerWidth <= 992) {
                    const isActive = card.classList.contains('is-active');
                    industryCards.forEach(c => c.classList.remove('is-active'));
                    if (!isActive) {
                        card.classList.add('is-active');
                    }
                }
            });
        });

        // Close active card when tapping outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.industry-card')) {
                industryCards.forEach(c => c.classList.remove('is-active'));
            }
        });
    }

    // Trust cards touch/tap handler for mobile
    const trustCards = document.querySelectorAll('.apple-trust-card');
    if (trustCards.length > 0) {
        trustCards.forEach(card => {
            card.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    const isActive = card.classList.contains('is-active');
                    trustCards.forEach(c => c.classList.remove('is-active'));
                    if (!isActive) card.classList.add('is-active');
                }
            });
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.apple-trust-card')) {
                trustCards.forEach(c => c.classList.remove('is-active'));
            }
        });
    }
});
