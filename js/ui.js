// AURA Living — Global Interactive UI Elements
// Injected Cart Drawer, Search Modal, Wishlist Drawer, Account Modal, and Toasts

document.addEventListener("DOMContentLoaded", () => {
  initGlobalHeaderListeners();
  injectModalsAndDrawers();
  syncHeaderState();

  // Listen for store updates
  window.addEventListener("cartUpdated", () => {
    syncHeaderState();
    renderCartDrawer();
  });

  window.addEventListener("wishlistUpdated", () => {
    syncHeaderState();
    renderWishlistDrawer();
  });

  window.addEventListener("showToast", (e) => {
    showToastNotification(e.detail.message);
  });

  // Global Keyboard shortcuts: ⌘K or Ctrl+K for search
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearchModal();
    }
    if (e.key === "Escape") {
      closeAllDrawersAndModals();
    }
  });
});

function initGlobalHeaderListeners() {
  // Navigation clicks across pages
  document.querySelectorAll("[data-path]").forEach(el => {
    el.addEventListener("click", (e) => {
      const path = el.getAttribute("data-path");
      if (!path) return;
      if (path === "home") {
        window.location.href = "index.html";
      } else if (path === "shop-all") {
        window.location.href = "catalog.html";
      } else if (path === "living-and-furniture") {
        window.location.href = "catalog.html?cat=furniture";
      } else if (path === "lighting") {
        window.location.href = "catalog.html?cat=lighting";
      } else if (path === "ceramics-and-decor") {
        window.location.href = "catalog.html?cat=ceramics";
      } else if (path === "sale") {
        window.location.href = "catalog.html?sale=true";
      } else if (path === "cart") {
        e.preventDefault();
        openCartDrawer();
      } else if (path === "wishlist") {
        e.preventDefault();
        openWishlistDrawer();
      } else if (path === "account") {
        e.preventDefault();
        openAccountModal();
      } else if (path.startsWith("product-")) {
        const prodId = path.replace("product-", "");
        window.location.href = `product.html?id=${prodId}`;
      }
    });
  });

  // Header Search buttons
  document.querySelectorAll("button[aria-label='Search catalog']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openSearchModal();
    });
  });

  // Header Wishlist buttons
  document.querySelectorAll("a[aria-label='View Wishlist']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openWishlistDrawer();
    });
  });

  // Header Shopping Cart buttons
  document.querySelectorAll("a[aria-label='View Shopping Cart']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  // Header Account link
  document.querySelectorAll("a[aria-label='Customer Account']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openAccountModal();
    });
  });
}

function syncHeaderState() {
  const totals = AURAStore.getTotals();
  const wishlist = AURAStore.getWishlist();

  // Update Cart Badge Count
  document.querySelectorAll("a[aria-label='View Shopping Cart'] span.bg-primary").forEach(el => {
    el.textContent = totals.count;
  });

  // Update Cart Header Subtotal Amount
  document.querySelectorAll("a[aria-label='View Shopping Cart'] span.font-label-sm").forEach(el => {
    el.textContent = `$${totals.subtotal.toFixed(2)}`;
  });

  // Update Wishlist Badge Count
  document.querySelectorAll("a[aria-label='View Wishlist'] span.bg-secondary").forEach(el => {
    el.textContent = wishlist.length;
  });
}

