// collectors-market/components/admin.js

function renderAdminDashboard() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const users = db.get('users');
  const products = db.get('products');
  const profiles = db.get('seller_profiles');
  const orders = db.get('orders');
  const transactions = db.get('transactions');
  const reviews = db.get('reviews');
  const banners = db.get('banners');
  const coupons = db.get('coupons');

  // Sub-section tab state
  if (!window.activeAdminTab) window.activeAdminTab = 'overview';

  // Statistics calculations
  const totalSalesGross = transactions.reduce((sum, t) => t.status === 'succeeded' ? sum + t.gross_amount : sum, 0);
  const totalCommissions = transactions.reduce((sum, t) => t.status === 'succeeded' ? sum + t.platform_fee : sum, 0);
  const pendingOrders = orders.filter(o => o.order_status === 'paid' || o.order_status === 'shipped').length;
  
  const pendingProducts = products.filter(p => p.status === 'pending');
  const pendingSellers = profiles.filter(p => !p.approved);

  viewport.innerHTML = `
    <div class="section-container">
      <div style="margin-bottom: 1.5rem;">
        <h2 class="section-title">Panel de Administración</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">Control global del marketplace, comisiones, aprobaciones y catálogo.</p>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Menu -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeAdminTab === 'overview' ? 'active' : ''}" onclick="setAdminTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            Resumen General
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'approvals' ? 'active' : ''}" onclick="setAdminTab('approvals')">
            <i data-lucide="user-check" style="width:1.05rem;height:1.05rem;"></i>
            Aprobaciones (${pendingProducts.length + pendingSellers.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'products' ? 'active' : ''}" onclick="setAdminTab('products')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            Catálogo / Inventario
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'transactions' ? 'active' : ''}" onclick="setAdminTab('transactions')">
            <i data-lucide="dollar-sign" style="width:1.05rem;height:1.05rem;"></i>
            Ventas y Payouts
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'reviews' ? 'active' : ''}" onclick="setAdminTab('reviews')">
            <i data-lucide="message-square" style="width:1.05rem;height:1.05rem;"></i>
            Moderar Reseñas (${reviews.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'marketing' ? 'active' : ''}" onclick="setAdminTab('marketing')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            Banners y Cupones
          </a>
        </aside>

        <!-- Dynamic Content Area -->
        <main class="dashboard-content" id="admin-db-content">
          <!-- Sub-tab component injects here -->
        </main>
      </div>
    </div>
  `;

  renderAdminSubTab(window.activeAdminTab, {
    users, products, profiles, orders, transactions, reviews, banners, coupons,
    totalSalesGross, totalCommissions, pendingOrders, pendingProducts, pendingSellers
  });

  lucide.createIcons();
}

function setAdminTab(tabName) {
  window.activeAdminTab = tabName;
  renderAdminDashboard();
}

