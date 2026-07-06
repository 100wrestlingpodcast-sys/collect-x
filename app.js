// collectors-market/app.js

// --- Persistent Database Simulator using LocalStorage ---
const db = {
  init() {
    if (!localStorage.getItem('cm_initialized_v2')) {
      // Clean old keys if exist
      localStorage.clear();
      
      localStorage.setItem('cm_users', JSON.stringify(window.INITIAL_USERS));
      localStorage.setItem('cm_seller_profiles', JSON.stringify(window.INITIAL_SELLER_PROFILES));
      localStorage.setItem('cm_products', JSON.stringify(window.INITIAL_PRODUCTS));
      localStorage.setItem('cm_product_media', JSON.stringify(window.INITIAL_PRODUCT_MEDIA));
      localStorage.setItem('cm_reviews', JSON.stringify(window.INITIAL_REVIEWS));
      localStorage.setItem('cm_review_media', JSON.stringify(window.INITIAL_REVIEW_MEDIA));
      localStorage.setItem('cm_orders', JSON.stringify(window.INITIAL_ORDERS));
      localStorage.setItem('cm_order_items', JSON.stringify(window.INITIAL_ORDER_ITEMS));
      localStorage.setItem('cm_transactions', JSON.stringify(window.INITIAL_TRANSACTIONS));
      localStorage.setItem('cm_seller_subscriptions', JSON.stringify(window.INITIAL_SELLER_SUBSCRIPTIONS));
      localStorage.setItem('cm_banners', JSON.stringify(window.INITIAL_BANNERS));
      localStorage.setItem('cm_coupons', JSON.stringify(window.INITIAL_COUPONS));
      
      // New Shippo tables
      localStorage.setItem('cm_shipping_addresses', JSON.stringify(window.INITIAL_SHIPPING_ADDRESSES));
      localStorage.setItem('cm_shipments', JSON.stringify(window.INITIAL_SHIPMENTS));
      localStorage.setItem('cm_package_evidence', JSON.stringify(window.INITIAL_PACKAGE_EVIDENCE));
      
      // Default session
      localStorage.setItem('cm_current_user_id', 'usr_buyer_1'); // Carlos default
      localStorage.setItem('cm_cart', JSON.stringify([]));
      localStorage.setItem('cm_favorites', JSON.stringify([]));
      
      localStorage.setItem('cm_initialized_v2', 'true');
    }
  },
  
  get(table) {
    return JSON.parse(localStorage.getItem(`cm_${table}`)) || [];
  },
  
  set(table, data) {
    localStorage.setItem(`cm_${table}`, JSON.stringify(data));
  },
  
  getCurrentUserId() {
    return localStorage.getItem('cm_current_user_id') || 'usr_buyer_1';
  },
  
  setCurrentUserId(id) {
    localStorage.setItem('cm_current_user_id', id);
  }
};

