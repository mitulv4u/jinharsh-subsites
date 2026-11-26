<?php include 'header.php'; ?>
<section class="relative bg-surface border-b border-border-std overflow-hidden">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
    <div class="flex flex-col justify-center px-8 py-16 md:pr-12 relative z-10">
      <div class="inline-flex items-center gap-2 mb-5">
        <span class="w-8 h-[2px] bg-secondary"></span>
        <span class="uppercase tracking-widest text-primary font-bold text-xs font-mono">Since 1985 · Surat, Gujarat</span>
      </div>
      <h2 class="font-display text-5xl md:text-6xl font-bold text-primary leading-[1.1] mb-6 uppercase tracking-tight">
        India's Official Source for <br/><span class="text-secondary">Dodge</span> Components
      </h2>
      <p class="text-lg text-muted mb-8 max-w-lg leading-relaxed">
        Direct from factory to facility. Eliminate grey-market risks with fully traceable, warranty-backed industrial power transmission solutions.
      </p>
      <a href="catalog.php" class="bg-primary text-white font-display font-bold uppercase tracking-wide px-8 py-3 w-fit hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
        <span>Search Components</span>
        <span class="material-symbols-outlined text-secondary">arrow_forward</span>
      </a>
      <div class="mt-4 text-xs text-muted flex gap-4">
        <span>Popular: <a class="underline hover:text-primary" href="catalog.php?cat=mounted">Type-E Bearings</a></span>
        <span><a class="underline hover:text-primary" href="catalog.php?cat=gear">Torque-Arm II</a></span>
        <span><a class="underline hover:text-primary" href="catalog.php?cat=coupling">Grid-Lign</a></span>
      </div>
    </div>
    <div class="relative bg-primary min-h-[300px] group overflow-hidden flex items-center justify-center">
      <!-- Stitch Heavy machinery background image -->
      <img src="images/stitch_hero.jpg" alt="Industrial Dodge Components" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-700 z-0"/>
      <!-- Solid AI-Generated Dodge Logo -->
      <img src="images/dodge_logo_ai_transparent.png" alt="Dodge Watermark" class="absolute w-3/4 max-w-[400px] h-auto object-contain pointer-events-none z-10 transition-transform duration-700"/>
      <div class="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-primary/80 md:via-primary/20 md:to-primary/60 z-20"></div>
    </div>
  </div>
</section>

<!-- Guarantee Bar -->
<div class="bg-white border-b border-border-std shadow-sm relative z-20">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-std">
    <div class="flex items-center justify-center gap-4 py-6 px-4 group hover:bg-surface transition-colors cursor-default">
      <div class="h-12 w-12 bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
        <span class="material-symbols-outlined text-3xl">verified</span>
      </div>
      <div>
        <h3 class="font-display font-bold text-lg text-primary uppercase">100% Genuine</h3>
        <p class="text-sm text-muted">Certificate of Origin included</p>
      </div>
    </div>
    <div class="flex items-center justify-center gap-4 py-6 px-4 group hover:bg-surface transition-colors cursor-default">
      <div class="h-12 w-12 bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
        <span class="material-symbols-outlined text-3xl">shield</span>
      </div>
      <div>
        <h3 class="font-display font-bold text-lg text-primary uppercase">Factory Warranty</h3>
        <p class="text-sm text-muted">Full manufacturer support</p>
      </div>
    </div>
    <div class="flex items-center justify-center gap-4 py-6 px-4 group hover:bg-surface transition-colors cursor-default">
      <div class="h-12 w-12 bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
        <span class="material-symbols-outlined text-3xl">local_shipping</span>
      </div>
      <div>
        <h3 class="font-display font-bold text-lg text-primary uppercase">24h Dispatch</h3>
        <p class="text-sm text-muted">On all stocked items</p>
      </div>
    </div>
  </div>
</div>

