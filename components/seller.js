// collectors-market/components/seller.js

function renderSellerDashboard() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const users = db.get('users');
  const products = db.get('products');
  const profiles = db.get('seller_profiles');
  const orders = db.get('orders');
  const orderItems = db.get('order_items');
  const transactions = db.get('transactions');
  const reviews = db.get('reviews');

  const sellerUser = state.currentUser;
  const sellerProf = profiles.find(p => p.user_id === sellerUser.id);

  if (!sellerProf) {
    viewport.innerHTML = `
      <div class="section-container" style="text-align:center; padding:5rem 0;">
        <h2>Tu perfil de vendedor está pendiente de aprobación</h2>
        <p style="color:var(--text-secondary); margin-top:1rem;">El administrador está revisando tu cuenta. Te notificaremos una vez aprobada.</p>
        <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">Ir al Marketplace</button>
      </div>
    `;
    return;
  }

  // Active sub-section tab inside dashboard
  if (!window.activeSellerTab) window.activeSellerTab = 'overview';

  // Calculate statistics for this seller
  const sellerProducts = products.filter(p => p.seller_id === sellerUser.id);
  const activeProducts = sellerProducts.filter(p => p.status === 'approved');
  const pendingProducts = sellerProducts.filter(p => p.status === 'pending');
  
  const sellerOrders = orders.filter(o => o.seller_id === sellerUser.id);
  const sellerTransactions = transactions.filter(t => t.seller_id === sellerUser.id);
  
  // Money calculations
  const totalSales = sellerOrders.reduce((sum, o) => o.payment_status === 'paid' ? sum + o.total_amount : sum, 0);
  const commissionsPaid = sellerOrders.reduce((sum, o) => sum + o.platform_fee, 0);
  
  // Pending money (orders paid but not delivered yet)
  const pendingPayouts = sellerOrders.reduce((sum, o) => {
    if (o.order_status !== 'delivered' && o.order_status !== 'cancelled' && o.order_status !== 'refunded') {
      return sum + o.seller_payout;
    }
    return sum;
  }, 0);

  // Reviews for this seller
  const sellerReviews = reviews.filter(r => r.seller_id === sellerUser.id);

  // Render Shell structure
  viewport.innerHTML = `
    <div class="section-container">
      <div style="margin-bottom: 1.5rem;">
        <h2 class="section-title">Panel del Vendedor</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">
          Gestiona tu tienda: <strong>${sellerProf.store_name}</strong> | Plan: <span class="status-tag approved" style="font-weight:700;">${sellerProf.subscription_plan}</span>
        </p>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeSellerTab === 'overview' ? 'active' : ''}" onclick="setSellerTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            Resumen Financiero
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'products' ? 'active' : ''}" onclick="setSellerTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
            Mis Productos (${sellerProducts.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'orders' ? 'active' : ''}" onclick="setSellerTab('orders')">
            <i data-lucide="truck" style="width:1.05rem;height:1.05rem;"></i>
            Órdenes Recibidas (${sellerOrders.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'reviews' ? 'active' : ''}" onclick="setSellerTab('reviews')">
            <i data-lucide="star" style="width:1.05rem;height:1.05rem;"></i>
            Valoraciones (${sellerReviews.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'subscription' ? 'active' : ''}" onclick="setSellerTab('subscription')">
            <i data-lucide="credit-card" style="width:1.05rem;height:1.05rem;"></i>
            Mi Suscripción
          </a>
        </aside>

        <!-- Sub-section Render Viewport -->
        <main class="dashboard-content" id="seller-db-content">
          <!-- Dynamically loaded below -->
        </main>
      </div>
    </div>
  `;

  // Render active tab inside dashboard
  renderSellerSubTab(window.activeSellerTab, {
    sellerProf,
    activeProducts,
    pendingProducts,
    sellerProducts,
    sellerOrders,
    totalSales,
    commissionsPaid,
    pendingPayouts,
    sellerReviews,
    orderItems
  });

  lucide.createIcons();
}

function setSellerTab(tabName) {
  window.activeSellerTab = tabName;
  renderSellerDashboard();
}

