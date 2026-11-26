// Quote Cart localStorage manager

function getQuoteItems() {
  const items = localStorage.getItem('jinharsh_quote_items');
  return items ? JSON.parse(items) : [];
}

function saveQuoteItems(items) {
  localStorage.setItem('jinharsh_quote_items', JSON.stringify(items));
  updateQuoteBadges();
}

function addToQuote(productName, category, brand, image, slug) {
  let items = getQuoteItems();
  const existing = items.find(i => i.slug === slug || i.name === productName);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    items.push({
      name: productName,
      category: category,
      brand: brand || 'Generic',
      image: image || '/images/catalog/homepage.png',
      slug: slug || productName.toLowerCase().replace(/\s+/g, '-'),
      quantity: 1
    });
  }
  saveQuoteItems(items);
}

function removeFromQuote(slug) {
  let items = getQuoteItems();
  items = items.filter(i => i.slug !== slug && i.name !== slug);
  saveQuoteItems(items);
}

function updateQuantity(slug, qty) {
  let items = getQuoteItems();
  const item = items.find(i => i.slug === slug || i.name === slug);
  if (item) {
    item.quantity = Math.max(1, qty);
    saveQuoteItems(items);
  }
}

function clearQuote() {
  localStorage.removeItem('jinharsh_quote_items');
  updateQuoteBadges();
}

function updateQuoteBadges() {
  const items = getQuoteItems();
  const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const badges = document.querySelectorAll('.quote-badge');
  badges.forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateQuoteBadges();
});