<!-- Facility Showcase -->
<section class="py-20 bg-surface border-b border-border-std relative overflow-hidden">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
    <div class="relative group">
       <img src="images/store1.png" alt="Rolltech Facility" class="w-full h-auto object-cover border-4 border-white shadow-xl group-hover:scale-[1.02] transition-transform duration-700">
       <div class="absolute -bottom-6 -right-6 bg-secondary text-primary p-6 shadow-xl hidden sm:block">
           <p class="font-display font-bold text-3xl">Surat, Gujarat</p>
           <p class="text-xs uppercase tracking-widest font-mono opacity-90 mt-1">State-of-the-art Facility</p>
       </div>
    </div>
    <div class="flex flex-col gap-6">
      <div class="inline-flex items-center gap-2 mb-2">
        <span class="w-8 h-[2px] bg-secondary"></span>
        <h2 class="text-primary text-xs font-bold uppercase tracking-widest font-mono">Our Infrastructure</h2>
      </div>
      <h3 class="text-text-main text-3xl lg:text-4xl font-bold leading-tight font-display uppercase tracking-tight">Massive Ready Inventory</h3>
      <p class="text-muted text-lg leading-relaxed">
        Our state-of-the-art warehousing facility in Surat is fully stocked with authentic Dodge power transmission components. We maintain substantial local inventory to guarantee immediate dispatch and zero downtime for your critical industrial applications.
      </p>
      <a href="about.php" class="text-primary font-bold hover:text-secondary uppercase tracking-widest text-sm inline-flex items-center gap-2 mt-4 transition-colors">
        Read our story <span class="material-symbols-outlined">arrow_forward</span>
      </a>
    </div>
  </div>
</section>

<!-- Uptime Insurance Section (From Stitch Template) -->
<section class="px-6 lg:px-20 py-16 bg-white border-b border-border-std">
  <div class="max-w-7xl mx-auto flex flex-col gap-12">
    <div class="flex flex-col gap-4 max-w-3xl">
      <div class="inline-flex items-center gap-2 mb-2">
        <span class="w-8 h-[2px] bg-secondary"></span>
        <h2 class="text-primary text-xs font-bold uppercase tracking-widest font-mono">Why Choose Rolltech</h2>
      </div>
      <h3 class="text-text-main text-3xl lg:text-4xl font-bold leading-tight font-display uppercase tracking-tight">Uptime Insurance</h3>
      <p class="text-muted text-lg leading-relaxed">
        Leading Indian industries trust Rolltech and Dodge for their mechanical power transmission needs because we provide more than just parts; we provide reliability.
      </p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="flex flex-col gap-4 p-8 bg-surface border border-border-std hover:border-secondary transition-all group">
        <div class="h-12 w-12 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
          <span class="material-symbols-outlined text-2xl">shield</span>
        </div>
        <h4 class="text-primary text-xl font-bold font-display uppercase tracking-wide">Proven Reliability</h4>
        <p class="text-muted leading-relaxed text-sm">Minimize costly downtime with world-class Dodge engineering designed for the most demanding industrial environments.</p>
      </div>
      <div class="flex flex-col gap-4 p-8 bg-surface border border-border-std hover:border-secondary transition-all group">
        <div class="h-12 w-12 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
          <span class="material-symbols-outlined text-2xl">engineering</span>
        </div>
        <h4 class="text-primary text-xl font-bold font-display uppercase tracking-wide">Expert Support</h4>
        <p class="text-muted leading-relaxed text-sm">Direct on-ground technical assistance and maintenance consultations available across major industrial hubs in India.</p>
      </div>
      <div class="flex flex-col gap-4 p-8 bg-surface border border-border-std hover:border-secondary transition-all group">
        <div class="h-12 w-12 bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-colors">
          <span class="material-symbols-outlined text-2xl">local_shipping</span>
        </div>
        <h4 class="text-primary text-xl font-bold font-display uppercase tracking-wide">Local Availability</h4>
        <p class="text-muted leading-relaxed text-sm">Fast delivery from our regional warehouses ensures your production line never stops for lack of a critical spare part.</p>
      </div>
    </div>
  </div>