// --- Render Seller Sub-Tabs ---
function renderSellerSubTab(tab, data) {
  const container = document.getElementById('seller-db-content');
  if (!container) return;

  if (tab === 'overview') {
    container.innerHTML = `
      <!-- Stats Cards -->
      <div class="stat-cards-grid">
        <div class="stat-card">
          <div class="stat-card-title">Ventas Totales Brutas</div>
          <div class="stat-card-value">$${data.totalSales.toFixed(2)}</div>
          <div class="stat-card-change up">Ingresos totales facturados</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Fondos Pendientes (Garantía)</div>
          <div class="stat-card-value" style="color:var(--gold-light);">$${data.pendingPayouts.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">En tránsito o preparando envío</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Comisiones Plataforma (Cobrado)</div>
          <div class="stat-card-value" style="color:var(--primary-light);">$${data.commissionsPaid.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">Tasa de comisión activa: ${(data.sellerProf.commission_rate * 100).toFixed(0)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Límite de Productos</div>
          <div class="stat-card-value">
            ${data.sellerProf.subscription_plan === 'Free' ? `${data.sellerProducts.length} / 10` : 
              data.sellerProf.subscription_plan === 'Pro' ? `${data.sellerProducts.length} / 100` : 
              'Ilimitado'}
          </div>
          <div class="stat-card-change" style="color:var(--text-secondary);">Depende de tu plan de suscripción</div>
        </div>
      </div>

      <!-- sales history chart or summary table -->
      <div class="db-table-card">
        <div class="db-table-header">
          <h3>Historial de Transacciones Recientes (Stripe Connect)</h3>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>ID Transacción</th>
                <th>Fecha</th>
                <th>Bruto</th>
                <th>Comisión Plataforma</th>
                <th>Neto Stripe Connect</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${db.get('transactions').filter(t => t.seller_id === state.currentUser.id).length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem;">No se registran transacciones de pago aún.</td>
                </tr>
              ` : db.get('transactions').filter(t => t.seller_id === state.currentUser.id).map(t => `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td>${new Date(t.created_at).toLocaleDateString()}</td>
                  <td>$${t.gross_amount.toFixed(2)}</td>
                  <td>-$${t.platform_fee.toFixed(2)}</td>
                  <td style="color:#34d399; font-weight:600;">$${t.seller_net.toFixed(2)}</td>
                  <td><span class="status-tag approved">${t.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'products') {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3>Inventario de Figuras (${data.sellerProducts.length})</h3>
        <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem;" onclick="openAddProductModal()">
          <i data-lucide="plus"></i> Publicar Figura
        </button>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Figura</th>
                <th>Marca / Categoría</th>
                <th>Condición</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado Aprobación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerProducts.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding:3rem;">No tienes figuras publicadas aún. Presiona "Publicar Figura" para comenzar.</td>
                </tr>
              ` : data.sellerProducts.map(p => {
                const condClass = p.condition.toLowerCase().replace(/\s+/g, '');
                return `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${p.brand} / <span style="font-size:0.8rem; color:var(--text-muted);">${p.category}</span></td>
                    <td><span class="condition-badge ${condClass}" style="position:static;">${p.condition}</span></td>
                    <td style="font-weight:600; color:var(--text-primary);">$${p.price.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td>
                      <span class="status-tag ${p.status}">
                        ${p.status === 'approved' ? 'Aprobado' : p.status === 'pending' ? 'Pendiente Admin' : p.status === 'rejected' ? 'Rechazado' : 'Agotado'}
                      </span>
                    </td>
                    <td>
                      <button class="action-btn-small suspend" onclick="openEditProductModal('${p.id}')">Editar</button>
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
  
  else if (tab === 'orders') {
    container.innerHTML = `
      <h3>Órdenes Recibidas por Compradores</h3>
      
      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Fecha</th>
                <th>Artículos Comprados</th>
                <th>Monto Payout</th>
                <th>Estado Envío</th>
                <th>Tracking</th>
                <th>Gestión</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerOrders.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding:3rem;">No has recibido órdenes de compra todavía.</td>
                </tr>
              ` : data.sellerOrders.map(o => {
                // Find order items
                const items = data.orderItems.filter(oi => oi.order_id === o.id);
                const productsList = db.get('products');
                
                const itemsDescription = items.map(i => {
                  const p = productsList.find(pr => pr.id === i.product_id);
                  return `${p ? p.title : 'Figura'} (x${i.quantity})`;
                }).join(', ');

                return `
                  <tr>
                    <td><code>${o.id}</code></td>
                    <td>${new Date(o.created_at).toLocaleDateString()}</td>
                    <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsDescription}">
                      ${itemsDescription}
                    </td>
                    <td style="font-weight:600; color:#34d399;">$${o.seller_payout.toFixed(2)}</td>
                    <td><span class="status-tag ${o.order_status}">${o.order_status}</span></td>
                    <td>
                      ${o.tracking_number ? `
                        <span style="font-size:0.8rem;"><code>${o.tracking_number}</code> (${o.shipping_carrier})</span>
                      ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Sin registrar</span>'}
                    </td>
                    <td>
                      ${o.order_status === 'paid' ? `
                        <button class="action-btn-small approve" onclick="openShipOrderModal('${o.id}')">Enviar pedido</button>
                      ` : o.order_status === 'shipped' ? `
                        <button class="action-btn-small suspend" onclick="simulateMarkOrderDelivered('${o.id}')">Marcar Entregado</button>
                      ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Completado</span>'}
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
  
  else if (tab === 'reviews') {
    container.innerHTML = `
      <h3>Valoraciones y Reseñas de tu Tienda</h3>
      <div style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:1rem;">
        Tu promedio de estrellas actual es <strong>${data.sellerProf.rating_average.toFixed(1)} / 5.0</strong>.
      </div>

      <div class="reviews-list">
        ${data.sellerReviews.length === 0 ? `
          <p style="text-align:center; padding: 2rem; color:var(--text-muted); font-style:italic;">Aún no recibes reseñas de compradores.</p>
        ` : data.sellerReviews.map(r => `
          <div class="review-item" style="background:var(--bg-card); padding:1rem; border-radius:8px; border:1px solid var(--border-color);">
            <div class="review-header">
              <span style="font-weight:600; color:var(--text-primary);">ID Compra: <code>${r.id}</code></span>
              <span style="color:var(--text-muted); font-size:0.8rem;">${new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <div style="color:var(--gold-light); margin-bottom:0.5rem;">
              ${drawStarRatingHtml(r.rating)}
            </div>
            <p style="color:var(--text-primary); font-size:0.9rem;">"${r.comment}"</p>
          </div>
        `).join('')}
      </div>
    `;
  } 
  
  else if (tab === 'subscription') {
    container.innerHTML = `
      <h3>Suscripción y Comisión de la Plataforma</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1.5rem;">
        Actualiza tu plan para desbloquear límites de stock y obtener mejores tasas de comisiones por venta.
      </p>

      <div class="subscription-cards-grid">
        <!-- Plan Gratis -->
        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Free' ? 'active' : ''}" onclick="selectSubscriptionPlan('Free')">
          <div class="sub-plan-name">Plan Gratis</div>
          <div class="sub-plan-price">Gratis</div>
          <div class="sub-plan-features">
            <span>Comisión base: <strong>12%</strong></span>
            <span>Hasta 10 productos activos</span>
            <span>Sin distintivo verificado</span>
          </div>
          <button class="btn-large secondary-btn" style="padding:0.4rem; font-size:0.8rem;" ${data.sellerProf.subscription_plan === 'Free' ? 'disabled' : ''}>
            ${data.sellerProf.subscription_plan === 'Free' ? 'Plan Activo' : 'Degradar'}
          </button>
        </div>

        <!-- Plan Pro -->
        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Pro' ? 'active' : ''}" onclick="selectSubscriptionPlan('Pro')">
          <div class="sub-plan-name" style="color:var(--gold-light);">Plan Pro</div>
          <div class="sub-plan-price">$9.99<span style="font-size:0.8rem;color:var(--text-muted);">/mes</span></div>
          <div class="sub-plan-features">
            <span>Comisión base: <strong>10%</strong></span>
            <span>Hasta 100 productos activos</span>
            <span>Badge Vendedor Verificado</span>
          </div>
          <button class="btn-large secondary-btn" style="padding:0.4rem; font-size:0.8rem;" ${data.sellerProf.subscription_plan === 'Pro' ? 'disabled' : ''}>
            ${data.sellerProf.subscription_plan === 'Pro' ? 'Plan Activo' : 'Activar'}
          </button>
        </div>

        <!-- Plan Elite -->
        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Elite' ? 'active' : ''}" onclick="selectSubscriptionPlan('Elite')">
          <div class="sub-plan-name" style="color:#ef4444;">Plan Elite</div>
          <div class="sub-plan-price">$19.99<span style="font-size:0.8rem;color:var(--text-muted);">/mes</span></div>
          <div class="sub-plan-features">
            <span>Comisión base: <strong>8%</strong></span>
            <span>Productos ilimitados</span>
            <span>Badge Premium Destacado</span>
            <span>Mejor posicionamiento</span>
          </div>
          <button class="btn-large secondary-btn" style="padding:0.4rem; font-size:0.8rem;" ${data.sellerProf.subscription_plan === 'Elite' ? 'disabled' : ''}>
            ${data.sellerProf.subscription_plan === 'Elite' ? 'Plan Activo' : 'Activar'}
          </button>
        </div>
      </div>
    `;
  }
}

// --- Subscription Plan Manager ---
function selectSubscriptionPlan(planName) {
  let rate = 0.12;
  if (planName === 'Pro') rate = 0.10;
  if (planName === 'Elite') rate = 0.08;

  const profiles = db.get('seller_profiles');
  const index = profiles.findIndex(p => p.user_id === state.currentUser.id);
  if (index > -1) {
    profiles[index].subscription_plan = planName;
    profiles[index].commission_rate = rate;
    db.set('seller_profiles', profiles);
    
    // Also save subscription logs
    const subs = db.get('seller_subscriptions');
    const newSub = {
      id: "sub_" + Date.now(),
      seller_id: state.currentUser.id,
      plan_name: planName,
      monthly_price: planName === 'Free' ? 0.00 : planName === 'Pro' ? 9.99 : 19.99,
      commission_rate: rate,
      status: "active",
      start_date: new Date().toISOString(),
      renewal_date: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    };
    subs.push(newSub);
    db.set('seller_subscriptions', subs);
    
    alert(`¡Plan de vendedor cambiado con éxito a ${planName}! Tu tasa de comisión ahora es de ${(rate * 100).toFixed(0)}%.`);
    state.refresh();
    renderSellerDashboard();
  }
}

// --- Add / Edit Product Modals ---
function openAddProductModal() {
  const categoriesOptions = CATEGORIES.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Título de la figura</label>
        <input type="text" id="frm-prod-title" placeholder="Ej: Funko Pop Goku (Super Saiyan)">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Marca</label>
          <input type="text" id="frm-prod-brand" placeholder="Funko, Mattel, Bandai, etc.">
        </div>
        <div class="checkout-input-wrapper">
          <label>Categoría</label>
          <select id="frm-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Condición</label>
          <select id="frm-prod-condition">
            <option value="Sellado">Sellado (Caja Perfecta)</option>
            <option value="Nuevo">Nuevo (Abierto para fotos)</option>
            <option value="Usado">Usado (Exhibido)</option>
            <option value="Caja dañada">Caja dañada</option>
            <option value="Sin caja">Sin caja (Figura suelta)</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Cantidad (Stock)</label>
          <input type="number" id="frm-prod-stock" value="1">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="frm-prod-price" placeholder="49.99">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen (URL)</label>
          <input type="text" id="frm-prod-img" placeholder="https://images.unsplash.com/photo-...">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Descripción detallada</label>
        <textarea class="form-textarea" id="frm-prod-desc" placeholder="Estado del empaque, detalles de pintura, etc."></textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAddProduct()">Publicar Figura (Requiere Aprobación)</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Publicar Nueva Figura Coleccionable", formHtml);
}

function submitAddProduct() {
  const title = document.getElementById('frm-prod-title').value.trim();
  const brand = document.getElementById('frm-prod-brand').value.trim();
  const category = document.getElementById('frm-prod-category').value;
  const condition = document.getElementById('frm-prod-condition').value;
  const stock = parseInt(document.getElementById('frm-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('frm-prod-price').value) || 0.00;
  const imgUrl = document.getElementById('frm-prod-img').value.trim() || 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
  const desc = document.getElementById('frm-prod-desc').value.trim();

  if (!title || !brand || !price || !desc) {
    alert("Por favor completa los campos principales (Título, Marca, Precio y Descripción).");
    return;
  }

  const products = db.get('products');
  const media = db.get('product_media');
  
  const newProdId = "prod_" + Date.now();
  const newProd = {
    id: newProdId,
    seller_id: state.currentUser.id,
    title: title,
    description: desc,
    brand: brand,
    category: category,
    condition: condition,
    price: price,
    stock: stock,
    status: "pending", // Always pending admin approval on publishing
    ebay_url: "",
    is_external_ebay: false,
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
  alert("¡Figura publicada con éxito! Queda pendiente de aprobación por el Administrador.");
  renderSellerDashboard();
}

function openEditProductModal(prodId) {
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
        <input type="text" id="edit-prod-title" value="${p.title}">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Marca</label>
          <input type="text" id="edit-prod-brand" value="${p.brand}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Categoría</label>
          <select id="edit-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Condición</label>
          <select id="edit-prod-condition">
            <option value="Sellado" ${p.condition === 'Sellado' ? 'selected' : ''}>Sellado (Caja Perfecta)</option>
            <option value="Nuevo" ${p.condition === 'Nuevo' ? 'selected' : ''}>Nuevo (Abierto para fotos)</option>
            <option value="Usado" ${p.condition === 'Usado' ? 'selected' : ''}>Usado (Exhibido)</option>
            <option value="Caja dañada" ${p.condition === 'Caja dañada' ? 'selected' : ''}>Caja dañada</option>
            <option value="Sin caja" ${p.condition === 'Sin caja' ? 'selected' : ''}>Sin caja (Figura suelta)</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Cantidad (Stock)</label>
          <input type="number" id="edit-prod-stock" value="${p.stock}">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="edit-prod-price" value="${p.price}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen (URL)</label>
          <input type="text" id="edit-prod-img" value="${pMed ? pMed.media_url : ''}">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Descripción detallada</label>
        <textarea class="form-textarea" id="edit-prod-desc">${p.description}</textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitEditProduct('${p.id}')">Guardar Cambios</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Editar Figura Coleccionable", formHtml);
}

function submitEditProduct(productId) {
  const title = document.getElementById('edit-prod-title').value.trim();
  const brand = document.getElementById('edit-prod-brand').value.trim();
  const category = document.getElementById('edit-prod-category').value;
  const condition = document.getElementById('edit-prod-condition').value;
  const stock = parseInt(document.getElementById('edit-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('edit-prod-price').value) || 0.00;
  const imgUrl = document.getElementById('edit-prod-img').value.trim();
  const desc = document.getElementById('edit-prod-desc').value.trim();

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
    
    // Status resets to pending if price/title changes for safety, otherwise remains approved
    products[pIndex].status = "pending"; 

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
    alert("¡Cambios guardados con éxito! El producto volverá a revisión administrativa antes de salir a la venta.");
    renderSellerDashboard();
  }
}

// --- Ship Order Modal ---
function openShipOrderModal(orderId) {
  const modalHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Empresa de Envíos (Carrier)</label>
        <select id="ship-carrier-select">
          <option value="USPS">USPS First Class</option>
          <option value="DHL">DHL Express</option>
          <option value="FedEx">FedEx Home Delivery</option>
          <option value="Estafeta">Estafeta</option>
        </select>
      </div>
      <div class="checkout-input-wrapper">
        <label>Número de Rastreo (Tracking Number)</label>
        <input type="text" id="ship-tracking-input" placeholder="Ej: USPS9876543210" value="USPS${Math.floor(Math.random()*10000000000)}">
      </div>
      <button class="btn-large primary-btn" onclick="submitShipOrder('${orderId}')">Registrar Envío</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Registrar Guía de Envío", modalHtml);
}

function submitShipOrder(orderId) {
  const carrier = document.getElementById('ship-carrier-select').value;
  const tracking = document.getElementById('ship-tracking-input').value.trim();

  if (!tracking) {
    alert("Por favor proporciona el número de rastreo.");
    return;
  }

  const orders = db.get('orders');
  const index = orders.findIndex(o => o.id === orderId);
  if (index > -1) {
    orders[index].order_status = 'shipped';
    orders[index].shipping_carrier = carrier;
    orders[index].tracking_number = tracking;
    db.set('orders', orders);

    toggleGlobalModal(false);
    alert("¡Envío registrado con éxito! Se notificará al comprador.");
    renderSellerDashboard();
  }
}

function simulateMarkOrderDelivered(orderId) {
  const orders = db.get('orders');
  const index = orders.findIndex(o => o.id === orderId);
  if (index > -1) {
    orders[index].order_status = 'delivered';
    db.set('orders', orders);
    alert("¡Orden marcada como Entregada! El dinero pendiente ha sido liberado a tu cuenta de Stripe Connect.");
    renderSellerDashboard();
  }
}
