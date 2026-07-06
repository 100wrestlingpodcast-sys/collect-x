// collectors-market/app.js

// --- Persistent Database Simulator using LocalStorage ---
const db = {
  init() {
    if (!localStorage.getItem('cm_initialized')) {
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
      
      // Default session
      localStorage.setItem('cm_current_user_id', 'usr_buyer_1'); // Carlos default
      localStorage.setItem('cm_cart', JSON.stringify([]));
      localStorage.setItem('cm_favorites', JSON.stringify([]));
      
      localStorage.setItem('cm_initialized', 'true');
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
  
  const currentHash = window.location.hash.slice(1);
  const selectedCategory = currentHash.startsWith('category/') ? decodeURIComponent(currentHash.split('/')[1]) : 'Todos';
  
  container.innerHTML = CATEGORIES.map(cat => {
    const isActive = (cat === 'Todos' && selectedCategory === 'Todos') || (cat === selectedCategory);
    const clickHandler = cat === 'Todos' ? `router.navigate('')` : `router.navigate('category/${encodeURIComponent(cat)}')`;
    return `<button class="category-tab ${isActive ? 'active' : ''}" onclick="${clickHandler}">${cat}</button>`;
  }).join('');
}

// Special route check for category filters
window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#category/')) {
    // Re-render marketplace with active category selected
    renderMarketplace();
  }
  renderCategoryTabs();
});

// --- Dynamic Badges and Headers ---
function updateBadges() {
  // Cart Badge
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
  
  // Drawer Cart Count
  const cartDrawerCount = document.getElementById('cart-drawer-count');
  if (cartDrawerCount) cartDrawerCount.textContent = cartCount;
  
  // Favorites Badge
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

// --- Quick Role Switcher ---
function quickSwitchUser(userId) {
  db.setCurrentUserId(userId);
  state.refresh();
  updateNavBar();
  updateBadges();
  
  // Refresh current route
  router.resolve();
  
  // Rerender headers
  renderCategoryTabs();
  
  console.log(`Switched to user: ${state.currentUser.name} (${state.currentUser.role})`);
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
  // Simple simulator shows profile edit/details overlay
  const user = state.currentUser;
  const createdDate = new Date(user.created_at).toLocaleDateString();
  
  let detailsHtml = `
    <div style="text-align:center; padding: 1rem 0;">
      <img src="${user.avatar}" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:3px solid var(--gold); margin-bottom:1rem;">
      <h3 style="color:white; margin-bottom:0.25rem;">${user.name}</h3>
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
  
  // Parse lucide icons initial load
  lucide.createIcons();
});