function injectModalsAndDrawers() {
  const container = document.createElement("div");
  container.id = "aura-global-overlays";
  container.innerHTML = `
    <!-- Slide-over Cart Drawer -->
    <div id="aura-cart-drawer" class="fixed inset-0 z-[100] hidden">
      <div class="drawer-backdrop fixed inset-0 bg-charcoal/40 backdrop-blur-sm opacity-0 transition-opacity duration-300" onclick="closeCartDrawer()"></div>
      <div class="fixed inset-y-0 right-0 max-w-full flex">
        <div class="drawer-panel w-screen max-w-md bg-surface glass-drawer shadow-2xl flex flex-col translate-x-full duration-300">
          <!-- Drawer Header -->
          <div class="p-space-md border-b border-outline-variant/30 flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-primary text-[24px]">shopping_bag</span>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-display-hero">Your Curated Bag</h3>
              <span id="cart-drawer-count" class="font-label-caps text-label-caps px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">0 items</span>
            </div>
            <button onclick="closeCartDrawer()" class="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Free Shipping Incentive in Drawer -->
          <div class="px-space-md py-space-xs bg-surface-container-low border-b border-outline-variant/20">
            <div class="flex items-center justify-between text-[12px] font-label-md text-on-surface mb-1">
              <span id="cart-free-shipping-text">Complimentary White Glove Delivery unlocked!</span>
              <span class="text-secondary font-bold" id="cart-free-shipping-badge">✓ Free</span>
            </div>
            <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div id="cart-shipping-bar" class="bg-primary h-full rounded-full transition-all duration-300" style="width: 100%;"></div>
            </div>
          </div>

          <!-- Cart Items Scrollable List -->
          <div id="cart-drawer-items" class="flex-1 overflow-y-auto p-space-md space-y-space-sm divide-y divide-outline-variant/20">
            <!-- Dynamic Items Injected Here -->
          </div>

          <!-- Cart Drawer Footer -->
          <div class="p-space-md border-t border-outline-variant/30 bg-surface-container-lowest space-y-space-xs">
            <div class="space-y-1 text-body-sm font-body-sm">
              <div class="flex items-center justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span id="cart-drawer-subtotal" class="font-medium text-on-surface">$0.00</span>
              </div>
              <div class="flex items-center justify-between text-on-surface-variant">
                <span>White Glove Shipping</span>
                <span class="text-secondary font-medium">Free</span>
              </div>
              <div id="cart-drawer-discount-row" class="flex items-center justify-between text-primary hidden">
                <span id="cart-drawer-discount-label">Promotion (AURAHOME)</span>
                <span id="cart-drawer-discount-amount">-$0.00</span>
              </div>
            </div>
            <div class="pt-space-xs border-t border-outline-variant/20 flex items-baseline justify-between">
              <span class="font-headline-sm text-headline-sm text-on-surface font-display-hero">Estimated Total</span>
              <span id="cart-drawer-total" class="font-headline-sm text-headline-sm font-semibold text-primary">$0.00</span>
            </div>
            <div class="pt-space-xs space-y-2">
              <a href="checkout.html" class="w-full h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all">
                <span>Proceed to Checkout</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
              <button onclick="closeCartDrawer()" class="w-full py-2 text-center text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm underline transition-colors">
                Continue Curating
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Search Modal (⌘K) -->
    <div id="aura-search-modal" class="fixed inset-0 z-[110] hidden">
      <div class="fixed inset-0 bg-charcoal/50 backdrop-blur-md opacity-0 transition-opacity duration-300" onclick="closeSearchModal()"></div>
      <div class="fixed inset-x-0 top-16 max-w-2xl mx-auto px-4 z-10">
        <div class="bg-surface-container-lowest glass-modal rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-4 border-b border-outline-variant/30 flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[24px]">search</span>
            <input id="aura-search-input" type="text" placeholder="Search furniture, lighting, ceramics, materials..." class="flex-1 bg-transparent border-0 outline-none text-on-surface font-body-lg text-body-lg placeholder:text-outline" autocomplete="off" />
            <kbd class="font-label-caps text-label-caps bg-surface-container-low px-2 py-1 rounded border border-outline-variant/50 text-on-surface-variant">ESC</kbd>
          </div>
          <!-- Quick filters / suggestions -->
          <div class="p-3 bg-surface-container-low/50 border-b border-outline-variant/20 flex flex-wrap items-center gap-2 text-label-sm font-label-sm text-on-surface-variant">
            <span class="font-label-caps uppercase text-[10px] text-outline">Quick Filters:</span>
            <button onclick="filterSearch('Lounge Chair')" class="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface">Lounge Chairs</button>
            <button onclick="filterSearch('Travertine')" class="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface">Travertine</button>
            <button onclick="filterSearch('Lighting')" class="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface">Lighting</button>
            <button onclick="filterSearch('Ceramic')" class="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-on-surface">Ceramics</button>
          </div>
          <!-- Search Results List -->
          <div id="aura-search-results" class="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            <!-- Dynamic Search items injected here -->
          </div>
        </div>
      </div>
    </div>

    <!-- Wishlist Drawer -->
    <div id="aura-wishlist-drawer" class="fixed inset-0 z-[100] hidden">
      <div class="drawer-backdrop fixed inset-0 bg-charcoal/40 backdrop-blur-sm opacity-0 transition-opacity duration-300" onclick="closeWishlistDrawer()"></div>
      <div class="fixed inset-y-0 right-0 max-w-full flex">
        <div class="drawer-panel w-screen max-w-md bg-surface glass-drawer shadow-2xl flex flex-col translate-x-full duration-300">
          <div class="p-space-md border-b border-outline-variant/30 flex items-center justify-between">
            <div class="flex items-center gap-space-xs">
              <span class="material-symbols-outlined text-secondary text-[24px]">favorite</span>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-display-hero">Saved Archive</h3>
              <span id="wishlist-drawer-count" class="font-label-caps text-label-caps px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-semibold">0 items</span>
            </div>
            <button onclick="closeWishlistDrawer()" class="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div id="wishlist-drawer-items" class="flex-1 overflow-y-auto p-space-md space-y-space-sm divide-y divide-outline-variant/20">
            <!-- Dynamic Wishlist items -->
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Account Modal -->
    <div id="aura-account-modal" class="fixed inset-0 z-[110] hidden">
      <div class="fixed inset-0 bg-charcoal/50 backdrop-blur-sm opacity-0 transition-opacity duration-300" onclick="closeAccountModal()"></div>
      <div class="fixed inset-0 flex items-center justify-center p-4 z-10">
        <div class="bg-surface-container-lowest glass-modal rounded-2xl shadow-2xl border border-outline-variant/40 max-w-lg w-full overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
          <div class="p-space-md border-b border-outline-variant/30 flex items-center justify-between">
            <div class="flex items-center gap-space-sm">
              <img alt="Profile" class="w-12 h-12 rounded-full object-cover ring-2 ring-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdxJ7Sts5Ei8OZPEWBSIsITEE0gY2CmfLGcXFlOQux3n3VC3TLIrVsyW-HfefRuBi3Zt5cSwhWhgJMs6F2439y-7PnOhyY8X2TsI7HmrWBDg2u5ClqXz0TI-Wp8MopzAZNfBrrsp2nmUfOkqdbw114LcBkzXWHfzwocqaypCXgSBkBddNQr0TIIlN5YEg792j8V2xqyUTr9ImLFVHcoxuSYZuM7rlybj76HzhqYuE-qQfHVSa5A1zc" />
              <div>
                <h4 class="font-headline-sm text-[18px] text-on-surface font-display-hero">Elena Sterling</h4>
                <p class="font-body-sm text-[12px] text-primary font-medium">AURA Guild Collector #2841</p>
              </div>
            </div>
            <button onclick="closeAccountModal()" class="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div class="p-space-md space-y-space-md">
            <div>
              <span class="font-label-caps text-label-caps uppercase text-outline tracking-wider block mb-2">Recent Architectural Curation</span>
              <div class="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                <div>
                  <p class="font-label-md text-label-md font-semibold text-on-surface">Order #AURA-98214</p>
                  <p class="font-body-sm text-[12px] text-on-surface-variant">Dispatched · In Transit via White Glove</p>
                </div>
                <span class="px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-semibold">Active</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-space-xs text-center font-label-sm text-label-sm">
              <a href="catalog.html" class="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors">Browse Catalog</a>
              <a href="checkout.html" class="p-3 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors">View Bag</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification Anchor -->
    <div id="aura-toast-container"></div>
  `;
  document.body.appendChild(container);

  // Search Input Listener
  const searchInput = document.getElementById("aura-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });
  }
}