// --- Render Admin Sub-Tabs ---
function renderAdminSubTab(tab, data) {
  const container = document.getElementById('admin-db-content');
  if (!container) return;

  if (tab === 'overview') {
    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="stat-cards-grid">
        <div class="stat-card">
          <div class="stat-card-title">Ventas Brutas Totales</div>
          <div class="stat-card-value">$${data.totalSalesGross.toFixed(2)}</div>
          <div class="stat-card-change up">+15.2% esta semana</div>
        </div>
        <div class="stat-card" style="border-color: var(--gold-light);">
          <div class="stat-card-title" style="color:var(--gold-light);">Comisión de Plataforma</div>
          <div class="stat-card-value">$${data.totalCommissions.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">Comisiones de venta netas</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Aprobaciones Pendientes</div>
          <div class="stat-card-value">${data.pendingProducts.length + data.pendingSellers.length}</div>
          <div class="stat-card-change" style="color:#fbbf24;">Sellers: ${data.pendingSellers.length} | Items: ${data.pendingProducts.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Pedidos Activos</div>
          <div class="stat-card-value">${data.pendingOrders}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">Órdenes pagadas o en camino</div>
        </div>
      </div>

      <!-- CSS Charts for Sales Analytics -->
      <div class="chart-container">
        <div class="chart-title">Comisión Neta por Mes (USD)</div>
        <div class="chart-bars-wrapper">
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 40px;" data-val="$450.00"></div>
            <div class="chart-bar-label">Marzo</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 60px;" data-val="$680.00"></div>
            <div class="chart-bar-label">Abril</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 85px;" data-val="$950.00"></div>
            <div class="chart-bar-label">Mayo</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 110px;" data-val="$1,250.00"></div>
            <div class="chart-bar-label">Junio</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 130px;" data-val="$1,580.00"></div>
            <div class="chart-bar-label">Julio (Actual)</div>
          </div>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'approvals') {
    container.innerHTML = `
      <!-- Product Approvals -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header">
          <h3 style="display:flex;align-items:center;gap:0.5rem;">
            <i data-lucide="tag" style="color:var(--gold-light);"></i> Figuras Pendientes de Aprobación (${data.pendingProducts.length})
          </h3>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Figura</th>
                <th>Marca / Categoría</th>
                <th>Condición</th>
                <th>Precio</th>
                <th>Vendedor</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.pendingProducts.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem;">No hay productos pendientes de revisión.</td>
                </tr>
              ` : data.pendingProducts.map(p => {
                const sName = data.profiles.find(sp => sp.user_id === p.seller_id)?.store_name || 'Vendedor Externo';
                return `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${p.brand} / ${p.category}</td>
                    <td>${p.condition}</td>
                    <td style="font-weight:600; color:var(--text-primary);">$${p.price.toFixed(2)}</td>
                    <td>${sName}</td>
                    <td style="display:flex; gap:0.5rem;">
                      <button class="action-btn-small approve" onclick="approveProduct('${p.id}', true)">Aprobar</button>
                      <button class="action-btn-small reject" onclick="approveProduct('${p.id}', false)">Rechazar</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Seller Approvals -->
      <div class="db-table-card">
        <div class="db-table-header">
          <h3 style="display:flex;align-items:center;gap:0.5rem;">
            <i data-lucide="store" style="color:var(--primary-light);"></i> Solicitudes de Registro de Vendedores (${data.pendingSellers.length})
          </h3>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Tienda</th>
                <th>Plan Suscripción</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.pendingSellers.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align:center; padding:2rem;">No hay solicitudes de vendedores pendientes.</td>
                </tr>
              ` : data.pendingSellers.map(s => {
                const sUser = data.users.find(u => u.id === s.user_id) || {};
                return `
                  <tr>
                    <td><strong>${sUser.name || 'Vendedor'}</strong></td>
                    <td>${s.store_name}</td>
                    <td><span class="status-tag approved">${s.subscription_plan}</span></td>
                    <td>${sUser.email || ''}</td>
                    <td style="display:flex; gap:0.5rem;">
                      <button class="action-btn-small approve" onclick="approveSeller('${s.id}', true)">Aprobar</button>
                      <button class="action-btn-small reject" onclick="approveSeller('${s.id}', false)">Rechazar</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'products') {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3>Administración de Catálogo Completo</h3>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1rem;" onclick="openAdminAddProductModal()">
          <i data-lucide="plus"></i> Crear Producto Oficial (Tienda)
        </button>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Vendedor</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.products.map(p => {
                const sName = p.seller_id === 'usr_admin_1' 
                  ? 'Collectors Shop (Oficial)' 
                  : (data.profiles.find(sp => sp.user_id === p.seller_id)?.store_name || 'Vendedor');
                  
                return `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${sName}</td>
                    <td style="font-weight:600; color:var(--text-primary);">$${p.price.toFixed(2)}</td>
                    <td>${p.stock} u.</td>
                    <td>
                      ${p.is_external_ebay ? `
                        <span class="status-tag disputed" style="font-size:0.7rem; border-color:#002f87; color:#3b82f6;">eBay Link</span>
                      ` : '<span class="status-tag approved" style="font-size:0.7rem; background:none; border:1px solid #10b981; color:#10b981;">Interno</span>'}
                    </td>
                    <td><span class="status-tag ${p.status}">${p.status}</span></td>
                    <td style="display:flex; gap:0.4rem;">
                      <button class="action-btn-small suspend" style="padding:0.25rem 0.5rem;" onclick="openAdminEditProductModal('${p.id}')">Editar</button>
                      <button class="action-btn-small reject" style="padding:0.25rem 0.5rem;" onclick="removeProductAdmin('${p.id}')">Eliminar</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'transactions') {
    container.innerHTML = `
      <h3>Historial de Ventas y Liquidaciones Stripe Connect</h3>
      
      <div class="db-table-card">
        <div class="db-table-header">
          <h4>Ventas Registradas en la Plataforma</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>ID Transacción</th>
                <th>Fecha</th>
                <th>Comprador</th>
                <th>Vendedor</th>
                <th>Bruto</th>
                <th>Stripe Fee</th>
                <th>Comisión Plataforma</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.map(t => {
                const bName = data.users.find(u => u.id === t.buyer_id)?.name || 'Buyer';
                const sName = t.seller_id === 'usr_admin_1' 
                  ? 'Collectors Shop' 
                  : (data.profiles.find(sp => sp.user_id === t.seller_id)?.store_name || 'Vendedor');

                return `
                  <tr>
                    <td><code>${t.id}</code></td>
                    <td>${new Date(t.created_at).toLocaleDateString()}</td>
                    <td>${bName}</td>
                    <td>${sName}</td>
                    <td style="font-weight:600; color:var(--text-primary);">$${t.gross_amount.toFixed(2)}</td>
                    <td>-$${t.processing_fee.toFixed(2)}</td>
                    <td style="color:var(--gold-light); font-weight:600;">+$${t.platform_fee.toFixed(2)}</td>
                    <td><span class="status-tag approved">${t.status}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'reviews') {
    container.innerHTML = `
      <h3>Moderar Reseñas del Portal</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1rem;">Oculta reviews que contengan lenguaje ofensivo, spam o fotos no relacionadas con el producto.</p>
      
      <div class="reviews-list">
        ${data.reviews.map(r => {
          const prodTitle = data.products.find(p => p.id === r.product_id)?.title || 'Figura';
          const isApproved = r.status === 'approved';
          
          return `
            <div class="review-item" style="background:var(--bg-card); padding:1.25rem; border-radius:10px; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="margin-bottom:0.4rem;">
                  <strong>Review para:</strong> <span style="color:var(--gold-light);">${prodTitle}</span>
                </div>
                <div style="color:var(--gold-light); margin-bottom:0.5rem;">
                  ${drawStarRatingHtml(r.rating)}
                </div>
                <p style="font-size:0.95rem; color:var(--text-primary);">"${r.comment}"</p>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">
                  Estado actual: <span class="status-tag ${r.status}">${r.status}</span>
                </div>
              </div>
              <div>
                ${isApproved ? `
                  <button class="action-btn-small reject" onclick="toggleReviewStatus('${r.id}', false)">Ocultar Review</button>
                ` : `
                  <button class="action-btn-small approve" onclick="toggleReviewStatus('${r.id}', true)">Mostrar Review</button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } 
  
  else if (tab === 'marketing') {
    container.innerHTML = `
      <!-- Coupons Section -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3>Cupones de Descuento Activos</h3>
          <button class="btn-large primary-btn" style="width:auto; padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="openAddCouponModal()">+ Crear Cupón</button>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo Descuento</th>
                <th>Valor</th>
                <th>Compra Mínima</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.coupons.map(c => `
                <tr>
                  <td><strong style="color:var(--gold-light); letter-spacing:0.05em;">${c.code}</strong></td>
                  <td>${c.discount_type === 'percentage' ? 'Porcentaje (%)' : 'Fijo ($USD)'}</td>
                  <td>${c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value.toFixed(2)}`}</td>
                  <td>$${c.min_purchase.toFixed(2)}</td>
                  <td><span class="status-tag ${c.active ? 'approved' : 'rejected'}">${c.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <button class="action-btn-small reject" onclick="toggleCouponStatus('${c.code}')">
                      ${c.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Banners Section -->
      <div class="db-table-card">
        <div class="db-table-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3>Banners Promocionales Home</h3>
          <button class="btn-large primary-btn" style="width:auto; padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="openAddBannerModal()">+ Crear Banner</button>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Título Promoción</th>
                <th>Subtítulo</th>
                <th>Link Destino</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.banners.map(b => `
                <tr>
                  <td><strong>${b.title}</strong></td>
                  <td>${b.subtitle}</td>
                  <td><code>${b.link}</code></td>
                  <td><span class="status-tag ${b.active ? 'approved' : 'rejected'}">${b.active ? 'Activo' : 'Oculto'}</span></td>
                  <td>
                    <button class="action-btn-small reject" onclick="toggleBannerStatus('${b.id}')">
                      ${b.active ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// --- Admin Actions Controllers ---
function approveProduct(prodId, isApprove) {
  const products = db.get('products');
  const index = products.findIndex(p => p.id === prodId);
  if (index > -1) {
    products[index].status = isApprove ? 'approved' : 'rejected';
    db.set('products', products);
    alert(`Producto ${isApprove ? 'Aprobado' : 'Rechazado'} con éxito.`);
    renderAdminDashboard();
  }
}

function approveSeller(sellerId, isApprove) {
  const profiles = db.get('seller_profiles');
  const index = profiles.findIndex(p => p.id === sellerId);
  if (index > -1) {
    profiles[index].approved = isApprove;
    if (isApprove) {
      profiles[index].stripe_connect_id = "acct_Connect_" + Math.random().toString(36).substr(2, 9);
    }
    db.set('seller_profiles', profiles);
    alert(`Vendedor ${isApprove ? 'Aprobado y Cuenta Stripe Connect Asignada' : 'Rechazado'} con éxito.`);
    renderAdminDashboard();
  }
}

function removeProductAdmin(prodId) {
  if (confirm("¿Estás seguro de eliminar este producto del marketplace?")) {
    let products = db.get('products');
    products = products.filter(p => p.id !== prodId);
    db.set('products', products);
    alert("Producto eliminado.");
    renderAdminDashboard();
  }
}

function toggleReviewStatus(reviewId, show) {
  const reviews = db.get('reviews');
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index > -1) {
    reviews[index].status = show ? 'approved' : 'hidden';
    db.set('reviews', reviews);
    alert(`Review ${show ? 'mostrada' : 'ocultada'} con éxito.`);
    renderAdminDashboard();
  }
}

function toggleCouponStatus(code) {
  const coupons = db.get('coupons');
  const index = coupons.findIndex(c => c.code === code);
  if (index > -1) {
    coupons[index].active = !coupons[index].active;
    db.set('coupons', coupons);
    renderAdminDashboard();
  }
}

function toggleBannerStatus(id) {
  const banners = db.get('banners');
  const index = banners.findIndex(b => b.id === id);
  if (index > -1) {
    banners[index].active = !banners[index].active;
    db.set('banners', banners);
    renderAdminDashboard();
  }
}

// --- Create Coupons and Banners Forms ---
function openAddCouponModal() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Código del Cupón</label>
        <input type="text" id="add-coupon-code" placeholder="Ej: VERANO20" style="text-transform:uppercase;">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Tipo Descuento</label>
          <select id="add-coupon-type">
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Fijo ($USD)</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Valor</label>
          <input type="number" id="add-coupon-val" placeholder="20">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Compra Mínima Requerida ($USD)</label>
        <input type="number" id="add-coupon-min" value="30.00">
      </div>
      <button class="btn-large primary-btn" onclick="submitAddCoupon()">Crear Cupón</button>
    </div>
  `;
  toggleGlobalModal(true, "Crear Cupón de Descuento", html);
}

function submitAddCoupon() {
  const code = document.getElementById('add-coupon-code').value.trim().toUpperCase();
  const type = document.getElementById('add-coupon-type').value;
  const val = parseFloat(document.getElementById('add-coupon-val').value) || 0;
  const min = parseFloat(document.getElementById('add-coupon-min').value) || 0;

  if (!code || !val) {
    alert("Ingresa un código de cupón y su valor de descuento.");
    return;
  }

  const coupons = db.get('coupons');
  coupons.push({
    code: code,
    discount_type: type,
    value: val,
    min_purchase: min,
    active: true
  });
  db.set('coupons', coupons);

  toggleGlobalModal(false);
  alert(`¡Cupón ${code} creado correctamente!`);
  renderAdminDashboard();
}

function openAddBannerModal() {
  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Título del Banner</label>
        <input type="text" id="add-banner-title" placeholder="Descuentos Retro">
      </div>
      <div class="checkout-input-wrapper">
        <label>Subtítulo / Mensaje</label>
        <input type="text" id="add-banner-subtitle" placeholder="Obtén 10% en figuras vintage esta semana">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Link Destino (Ej: #category/Anime)</label>
          <input type="text" id="add-banner-link" placeholder="#category/Anime">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen del Banner (URL)</label>
          <input type="text" id="add-banner-img" placeholder="https://images.unsplash.com/...">
        </div>
      </div>
      <button class="btn-large primary-btn" onclick="submitAddBanner()">Crear Banner</button>
    </div>
  `;
  toggleGlobalModal(true, "Crear Banner Publicitario", html);
}

function submitAddBanner() {
  const title = document.getElementById('add-banner-title').value.trim();
  const sub = document.getElementById('add-banner-subtitle').value.trim();
  const link = document.getElementById('add-banner-link').value.trim() || '#';
  const img = document.getElementById('add-banner-img').value.trim() || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80';

  if (!title || !sub) {
    alert("Por favor rellena el título y el subtítulo.");
    return;
  }

  const banners = db.get('banners');
  banners.push({
    id: "ban_" + Date.now(),
    title: title,
    subtitle: sub,
    image: img,
    link: link,
    active: true
  });
  db.set('banners', banners);

  toggleGlobalModal(false);
  alert("¡Banner publicitario creado con éxito!");
  renderAdminDashboard();
}

// --- Admin Store Inventory Creators ---
function openAdminAddProductModal() {
  const categoriesOptions = CATEGORIES.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Título de la figura (Tienda Oficial)</label>
        <input type="text" id="admin-prod-title" placeholder="Ej: WWE Undertaker Retro Series">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Marca</label>
          <input type="text" id="admin-prod-brand" placeholder="Hasbro, Mattel, etc.">
        </div>
        <div class="checkout-input-wrapper">
          <label>Categoría</label>
          <select id="admin-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Condición</label>
          <select id="admin-prod-condition">
            <option value="Sellado">Sellado</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Cantidad (Stock)</label>
          <input type="number" id="admin-prod-stock" value="5">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="admin-prod-price" placeholder="59.99">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen (URL)</label>
          <input type="text" id="admin-prod-img" placeholder="https://images.unsplash.com/...">
        </div>
      </div>
      
      <!-- eBay Referral settings -->
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>¿Es venta externa en eBay?</label>
          <select id="admin-prod-isebay" onchange="toggleAdminEbayInput(this.value)">
            <option value="false">No (Venta interna local)</option>
            <option value="true">Sí (Redirigir a eBay)</option>
          </select>
        </div>
        <div class="checkout-input-wrapper" id="admin-ebay-url-wrapper" style="display:none;">
          <label>eBay URL de Compra</label>
          <input type="text" id="admin-prod-ebayurl" placeholder="https://www.ebay.com/itm/...">
        </div>
      </div>
      
      <div class="checkout-input-wrapper">
        <label>Descripción detallada</label>
        <textarea class="form-textarea" id="admin-prod-desc" placeholder="Descripción física..."></textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAdminAddProduct()">Publicar al Instante</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Agregar Producto Oficial al Catálogo", formHtml);
}

function toggleAdminEbayInput(val) {
  const el = document.getElementById('admin-ebay-url-wrapper');
  el.style.display = val === 'true' ? 'block' : 'none';
}

function submitAdminAddProduct() {
  const title = document.getElementById('admin-prod-title').value.trim();
  const brand = document.getElementById('admin-prod-brand').value.trim();
  const category = document.getElementById('admin-prod-category').value;
  const condition = document.getElementById('admin-prod-condition').value;
  const stock = parseInt(document.getElementById('admin-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('admin-prod-price').value) || 0.00;
  const imgUrl = document.getElementById('admin-prod-img').value.trim() || 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
  const isEbay = document.getElementById('admin-prod-isebay').value === 'true';
  const ebayUrl = document.getElementById('admin-prod-ebayurl').value.trim();
  const desc = document.getElementById('admin-prod-desc').value.trim();

  if (!title || !brand || !price || !desc) {
    alert("Por favor rellena los campos principales.");
    return;
  }
  if (isEbay && !ebayUrl) {
    alert("Debes proporcionar el enlace de eBay si activas la venta externa.");
    return;
  }

  const products = db.get('products');
  const media = db.get('product_media');
  
  const newProdId = "prod_" + Date.now();
  const newProd = {
    id: newProdId,
    seller_id: "usr_admin_1", // Published under admin store directly
    title: title,
    description: desc,
    brand: brand,
    category: category,
    condition: condition,
    price: price,
    stock: stock,
    status: "approved", // Admin items are automatically approved!
    ebay_url: isEbay ? ebayUrl : "",
    is_external_ebay: isEbay,
    created_at: new Date().toISOString()
  };

  products.push(newProd);
  db.set('products', products);

  // Add media
  const newMedia = {
    id: "med_" + Date.now(),
    product_id: newProdId,
    media_url: imgUrl,
    media_type: "image"
  };
  media.push(newMedia);
  db.set('product_media', media);

  toggleGlobalModal(false);
  alert("¡Producto de la tienda oficial publicado con éxito!");
  renderAdminDashboard();
}

function openAdminEditProductModal(prodId) {
  const products = db.get('products');
  const media = db.get('product_media');
  
  const p = products.find(prod => prod.id === prodId);
  const pMed = media.find(m => m.product_id === prodId);
  if (!p) return;

  const categoriesOptions = CATEGORIES.slice(1).map(cat => `
    <option value="${cat}" ${p.category === cat ? 'selected' : ''}>${cat}</option>
  `).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Título de la figura</label>
        <input type="text" id="adm-edit-title" value="${p.title}">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Marca</label>
          <input type="text" id="adm-edit-brand" value="${p.brand}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Categoría</label>
          <select id="adm-edit-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Condición</label>
          <select id="adm-edit-condition">
            <option value="Sellado" ${p.condition === 'Sellado' ? 'selected' : ''}>Sellado</option>
            <option value="Nuevo" ${p.condition === 'Nuevo' ? 'selected' : ''}>Nuevo</option>
            <option value="Usado" ${p.condition === 'Usado' ? 'selected' : ''}>Usado</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Cantidad (Stock)</label>
          <input type="number" id="adm-edit-stock" value="${p.stock}">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="adm-edit-price" value="${p.price}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen (URL)</label>
          <input type="text" id="adm-edit-img" value="${pMed ? pMed.media_url : ''}">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Descripción detallada</label>
        <textarea class="form-textarea" id="adm-edit-desc">${p.description}</textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAdminEditProduct('${p.id}')">Guardar Cambios Catálogo</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Editar Producto como Administrador", formHtml);
}

function submitAdminEditProduct(productId) {
  const title = document.getElementById('adm-edit-title').value.trim();
  const brand = document.getElementById('adm-edit-brand').value.trim();
  const category = document.getElementById('adm-edit-category').value;
  const condition = document.getElementById('adm-edit-condition').value;
  const stock = parseInt(document.getElementById('adm-edit-stock').value) || 0;
  const price = parseFloat(document.getElementById('adm-edit-price').value) || 0.00;
  const imgUrl = document.getElementById('adm-edit-img').value.trim();
  const desc = document.getElementById('adm-edit-desc').value.trim();

  const products = db.get('products');
  const media = db.get('product_media');
  
  const pIndex = products.findIndex(p => p.id === productId);
  if (pIndex > -1) {
    products[pIndex].title = title;
    products[pIndex].brand = brand;
    products[pIndex].category = category;
    products[pIndex].condition = condition;
    products[pIndex].stock = stock;
    products[pIndex].price = price;
    products[pIndex].description = desc;
    // Keeping status approved when edited by admin directly
    products[pIndex].status = "approved"; 

    db.set('products', products);

    if (imgUrl) {
      const mIndex = media.findIndex(m => m.product_id === productId);
      if (mIndex > -1) {
        media[mIndex].media_url = imgUrl;
      } else {
        media.push({
          id: "med_" + Date.now(),
          product_id: productId,
          media_url: imgUrl,
          media_type: "image"
        });
      }
      db.set('product_media', media);
    }

    toggleGlobalModal(false);
    alert("¡Cambios aplicados exitosamente en el catálogo!");
    renderAdminDashboard();
  }
}