// --- Secure Shippo API Simulator (Backend Endpoint Simulation) ---
const shippoAPI = {
  verifyAddress(address) {
    // Basic verification simulation
    if (!address.zip || address.zip.length < 5) {
      return { isValid: false, error: "Código postal inválido." };
    }
    if (!address.street || address.street.length < 5) {
      return { isValid: false, error: "Dirección de calle incompleta." };
    }
    return { isValid: true, error: null };
  },

  calculateRates(parcel, fromAddress, toAddress) {
    // Simulating call to Shippo API to fetch carrier rates
    // Apply rules for collectibles
    const declaredValue = parcel.declared_value || 0;
    const isFragile = parcel.fragile || false;
    const isCollectibleSpecial = parcel.category === "Autografiados" || parcel.category === "Ediciones limitadas";

    // Auto-calculate insurance fee if required or worth > $100
    let insuranceFee = 0.00;
    let insuranceSuggested = false;

    if (declaredValue >= 100.00 || isCollectibleSpecial) {
      insuranceSuggested = true;
      // Mock Shippo Insurance calculation: 1% of declared value, minimum $2.50
      insuranceFee = Math.max(2.50, declaredValue * 0.01);
    }

    // Dynamic base shipping multipliers based on weight (oz) and distance (mocked by ZIP differences)
    const weightInOunces = parcel.weight || 8;
    const weightFactor = Math.ceil(weightInOunces / 16) * 1.5; // Scale rate per pound
    
    const baseRates = [
      {
        id: "rate_usps_ground",
        carrier: "USPS",
        service: "Ground Advantage",
        cost: 4.50 + weightFactor,
        days: 4,
        tier: "Económico"
      },
      {
        id: "rate_usps_priority",
        carrier: "USPS",
        service: "Priority Mail",
        cost: 7.99 + weightFactor,
        days: 2,
        tier: "Estándar"
      },
      {
        id: "rate_fedex_home",
        carrier: "FedEx",
        service: "Home Delivery",
        cost: 10.50 + weightFactor,
        days: 3,
        tier: "Estándar"
      },
      {
        id: "rate_dhl_express",
        carrier: "DHL",
        service: "Express Worldwide",
        cost: 32.00 + weightFactor,
        days: 1,
        tier: "Rápido"
      }
    ];

    // Filter or adjust recommendations based on fragility
    const rates = baseRates.map(r => {
      let finalCost = r.cost;
      let notes = "";

      // Fragile items get protective packaging surcharge
      if (isFragile) {
        finalCost += 2.00;
        notes = "Incluye empaque especial de protección";
      }

      return {
        id: r.id,
        carrier: r.carrier,
        service: r.service,
        shipping_cost: parseFloat(finalCost.toFixed(2)),
        days: r.days,
        tier: r.tier,
        insurance_cost: parseFloat(insuranceFee.toFixed(2)),
        notes: notes
      };
    });

    // Recommend fast, secure carrier if fragile or high value
    let recommendedRateId = "rate_usps_priority";
    if (declaredValue > 500) recommendedRateId = "rate_dhl_express";

    return {
      rates: rates,
      insurance_suggested: insuranceSuggested,
      insurance_fee: parseFloat(insuranceFee.toFixed(2)),
      recommended_rate_id: recommendedRateId,
      fragile_warning: isFragile ? "Advertencia: El artículo es frágil. Se recomienda seleccionar envíos rápidos con seguro activo." : null
    };
  },

  createShipmentTransaction(orderId, rateSelected, parcel, fromAddr, toAddr) {
    // Simulating label creation
    const carrier = rateSelected.carrier;
    const trackingPrefix = carrier === "USPS" ? "USPS" : carrier === "FedEx" ? "FDX" : "DHL";
    const trackingNumber = trackingPrefix + Math.floor(1000000000 + Math.random() * 9000000000);
    
    const labelFilename = `label_${carrier.toLowerCase()}_${trackingNumber}.pdf`;
    const labelUrl = `https://shippo-delivery-labels.s3.amazonaws.com/${labelFilename}`;
    const trackingUrl = `https://goshippo.com/tracking?carrier=${carrier.toLowerCase()}&tracking_number=${trackingNumber}`;

    const shipments = db.get('shipments');
    const newShipment = {
      id: "shp_" + Date.now(),
      order_id: orderId,
      seller_id: parcel.seller_id,
      buyer_id: toAddr.user_id,
      shippo_shipment_id: "sh_api_" + Math.random().toString(36).substr(2, 9),
      shippo_transaction_id: "tx_api_" + Math.random().toString(36).substr(2, 9),
      carrier: carrier,
      service_level: rateSelected.service,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      label_url: labelUrl,
      shipping_cost: rateSelected.shipping_cost,
      insurance_amount: rateSelected.insurance_cost || 0.00,
      status: "label_generado", // Initial state once paid
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    shipments.push(newShipment);
    db.set('shipments', shipments);

    // Update order shipping details
    const orders = db.get('orders');
    const oIdx = orders.findIndex(o => o.id === orderId);
    if (oIdx > -1) {
      orders[oIdx].order_status = "preparing"; // Preparing shipment
      orders[oIdx].tracking_number = trackingNumber;
      orders[oIdx].shipping_carrier = carrier;
      db.set('orders', orders);
    }

    return newShipment;
  },

  updateShipmentStatus(shipmentId, newStatus) {
    const shipments = db.get('shipments');
    const orders = db.get('orders');
    const transactions = db.get('transactions');
    const profiles = db.get('seller_profiles');

    const sIdx = shipments.findIndex(s => s.id === shipmentId);
    if (sIdx === -1) return;

    const shipment = shipments[sIdx];
    shipment.status = newStatus;
    shipment.updated_at = new Date().toISOString();
    shipments[sIdx] = shipment;
    db.set('shipments', shipments);

    // Sync order status
    const oIdx = orders.findIndex(o => o.id === shipment.order_id);
    if (oIdx > -1) {
      let mappedOrderStatus = "processing";
      if (newStatus === "empacado") mappedOrderStatus = "preparing";
      if (newStatus === "entregado_al_carrier") mappedOrderStatus = "preparing";
      if (newStatus === "en_transito") mappedOrderStatus = "shipped";
      if (newStatus === "entregado") mappedOrderStatus = "delivered";
      if (newStatus === "problema") mappedOrderStatus = "disputed";
      if (newStatus === "devuelto") mappedOrderStatus = "refunded";

      orders[oIdx].order_status = mappedOrderStatus;
      db.set('orders', orders);

      // Payout Release Lock: If status is 'delivered' (entregado), release the transaction seller payout!
      if (mappedOrderStatus === "delivered") {
        const tIdx = transactions.findIndex(t => t.order_id === shipment.order_id);
        if (tIdx > -1 && transactions[tIdx].status === "succeeded") {
          // Release payout from escrow (payout is marked as released/succeeded)
          console.log(`Shipment delivered. Releasing $${transactions[tIdx].seller_net.toFixed(2)} to seller connected account: ${shipment.seller_id}`);
        }
      }
    }
  }
};

// --- Application Core State ---
const state = {
  currentUser: null,
  sellerProfile: null,
  cart: [],
  favorites: [],
  
  refresh() {
    db.init();
    
    // Load User
    const users = db.get('users');
    const currId = db.getCurrentUserId();
    this.currentUser = users.find(u => u.id === currId) || users[0];
    
    // Load Seller Profile if role is seller
    if (this.currentUser.role === 'seller') {
      const profiles = db.get('seller_profiles');
      this.sellerProfile = profiles.find(p => p.user_id === this.currentUser.id);
    } else {
      this.sellerProfile = null;
    }
    
    // Load Cart
    this.cart = db.get('cart');
    
    // Load Favorites
    this.favorites = db.get('favorites');
  },
  
  saveCart() {
    db.set('cart', this.cart);
    updateBadges();
  },
  
  saveFavorites() {
    db.set('favorites', this.favorites);
    updateBadges();
  }
};

// --- Single Page App Router ---
const router = {
  routes: {},
  
  init() {
    window.addEventListener('hashchange', () => {
      this.resolve();
    });
    this.resolve();
  },
  
  navigate(hash) {
    window.location.hash = hash;
  },
  
  resolve() {
    const hash = window.location.hash.slice(1) || '';
    
    // Parse route parameters (e.g. #product/prod_1)
    const parts = hash.split('/');
    const route = parts[0];
    const param = parts[1] || null;
    
    // Update active nav styling
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    // Perform route routing
    if (route === '') {
      document.getElementById('nav-btn-marketplace')?.classList.add('active');
      renderMarketplace();
    } else if (route === 'product' && param) {
      renderProductDetail(param);
    } else if (route === 'favorites') {
      document.getElementById('nav-btn-favorites')?.classList.add('active');
      renderFavoritesView();
    } else if (route === 'checkout') {
      renderCheckoutView();
    } else if (route === 'admin') {
      if (state.currentUser.role !== 'admin') {
        alert("Acceso denegado. Se requieren privilegios de Administrador.");
        this.navigate('');
        return;
      }
      document.getElementById('nav-btn-admin')?.classList.add('active');
      renderAdminDashboard();
    } else if (route === 'seller') {
      if (state.currentUser.role !== 'seller') {
        alert("Acceso denegado. Se requiere cuenta de Vendedor.");
        this.navigate('');
        return;
      }
      document.getElementById('nav-btn-seller')?.classList.add('active');
      renderSellerDashboard();
    } else {
      // Catch-all
      renderMarketplace();
    }
    
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Close cart drawer if navigating
    toggleCartDrawer(false);
  }
};

// --- Dynamic Category Bar ---
const CATEGORIES = [
  "Todos",
  "Funko Pop",
  "WWE / Wrestling",
  "NBA / Deportes",
  "Anime",
  "Marvel / DC",
  "Gaming",
  "Figuras vintage",
  "Ediciones limitadas",
  "Autografiados"
];

function renderCategoryTabs() {
  const container = document.getElementById('categories-tabs-container');
  if (!container) return;
  
  const selectedCategory = window.location.hash.slice(1).startsWith('category/') ? decodeURIComponent(window.location.hash.slice(1).split('/')[1]) : 'Todos';
  
  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = (cat === 'Todos' && selectedCategory === 'Todos') || (cat === selectedCategory);
    const clickHandler = cat === 'Todos' ? `router.navigate('')` : `router.navigate('category/${encodeURIComponent(cat)}')`;
    return `<button class="category-tab ${isActive ? 'active' : ''}" onclick="${clickHandler}">${cat}</button>`;
  }).join('');
}

