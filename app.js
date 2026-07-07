// collectors-market/app.js

window.tr = function(es, en) {
  const lang = localStorage.getItem('cm_language') || 'es';
  return lang === 'en' ? en : es;
};

// --- Persistent Database Simulator using LocalStorage ---
const db = {
  init() {
    if (!localStorage.getItem('cm_initialized_v7')) {
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
      
      // New CRM Notification and Follower tables
      localStorage.setItem('cm_favorite_sellers', JSON.stringify([]));
      localStorage.setItem('cm_notifications', JSON.stringify([]));
      
      // Compliance Tables (v7)
      localStorage.setItem('cm_strikes', JSON.stringify(window.INITIAL_STRIKES || []));
      localStorage.setItem('cm_extension_requests', JSON.stringify(window.INITIAL_EXTENSION_REQUESTS || []));
      localStorage.setItem('cm_compliance_audit_logs', JSON.stringify(window.INITIAL_COMPLIANCE_AUDIT_LOGS || []));
      
      // Default session
      localStorage.setItem('cm_current_user_id', ''); // Empty (Guest) default
      localStorage.setItem('cm_cart', JSON.stringify([]));
      localStorage.setItem('cm_favorites', JSON.stringify([]));
      
      localStorage.setItem('cm_initialized_v7', 'true');
    }
  },
  
  get(table) {
    return JSON.parse(localStorage.getItem(`cm_${table}`)) || [];
  },
  
  set(table, data) {
    localStorage.setItem(`cm_${table}`, JSON.stringify(data));
  },
  
  getCurrentUserId() {
    const val = localStorage.getItem('cm_current_user_id');
    return val !== null ? val : '';
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
  language: 'es',
  
  refresh() {
    db.init();
    
    // Load Language
    this.language = localStorage.getItem('cm_language') || 'es';
    
    // Load User
    const users = db.get('users');
    const currId = db.getCurrentUserId();
    this.currentUser = users.find(u => u.id === currId) || null;
    
    // Load Seller Profile if role is seller
    if (this.currentUser && this.currentUser.role === 'seller') {
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
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        alert("Acceso denegado. Se requieren privilegios de Administrador.");
        this.navigate('');
        return;
      }
      document.getElementById('nav-btn-admin')?.classList.add('active');
      renderAdminDashboard();
    } else if (route === 'seller') {
      if (!state.currentUser || (state.currentUser.role !== 'seller' && state.currentUser.role !== 'admin')) {
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
    
    // Category translations map
    const catTranslations = {
      'Todos': 'All',
      'Acción (Retro)': 'Action (Retro)',
      'Funko Pop': 'Funko Pop',
      'Wrestling': 'Wrestling',
      'Anime': 'Anime',
      'Marvel / DC': 'Marvel / DC',
      'Autografiados': 'Autographed',
      'Ediciones limitadas': 'Limited Editions'
    };
    
    const translatedCat = tr(cat, catTranslations[cat] || cat);
    return `<button class="category-tab ${isActive ? 'active' : ''}" onclick="${clickHandler}">${translatedCat}</button>`;
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
  
  if (user) {
    if (navAvatar) navAvatar.src = user.avatar;
    if (navName) navName.textContent = user.name;
    if (navRoleBadge) {
      navRoleBadge.className = `user-role-badge ${user.role}`;
      navRoleBadge.textContent = user.role === 'buyer' ? 'comprador' : user.role === 'seller' ? 'vendedor' : 'admin';
    }

    // Mobile Bottom Nav Profile Avatar Update
    const mobileNavAvatar = document.getElementById('mobile-nav-avatar');
    if (mobileNavAvatar) {
      mobileNavAvatar.src = user.avatar || window.GUEST_AVATAR;
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
    if (sellerBtn) sellerBtn.style.display = (user.role === 'seller' || user.role === 'admin') ? 'flex' : 'none';
  } else {
    // Guest State
    if (navAvatar) navAvatar.src = window.GUEST_AVATAR;
    if (navName) navName.textContent = 'Iniciar Sesión';
    if (navRoleBadge) {
      navRoleBadge.className = 'user-role-badge guest';
      navRoleBadge.textContent = 'visitante';
    }

    // Mobile Bottom Nav Profile Avatar Update
    const mobileNavAvatar = document.getElementById('mobile-nav-avatar');
    if (mobileNavAvatar) {
      mobileNavAvatar.src = window.GUEST_AVATAR;
    }

    // Mobile Dashboard Button visibility
    const mobileDashBtn = document.getElementById('mobile-nav-btn-dashboard');
    if (mobileDashBtn) mobileDashBtn.style.display = 'none';

    // Hide dashboards buttons
    const adminBtn = document.getElementById('nav-btn-admin');
    const sellerBtn = document.getElementById('nav-btn-seller');
    if (adminBtn) adminBtn.style.display = 'none';
    if (sellerBtn) sellerBtn.style.display = 'none';
  }
  
  // Float switcher active classes
  document.querySelectorAll('.role-switch-btn').forEach(btn => btn.classList.remove('active'));
  if (user) {
    if (user.id === 'usr_buyer_1') document.getElementById('role-btn-buyer')?.classList.add('active');
    if (user.id === 'usr_seller_1') document.getElementById('role-btn-seller')?.classList.add('active');
    if (user.id === 'usr_admin_1') document.getElementById('role-btn-admin')?.classList.add('active');
  }

  // Translate search placeholder
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = tr("Buscar figuras de acción, Funko, cómics...", "Search action figures, Funkos, comics...");
  }

  // Update lang switcher style in navbar
  const btnEs = document.getElementById('lang-btn-es');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnEs && btnEn) {
    if (state.language === 'en') {
      btnEs.style.background = 'transparent';
      btnEs.style.color = 'var(--text-secondary)';
      btnEs.style.fontWeight = '500';
      
      btnEn.style.background = 'var(--gold-light)';
      btnEn.style.color = '#000000';
      btnEn.style.fontWeight = '700';
    } else {
      btnEn.style.background = 'transparent';
      btnEn.style.color = 'var(--text-secondary)';
      btnEn.style.fontWeight = '500';
      
      btnEs.style.background = 'var(--gold-light)';
      btnEs.style.color = '#000000';
      btnEs.style.fontWeight = '700';
    }
  }

  // Translate desktop links text content
  const desktopNavLabels = document.querySelectorAll('.nav-text-desktop');
  if (desktopNavLabels.length >= 5) {
    desktopNavLabels[0].textContent = tr("Marketplace", "Marketplace");
    desktopNavLabels[1].textContent = tr("Favoritos", "Favorites");
    desktopNavLabels[2].textContent = tr("Carrito", "Cart");
    desktopNavLabels[3].textContent = tr("Panel Vendedor", "Seller Panel");
    desktopNavLabels[4].textContent = tr("Admin Dashboard", "Admin Panel");
  }

  // Translate mobile links text content
  const mobileNavLabels = document.querySelectorAll('.nav-text-mobile');
  if (mobileNavLabels.length >= 5) {
    mobileNavLabels[0].textContent = tr("Tienda", "Store");
    mobileNavLabels[1].textContent = tr("Favoritos", "Favs");
    mobileNavLabels[2].textContent = tr("Carrito", "Cart");
    mobileNavLabels[3].textContent = tr("Panel", "Panel");
    mobileNavLabels[4].textContent = tr("Perfil", "Profile");
  }

  // Translate cart drawer static headers
  const drawerHeaderTitle = document.querySelector('.cart-drawer-header h3');
  if (drawerHeaderTitle) {
    const countSpan = document.getElementById('cart-drawer-count');
    const countVal = countSpan ? countSpan.textContent : '0';
    drawerHeaderTitle.innerHTML = `<i data-lucide="shopping-cart" style="color:var(--gold-light);"></i> ${tr('Tu Carrito', 'Your Cart')} (<span id="cart-drawer-count">${countVal}</span>)`;
  }
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

// Profile Dropdown & Login Modal
function toggleProfileDropdown() {
  const user = state.currentUser;
  
  if (!user || window.showLoginFormOnly) {
    renderLoginFormModal();
    return;
  }
  
  const createdDate = new Date(user.created_at).toLocaleDateString();
  
  let detailsHtml = `
    <div style="text-align:center; padding: 1rem 0;">
      <div style="position:relative; display:inline-block; margin-bottom:0.75rem;">
        <img src="${user.avatar}" id="profile-avatar-preview" style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:3.5px solid var(--border-metallic-yellow);">
        <label for="avatar-file-input" style="position:absolute; bottom:-5px; right:-5px; background:var(--gold-light); border:1.5px solid #000000; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 3px 8px rgba(0,0,0,0.2);">
          <i data-lucide="camera" style="width:0.85rem; height:0.85rem; color:#000000;"></i>
        </label>
        <input type="file" id="avatar-file-input" style="display:none;" accept="image/*" onchange="handleAvatarUpload(this)">
      </div>
      <h3 style="color:var(--text-primary); margin-bottom:0.25rem;">${user.name}</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1.2rem;">${user.email}</p>
      <div style="display:flex; justify-content:center; gap:0.5rem; margin-bottom:1.5rem;">
        <span class="user-role-badge ${user.role}">${user.role === 'buyer' ? 'Comprador' : user.role === 'seller' ? 'Vendedor' : 'Admin'}</span>
        <span class="status-tag approved">${user.status}</span>
      </div>
      
      <div style="border-top:1px solid var(--border-color); padding:1rem 0; text-align:left; font-size:0.85rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.4rem;">
        <p><strong>ID Usuario:</strong> <code>${user.id}</code></p>
        <p><strong>Miembro desde:</strong> ${createdDate}</p>
      </div>

      <!-- Notification Preferences -->
      <div style="border-top:1px solid var(--border-color); padding:0.85rem 0; text-align:left;">
        <h4 style="font-size:0.8rem; margin-bottom:0.6rem; color:var(--text-primary); font-family:var(--font-heading);">Alertas de Vendedores:</h4>
        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.75rem; color:var(--text-secondary);">
          <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
            <input type="checkbox" id="pref-email-notif" ${user.email_notifications !== false ? 'checked' : ''} onchange="updateNotifPref('email', this.checked)">
            Recibir alertas por Correo Electrónico
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
            <input type="checkbox" id="pref-sms-notif" ${user.sms_notifications === true ? 'checked' : ''} onchange="updateNotifPref('sms', this.checked)">
            Recibir alertas por Mensaje de Texto (SMS)
          </label>
        </div>
      </div>

      <!-- Favorite Sellers List -->
      <div style="border-top:1px solid var(--border-color); padding:0.85rem 0; text-align:left;">
        <h4 style="font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-primary); font-family:var(--font-heading);">Vendedores Favoritos:</h4>
        <div style="display:flex; flex-direction:column; gap:0.35rem; max-height:100px; overflow-y:auto; padding-right:0.25rem;">
          ${getFollowedSellersHtml()}
        </div>
      </div>
      
      <div style="display:flex; gap:0.75rem; margin-top:1.2rem; border-top:1px solid var(--border-color); padding-top:1rem;">
        <button class="btn-large secondary-btn" style="flex:1;" onclick="handleUserLogout()">
          <i data-lucide="log-out" style="width:0.95rem;height:0.95rem;display:inline-block;vertical-align:middle;margin-right:0.3rem;"></i>
          Cerrar Sesión
        </button>
        <button class="btn-large primary-btn" style="flex:1;" onclick="toggleGlobalModal(false)">
          Cerrar
        </button>
      </div>
    </div>
  `;
  
  toggleGlobalModal(true, "Tu Perfil de Usuario", detailsHtml);
  lucide.createIcons();
}

function renderLoginFormModal() {
  const formHtml = `
    <div style="padding: 0.5rem 0;">
      <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.5rem; text-align:center;">
        Ingresa tus credenciales registradas en la base de datos de COLLECT X.
      </p>

      <div style="display:flex; flex-direction:column; gap:1.2rem;">
        <div class="checkout-input-wrapper">
          <label for="login-email">Correo Electrónico</label>
          <input type="email" id="login-email" placeholder="admin@mail.com" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
        </div>
        <div class="checkout-input-wrapper">
          <label for="login-password">Contraseña</label>
          <input type="password" id="login-password" placeholder="••••••••" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
        </div>
        
        <button class="btn-large primary-btn" style="margin-top:0.5rem; padding:0.9rem;" onclick="handleUserLoginSubmit()">
          <i data-lucide="log-in" style="width:1.1rem;height:1.1rem;display:inline-block;vertical-align:middle;margin-right:0.4rem;"></i>
          Iniciar Sesión
        </button>
      </div>

      <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:1.5rem; text-align:center;">
        ¿No tienes cuenta? <a onclick="renderRegisterFormModal()" style="color:var(--gold-light); font-weight:700; cursor:pointer; text-decoration:underline;">Regístrate aquí</a>
      </p>
    </div>
  `;
  toggleGlobalModal(true, "Iniciar Sesión en COLLECT X", formHtml);
  lucide.createIcons();
}

function handleUserLoginSubmit() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    alert("Por favor completa el correo y la contraseña.");
    return;
  }

  const users = db.get('users');
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (user && user.password_hash === password) {
    db.setCurrentUserId(user.id);
    state.refresh();
    updateNavBar();
    updateBadges();
    
    window.showLoginFormOnly = false;
    toggleGlobalModal(false);
    
    // Redirect based on role
    if (user.role === 'admin') {
      router.navigate('admin');
    } else if (user.role === 'seller') {
      router.navigate('seller');
    } else {
      router.navigate('');
    }
    
    alert(`¡Sesión iniciada con éxito! Bienvenido, ${user.name}.`);
  } else {
    alert("Credenciales incorrectas. Por favor verifica los datos ingresados.");
  }
}

function handleUserLogout() {
  db.setCurrentUserId(''); // Clear session
  state.refresh();
  updateNavBar();
  updateBadges();
  
  window.showLoginFormOnly = false;
  toggleGlobalModal(false); // Close modal immediately
  router.navigate(''); // Redirect to home page on logout
}

function renderRegisterFormModal() {
  const formHtml = `
    <div style="padding: 0.5rem 0;">
      <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.5rem; text-align:center;">
        Crea tu cuenta de Comprador o Vendedor en COLLECT X.
      </p>

      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div class="checkout-input-wrapper">
          <label for="reg-name">Nombre Completo</label>
          <input type="text" id="reg-name" placeholder="Ej: John Doe" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
        </div>
        <div class="checkout-input-wrapper">
          <label for="reg-email">Correo Electrónico</label>
          <input type="email" id="reg-email" placeholder="ejemplo@mail.com" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
        </div>
        <div class="checkout-input-wrapper">
          <label for="reg-password">Contraseña</label>
          <input type="password" id="reg-password" placeholder="••••••••" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
        </div>
        <div class="checkout-input-wrapper">
          <label for="reg-role">¿Qué deseas hacer?</label>
          <select id="reg-role" onchange="toggleRegisterSellerFields(this.value)" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
            <option value="buyer">Comprar Figuras (Comprador)</option>
            <option value="seller">Vender Figuras (Vendedor)</option>
          </select>
        </div>

        <!-- Extra fields for Seller -->
        <div id="reg-seller-fields" style="display:none; flex-direction:column; gap:1rem; border-top:1px dashed var(--border-color); padding-top:1rem; margin-top:0.5rem;">
          <div class="checkout-input-wrapper">
            <label for="reg-store-name">Nombre de tu Tienda</label>
            <input type="text" id="reg-store-name" placeholder="Ej: Geek Empire" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); padding:0.5rem; border-radius:6px; outline:none; width:100%;">
          </div>
          <div class="checkout-input-wrapper">
            <label for="reg-store-desc">Descripción corta</label>
            <textarea id="reg-store-desc" placeholder="¿Qué tipo de coleccionables vendes?" style="height:60px; padding:0.5rem; border-radius:6px; border:1px solid var(--border-color); width:100%; outline:none; background:white; color:var(--text-primary);"></textarea>
          </div>
        </div>

        <button class="btn-large primary-btn" style="margin-top:1rem; padding:0.9rem;" onclick="handleUserRegisterSubmit()">
          Crear Cuenta
        </button>
      </div>

      <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:1.5rem; text-align:center;">
        ¿Ya tienes cuenta? <a onclick="renderLoginFormModal()" style="color:var(--gold-light); font-weight:700; cursor:pointer; text-decoration:underline;">Inicia sesión aquí</a>
      </p>
    </div>
  `;
  toggleGlobalModal(true, "Registrarse en COLLECT X", formHtml);
  lucide.createIcons();
}

function toggleRegisterSellerFields(role) {
  const fields = document.getElementById('reg-seller-fields');
  if (fields) {
    fields.style.display = role === 'seller' ? 'flex' : 'none';
  }
}

function handleUserRegisterSubmit() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const role = document.getElementById('reg-role').value;

  if (!name || !email || !password) {
    alert("Por favor completa todos los campos principales (Nombre, Email y Contraseña).");
    return;
  }

  const users = db.get('users');
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    alert("Este correo electrónico ya está registrado.");
    return;
  }

  const newUserId = "usr_" + Date.now();
  const newUser = {
    id: newUserId,
    name: name,
    email: email,
    password_hash: password,
    role: role,
    avatar: window.GUEST_AVATAR,
    created_at: new Date().toISOString(),
    status: "active"
  };
  users.push(newUser);
  db.set('users', users);

  if (role === 'seller') {
    const storeName = document.getElementById('reg-store-name').value.trim() || `${name} Shop`;
    const storeDesc = document.getElementById('reg-store-desc').value.trim() || 'Vendedor de figuras coleccionables.';
    
    const profiles = db.get('seller_profiles');
    profiles.push({
      id: "sel_prof_" + Date.now(),
      user_id: newUserId,
      store_name: storeName,
      description: storeDesc,
      stripe_connect_id: "",
      subscription_plan: "Free",
      commission_rate: 0.12,
      approved: false, // Starts as pending admin approval!
      rating_average: 5.0,
      total_sales: 0.00
    });
    db.set('seller_profiles', profiles);
    
    alert(`¡Registro de vendedor exitoso! Tu perfil está pendiente de aprobación por el Administrador.`);
  } else {
    // Create default empty shipping address for buyer
    const addresses = db.get('shipping_addresses');
    addresses.push({
      id: "addr_" + Date.now(),
      user_id: newUserId,
      name: name,
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      phone: "",
      is_default: true
    });
    db.set('shipping_addresses', addresses);
    alert(`¡Cuenta creada con éxito! Bienvenido a COLLECT X, ${name}.`);
  }

  // Auto login
  db.setCurrentUserId(newUserId);
  state.refresh();
  updateNavBar();
  updateBadges();

  window.showLoginFormOnly = false;
  toggleGlobalModal(false);
  router.navigate('');
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

