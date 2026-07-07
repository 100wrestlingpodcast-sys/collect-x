// collectors-market/components/marketplace.js

function renderMarketplace() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const products = db.get('products');
  const media = db.get('product_media');
  const profiles = db.get('seller_profiles');
  const banners = db.get('banners').filter(b => b.active);
  const reviews = db.get('reviews');

  // Parse routing parameters (category or search)
  const hash = window.location.hash.slice(1);
  let activeCategory = 'Todos';
  let searchQuery = '';

  if (hash.startsWith('category/')) {
    activeCategory = decodeURIComponent(hash.split('/')[1]);
  } else if (hash.startsWith('search/')) {
    searchQuery = decodeURIComponent(hash.split('/')[1]);
  }

  // Get filter selections from local state or set defaults
  if (!window.activeFilters) {
    window.activeFilters = {
      brands: [],
      conditions: [],
      minPrice: '',
      maxPrice: '',
      onlyInStock: false,
      sellerId: 'all',
      minRating: 0
    };
  }

  // Pre-extract unique brands, sellers, conditions for filter checkboxes
  const allApprovedProducts = products.filter(p => p.status === 'approved' || p.status === 'sold_out');
  const brands = [...new Set(allApprovedProducts.map(p => p.brand))];
  const conditions = ["Sellado", "Nuevo", "Usado", "Caja dañada", "Sin caja"];
  const approvedSellers = profiles.filter(p => p.approved);

  // Filter application logic
  let filteredProducts = allApprovedProducts;

  // Filter by Category route
  if (activeCategory !== 'Todos') {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }

  // Filter by Search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }

  // Sidebar dynamic filters
  if (window.activeFilters.brands.length > 0) {
    filteredProducts = filteredProducts.filter(p => window.activeFilters.brands.includes(p.brand));
  }
  if (window.activeFilters.conditions.length > 0) {
    filteredProducts = filteredProducts.filter(p => window.activeFilters.conditions.includes(p.condition));
  }
  if (window.activeFilters.minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(window.activeFilters.minPrice));
  }
  if (window.activeFilters.maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(window.activeFilters.maxPrice));
  }
  if (window.activeFilters.onlyInStock) {
    filteredProducts = filteredProducts.filter(p => p.stock > 0);
  }
  if (window.activeFilters.sellerId !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.seller_id === window.activeFilters.sellerId);
  }
  if (window.activeFilters.minRating > 0) {
    filteredProducts = filteredProducts.filter(p => {
      // Find rating of seller
      const seller = profiles.find(prof => prof.user_id === p.seller_id);
      return seller && seller.rating_average >= window.activeFilters.minRating;
    });
  }

  // Sort by Seller Reliability Score (Higher score = Higher ranking)
  filteredProducts.sort((a, b) => {
    const sellerA = profiles.find(prof => prof.user_id === a.seller_id);
    const sellerB = profiles.find(prof => prof.user_id === b.seller_id);
    const scoreA = sellerA ? (sellerA.reliability_score || 0) : 0;
    const scoreB = sellerB ? (sellerB.reliability_score || 0) : 0;
    return scoreB - scoreA; // Descending order
  });

  // Build Hero Slider markup
  let heroMarkup = '';
  // Only show hero banner on home page without search query
  if (activeCategory === 'Todos' && !searchQuery) {
    heroMarkup = `
      <div class="hero-slider" id="hero-slider">
        ${banners.map((banner, index) => `
          <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${banner.image}');" id="hero-slide-${index}">
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <span class="hero-badge">${tr('Destacado', 'Featured')}</span>
              <h2 class="hero-title">${banner.title === 'Tienda Oficial COLLECT X' ? tr('Tienda Oficial COLLECT X', 'Official Store COLLECT X') : banner.title}</h2>
              <p class="hero-subtitle">${banner.subtitle === 'Consigue figuras certificadas y ediciones especiales con envío garantizado.' ? tr('Consigue figuras certificadas y ediciones especiales con envío garantizado.', 'Get certified figures and special editions with guaranteed shipping.') : banner.subtitle}</p>
              <button class="hero-btn" onclick="router.navigate('${banner.link.replace('#', '')}')">${tr('Ver Colección', 'View Collection')}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Build grid and layout
  viewport.innerHTML = `
    ${heroMarkup}
    
    <div class="section-container">
      <div class="section-header">
        <div>
          <h2 class="section-title">
            ${searchQuery ? `${tr('Resultados para', 'Results for')} "${searchQuery}"` : activeCategory === 'Todos' ? tr('Descubre Figuras Exclusivas', 'Discover Exclusive Figures') : activeCategory}
          </h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 0.25rem;">
            ${tr(`Mostrando ${filteredProducts.length} coleccionables`, `Showing ${filteredProducts.length} collectibles`)}
          </p>
        </div>
      </div>
      
      <div class="marketplace-layout">
        <!-- Sidebar Filters -->
        <aside class="filter-sidebar">
          <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
            <i data-lucide="sliders-horizontal" style="width:1.1rem; height:1.1rem; color:var(--gold-light);"></i>
            ${tr('Filtros', 'Filters')}
          </h3>
          
          <!-- Brand filters -->
          <div class="filter-group">
            <span class="filter-label">${tr('Marcas', 'Brands')}</span>
            <div class="filter-options">
              ${brands.map(brand => {
                const checked = window.activeFilters.brands.includes(brand) ? 'checked' : '';
                return `
                  <label class="filter-checkbox">
                    <input type="checkbox" value="${brand}" onchange="toggleFilterBrand('${brand}')" ${checked}>
                    <span>${brand}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Condition filters -->
          <div class="filter-group">
            <span class="filter-label">${tr('Condición', 'Condition')}</span>
            <div class="filter-options">
              ${conditions.map(cond => {
                const checked = window.activeFilters.conditions.includes(cond) ? 'checked' : '';
                return `
                  <label class="filter-checkbox">
                    <input type="checkbox" value="${cond}" onchange="toggleFilterCondition('${cond}')" ${checked}>
                    <span>${cond}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Price filter -->
          <div class="filter-group">
            <span class="filter-label">${tr('Rango de Precio', 'Price Range')}</span>
            <div class="price-inputs">
              <input type="number" id="filter-min-price" placeholder="Min" value="${window.activeFilters.minPrice}" onchange="updateFilterPrice()">
              <input type="number" id="filter-max-price" placeholder="Max" value="${window.activeFilters.maxPrice}" onchange="updateFilterPrice()">
            </div>
          </div>

          <!-- Seller filter -->
          <div class="filter-group">
            <span class="filter-label">${tr('Vendedor', 'Seller')}</span>
            <select id="filter-seller-select" onchange="updateFilterSeller()" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); width:100%; border-radius:6px; padding:0.4rem; font-family:var(--font-body); outline:none;">
              <option value="all" ${window.activeFilters.sellerId === 'all' ? 'selected' : ''}>${tr('Todos los vendedores', 'All Sellers')}</option>
              <option value="usr_admin_1" ${window.activeFilters.sellerId === 'usr_admin_1' ? 'selected' : ''}>COLLECT X (${tr('Oficial', 'Official')})</option>
              ${approvedSellers.map(sel => `
                <option value="${sel.user_id}" ${window.activeFilters.sellerId === sel.user_id ? 'selected' : ''}>${sel.store_name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Availability filter -->
          <div class="filter-group">
            <span class="filter-label">${tr('Disponibilidad', 'Availability')}</span>
            <label class="filter-checkbox">
              <input type="checkbox" onchange="toggleFilterStock()" ${window.activeFilters.onlyInStock ? 'checked' : ''}>
              <span>${tr('Solo en Stock', 'Only In Stock')}</span>
            </label>
          </div>

          <!-- Rating filter -->
          <div class="filter-group">
            <span class="filter-label">${tr('Rating Vendedor', 'Seller Rating')}</span>
            <div class="filter-options">
              ${[4, 3, 2].map(stars => `
                <label class="filter-checkbox" style="display:flex; align-items:center;">
                  <input type="radio" name="filter-rating" onchange="updateFilterRating(${stars})" ${window.activeFilters.minRating === stars ? 'checked' : ''}>
                  <span style="color: var(--gold-light); display:flex; align-items:center; gap:0.25rem;">
                    ${stars}+ <i data-lucide="star" style="width:0.8rem;height:0.8rem;fill:var(--gold-light);"></i>
                  </span>
                </label>
              `).join('')}
              <label class="filter-checkbox">
                <input type="radio" name="filter-rating" onchange="updateFilterRating(0)" ${window.activeFilters.minRating === 0 ? 'checked' : ''}>
                <span>${tr('Cualquier Rating', 'Any Rating')}</span>
              </label>
            </div>
          </div>

          <button class="clear-filters-btn" onclick="clearAllFilters()">
            ${tr('Limpiar Filtros', 'Clear Filters')}
          </button>
        </aside>

        <!-- Product Cards Grid -->
        <section class="products-grid">
          ${filteredProducts.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: var(--text-secondary);">
              <i data-lucide="shopping-bag" style="width: 3rem; height: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
              <h3>${tr('No se encontraron productos', 'No products found')}</h3>
              <p style="margin-top: 0.5rem; font-size: 0.9rem;">${tr('Prueba modificando tus filtros o cambiando la búsqueda.', 'Try modifying your filters or changing your search.')}</p>
            </div>
          ` : filteredProducts.map(p => {
            // Find product image
            const pMedia = media.find(m => m.product_id === p.id);
            const imgSrc = pMedia ? pMedia.media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
            
            // Find seller details
            let sellerName = 'Collectors Shop';
            if (p.seller_id !== 'usr_admin_1') {
              const prof = profiles.find(s => s.user_id === p.seller_id);
              sellerName = prof ? prof.store_name : 'Vendedor Externo';
            }

            // Check if is favorited
            const isFav = state.favorites.includes(p.id);

            // Setup proper condition badge class
            const condClass = p.condition.toLowerCase().replace(/\s+/g, '');

            return `
              <article class="product-card">
                <div class="card-img-wrapper" onclick="router.navigate('product/${p.id}')" style="cursor:pointer;">
                  <img src="${imgSrc}" alt="${p.title}" class="card-img" loading="lazy">
                  <span class="condition-badge ${condClass}">${p.condition}</span>
                </div>
                
                <button class="favorite-btn-floating ${isFav ? 'favorited' : ''}" onclick="toggleFavorite('${p.id}')">
                  <i data-lucide="heart" style="width:1.2rem; height:1.2rem; fill:${isFav ? '#ef4444' : 'none'};"></i>
                </button>
                
                <div class="card-body">
                  <span class="card-category">${p.category}</span>
                  <a onclick="router.navigate('product/${p.id}')" class="card-title">${p.title}</a>
                  
                  <div class="card-seller">
                    <i data-lucide="store" style="width:0.8rem;height:0.8rem;color:var(--text-muted);"></i>
                    <span>${sellerName}</span>
                  </div>
                  
                  <div class="card-footer">
                    <span class="card-price">$${p.price.toFixed(2)}</span>
                    ${p.is_external_ebay ? `
                      <button class="card-btn ebay-btn" onclick="openEbayLink('${p.id}', '${p.ebay_url}')">
                        <i data-lucide="external-link" style="width:0.85rem;height:0.85rem;display:inline;margin-right:2px;vertical-align:-1px;"></i>
                        eBay
                      </button>
                    ` : p.stock === 0 ? `
                      <span class="status-tag rejected" style="font-size:0.75rem;">${tr('Agotado', 'Sold Out')}</span>
                    ` : `
                      <button class="card-btn" onclick="addToCart('${p.id}')">
                        ${tr('Añadir', 'Add')}
                      </button>
                    `}
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </section>
      </div>
    </div>
  `;

  // Start slideshow interval if hero banner exists
  if (activeCategory === 'Todos' && !searchQuery) {
    startHeroSliderInterval(banners.length);
  }

  // Bind icons
  lucide.createIcons();
}

// --- Hero Banner Slideshow Simulation ---
let heroSliderInterval = null;
function startHeroSliderInterval(slideCount) {
  if (heroSliderInterval) clearInterval(heroSliderInterval);
  if (slideCount <= 1) return;

  let activeIndex = 0;
  heroSliderInterval = setInterval(() => {
    const activeSlide = document.getElementById(`hero-slide-${activeIndex}`);
    if (activeSlide) activeSlide.classList.remove('active');
    
    activeIndex = (activeIndex + 1) % slideCount;
    
    const nextSlide = document.getElementById(`hero-slide-${activeIndex}`);
    if (nextSlide) nextSlide.classList.add('active');
  }, 5000);
}

// --- Filter Interactions ---
function toggleFilterBrand(brand) {
  const index = window.activeFilters.brands.indexOf(brand);
  if (index > -1) {
    window.activeFilters.brands.splice(index, 1);
  } else {
    window.activeFilters.brands.push(brand);
  }
  renderMarketplace();
}

function toggleFilterCondition(cond) {
  const index = window.activeFilters.conditions.indexOf(cond);
  if (index > -1) {
    window.activeFilters.conditions.splice(index, 1);
  } else {
    window.activeFilters.conditions.push(cond);
  }
  renderMarketplace();
}

function updateFilterPrice() {
  window.activeFilters.minPrice = document.getElementById('filter-min-price').value;
  window.activeFilters.maxPrice = document.getElementById('filter-max-price').value;
  
  // Debounce grid refresh
  if (window.priceFilterTimeout) clearTimeout(window.priceFilterTimeout);
  window.priceFilterTimeout = setTimeout(() => {
    renderMarketplace();
  }, 400);
}

function updateFilterSeller() {
  window.activeFilters.sellerId = document.getElementById('filter-seller-select').value;
  renderMarketplace();
}

function toggleFilterStock() {
  window.activeFilters.onlyInStock = !window.activeFilters.onlyInStock;
  renderMarketplace();
}

function updateFilterRating(rating) {
  window.activeFilters.minRating = rating;
  renderMarketplace();
}

function clearAllFilters() {
  window.activeFilters = {
    brands: [],
    conditions: [],
    minPrice: '',
    maxPrice: '',
    onlyInStock: false,
    sellerId: 'all',
    minRating: 0
  };
  renderMarketplace();
}

// --- Cart and Favorite actions ---
function addToCart(productId) {
  if (!state.currentUser) {
    alert("Por favor inicia sesión para añadir artículos al carrito.");
    renderLoginFormModal();
    return;
  }

  const products = db.get('products');
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const itemIndex = state.cart.findIndex(i => i.product_id === productId);
  if (itemIndex > -1) {
    if (state.cart[itemIndex].quantity >= product.stock) {
      alert(`Lo sentimos, no hay suficiente stock disponible de esta figura (${product.stock} unidades).`);
      return;
    }
    state.cart[itemIndex].quantity++;
  } else {
    state.cart.push({
      id: "cart_it_" + Date.now(),
      user_id: state.currentUser.id,
      product_id: productId,
      quantity: 1
    });
  }
  state.saveCart();
  
  // Open the drawer automatically to show visual feedback
  toggleCartDrawer(true);
}

function toggleFavorite(productId) {
  if (!state.currentUser) {
    alert("Por favor inicia sesión para guardar productos en tus favoritos.");
    renderLoginFormModal();
    return;
  }

  const index = state.favorites.indexOf(productId);
  if (index > -1) {
    state.favorites.splice(index, 1);
  } else {
    state.favorites.push(productId);
  }
  state.saveFavorites();
  
  // Re-render
  renderMarketplace();
}

function openEbayLink(productId, url) {
  // Track backend referral traffic
  const orders = db.get('orders');
  
  // Log external order click
  const newExternalOrder = {
    id: "ord_ext_" + Math.random().toString(36).substr(2, 9),
    buyer_id: state.currentUser.id,
    seller_id: "usr_admin_1", // Admin referral
    total_amount: 0.0, // External
    platform_fee: 0.0,
    seller_payout: 0.0,
    payment_status: "external_click",
    order_status: "external_referred",
    stripe_payment_intent_id: "ebay_referred_" + productId,
    tracking_number: "EBAY_LINK",
    shipping_carrier: "eBay",
    created_at: new Date().toISOString()
  };
  
  orders.push(newExternalOrder);
  db.set('orders', orders);
  
  // Open URL
  window.open(url, '_blank');
}

// --- Favorites View ---
function renderFavoritesView() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const products = db.get('products');
  const media = db.get('product_media');
  const profiles = db.get('seller_profiles');

  const favProducts = products.filter(p => state.favorites.includes(p.id));

  viewport.innerHTML = `
    <div class="section-container">
      <div style="margin-bottom: 2rem;">
        <h2 class="section-title">${tr('Tus Favoritos', 'Your Favorites')}</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">${tr('Figuras guardadas para comprar después', 'Saved figures to buy later')}</p>
      </div>

      ${favProducts.length === 0 ? `
        <div style="text-align: center; padding: 5rem 0; color: var(--text-secondary); background:var(--bg-card); border-radius:12px; border:1px solid var(--border-color);">
          <i data-lucide="heart" style="width: 4rem; height: 4rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>${tr('No tienes favoritos aún', 'No favorites yet')}</h3>
          <p style="margin-top:0.5rem; font-size:0.95rem;">${tr('Explora el catálogo y presiona el corazón para guardar figuras.', 'Explore the catalog and tap the heart icon to save figures.')}</p>
          <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">${tr('Explorar Catálogo', 'Explore Catalog')}</button>
        </div>
      ` : `
        <section class="products-grid">
          ${favProducts.map(p => {
            const pMedia = media.find(m => m.product_id === p.id);
            const imgSrc = pMedia ? pMedia.media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
            
            let sellerName = 'Collectors Shop';
            if (p.seller_id !== 'usr_admin_1') {
              const prof = profiles.find(s => s.user_id === p.seller_id);
              sellerName = prof ? prof.store_name : 'Vendedor Externo';
            }
            const condClass = p.condition.toLowerCase().replace(/\s+/g, '');

            return `
              <article class="product-card">
                <div class="card-img-wrapper" onclick="router.navigate('product/${p.id}')" style="cursor:pointer;">
                  <img src="${imgSrc}" alt="${p.title}" class="card-img">
                  <span class="condition-badge ${condClass}">${p.condition}</span>
                </div>
                
                <button class="favorite-btn-floating favorited" onclick="toggleFavoriteFromFavsPage('${p.id}')">
                  <i data-lucide="heart" style="width:1.2rem; height:1.2rem; fill:#ef4444; color:#ef4444;"></i>
                </button>
                
                <div class="card-body">
                  <span class="card-category">${p.category}</span>
                  <a onclick="router.navigate('product/${p.id}')" class="card-title">${p.title}</a>
                  
                  <div class="card-seller">
                    <i data-lucide="store" style="width:0.8rem;height:0.8rem;color:var(--text-muted);"></i>
                    <span>${sellerName}</span>
                  </div>
                  
                  <div class="card-footer">
                    <span class="card-price">$${p.price.toFixed(2)}</span>
                    ${p.is_external_ebay ? `
                      <button class="card-btn ebay-btn" onclick="openEbayLink('${p.id}', '${p.ebay_url}')">eBay</button>
                    ` : p.stock === 0 ? `
                      <span class="status-tag rejected" style="font-size:0.75rem;">${tr('Agotado', 'Sold Out')}</span>
                    ` : `
                      <button class="card-btn" onclick="addToCart('${p.id}')">${tr('Añadir', 'Add')}</button>
                    `}
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </section>
      `}
    </div>
  `;

  lucide.createIcons();
}

function toggleFavoriteFromFavsPage(productId) {
  const index = state.favorites.indexOf(productId);
  if (index > -1) {
    state.favorites.splice(index, 1);
  }
  state.saveFavorites();
  renderFavoritesView();
}
