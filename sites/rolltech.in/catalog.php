<?php
include 'header.php';
@include_once 'products_data.php';
$DODGE_CATALOG = isset($DODGE_CATALOG) ? $DODGE_CATALOG : [];
?>
<section class="bg-primary text-white py-10 border-b-4 border-secondary">
  <div class="max-w-7xl mx-auto px-6">
    <h1 class="font-display text-4xl font-bold uppercase">Product Catalog</h1>
  </div>
</section>
<section class="py-12 px-6 bg-surface min-h-[50vh]">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <?php foreach ($DODGE_CATALOG as $p) { ?>
      <div class="bg-white border border-border-std p-4 hover:-translate-y-1 transition-transform flex flex-col">
        <div class="bg-primary text-white font-mono text-xs px-2 py-1 mb-2 truncate"><?php echo $p['sku']; ?></div>
        <p class="font-bold flex-1 text-sm leading-tight text-text-main"><?php echo $p['name']; ?></p>
        <div class="border-t border-border-std mt-3 pt-2 text-[10px] text-muted font-mono uppercase"><?php echo $p['cat']; ?></div>
      </div>
      <?php
}?>
    </div>
  </div>
</section>
<?php include 'footer.php'; ?>