// --- Favorite/Follow Sellers Engine ---
function isFollowingSeller(sellerId) {
  if (!state.currentUser) return false;
  const follows = db.get('favorite_sellers');
  return follows.some(f => f.user_id === state.currentUser.id && f.seller_id === sellerId);
}

function toggleFollowSeller(sellerId, storeName) {
  if (!state.currentUser) {
    alert("Inicia sesión para agregar este vendedor a tus favoritos.");
    renderLoginFormModal();
    return;
  }

  const follows = db.get('favorite_sellers');
  const idx = follows.findIndex(f => f.user_id === state.currentUser.id && f.seller_id === sellerId);

  if (idx !== -1) {
    follows.splice(idx, 1);
    db.set('favorite_sellers', follows);
    alert(`Has dejado de seguir a ${storeName}.`);
  } else {
    follows.push({
      id: "fav_sel_" + Date.now(),
      user_id: state.currentUser.id,
      seller_id: sellerId,
      created_at: new Date().toISOString()
    });
    db.set('favorite_sellers', follows);
    alert(`¡Ahora sigues a ${storeName}! Recibirás notificaciones cuando suba nuevos artículos.`);
  }

  // Refresh current view
  if (window.location.hash.startsWith('#product/')) {
    renderProductDetails();
  }
  
  // Refresh profile modal if open to show updated followed sellers list
  if (document.getElementById('global-modal').classList.contains('open') && document.getElementById('modal-title').textContent === "Tu Perfil de Usuario") {
    toggleProfileDropdown();
  }
  updateNavBar();
}