// CART DRAWER CONTROLS
function openCartDrawer() {
  const drawer = document.getElementById("aura-cart-drawer");
  if (!drawer) return;
  drawer.classList.remove("hidden");
  renderCartDrawer();
  setTimeout(() => {
    drawer.querySelector(".drawer-backdrop").classList.remove("opacity-0");
    drawer.querySelector(".drawer-panel").classList.remove("translate-x-full");
  }, 10);
}

function closeCartDrawer() {
  const drawer = document.getElementById("aura-cart-drawer");
  if (!drawer) return;
  drawer.querySelector(".drawer-backdrop").classList.add("opacity-0");
  drawer.querySelector(".drawer-panel").classList.add("translate-x-full");
  setTimeout(() => {
    drawer.classList.add("hidden");
  }, 300);
}

function renderCartDrawer() {
  const cart = AURAStore.getCart();
  const totals = AURAStore.getTotals();
  const itemsContainer = document.getElementById("cart-drawer-items");
  const countEl = document.getElementById("cart-drawer-count");
  const subtotalEl = document.getElementById("cart-drawer-subtotal");
  const totalEl = document.getElementById("cart-drawer-total");
  const discountRow = document.getElementById("cart-drawer-discount-row");
  const discountLabel = document.getElementById("cart-drawer-discount-label");
  const discountAmount = document.getElementById("cart-drawer-discount-amount");
  const shippingBar = document.getElementById("cart-shipping-bar");
  const shippingText = document.getElementById("cart-free-shipping-text");
  const shippingBadge = document.getElementById("cart-free-shipping-badge");

  if (countEl) countEl.textContent = `${totals.count} item${totals.count === 1 ? '' : 's'}`;
  if (subtotalEl) subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${totals.total.toFixed(2)}`;

  if (shippingBar) {
    shippingBar.style.width = `${totals.freeShippingProgress}%`;
  }
  if (shippingText && shippingBadge) {
    if (totals.subtotal >= totals.freeShippingThreshold) {
      shippingText.innerHTML = `You've unlocked complimentary <strong class="text-primary">White Glove Delivery!</strong>`;
      shippingBadge.textContent = "✓ Free";
    } else {
      const remaining = totals.freeShippingThreshold - totals.subtotal;
      shippingText.innerHTML = `Add <strong class="text-primary">$${remaining.toFixed(2)}</strong> to unlock Free White Glove Delivery`;
      shippingBadge.textContent = `${totals.freeShippingProgress}%`;
    }
  }

  if (discountRow) {
    if (totals.discount > 0 && totals.promo) {
      discountRow.classList.remove("hidden");
      discountLabel.textContent = totals.promo.label;
      discountAmount.textContent = `-$${totals.discount.toFixed(2)}`;
    } else {
      discountRow.classList.add("hidden");
    }
  }

  if (!itemsContainer) return;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="py-16 text-center space-y-3">
        <span class="material-symbols-outlined text-outline text-[48px]">shopping_bag</span>
        <h4 class="font-headline-sm text-headline-sm text-on-surface font-display-hero">Your bag is empty</h4>
        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">Explore our permanent collection to discover sculptural furniture and tactile ceramics.</p>
        <a href="catalog.html" onclick="closeCartDrawer()" class="inline-block mt-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">Browse Collection</a>
      </div>
    `;
    return;
  }

  itemsContainer.innerHTML = cart.map((item, idx) => `
    <div class="py-3 flex gap-space-sm group">
      <img src="${item.image}" alt="${item.title}" class="w-20 h-24 object-cover rounded-lg bg-surface-container shrink-0" />
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-1">
            <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">${item.title}</h4>
            <span class="font-label-md text-label-md font-semibold text-on-surface">$${(item.price * item.qty).toFixed(2)}</span>
          </div>
          <p class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${item.fabric || item.categoryLabel}${item.wood ? ' · ' + item.wood : ''}</p>
        </div>
        <div class="flex items-center justify-between mt-2">
          <div class="inline-flex items-center bg-surface-container-low rounded-lg p-0.5 border border-outline-variant/30">
            <button onclick="AURAStore.updateQty(${idx}, ${item.qty - 1})" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container rounded transition-colors">
              <span class="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span class="w-6 text-center font-label-sm text-label-sm font-semibold text-on-surface">${item.qty}</span>
            <button onclick="AURAStore.updateQty(${idx}, ${item.qty + 1})" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container rounded transition-colors">
              <span class="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
          <button onclick="AURAStore.removeItem(${idx})" class="text-on-surface-variant hover:text-error transition-colors p-1" title="Remove item">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// SEARCH MODAL CONTROLS
