<?php
$page = basename($_SERVER['PHP_SELF'], '.php');
$titles = [
  'index' => 'Rolltech x Dodge | Authorized Industrial Distributor India',
  'catalog' => 'Product Catalog – Rolltech Inc.',
  'library' => 'Technical Library – Rolltech Inc.',
  'about' => 'About Us – Rolltech Inc.',
  'contact' => 'Contact – Rolltech Inc.'
];
$title = $titles[$page] ?? 'Rolltech Inc.';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title><?php echo $title; ?></title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Roboto+Mono:wght@400;500&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script>
tailwind.config={darkMode:"class",theme:{extend:{colors:{"primary":"#003F46","primary-dark":"#002e33","secondary":"#FFB81C","surface":"#F4F6F7","border-std":"#E2E8F0","muted":"#5C6B73","text-main":"#1A2022"},fontFamily:{"display":["Oswald","sans-serif"],"body":["Roboto","sans-serif"],"mono":["Roboto Mono","monospace"]},borderRadius:{"DEFAULT":"0","none":"0","sm":"0","md":"0","lg":"0","xl":"0","2xl":"0","full":"9999px"}}}}
</script>
<style>
body{font-family:'Roboto',sans-serif;}
.nav-link{@apply h-full flex items-center px-2 text-sm font-medium uppercase tracking-wide text-primary border-b-4 border-transparent hover:border-secondary hover:bg-surface transition-all;}
.nav-link.active{border-color:#FFB81C;background:#F4F6F7;}
</style>
</head>
<body class="bg-surface font-body text-text-main antialiased min-h-screen flex flex-col">
<!-- Top Utility Bar -->
<div class="bg-primary text-white text-xs py-2 px-6 border-b border-white/10">
 <div class="max-w-7xl mx-auto flex justify-between items-center">
  <div class="flex items-center gap-6">
   <span class="flex items-center gap-2">
    <span class="material-symbols-outlined text-[16px]">call</span>
    <span class="font-mono tracking-wide">+91 80001 04000</span>
   </span>
   <span class="flex items-center gap-2">
    <span class="material-symbols-outlined text-[16px]">mail</span>
    <span class="font-mono tracking-wide">crm@rolltech.in</span>
   </span>
  </div>
  <div class="flex items-center gap-4 text-white/80">
   <a class="hover:text-secondary transition-colors" href="library.php">Technical Library</a>
   <span class="text-white/20">|</span>
   <a class="hover:text-secondary transition-colors" href="contact.php">Support Portal</a>
  </div>
 </div>
</div>
<!-- Main Header -->
<header class="bg-white border-b border-border-std h-20 sticky top-0 z-50 shadow-sm relative">
 <div class="relative max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
  <!-- Logo Area -->
  <a href="index.php" class="flex items-center gap-3">
   <div class="h-10 bg-white flex items-center justify-center">
    <img src="images/rolltech_logo.png" alt="Rolltech Inc." class="h-full w-auto object-contain mix-blend-multiply"/>
   </div>
   <div class="hidden sm:flex flex-col">
    <h1 class="font-display text-2xl font-bold tracking-tight text-primary uppercase leading-none">Rolltech <span class="text-secondary">Inc.</span></h1>
    <span class="text-[10px] tracking-widest uppercase text-muted font-bold mt-1">Authorized Dodge Distributor</span>
   </div>
  </a>

  <!-- Navigation -->
  <nav class="hidden md:flex items-center gap-8 h-full">   
   <a class="nav-link <?php echo $page === 'catalog' ? 'active' : ''; ?>" href="catalog.php">Products</a>
   <a class="nav-link <?php echo $page === 'tools' ? 'active' : ''; ?>" href="tools.php">Groz Tools</a>
   <a class="nav-link <?php echo $page === 'library' ? 'active' : ''; ?>" href="library.php">Resources</a>
   <a class="nav-link <?php echo $page === 'about' ? 'active' : ''; ?>" href="about.php">About Us</a>
  </nav>

  <!-- Quote Cart Button -->
  <div class="flex items-center">
   <a href="contact.php" class="flex items-center gap-3 px-5 py-2.5 bg-surface border border-border-std hover:bg-secondary/10 hover:border-secondary transition-all group cursor-pointer">
    <div class="relative">
     <span class="material-symbols-outlined text-primary group-hover:text-primary">shopping_cart</span>
     <span class="absolute -top-2 -right-2 bg-secondary text-primary text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">0</span>
    </div>
    <div class="flex flex-col items-start leading-none">
     <span class="text-[10px] uppercase font-bold text-muted">Quote Form</span>
     <span class="text-sm font-bold text-primary">Inquire</span>
    </div>
   </a>
  </div>

  <!-- Trust Badge (Absolute Positioned) -->
  <div class="absolute right-0 top-full translate-y-3 lg:right-4 z-50 shadow-sm hidden sm:flex pointer-events-none">
   <div class="h-28 w-28 rounded-full bg-primary border-4 border-secondary flex flex-col items-center justify-center text-center p-2 shadow-2xl relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
    <span class="material-symbols-outlined text-secondary text-2xl mb-1">verified_user</span>
    <span class="text-white font-display font-bold text-xs leading-tight tracking-wider uppercase">Official<br/>Partner</span>
    <span class="text-[8px] text-white/70 mt-1 font-mono uppercase">Authorized</span>
   </div>
  </div>

 </div>
</header>