function updateNotifPref(type, enabled) {
  if (!state.currentUser) return;
  const users = db.get('users');
  const idx = users.findIndex(u => u.id === state.currentUser.id);
  if (idx !== -1) {
    if (type === 'email') {
      users[idx].email_notifications = enabled;
    } else if (type === 'sms') {
      users[idx].sms_notifications = enabled;
    }
    db.set('users', users);
    state.currentUser = users[idx];
    console.log("Preferencia de notificación actualizada:", type, enabled);
  }
}

function getFollowedSellersHtml() {
  if (!state.currentUser) return '';
  const follows = db.get('favorite_sellers').filter(f => f.user_id === state.currentUser.id);
  const profiles = db.get('seller_profiles');
  
  if (follows.length === 0) {
    return `<p style="font-size:0.75rem; color:var(--text-muted); font-style:italic; text-align:center; padding: 0.5rem 0;">No sigues a ningún vendedor todavía.</p>`;
  }

  let html = '';
  follows.forEach(f => {
    let sName = 'Collectors Shop';
    if (f.seller_id !== 'usr_admin_1') {
      const p = profiles.find(prof => prof.user_id === f.seller_id);
      if (p) sName = p.store_name;
    } else {
      sName = 'COLLECT X Tienda Oficial';
    }
    
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fafafa; border:1px solid var(--border-color); padding:0.4rem 0.6rem; border-radius:6px; font-size:0.75rem; color:var(--text-primary); margin-bottom:0.25rem;">
        <span>🏪 ${sName}</span>
        <a onclick="toggleFollowSeller('${f.seller_id}', '${sName.replace(/'/g, "\\'")}')" style="color:var(--gold-light); cursor:pointer; font-weight:700; text-decoration:underline;">Quitar</a>
      </div>
    `;
  });
  return html;
}

function notifyFollowers(sellerId, product) {
  const follows = db.get('favorite_sellers').filter(f => f.seller_id === sellerId);
  const users = db.get('users');
  const profiles = db.get('seller_profiles');
  const notifications = db.get('notifications') || [];
  
  let storeName = 'COLLECT X Tienda Oficial';
  if (sellerId !== 'usr_admin_1') {
    const prof = profiles.find(p => p.user_id === sellerId);
    if (prof) storeName = prof.store_name;
  }

  let notificationCount = 0;

  follows.forEach(f => {
    const buyer = users.find(u => u.id === f.user_id);
    if (!buyer) return;

    // Check if buyer has email alerts enabled (default is true)
    if (buyer.email_notifications !== false) {
      const emailMsg = `¡Nueva figura de ${storeName} en COLLECT X! Hola ${buyer.name}, tu vendedor favorito ${storeName} acaba de publicar "${product.title}" por $${product.price.toFixed(2)}. ¡Entra ya para verla!`;
      notifications.push({
        id: "notif_email_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        user_id: buyer.id,
        type: "email",
        recipient: buyer.email,
        message: emailMsg,
        sent_at: new Date().toISOString(),
        status: "sent"
      });
      notificationCount++;
    }

    // Check if buyer has SMS alerts enabled (default is false)
    if (buyer.sms_notifications === true) {
      const smsMsg = `COLLECT X ALERTA: ¡${storeName} publicó "${product.title}" por $${product.price.toFixed(2)}! Ver en: #product/${product.id}`;
      notifications.push({
        id: "notif_sms_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        user_id: buyer.id,
        type: "sms",
        recipient: buyer.phone || "+1 (555) 0199",
        message: smsMsg,
        sent_at: new Date().toISOString(),
        status: "sent"
      });
      notificationCount++;
    }
  });

  db.set('notifications', notifications);

  if (notificationCount > 0) {
    showNotificationToast(storeName, product.title, notificationCount);
  }
}

