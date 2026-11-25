const CATALOG_DIVISIONS = [
  {
    id: "01",
    group: "Bearings & PT",
    title: "Industrial Bearings",
    description:
      "Complete range of spherical, tapered, cylindrical, ball, precision, and slewing ring bearings with technical nomenclature support (W33, C3/C4, VA405).",
    products: [
      "Spherical Roller Bearings (SRB)",
      "Tapered Roller Bearings (TRB / 4-Row)",
      "Cylindrical & Needle Roller Bearings",
      "Angular Contact & Thrust Bearings",
      "Precision TRB & Gamet",
      "Slewing Ring & Linear Rail Blocks",
    ],
    brands: ["Timken", "SKF", "Gamet", "Rollix", "Hyatt", "Link-Belt"],
  },
  {
    id: "02",
    group: "Bearings & PT",
    title: "Housed Units & Split Bearings",
    description:
      "Heavy-duty mounted bearing units and split-to-the-shaft solutions engineered for quick replacement and minimal downtime.",
    products: [
      "Solid Housed Units (Dodge / Link-Belt)",
      "SNT / SAF Plummer Blocks",
      "Revolvo Split Roller Bearings",
      "Ball & SS Polymer Housed Units",
      "Nickel / Zinc / Urethane Coated Housings",
    ],
    brands: ["Dodge", "RegalRexnord", "Link-Belt", "Revolvo", "Sealmaster", "Timken"],
  },
  {
    id: "03",
    group: "Bearings & PT",
    title: "Couplings & Power Transmission",
    description:
      "Elastomeric, metallic, fluid, and composite shaft couplings along with backstops, shrink discs, and torque limiters.",
    products: [
      "Omega & Viva Elastomeric Couplings",
      "QuickFlex Couplings",
      "Disc, Grid & Gear Couplings",
      "Addax Composite Cooling Tower Shafts",
      "Torque Limiters & Shrink Discs",
    ],
    brands: [
      "RegalRexnord",
      "Falk",
      "Thomas",
      "Omega",
      "QuickFlex",
      "Magnaloy",
      "Altraflex",
      "Euroflex",
      "GMY",
      "Autogard",
      "Lovejoy",
      "Tollok",
    ],
  },
  {
    id: "04",
    group: "Motors & Automation",
    title: "Motors, Gearboxes & Automation",
    description:
      "Industrial electric motors, geared drives, VFDs, PLCs, and industrial ventilation fans for continuous process plants.",
    products: [
      "NEMA, HT & Explosion-Proof Motors",
      "Helical Inline & Bevel Geared Motors",
      "Shaft-Mounted & Slip Ring Drives",
      "PLCs, Breakers & Industrial Drives",
      "Axial Flow, Centrifugal & Propeller Fans",
    ],
    brands: ["ABB", "Baldor", "JK Fenner", "Marathon", "PBL", "Sumit", "NMTG", "Master XL", "Cone Drive"],
  },
  {
    id: "05",
    group: "Lubrication",
    title: "Industrial Lubricants & Oils",
    description:
      "Genuine Shell industrial oils, greases, and transmission fluids for compressors, gearboxes, hydraulics, and heavy fleets.",
    products: [
      "Shell Omala Gear Oils",
      "Shell Tellus Hydraulic Fluids",
      "Shell Gadus Industrial Greases",
      "Shell Corena Compressor Oils",
      "Shell Tonna Machine Tool & Spirax/Rimula",
    ],
    brands: ["Shell"],
  },
  {
    id: "06",
    group: "Lubrication",
    title: "Specialty Lubricants & Open Drive Cleaning",
    description:
      "Static cleaning, priming, and water-resistant specialty greases for open gears, wire ropes, and high-load chains.",
    products: [
      "Open Drive Static Cleaning Solutions",
      "Gear Priming Grease in Spray Form",
      "Water-Resistant Specialty Greases",
      "Wire Rope & Chain Lubrication",
    ],
    brands: ["Lubrilog", "Shell"],
  },
  {
    id: "07",
    group: "Lubrication",
    title: "Lubrication Equipment & Systems",
    description:
      "End-to-end lubrication management from portable lube vans and computerized oil rooms to automated Centralized Lubrication Systems (CLS).",
    products: [
      "Centralized Lubrication Systems (CLS)",
      "Computerised Oil Management Systems",
      "Modular Lube Rooms & Lube Vans",
      "Single-Point & Multi-Point Lubricators",
    ],
    brands: ["Groeneveld-Beka", "Interlube", "Gruetzner", "Groz", "Graco", "Udyogi"],
  },
  {
    id: "08",
    group: "Safety & Welding",
    title: "Adhesives, Coatings & Epoxy Solutions",
    description:
      "Industrial maintenance adhesives, pipe-wrap repair systems, rust-loosening sprays, and steel-filled epoxy putties.",
    products: [
      "Zorrik 101 & Zorrik 201 Maintenance Sprays",
      "Wrap Seal Plus Pipe Repair",
      "M-Seal Steel Putty",
      "Industrial Epoxy & Protective Coatings",
    ],
    brands: ["Pidilite"],
  },
  {
    id: "09",
    group: "Safety & Welding",
    title: "Protection & Gas Detection Solutions",
    description:
      "Personal and area gas detectors, breathing apparatus, escape hoods, and air quality monitoring for hazardous industrial zones.",
    products: [
      "X-am 2800 / 5600 / 8000 Gas Detectors",
      "X-zone 5500/5800 Area Monitoring",
      "Pac 6500 / 8500 & X-pid 9500",
      "SCBA, PAS Micro & Saver CF/PP Escape",
      "Aerotest (AQMS) & CPS Chemical Suits",
    ],
    brands: ["Dräger"],
  },
  {
    id: "10",
    group: "Safety & Welding",
    title: "Welding Products & Wear Services",
    description:
      "Heavy-duty welding machines, tubular hardfacing electrodes, plasma cutters, and Hardox wear plate fabrication.",
    products: [
      "TIG / MIG & Plasma Cutting Machines",
      "Tubular & Maintenance Electrodes",
      "Hardox Wear Plates",
      "On-Site Hardfacing & Welding Services",
    ],
    brands: ["Ador", "Ador Fontech", "Hypertherm"],
  },
  {
    id: "11",
    group: "Conveyors & Tools",
    title: "Material Handling & Conveyor Solutions",
    description:
      "Complete conveyor belt maintenance systems that prevent carryback, mistracking, and unscheduled belt splices.",
    products: [
      "Belt Scrapers & Primary/Secondary Cleaners",
      "Belt Trackers & Washbox / Skirting Systems",
      "Mechanical Belt Fasteners & Cutters",
      "Ceramic Pulley Lagging & Elevate Sensors",
    ],
    brands: ["Flexco", "Convmech"],
  },
  {
    id: "12",
    group: "Conveyors & Tools",
    title: "Lighting & Electrical Solutions",
    description:
      "Rugged industrial LED worklights, floodlights, headlamps, and electrical consumables built for plant maintenance.",
    products: [
      "Rechargeable LED Worklights",
      "Industrial Flood Lights & Light Bars",
      "Inspection Flashlights & Headlamps",
      "Electrical Maintenance Consumables",
    ],
    brands: ["Groz", "Wattera"],
  },
  {
    id: "13",
    group: "Conveyors & Tools",
    title: "Industrial Tools, Maintenance & Insulation",
    description:
      "Precision bearing mounting/dismounting tools, torque wrenches, fine boring units, hydraulic pallet trolleys, and thermal insulation.",
    products: [
      "Induction Bearing Heaters & Pullers",
      "Pneumatic Torque Wrenches & Impact Nut Runners",
      "Fine Boring Units & Milling Cutters",
      "Hydraulic Power Packs & Pallet Trolleys",
      "AC Duct Insulation & Thouwrap Sleeves",
    ],
    brands: ["Groz", "Sigma", "JCB", "Timken", "PRS-Permacel", "Nido", "Orione"],
  },
  {
    id: "14",
    group: "Eco & FRP",
    title: "FRP & Eco-Green Solutions",
    description:
      "DRDO-technology anaerobic bio-digesters, containerized bio-toilets, FRP doors, and eco-friendly industrial cleaning formulations.",
    products: [
      "DRDO Anaerobic Bio Digesters",
      "Container & Railway Bio-Toilets",
      "FRP Main Doors & Structural Products",
      "Finishol 360 & Finishol 99 Eco Solutions",
    ],
    brands: ["Weldynamics", "Finishol"],
  },
];