</section>

<!-- Category Grid -->
<section class="py-20 px-6 bg-surface">
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-end mb-10 border-b border-border-std pb-4">
      <div>
        <h2 class="font-display text-3xl font-bold text-primary uppercase">Product Categories</h2>
        <p class="text-muted mt-1">Browse our complete inventory of Dodge power transmission components.</p>
      </div>
      <a class="hidden md:flex items-center gap-2 font-display font-bold text-primary uppercase text-sm hover:text-secondary transition-colors group" href="catalog.php">
        View Full Catalog
        <span class="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </a>
    </div>

    <!-- The 4 customized cards based on actual products -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <!-- Card 1 -->
      <a class="relative group overflow-hidden bg-primary border-4 border-transparent hover:border-secondary transition-all aspect-[4/5] flex" href="catalog.php?cat=mounted">
        <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" alt="Mounted Bearings" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAbUXrDnjhy7BPHuc-9NwQRwULUlInCP6qGJ5YO3GTSKNzOOlvtR6OWmZPY2Td6Em6_-TP2NopDROTPRW9_-oYoReUGZrkMPpeOupbFpYCi4QWdCa8ru1ASptiPsYQNQa6UMkJQcsfCQHu_Btg6J8w5U2yirnUabrLDQ26oGK64yuXwd_NQpJP0ApA_gsqgajk1keBXp2a7-QGEDpBch5xsddtxYSRzC9ZUrLDc8wS0u3Nc5pOQoEAUMXCIVYKX6BeshynH-W9UnnV"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-10 w-full">
          <h4 class="text-white text-xl font-bold font-display uppercase tracking-wide group-hover:text-secondary transition-colors">Mounted Bearings</h4>
          <p class="text-white/80 text-sm mt-1">Sleevoil, Type-E & Grip-Tight</p>
        </div>
      </a>

      <!-- Card 2 -->
      <a class="relative group overflow-hidden bg-primary border-4 border-transparent hover:border-secondary transition-all aspect-[4/5] flex" href="catalog.php?cat=gear">
        <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" alt="Enclosed Gearing" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKBG5to0SjKX6goQjQRRPjdjRPsbKqhR12cknkuz25yG_HkX0Eo_bFeetPj3KJx3hN04OdYq-8AApFouok2bMPSaUR9BDWQBnN3hXCmVyHvvs_hWnp-msTp9MIPFcMtZU3kehOMEteCXGbVoHh1UkRxu6KBPUCUvZsxESsq0HyPlTyMRtQ6a5d-6xk91swiVkvBTiTM2ALV3oPo2cuw6gVNcNF2exxbpsArfnyskaWxbhgU7cMgbcp65fkR55LeV1ihKiPgyZAbiTL"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-10 w-full">
          <h4 class="text-white text-xl font-bold font-display uppercase tracking-wide group-hover:text-secondary transition-colors">Enclosed Gearing</h4>
          <p class="text-white/80 text-sm mt-1">Legendary Torque-Arm Units</p>
        </div>
      </a>

      <!-- Card 3 -->
      <a class="relative group overflow-hidden bg-primary border-4 border-transparent hover:border-secondary transition-all aspect-[4/5] flex" href="catalog.php?cat=coupling">
        <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" alt="Couplings" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb7gXDfpsHqwQVgFIAPD-g6zy9FFzaeihPcV4MagN5HWIp4OL4yL_-yT_aRapXjanNjXSvdF2Olvv0xpCaP6gol5JAL1137Y1fabFRovGnKuPR54hBjHulZZRIQeeDj92adeDE9gIJxqN5pYUqrvQto89Ua6oassJY9x_l8_PKvY_ypbEpMZ1HRdg6ZtndhmMQ3JV2Wta3nrxhyAMa7Vwhoi8nXVXZ-JkslQm1p_BQqWnpuA_hGja07PzYzdhb4D5MepPvYffilqvk"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-10 w-full">
          <h4 class="text-white text-xl font-bold font-display uppercase tracking-wide group-hover:text-secondary transition-colors">Couplings</h4>
          <p class="text-white/80 text-sm mt-1">Raptor Elastomeric Solutions</p>
        </div>
      </a>

      <!-- Card 4 -->
      <a class="relative group overflow-hidden bg-primary border-4 border-transparent hover:border-secondary transition-all aspect-[4/5] flex" href="catalog.php?cat=iiot">
        <img class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" alt="IIoT Solutions" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR2-7IqwuqbMt_4-E2aL2fyY91jLTxQygd8psva_FD5B9FEfpYpCF-rTFX_d1FMnoMKGz1V2lazuO92tZOBGsoIGI6hrbW0Ot12qzZcaQBWa02iehd3CUBXGjZrlkZHjt498TwxQpxYNDE2DvkU2wh22SOcdjrakUSAY2c_Wz0DeBpkzegcwnMFdZg6h5j1B-eFV_GlgJDxZJPBuG-jUpLDL_wrOrFM7JvVwBxX-Ek9R-gDxNHjrFyTQ7s-UJvET12a4qEhYKyO0tT"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-10 w-full">
          <h4 class="text-white text-xl font-bold font-display uppercase tracking-wide group-hover:text-secondary transition-colors">IIoT Solutions</h4>
          <p class="text-white/80 text-sm mt-1">Optify Smart Sensors</p>
        </div>
      </a>

    </div>
  </div>