function openSearchModal() {
  const modal = document.getElementById("aura-search-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  const input = document.getElementById("aura-search-input");
  renderSearchResults("");
  setTimeout(() => {
    modal.querySelector(".bg-charcoal\\/50").classList.remove("opacity-0");
    const inner = modal.querySelector(".glass-modal");
    inner.classList.remove("opacity-0", "scale-95");
    inner.classList.add("scale-100");
    if (input) input.focus();
  }, 10);
}

function closeSearchModal() {
  const modal = document.getElementById("aura-search-modal");
  if (!modal) return;
  modal.querySelector(".bg-charcoal\\/50").classList.add("opacity-0");
  const inner = modal.querySelector(".glass-modal");
  inner.classList.remove("scale-100");
  inner.classList.add("opacity-0", "scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 250);
}

function filterSearch(term) {
  const input = document.getElementById("aura-search-input");
  if (input) {
    input.value = term;
    renderSearchResults(term);
    input.focus();
  }
}

function renderSearchResults(query) {
  const resultsContainer = document.getElementById("aura-search-results");
  if (!resultsContainer) return;

  const q = (query || "").trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => {
    if (!q) return true;
    return p.title.toLowerCase().includes(q) ||
           p.categoryLabel.toLowerCase().includes(q) ||
           p.materials.some(m => m.toLowerCase().includes(q)) ||
           p.designer.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="py-12 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-[36px] text-outline">search_off</span>
        <p class="font-body-md text-body-md mt-2">No sculptural pieces found matching "${query}"</p>
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = filtered.map(p => `
    <a href="product.html?id=${p.id}" class="flex items-center gap-space-sm p-2.5 rounded-xl hover:bg-surface-container-low transition-colors group">
      <img src="${p.images.primary}" alt="${p.title}" class="w-16 h-16 rounded-lg object-cover bg-surface-container shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <h4 class="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">${p.title}</h4>
          <span class="font-headline-sm text-[16px] text-on-surface font-semibold shrink-0 ml-2">$${p.price}</span>
        </div>
        <p class="font-body-sm text-[12px] text-on-surface-variant truncate">${p.subtitle}</p>
        <div class="flex items-center gap-2 mt-1">
          <span class="font-label-caps text-[10px] text-primary uppercase font-semibold">${p.categoryLabel}</span>
          <span class="text-outline text-[10px]">•</span>
          <span class="font-body-sm text-[11px] text-outline">${p.provenance}</span>
        </div>
      </div>
    </a>
  `).join("");
}

// WISHLIST DRAWER CONTROLS
function openWishlistDrawer() {
  const drawer = document.getElementById("aura-wishlist-drawer");
  if (!drawer) return;
  drawer.classList.remove("hidden");
  renderWishlistDrawer();
  setTimeout(() => {
    drawer.querySelector(".drawer-backdrop").classList.remove("opacity-0");
    drawer.querySelector(".drawer-panel").classList.remove("translate-x-full");
  }, 10);
}

function closeWishlistDrawer() {
  const drawer = document.getElementById("aura-wishlist-drawer");
  if (!drawer) return;
  drawer.querySelector(".drawer-backdrop").classList.add("opacity-0");
  drawer.querySelector(".drawer-panel").classList.add("translate-x-full");
  setTimeout(() => {
    drawer.classList.add("hidden");
  }, 300);
}

function renderWishlistDrawer() {
  const wishlist = AURAStore.getWishlist();
  const itemsContainer = document.getElementById("wishlist-drawer-items");
  const countEl = document.getElementById("wishlist-drawer-count");

  if (countEl) countEl.textContent = `${wishlist.length} item${wishlist.length === 1 ? '' : 's'}`;
  if (!itemsContainer) return;

  if (wishlist.length === 0) {
    itemsContainer.innerHTML = `
      <div class="py-16 text-center space-y-3">
        <span class="material-symbols-outlined text-outline text-[48px]">favorite_border</span>
        <h4 class="font-headline-sm text-headline-sm text-on-surface font-display-hero">No saved items yet</h4>
        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-xs mx-auto">Click the heart icon on any piece to curate your private architectural wishlist.</p>
        <a href="catalog.html" onclick="closeWishlistDrawer()" class="inline-block mt-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold">Explore Pieces</a>
      </div>
    `;
    return;
  }

  const items = wishlist.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);

  itemsContainer.innerHTML = items.map(p => `
    <div class="py-3 flex gap-space-sm group">
      <img src="${p.images.primary}" alt="${p.title}" class="w-20 h-24 object-cover rounded-lg bg-surface-container shrink-0" />
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-1">
            <h4 class="font-label-md text-label-md font-semibold text-on-surface line-clamp-1">${p.title}</h4>
            <span class="font-label-md text-label-md font-semibold text-on-surface">$${p.price}</span>
          </div>
          <p class="font-body-sm text-[12px] text-on-surface-variant line-clamp-1">${p.subtitle}</p>
        </div>
        <div class="flex items-center justify-between mt-2 pt-1">
          <button onclick="AURAStore.addItem(getProductById('${p.id}'), 1); AURAStore.toggleWishlist('${p.id}');" class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold transition-colors">
            Move to Bag
          </button>
          <button onclick="AURAStore.toggleWishlist('${p.id}')" class="text-on-surface-variant hover:text-error transition-colors p-1" title="Remove from wishlist">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// ACCOUNT MODAL CONTROLS
function openAccountModal() {
  const modal = document.getElementById("aura-account-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.querySelector(".bg-charcoal\\/50").classList.remove("opacity-0");
    const inner = modal.querySelector(".glass-modal");
    inner.classList.remove("opacity-0", "scale-95");
    inner.classList.add("scale-100");
  }, 10);
}

function closeAccountModal() {
  const modal = document.getElementById("aura-account-modal");
  if (!modal) return;
  modal.querySelector(".bg-charcoal\\/50").classList.add("opacity-0");
  const inner = modal.querySelector(".glass-modal");
  inner.classList.remove("scale-100");
  inner.classList.add("opacity-0", "scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 250);
}

function closeAllDrawersAndModals() {
  closeCartDrawer();
  closeSearchModal();
  closeWishlistDrawer();
  closeAccountModal();
}

// TOAST NOTIFICATIONS
function showToastNotification(message) {
  const container = document.getElementById("aura-toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "aura-toast";
  toast.innerHTML = `
    <span class="material-symbols-outlined text-primary text-[20px]">check_circle</span>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toast-out 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