// Special route check for category filters
window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#category/')) {
    renderMarketplace();
  }
  renderCategoryTabs();
});

// --- Dynamic Badges and Headers ---
function updateBadges() {
  // Cart Badge (Desktop)
  const cartBadge = document.getElementById('cart-badge');
  const cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    if (cartCount > 0) {
      cartBadge.textContent = cartCount;
      cartBadge.style.display = 'flex';
    } else {
      cartBadge.style.display = 'none';
    }
  }

  // Cart Badge (Mobile)
  const mobileCartBadge = document.getElementById('mobile-cart-badge');
  if (mobileCartBadge) {
    if (cartCount > 0) {
      mobileCartBadge.textContent = cartCount;
      mobileCartBadge.style.display = 'flex';
    } else {
      mobileCartBadge.style.display = 'none';
    }
  }
  
  // Drawer Cart Count
  const cartDrawerCount = document.getElementById('cart-drawer-count');
  if (cartDrawerCount) cartDrawerCount.textContent = cartCount;
  
  // Favorites Badge (Desktop)
  const favBadge = document.getElementById('favorites-badge');
  const favCount = state.favorites.length;
  if (favBadge) {
    if (favCount > 0) {
      favBadge.textContent = favCount;
      favBadge.style.display = 'flex';
    } else {
      favBadge.style.display = 'none';
    }
  }

  // Favorites Badge (Mobile)
  const mobileFavBadge = document.getElementById('mobile-favorites-badge');
  if (mobileFavBadge) {
    if (favCount > 0) {
      mobileFavBadge.textContent = favCount;
      mobileFavBadge.style.display = 'flex';
    } else {
      mobileFavBadge.style.display = 'none';
    }
  }
}