</section>

<!-- Our Reach / Branch Locations (Adapted from Stitch file) -->
<section class="px-6 lg:px-20 py-20 bg-primary/5 border-t border-border-std">
  <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    <div class="flex flex-col gap-6">
      <h2 class="text-primary text-sm font-bold uppercase tracking-widest font-mono">Nationwide Support</h2>
      <h3 class="text-text-main text-3xl lg:text-4xl font-bold font-display uppercase leading-none">Our Reach Across India</h3>
      <p class="text-muted text-lg leading-relaxed">
        Strategically positioned to serve the Indian industrial heartland. With physical locations and a network of technical engineers, Rolltech ensures that factory-backed Dodge support is always nearby.
      </p>
      <div class="grid grid-cols-2 gap-4 mt-4 text-sm font-bold font-display uppercase text-primary">
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Surat (HQ)</div>
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Ahmedabad</div>
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Mumbai</div>
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Pune</div>
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Delhi NCR</div>
        <div class="flex items-center gap-3"><div class="h-2 w-2 rounded-full bg-secondary"></div> Chennai</div>
      </div>
      <a href="contact.php" class="mt-4 bg-primary text-white font-display font-bold uppercase tracking-wide px-8 py-3 w-fit hover:bg-primary-dark transition-colors">Contact Nearest Branch</a>
    </div>
    <div class="border-4 border-white shadow-xl bg-white min-h-[400px] flex items-center justify-center overflow-hidden p-4">
      <!-- Minimal geographic map depiction from Stitch -->
      <img class="w-full h-full object-contain mix-blend-multiply opacity-60 grayscale hover:grayscale-0 transition-all duration-500" alt="India Locations Map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ0B7rTA9p3xaGzJHvRzMaQaJuaWoZ8QK0rEJAwHOGmOK5olvtJDPBWHt7PwCSZE7oa3YOjRi0F96Mm7uwerCVR_H2zMR0z7DGTBV6oNRr-M2T-E-SCS2YhXo4t1uSHoYc1btesW7cNhWIFXmSgOWAKWV9bUiEH_MQrvq1Kvm_JlmEXfuXhdKSUmeWYBWbvATaJub4FHS0OPdkO0aoBJ9Uk6byhH2O4XAYh3OFrD_pMbcorSI6GOEMZAWWESpxUsKfQwR6FwLG5uXi"/>
    </div>
  </div>
</section>

<?php include 'footer.php'; ?>