function showNotificationToast(storeName, productTitle, count) {
  let container = document.getElementById('toast-notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notification-container';
    container.style.cssText = 'position:fixed; top:80px; right:20px; z-index:3000; display:flex; flex-direction:column; gap:0.75rem; max-width:320px; width:90%;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = 'background:var(--text-primary); color:white; border-left:4px solid var(--border-metallic-yellow); padding:0.85rem 1rem; border-radius:8px; box-shadow:0 10px 25px rgba(0,0,0,0.2); font-size:0.8rem; transform:translateX(120%); transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); display:flex; flex-direction:column; gap:0.25rem;';
  
  toast.innerHTML = `
    <div style="font-weight:700; color:var(--gold-light); display:flex; align-items:center; gap:0.3rem;">
      <i data-lucide="bell" style="width:0.9rem;height:0.9rem;color:var(--gold-light);"></i>
      <span>¡Notificaciones Despachadas!</span>
    </div>
    <div style="color:white; line-height:1.3;">Se enviaron ${count} alerta(s) de email/SMS a los seguidores de <strong>${storeName}</strong> por su nuevo artículo: "${productTitle}".</div>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 5000);
}

function handleAvatarUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64String = e.target.result;
    
    // Update active user profile picture
    const user = state.currentUser;
    if (user) {
      const users = db.get('users');
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx].avatar = base64String;
        db.set('users', users);
        state.currentUser = users[idx];
        
        // Update previews instantly
        const preview = document.getElementById('profile-avatar-preview');
        if (preview) preview.src = base64String;
        
        const navAvatar = document.getElementById('nav-user-avatar');
        if (navAvatar) navAvatar.src = base64String;
        
        const mobileAvatar = document.getElementById('mobile-nav-avatar');
        if (mobileAvatar) mobileAvatar.src = base64String;
        
        alert("¡Foto de perfil actualizada con éxito!");
      }
    }
  };
  reader.readAsDataURL(file);
}

function changeLanguage(lang) {
  state.language = lang;
  localStorage.setItem('cm_language', lang);
  
  // Refresh and re-render everything
  state.refresh();
  updateNavBar();
  updateBadges();
  
// Re-run router resolve to translate the current view
  router.resolve();
  
  // Re-render categories tabs
  renderCategoryTabs();
}

// --- Compliance & Fulfillment Engine ---
window.ComplianceEngine = {
  // Test utility: Shifts an order's created_at date BACKWARDS by X hours to simulate time passing
  fastForwardOrderTime(orderId, hours) {
    const orders = db.get('orders');
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx > -1) {
      const currentCreatedAt = new Date(orders[idx].created_at);
      currentCreatedAt.setHours(currentCreatedAt.getHours() - hours);
      orders[idx].created_at = currentCreatedAt.toISOString();
      db.set('orders', orders);
      console.log(`Order ${orderId} fast-forwarded by ${hours} hours. New created_at: ${orders[idx].created_at}`);
      this.runFulfillmentChecker();
      state.refresh();
    }
  },

  runFulfillmentChecker() {
    const orders = db.get('orders');
    const profiles = db.get('seller_profiles');
    const transactions = db.get('transactions');
    const strikes = db.get('strikes');
    const auditLogs = db.get('compliance_audit_logs');
    
    let dbUpdated = false;
    const now = new Date();

    orders.forEach(order => {
      // Only care about paid orders that haven't been shipped/cancelled/refunded yet
      if (order.order_status !== 'paid' && order.order_status !== 'preparing' && order.order_status !== 'en_riesgo') return;

      const orderDate = new Date(order.created_at);
      const hoursPassed = Math.abs(now - orderDate) / 36e5;

      const sellerId = order.items[0].seller_id; 
      const profileIdx = profiles.findIndex(p => p.id === sellerId);
      if (profileIdx === -1) return;
      
      const p = profiles[profileIdx];

      // 5-Day (120h) Auto-Cancel & Strike
      if (hoursPassed >= 120 && order.order_status !== 'refunded') {
        order.order_status = 'refunded'; // Auto-refund
        
        // Find transaction and refund
        const txIdx = transactions.findIndex(t => t.order_id === order.id);
        if (txIdx > -1) {
          transactions[txIdx].status = 'refunded';
          transactions[txIdx].updated_at = new Date().toISOString();
        }

        // Apply Strike
        const newStrike = {
          id: 'strk_' + Date.now(),
          seller_id: p.id,
          order_id: order.id,
          reason: 'Fallo de envío - 5 días superados (Reembolso Automático)',
          created_at: new Date().toISOString(),
          status: 'active'
        };
        strikes.push(newStrike);
        
        // Update seller stats
        p.active_strikes += 1;
        p.cancelled_orders += 1;
        
        auditLogs.push({
          id: 'aud_' + Date.now(),
          type: 'auto_cancel_strike',
          seller_id: p.id,
          order_id: order.id,
          details: 'Orden cancelada y strike aplicado por superar los 5 días de envío.',
          created_at: new Date().toISOString()
        });
        
        // Re-calculate reliability
        this.recalculateReliability(p);
        
        dbUpdated = true;
      }
      // 72-Hour Risk Alert
      else if (hoursPassed >= 72 && hoursPassed < 120 && order.order_status !== 'en_riesgo' && !order.tracking_number) {
        order.order_status = 'en_riesgo'; // Put in risk
        
        auditLogs.push({
          id: 'aud_' + Date.now(),
          type: 'risk_warning',
          seller_id: p.id,
          order_id: order.id,
          details: 'Orden marcada EN RIESGO (72h sin envío).',
          created_at: new Date().toISOString()
        });
        
        dbUpdated = true;
      }
    });

    if (dbUpdated) {
      db.set('orders', orders);
      db.set('seller_profiles', profiles);
      db.set('transactions', transactions);
      db.set('strikes', strikes);
      db.set('compliance_audit_logs', auditLogs);
    }
  },

  recalculateReliability(profile) {
    // Basic formula: Start at 100
    // -20 pts per active strike
    // -5 pts per delayed order (not leading to cancel)
    // +1 pt for on-time order
    
    let score = 100;
    score -= (profile.active_strikes * 20);
    score -= (profile.delayed_orders * 5);
    score += (profile.ontime_orders * 1);
    
    // Check suspension thresholds
    if (profile.active_strikes >= 4) {
      profile.banned_permanently = true;
      score = 0;
    } else if (profile.active_strikes >= 3) {
      // 30 day lock
      const lockDate = new Date();
      lockDate.setDate(lockDate.getDate() + 30);
      profile.suspension_until = lockDate.toISOString();
    }
    
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    
    profile.reliability_score = score;
  }
};