function updateNavBar() {
  const user = state.currentUser;
  
  // Update user profile btn
  const navAvatar = document.getElementById('nav-user-avatar');
  const navName = document.getElementById('nav-user-name');
  const navRoleBadge = document.getElementById('nav-user-role-badge');
  
  if (navAvatar) navAvatar.src = user.avatar;
  if (navName) navName.textContent = user.name;
  if (navRoleBadge) {
    navRoleBadge.className = `user-role-badge ${user.role}`;
    navRoleBadge.textContent = user.role === 'buyer' ? 'comprador' : user.role === 'seller' ? 'vendedor' : 'admin';
  }

  // Mobile Bottom Nav Profile Avatar Update
  const mobileNavAvatar = document.getElementById('mobile-nav-avatar');
  if (mobileNavAvatar) {
    mobileNavAvatar.src = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }

  // Mobile Dashboard Button visibility
  const mobileDashBtn = document.getElementById('mobile-nav-btn-dashboard');
  if (mobileDashBtn) {
    if (user.role === 'seller' || user.role === 'admin') {
      mobileDashBtn.style.display = 'flex';
    } else {
      mobileDashBtn.style.display = 'none';
    }
  }
  
  // Toggle Admin / Seller buttons
  const adminBtn = document.getElementById('nav-btn-admin');
  const sellerBtn = document.getElementById('nav-btn-seller');
  
  if (adminBtn) adminBtn.style.display = user.role === 'admin' ? 'flex' : 'none';
  if (sellerBtn) sellerBtn.style.display = user.role === 'seller' ? 'flex' : 'none';
  
  // Float switcher active classes
  document.querySelectorAll('.role-switch-btn').forEach(btn => btn.classList.remove('active'));
  if (user.id === 'usr_buyer_1') document.getElementById('role-btn-buyer')?.classList.add('active');
  if (user.id === 'usr_seller_1') document.getElementById('role-btn-seller')?.classList.add('active');
  if (user.id === 'usr_admin_1') document.getElementById('role-btn-admin')?.classList.add('active');
}