const FEATURED_BRANDS = [
  "Timken",
  "RegalRexnord",
  "SKF",
  "Dodge",
  "ABB",
  "Shell",
  "Dräger",
  "Flexco",
  "Groz",
  "Pidilite",
  "Ador",
  "Ador Fontech",
  "Lubrilog",
  "Link-Belt",
  "Falk",
  "Thomas",
  "Omega",
  "QuickFlex",
  "Groeneveld-Beka",
  "Gruetzner",
  "Hypertherm",
  "Baldor",
  "Revolvo",
  "Gamet",
  "Rollix",
  "Sealmaster",
  "Magnaloy",
  "Wattera",
  "Finishol",
  "Weldynamics",
  "PRS-Permacel",
  "Sigma",
];

let activeGroup = "All";
let activeBrand = "";

const gridEl = document.getElementById("catalog-grid");
const emptyEl = document.getElementById("empty-state");
const searchEl = document.getElementById("catalog-search");
const filterBannerEl = document.getElementById("active-filter-banner");
const filterBannerTextEl = document.getElementById("active-filter-text");
const categorySelectEl = document.getElementById("inquiry-category");

function populateCategorySelect() {
  CATALOG_DIVISIONS.forEach((div) => {
    const opt = document.createElement("option");
    opt.value = `${div.id} - ${div.title}`;
    opt.textContent = `${div.id}. ${div.title}`;
    categorySelectEl.appendChild(opt);
  });
}

