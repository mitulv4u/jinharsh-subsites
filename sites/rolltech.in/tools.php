<?php 
include 'header.php'; 
@include_once 'tools_data.php';

$pdfs = isset($GROZ_TOOLS) ? $GROZ_TOOLS : [];
$active_cat = isset($_GET['cat']) ? $_GET['cat'] : 'all';
?>

<!-- Groz Tools Theme Scoped Wrapper -->
<div class="bg-[#f8f7f5] text-slate-900 antialiased font-['Inter'] min-h-screen">
  
    <!-- Inner Inline Styles & Config mapped from code.html -->
    <style>
        .groz-primary { color: #ff9900; }
        .bg-groz-primary { background-color: #ff9900; }
        .border-groz-primary { border-color: #ff9900; }
        .text-groz-dark { color: #231b0f; }
        .bg-groz-dark { background-color: #231b0f; }
    </style>

    <!-- Hero Section -->
    <section class="relative">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="relative min-h-[520px] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-2xl">
                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105" 
                     style='background-image: linear-gradient(to right, rgba(35, 27, 15, 0.95) 0%, rgba(35, 27, 15, 0.4) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDqDAUAhOrMX128S9OvWMsbRfB6TPNCZX0KBvaAq1Lw6Rlt9qXVNLnh0rq4jaz_AV3cqVRqwOIiV5nKEj3sSVbJ0MQDc31Ym22-3BQp1GZnGx9lj99gdTF9vtjJqDLvcmtlXBfxamNjcdY3cKFteK3L0_Vb4XarBI-YTTxCx3GSlcKlKZGzcU5zvQ3Mq7CaX5rM-W20iHJBhwkh5tB2M9kSGWOAHqv2KOkzxSc2liMS8z3JUHdar2AdSuKS1Gaja7gmk7f6lA1vjQM");'>
                </div>
                <div class="relative flex h-full min-h-[520px] flex-col justify-center px-8 lg:px-16 max-w-3xl gap-6">
                    <div class="inline-flex items-center gap-2 rounded-full bg-groz-primary px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-groz-dark self-start">
                        <span class="material-symbols-outlined text-sm">verified</span>
                        Authorized Distributor
                    </div>
                    <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white mb-0" style="font-family: 'Inter', sans-serif;">
                        Precision Tools for <br/> <span class="groz-primary">Every Industry</span>
                    </h1>
                    <p class="text-lg text-slate-300 leading-relaxed max-w-xl" style="font-family: 'Inter', sans-serif;">
                        Partnering with Groz to bring you world-class engineering. High-performance lubrication, precision hand tools, and workshop equipment designed for the toughest environments.
                    </p>
                    <div class="flex flex-wrap gap-4 pt-4">
                        <a href="#catalog" class="flex h-12 items-center justify-center rounded-lg bg-groz-primary px-8 text-base font-bold text-groz-dark hover:opacity-90 transition-all shadow-lg">
                            Explore Catalog
                        </a>
                        <button class="flex h-12 items-center justify-center rounded-lg border-2 border-white/20 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-sm hover:bg-white/10 transition-all">
                            Verify Authentic Pricing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Interactive Catalog Area -->
    <section id="catalog" class="py-16 max-w-7xl mx-auto px-4" style="font-family: 'Inter', sans-serif;">
        
        <div class="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
                <h2 class="text-sm font-bold uppercase tracking-[0.2em] groz-primary mb-2">Complete MRP List (2025)</h2>
                <h3 class="text-3xl font-black text-slate-900">Official Product Catalog</h3>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <!-- Sidebar / Filters -->
            <div class="lg:col-span-1">
                <div class="sticky top-28 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="font-black uppercase text-slate-900 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
                        <span class="material-symbols-outlined groz-primary">category</span> Categories
                    </h3>
                    <ul class="space-y-1 text-sm font-medium">
                        <li>
                            <a href="tools.php#catalog" class="block py-2.5 px-4 rounded-lg <?= $active_cat === 'all' ? 'bg-groz-primary text-[#231b0f] font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' ?> transition-colors">
                            All Equipment
                            </a>
                        </li>
                        <?php foreach ($GROZ_CATEGORIES as $key => $name) { ?>
                        <li>
                            <a href="tools.php?cat=<?= $key ?>#catalog" class="block py-2.5 px-4 rounded-lg <?= $active_cat === $key ? 'bg-groz-primary text-[#231b0f] font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900' ?> transition-colors truncate" title="<?= htmlspecialchars($name) ?>">
                            <?= htmlspecialchars($name) ?>
                            </a>
                        </li>
                        <?php } ?>
                    </ul>
                </div>
            </div>

            <!-- Main Grid -->
            <div class="lg:col-span-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <?php 
                    $count = 0;
                    foreach ($GROZ_TOOLS as $p): 
                        if ($active_cat !== 'all' && $p['cat'] !== $active_cat) continue;
                        $count++;
                    ?>
                    <div class="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#ff9900] hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                        <div class="h-56 bg-white overflow-hidden relative border-b border-slate-100">
                            <img src="<?= htmlspecialchars($p['image']) ?>" alt="<?= htmlspecialchars($p['name']) ?>" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 mix-blend-multiply md:p-4">
                            <div class="absolute top-3 right-3 bg-white text-slate-900 text-[10px] font-black uppercase px-2 py-1 tracking-wider rounded shadow-sm max-w-[80%] truncate">
                                <?= htmlspecialchars($p['cat']) ?>
                            </div>
                        </div>
                        <div class="p-6 flex flex-col flex-grow">
                            <div class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1.5 flex justify-between items-center">
                                <span>PART: <?= htmlspecialchars($p['sku']) ?></span>
                            </div>
                            <h3 class="text-slate-900 font-black text-xl leading-snug mb-3 group-hover:text-[#ff9900] transition-colors line-clamp-2">
                                <?= htmlspecialchars($p['name']) ?>
                            </h3>
                            <p class="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow leading-relaxed">
                                <?= htmlspecialchars($p['desc']) ?>
                            </p>
                            <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official MRP</span>
                                    <span class="text-lg font-black text-slate-900">₹<?= htmlspecialchars($p['mrp']) ?></span>
                                </div>
                                <button class="h-10 px-4 rounded-lg bg-slate-50 text-slate-900 font-bold text-sm group-hover:bg-[#ff9900] group-hover:text-white transition-colors border border-slate-200 group-hover:border-[#ff9900]">
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; 
                    if($count === 0): ?>
                        <div class="col-span-full py-20 text-center bg-white rounded-xl border border-slate-200">
                            <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">search_off</span>
                            <h3 class="text-2xl font-black text-slate-900 mb-2">No tools found</h3>
                            <p class="text-slate-500">Try selecting a different category from the sidebar.</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Groz? Section (From Theme) -->
    <section class="bg-white border-t border-slate-200 py-24" style="font-family: 'Inter', sans-serif;">
        <div class="max-w-7xl mx-auto px-4">
            <div class="max-w-2xl mb-16">
                <h2 class="text-4xl font-black text-slate-900 mb-6">Why Groz via Rolltech?</h2>
                <p class="text-lg text-slate-600 leading-relaxed">
                    For over 40 years, Groz has been at the forefront of engineering excellence. Sourcing through Rolltech guarantees authentic products, correct MRP pricing, and comprehensive technical enablement.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Quality -->
                <div class="group flex flex-col gap-6 rounded-xl border border-slate-200 bg-slate-50 p-8 transition-all hover:border-[#ff9900] hover:shadow-lg">
                    <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-sm text-[#ff9900]">
                        <span class="material-symbols-outlined text-3xl">verified_user</span>
                    </div>
                    <div>
                        <h4 class="text-xl font-black text-slate-900 mb-3">100% Genuine Quality</h4>
                        <p class="text-slate-600 leading-relaxed text-sm">Every tool sourced operates directly inside the global Groz warranty ecosystem. Ensure precision and durability without counterfeit risk.</p>
                    </div>
                </div>
                <!-- Reach -->
                <div class="group flex flex-col gap-6 rounded-xl border border-slate-200 bg-slate-50 p-8 transition-all hover:border-[#ff9900] hover:shadow-lg">
                    <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-sm text-[#ff9900]">
                        <span class="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                    <div>
                        <h4 class="text-xl font-black text-slate-900 mb-3">Expansive Inventory</h4>
                        <p class="text-slate-600 leading-relaxed text-sm">Rolltech actively stocks the largest comprehensive subset of Groz lubrication and hand tools available for immediate local dispatch.</p>
                    </div>
                </div>
                <!-- Innovation -->
                <div class="group flex flex-col gap-6 rounded-xl border border-slate-200 bg-slate-50 p-8 transition-all hover:border-[#ff9900] hover:shadow-lg">
                    <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-sm text-[#ff9900]">
                        <span class="material-symbols-outlined text-3xl">lightbulb</span>
                    </div>
                    <div>
                        <h4 class="text-xl font-black text-slate-900 mb-3">Technical Validation</h4>
                        <p class="text-slate-600 leading-relaxed text-sm">Our sales engineers don't just supply part numbers. We validate your application to ensure the proper torque, fluid, and mechanical tool is selected.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

</div>

<?php include 'footer.php'; ?>