function routeMobileDashboard() {
  if (state.currentUser.role === 'admin') {
    router.navigate('admin');
  } else if (state.currentUser.role === 'seller') {
    router.navigate('seller');
  }
}

// --- Quick Role Switcher ---
function quickSwitchUser(userId) {
  db.setCurrentUserId(userId);
  state.refresh();
  updateNavBar();
  updateBadges();
  
  // Refresh current route
  router.resolve();
  renderCategoryTabs();
}

// --- Cart Drawer Animation Controllers ---
function toggleCartDrawer(show) {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  const panel = document.getElementById('cart-drawer-panel');
  
  if (show) {
    backdrop.classList.add('open');
    panel.classList.add('open');
    renderCartDrawer();
  } else {
    backdrop.classList.remove('open');
    panel.classList.remove('open');
  }
}

// --- Modal Helper Functions ---
function toggleGlobalModal(show, title = '', bodyHtml = '') {
  const modal = document.getElementById('global-modal');
  const mTitle = document.getElementById('modal-title');
  const mBody = document.getElementById('modal-body');
  
  if (show) {
    mTitle.textContent = title;
    mBody.innerHTML = bodyHtml;
    modal.classList.add('open');
    lucide.createIcons();
  } else {
    modal.classList.remove('open');
  }
}

function closeGlobalModal(event) {
  if (event.target === document.getElementById('global-modal')) {
    toggleGlobalModal(false);
  }
}

// Profile Dropdown
function toggleProfileDropdown() {
  const user = state.currentUser;
  const createdDate = new Date(user.created_at).toLocaleDateString();
  
  let detailsHtml = `
    <div style="text-align:center; padding: 1rem 0;">
      <img src="${user.avatar}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid var(--border-metallic-yellow); margin-bottom:1rem;">
      <h3 style="color:var(--text-primary); margin-bottom:0.25rem;">${user.name}</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">${user.email}</p>
      <div style="display:flex; justify-content:center; gap:0.5rem; margin-bottom:1.5rem;">
        <span class="user-role-badge ${user.role}">${user.role}</span>
        <span class="status-tag approved">${user.status}</span>
      </div>
      
      <div style="border-top:1px solid var(--border-color); padding-top:1rem; text-align:left; font-size:0.85rem; color:var(--text-secondary);">
        <p style="margin-bottom:0.5rem;"><strong>ID Usuario:</strong> ${user.id}</p>
        <p style="margin-bottom:0.5rem;"><strong>Miembro desde:</strong> ${createdDate}</p>
      </div>
      
      <button class="btn-large secondary-btn" style="margin-top:1.5rem;" onclick="toggleGlobalModal(false)">Cerrar</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Tu Perfil de Usuario", detailsHtml);
}

// Search interactions
function handleSearchKeyPress(event) {
  if (event.key === 'Enter') {
    triggerSearch();
  }
}

function triggerSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (query) {
    router.navigate(`search/${encodeURIComponent(query)}`);
  } else {
    router.navigate('');
  }
}

// special check for search route
window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#search/')) {
    renderMarketplace();
  }
});

// --- App Booting Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  state.refresh();
  updateNavBar();
  updateBadges();
  renderCategoryTabs();
  
  // Start SPA router
  router.init();
  lucide.createIcons();
});