function renderBrands() {
  const container = document.getElementById("brand-pills");
  FEATURED_BRANDS.forEach((brand) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "brand-pill";
    btn.textContent = brand;
    btn.addEventListener("click", () => {
      activeBrand = brand;
      activeGroup = "All";
      syncGroupChips();
      renderCatalog();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
    });
    container.appendChild(btn);
  });
}

function syncGroupChips() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.group === activeGroup);
  });
}

function selectForQuote(division) {
  categorySelectEl.value = `${division.id} - ${division.title}`;
  const msgEl = document.getElementById("inquiry-message");
  if (!msgEl.value.trim()) {
    msgEl.value = `Interested in ${division.title} (${division.brands.slice(0, 4).join(", ")}). Please share catalog & pricing.`;
  }
  document.getElementById("inquiry").scrollIntoView({ behavior: "smooth" });
  document.getElementById("inquiry-name").focus({ preventScroll: true });
}

function renderCatalog() {
  const query = searchEl.value.trim().toLowerCase();

  const filtered = CATALOG_DIVISIONS.filter((div) => {
    const matchesGroup = activeGroup === "All" || div.group === activeGroup;
    const matchesBrand =
      !activeBrand ||
      div.brands.some((b) => b.toLowerCase() === activeBrand.toLowerCase());
    const haystack = [
      div.title,
      div.description,
      div.group,
      ...div.products,
      ...div.brands,
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesGroup && matchesBrand && matchesQuery;
  });

  if (activeBrand) {
    filterBannerTextEl.textContent = `Filtering by brand: ${activeBrand} (${filtered.length} division${filtered.length === 1 ? "" : "s"})`;
    filterBannerEl.classList.add("visible");
  } else {
    filterBannerEl.classList.remove("visible");
  }

  gridEl.innerHTML = "";
  if (filtered.length === 0) {
    emptyEl.classList.add("visible");
    return;
  }
  emptyEl.classList.remove("visible");

  filtered.forEach((div) => {
    const card = document.createElement("article");
    card.className = "catalog-card";

    const tagsHtml = div.products
      .map((p) => `<span class="item-tag">${p}</span>`)
      .join("");

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="card-num">Division ${div.id}</span>
          <span class="card-group">${div.group}</span>
        </div>
        <h3 class="card-title">${div.title}</h3>
        <p class="card-desc">${div.description}</p>
        <div class="tag-list">${tagsHtml}</div>
        <div class="card-brands"><strong>Brands:</strong> ${div.brands.join(" · ")}</div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-dark">Request Quote</button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => selectForQuote(div));
    gridEl.appendChild(card);
  });
}

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    activeGroup = chip.dataset.group;
    activeBrand = "";
    syncGroupChips();
    renderCatalog();
  });
});

searchEl.addEventListener("input", renderCatalog);

document.getElementById("clear-brand-filter").addEventListener("click", () => {
  activeBrand = "";
  renderCatalog();
});

document.getElementById("reset-filters-btn").addEventListener("click", () => {
  activeGroup = "All";
  activeBrand = "";
  searchEl.value = "";
  syncGroupChips();
  renderCatalog();
});

// Odoo ERP Inquiry Form
document.getElementById("odoo-inquiry-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("inquiry-submit-btn");
  const payload = Object.fromEntries(new FormData(e.target).entries());

  statusEl.className = "form-status visible";
  statusEl.textContent = "Submitting your inquiry to JinHarsh Sales...";
  submitBtn.disabled = true;

  try {
    const res = await fetch("https://api.jinharsh.com/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      statusEl.className = "form-status visible success";
      statusEl.textContent =
        "Thank you! Your inquiry has been routed to our JinHarsh Odoo ERP sales team.";
      e.target.reset();
    } else {
      statusEl.className = "form-status visible error";
      statusEl.textContent =
        "Could not submit automatically. Please email crm@jinharsh.com or call +91-22-40900000.";
    }
  } catch {
    statusEl.className = "form-status visible error";
    statusEl.textContent =
      "Network error. Please email crm@jinharsh.com or call +91-22-40900000.";
  } finally {
    submitBtn.disabled = false;
  }
});

populateCategorySelect();
renderBrands();
renderCatalog();
