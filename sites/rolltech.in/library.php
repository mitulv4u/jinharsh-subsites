<?php
include 'header.php';
@include_once 'library_data.php';

$pdfs = isset($LIBRARY_PDFS) ? $LIBRARY_PDFS : [];
?>

<!-- Page Header & Search -->
<div class="bg-white border-b border-border-std">
<div class="max-w-7xl mx-auto px-6 py-8">
<div class="flex flex-col gap-2 mb-6">
<div class="flex items-center gap-2 text-muted text-xs font-medium uppercase tracking-wide">
<a class="hover:text-primary" href="index.php">Home</a>
<span class="text-secondary">/</span>
<span class="text-primary">Technical Library</span>
</div>
<h2 class="text-primary text-4xl font-display font-bold uppercase">Engineering Library</h2>
<p class="text-muted max-w-2xl font-body">Access official installation manuals, drawings, and Dodge product catalogs. Search by part number or series keyword.</p>
</div>
<!-- Search Bar -->
<div class="relative max-w-3xl">
<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-muted">search</span>
</div>
<input id="lib-search" class="block w-full pl-12 pr-4 py-4 bg-surface border border-border-std text-primary placeholder-muted focus:ring-1 focus:ring-secondary focus:border-secondary transition-all font-body text-lg" placeholder="Search for manuals, drawings, or catalog numbers (e.g. Type E-Xtra)..." type="text" onkeyup="filterLib()"/>
<button class="absolute inset-y-2 right-2 px-6 bg-primary text-white font-display font-bold uppercase text-sm hover:bg-primary-dark transition-colors">
                    Search
</button>
</div>
</div>
</div>

<!-- Main Content -->
<main class="flex-grow max-w-7xl mx-auto px-6 py-12 w-full bg-surface min-h-[50vh]">
<div class="flex justify-between items-center mb-6 border-b border-border-std pb-4">
<span class="text-muted text-sm font-medium">Showing <span class="text-primary font-bold" id="lib-count"><?= count($pdfs) ?></span> documents</span>
</div>

<!-- Masonry Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="lib-grid">
<?php foreach($pdfs as $p): 
    $icon = 'description';
    if($p['type'] === 'Manual') $icon = 'picture_as_pdf';
    if($p['type'] === 'Catalog') $icon = 'menu_book';
    if($p['type'] === 'CAD') $icon = 'architecture';
?>
<div class="lib-card group bg-white border border-border-std hover:border-secondary hover:shadow-sm transition-all flex flex-col h-full relative" data-name="<?= strtolower(htmlspecialchars($p['name'])) ?>" data-cat="<?= strtolower(htmlspecialchars($p['cat'])) ?>">
<div class="absolute top-0 left-0 w-full h-1 bg-primary group-hover:bg-secondary transition-colors"></div>
<div class="p-6 flex flex-col flex-grow">
<div class="mb-4 flex justify-between items-start">
<div class="p-3 bg-surface border border-border-std">
<span class="material-symbols-outlined text-4xl text-muted font-light"><?= $icon ?></span>
</div>
<span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 uppercase tracking-wider"><?= $p['type'] ?></span>
</div>
<h3 class="text-primary font-display font-bold text-lg leading-tight mb-2 group-hover:text-[#00555E] transition-colors">
    <?= htmlspecialchars($p['name']) ?>
</h3>
<p class="text-muted text-xs mb-4 uppercase tracking-widest leading-loose"><?= htmlspecialchars($p['cat']) ?></p>
<div class="mt-auto pt-4 border-t border-border-std flex items-center gap-4 text-xs text-muted font-mono">
<span>PDF • <?= $p['size'] ?></span>
</div>
</div>
<a class="w-full py-3 bg-surface text-primary font-display font-bold text-xs uppercase text-center border-t border-border-std hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2" href="<?= htmlspecialchars($p['path']) ?>" target="_blank">
<span class="material-symbols-outlined text-base">download</span> Download
</a>
</div>
<?php endforeach; ?>
</div>
</main>

<script>
function filterLib()<@_C0|>| {
    let q = document.getElementById('lib-search').value.toLowerCase();
    let cards = document.querySelectorAll('.lib-card');
    let count = 0;
    cards.forEach(c => {
        let name = c.getAttribute('data-name');
        let cat = c.getAttribute('data-cat');
        if (name.includes(q) || cat.includes(q)) {
            c.style.display = 'flex';
            count++;
        } else {
            c.style.display = 'none';
        }
    });
    document.getElementById('lib-count').innerText = count;
}

// Check if there's a quick search param in URL
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        document.getElementById('lib-search').value = query;
        filterLib();
    }
}
</script>

<?php include 'footer.php'; ?>