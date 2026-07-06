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
  const shipments = db.get('shipments').filter(s => s.seller_id === state.currentUser.id);

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
          <a class="db-menu-item ${window.activeSellerTab === 'shipping' ? 'active' : ''}" onclick="setSellerTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            Envíos y Etiquetas (${shipments.length})
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
    orderItems,
    shipments
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
          <div class="stat-card-title">Fondos Retenidos (Custodia Stripe)</div>
          <div class="stat-card-value" style="color:#d97706;">$${data.pendingPayouts.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">Retenido hasta entrega verificada</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">Comisiones Cobradas</div>
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

      <!-- sales history chart -->
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

      <div class="db-table-card" style="margin-top:1.5rem;">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Marca / Cat</th>
                <th>Condición</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Dimensiones / Peso</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerProducts.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem;">No tienes figuras publicadas aún. Presiona "Publicar Figura" para comenzar.</td>
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
                    <td style="font-size:0.8rem; color:var(--text-secondary);">
                      ${p.weight || 8} oz<br>${p.length || 6}"x${p.width || 5}"x${p.height || 4}"
                    </td>
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

  else if (tab === 'shipping') {
    // Shippo panel implementation
    const evidenceLogs = db.get('package_evidence');

    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <h3>Envíos y Etiquetas (Shippo Integrado)</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          Genera etiquetas de envío, sube fotos del empaque y administra los trackings para liberar tus fondos de Stripe Connect.
        </p>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>ID Orden / Fecha</th>
                <th>Destinatario</th>
                <th>Carrier / Tarifa</th>
                <th>Código de Tracking</th>
                <th>Seguro / Frágil</th>
                <th>Evidencia Empaque</th>
                <th>Estado Envío</th>
                <th>Gestión</th>
              </tr>
            </thead>
            <tbody>
              ${data.shipments.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); font-style:italic;">No tienes envíos registrados aún.</td>
                </tr>
              ` : data.shipments.map(s => {
                const evidence = evidenceLogs.find(ev => ev.shipment_id === s.id);
                const isPaidOrder = db.get('orders').find(o => o.id === s.order_id)?.payment_status === 'paid';
                
                return `
                  <tr>
                    <td>
                      <code>${s.order_id}</code>
                      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">${new Date(s.created_at).toLocaleDateString()}</div>
                    </td>
                    <td>${db.get('shipping_addresses').find(a => a.user_id === s.buyer_id)?.name || 'Comprador'}</td>
                    <td>
                      <strong>${s.carrier}</strong>
                      <div style="font-size:0.75rem; color:var(--text-secondary);">${s.service_level}</div>
                      <div style="font-size:0.8rem; font-weight:700; color:var(--gold-light); margin-top:0.15rem;">$${s.shipping_cost.toFixed(2)}</div>
                    </td>
                    <td>
                      ${s.tracking_number ? `
                        <a href="${s.tracking_url}" target="_blank" style="color:var(--primary-light); font-weight:600; text-decoration:underline;">
                          <code>${s.tracking_number}</code>
                        </a>
                      ` : '<span style="color:var(--text-muted);">Sin generar</span>'}
                    </td>
                    <td>
                      <div style="font-size:0.8rem;">
                        ${s.insurance_amount > 0 ? `🛡️ Seguro ($${s.insurance_amount.toFixed(2)})` : '❌ Sin seguro'}<br>
                        ${db.get('orders').find(o => o.id === s.order_id)?.total_amount > 100 ? '⚠️ Valor alto (>100)' : ''}
                      </div>
                    </td>
                    <td id="evidence-td-${s.id}">
                      ${evidence ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                          <img src="${evidence.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1.5px solid var(--border-metallic-yellow);" onclick="viewEvidencePhoto('${evidence.image_url}')">
                          <span style="font-size:0.6rem; color:#10b981; font-weight:700;">REGISTRADA</span>
                        </div>
                      ` : `
                        <button class="action-btn-small suspend" style="padding:0.2rem 0.4rem; font-size:0.7rem;" onclick="openUploadEvidenceModal('${s.id}')">
                          📸 Subir Foto
                        </button>
                      `}
                    </td>
                    <td>
                      <span class="status-tag ${s.status === 'delivered' ? 'approved' : s.status === 'label_generado' ? 'pending' : 'disputed'}" style="font-size:0.75rem; text-transform:uppercase;">
                        ${s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style="display:flex; flex-direction:column; gap:0.4rem;">
                      <button class="action-btn-small approve" onclick="openLabelPrint('${s.id}')">
                        🖨️ Imprimir Label
                      </button>
                      
                      ${s.status === 'label_generado' ? `
                        <button class="action-btn-small suspend" style="background:#4f46e5; border-color:#4f46e5;" onclick="triggerDeliverToCarrier('${s.id}')">
                          🚚 Entregar al Carrier
                        </button>
                      ` : ''}

                      ${s.status === 'entregado_al_carrier' ? `
                        <button class="action-btn-small approve" style="background:#f59e0b; border-color:#f59e0b;" onclick="triggerSimulateTransit('${s.id}')">
                          📡 Simular En Tránsito
                        </button>
                      ` : ''}

                      ${s.status === 'en_transito' ? `
                        <button class="action-btn-small approve" style="background:#10b981; border-color:#10b981;" onclick="triggerSimulateDelivery('${s.id}')">
                          🎯 Simular Entregado
                        </button>
                      ` : ''}

                      <div style="font-size:0.65rem; color:var(--text-muted); text-align:center; max-width:100px; margin-top:0.25rem;">
                        ${s.status !== 'delivered' ? '🔒 Custodia Stripe Connect Activa' : '🔓 Fondos Liberados'}
                      </div>
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
              </tr>
            </thead>
            <tbody>
              ${data.sellerOrders.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:3rem;">No has recibido órdenes de compra todavía.</td>
                </tr>
              ` : data.sellerOrders.map(o => {
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
                    <td style="font-weight:600; color:#10b981;">$${o.seller_payout.toFixed(2)}</td>
                    <td><span class="status-tag ${o.order_status}">${o.order_status}</span></td>
                    <td>
                      ${o.tracking_number ? `
                        <span style="font-size:0.8rem;"><code>${o.tracking_number}</code> (${o.shipping_carrier})</span>
                      ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Label Pendiente</span>'}
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
      <div style="margin-bottom:1.5rem;">
        <h3>Administración de Suscripción</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          Tu plan de suscripción actual determina tu límite de publicaciones y la tasa de comisión retenida por COLLECT X.
        </p>
      </div>

      <div class="subscription-plans-grid">
        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Free' ? 'active' : ''}">
          <div class="plan-price">Gratis</div>
          <h4 style="margin: 0.5rem 0;">Plan Basic Free</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Comisión por venta: <strong>12%</strong></p>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Límite: Hasta 10 publicaciones de figuras.</p>
          <button class="btn-large secondary-btn" style="margin-top:1.5rem;" ${data.sellerProf.subscription_plan === 'Free' ? 'disabled' : ''} onclick="updateSellerPlan('Free')">
            ${data.sellerProf.subscription_plan === 'Free' ? 'Plan Activo' : 'Bajar a Free'}
          </button>
        </div>

        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Pro' ? 'active' : ''}" style="border-color:var(--border-metallic-yellow);">
          <div class="plan-price">$9.99<span style="font-size:0.8rem; font-weight:normal;">/mes</span></div>
          <h4 style="margin: 0.5rem 0; display:flex; align-items:center; gap:0.4rem;">
            Plan Pro Collector
          </h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Comisión por venta: <strong>10%</strong></p>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Límite: Hasta 100 publicaciones de figuras.</p>
          <button class="btn-large primary-btn" style="margin-top:1.5rem;" ${data.sellerProf.subscription_plan === 'Pro' ? 'disabled' : ''} onclick="updateSellerPlan('Pro')">
            ${data.sellerProf.subscription_plan === 'Pro' ? 'Plan Activo' : 'Mejorar a Pro'}
          </button>
        </div>

        <div class="sub-plan-card ${data.sellerProf.subscription_plan === 'Elite' ? 'active' : ''}">
          <div class="plan-price">$19.99<span style="font-size:0.8rem; font-weight:normal;">/mes</span></div>
          <h4 style="margin: 0.5rem 0;">Plan Elite Store</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Comisión por venta: <strong>8%</strong> (Mínima comisión)</p>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.4;">Límite: Publicaciones de figuras ilimitadas.</p>
          <button class="btn-large primary-btn" style="margin-top:1.5rem;" ${data.sellerProf.subscription_plan === 'Elite' ? 'disabled' : ''} onclick="updateSellerPlan('Elite')">
            ${data.sellerProf.subscription_plan === 'Elite' ? 'Plan Activo' : 'Mejorar a Elite'}
          </button>
        </div>
      </div>
    `;
  }
}

// Open label print mock overlay
function openLabelPrint(shipmentId) {
  const shipments = db.get('shipments');
  const s = shipments.find(sh => sh.id === shipmentId);
  if (!s) return;

  const order = db.get('orders').find(o => o.id === s.order_id);
  const buyerAddress = db.get('shipping_addresses').find(a => a.user_id === s.buyer_id);
  const sellerAddress = db.get('shipping_addresses').find(a => a.user_id === s.seller_id) || db.get('shipping_addresses').find(a => a.user_id === "usr_admin_1");

  const printHtml = `
    <div style="background:white; color:black; padding:1.5rem; border:2px solid black; font-family:'Courier New', monospace; font-size:0.85rem; max-width:400px; margin:0 auto; line-height:1.3; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
      <!-- Top header -->
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid black; padding-bottom:0.5rem; margin-bottom:0.5rem;">
        <span style="font-weight:bold; font-size:1.1rem;">${s.carrier} SHIPPING</span>
        <span style="font-weight:bold;">${s.service_level.toUpperCase()}</span>
      </div>
      
      <!-- Sender / Receiver addresses -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; border-bottom:1px solid black; padding-bottom:0.5rem; margin-bottom:0.5rem;">
        <div>
          <strong style="font-size:0.7rem; display:block;">FROM:</strong>
          <strong>${sellerAddress.name}</strong><br>
          ${sellerAddress.street}<br>
          ${sellerAddress.city}, ${sellerAddress.state} ${sellerAddress.zip}
        </div>
        <div>
          <strong style="font-size:0.7rem; display:block;">TO:</strong>
          <strong>${buyerAddress.name}</strong><br>
          ${buyerAddress.street}<br>
          ${buyerAddress.city}, ${buyerAddress.state} ${buyerAddress.zip}
        </div>
      </div>

      <!-- Parcel value / weight -->
      <div style="border-bottom:1px solid black; padding-bottom:0.5rem; margin-bottom:0.5rem; font-size:0.75rem;">
        <strong>ORDEN ID:</strong> ${s.order_id} | <strong>SEGURO VALOR:</strong> $${order ? order.total_amount.toFixed(2) : '100.00'}<br>
        <strong>TRACKING:</strong> ${s.tracking_number}
      </div>

      <!-- Barcode simulator -->
      <div style="text-align:center; padding:1.5rem 0; border-bottom:2px solid black; margin-bottom:0.5rem;">
        <div style="font-size:2.5rem; letter-spacing: 0.1em; font-weight:bold; line-height:1; user-select:none;">||||| | ||||| | |||</div>
        <div style="font-size:0.7rem; font-weight:bold; margin-top:0.3rem;">(01) 9876543210123 (${s.carrier})</div>
      </div>

      <!-- Print layout buttons -->
      <div style="display:flex; justify-content:center; gap:0.5rem; margin-top:1.5rem; font-family:var(--font-body);">
        <button class="action-btn-small approve" onclick="window.print()" style="font-size:0.85rem; padding:0.5rem 1rem;">🖨️ Imprimir</button>
        <button class="action-btn-small reject" onclick="toggleGlobalModal(false)" style="font-size:0.85rem; padding:0.5rem 1rem;">Cerrar</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, "Impresión de Etiqueta Shippo API", printHtml);
}

// Upload Evidence photo
function openUploadEvidenceModal(shipmentId) {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:1.2rem; align-items:center; text-align:center;">
      <i data-lucide="camera" style="width:3rem; height:3rem; color:var(--border-metallic-yellow); opacity:0.7;"></i>
      <div>
        <h4>Sube la foto del paquete sellado</h4>
        <p style="color:var(--text-secondary); font-size:0.8rem; margin-top:0.25rem;">
          Toma una foto donde se aprecie el embalaje, el protector de burbujas (si es frágil) y la etiqueta Shippo pegada.
        </p>
      </div>

      <div style="width:100%; border: 1.5px dashed var(--border-color); border-radius:8px; padding: 2rem; background:#fafafa; display:flex; flex-direction:column; gap:1rem; align-items:center;">
        <button class="btn-large secondary-btn" style="width:auto; font-size:0.85rem;" onclick="simulatePackageCameraCapture('${shipmentId}')">
          📸 Capturar con Cámara / Subir Archivo
        </button>
        <span style="font-size:0.75rem; color:var(--text-muted);">Formatos admitidos: JPG, PNG. Máx 5MB</span>
      </div>
    </div>
  `;
  toggleGlobalModal(true, "Registrar Evidencia de Empaque (Reglas del Coleccionista)", bodyHtml);
}

function simulatePackageCameraCapture(shipmentId) {
  // Mock image capture by using an active Unsplash box shipping image
  const mockImages = [
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&auto=format&fit=crop&q=80"
  ];
  const selectedImage = mockImages[Math.floor(Math.random() * mockImages.length)];

  const evidenceLogs = db.get('package_evidence');
  const newEvId = "ev_" + Date.now();
  const newEv = {
    id: newEvId,
    shipment_id: shipmentId,
    seller_id: state.currentUser.id,
    image_url: selectedImage,
    created_at: new Date().toISOString()
  };

  evidenceLogs.push(newEv);
  db.set('package_evidence', evidenceLogs);

  toggleGlobalModal(false);
  alert("📸 ¡Evidencia de empaque guardada con éxito! El sistema ahora te permitirá entregar la orden al carrier.");
  renderSellerDashboard();
}

function viewEvidencePhoto(imgUrl) {
  const bodyHtml = `
    <div style="text-align:center;">
      <img src="${imgUrl}" style="max-width:100%; max-height:400px; border-radius:8px; border:2px solid var(--border-metallic-yellow); object-fit:contain;">
      <button class="btn-large secondary-btn" style="margin-top:1.5rem; width:auto; padding: 0.5rem 1rem;" onclick="toggleGlobalModal(false)">Cerrar</button>
    </div>
  `;
  toggleGlobalModal(true, "Evidencia de Empaque del Paquete", bodyHtml);
}

// Carrier transitions
function triggerDeliverToCarrier(shipmentId) {
  const evidenceLogs = db.get('package_evidence');
  const hasEvidence = evidenceLogs.some(ev => ev.shipment_id === shipmentId);

  if (!hasEvidence) {
    alert("⚠️ REGLA DE COLECCIONABLES: Debes subir una foto de evidencia del empaque antes de marcar el paquete como entregado al transportista.");
    return;
  }

  shippoAPI.updateShipmentStatus(shipmentId, "entregado_al_carrier");
  alert("🚚 El paquete ha sido marcado como entregado al carrier. El tracking se ha activado.");
  renderSellerDashboard();
}

function triggerSimulateTransit(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "en_transito");
  alert("📡 En tránsito. El paquete está siendo transportado al destino final.");
  renderSellerDashboard();
}

function triggerSimulateDelivery(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  alert("🎯 Paquete entregado. El tracking ha marcado entrega exitosa. El saldo ha sido liberado de la custodia.");
  renderSellerDashboard();
}

// Plan Upgrade
function updateSellerPlan(planName) {
  const profiles = db.get('seller_profiles');
  const subs = db.get('seller_subscriptions');
  const sIdx = profiles.findIndex(p => p.user_id === state.currentUser.id);
  
  if (sIdx > -1) {
    let rate = 0.10;
    let price = 9.99;
    if (planName === 'Free') { rate = 0.12; price = 0.00; }
    if (planName === 'Elite') { rate = 0.08; price = 19.99; }

    profiles[sIdx].subscription_plan = planName;
    profiles[sIdx].commission_rate = rate;
    db.set('seller_profiles', profiles);

    // Create sub log
    const newSub = {
      id: "sub_" + Date.now(),
      seller_id: state.currentUser.id,
      plan_name: planName,
      monthly_price: price,
      commission_rate: rate,
      status: "active",
      start_date: new Date().toISOString(),
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    subs.push(newSub);
    db.set('seller_subscriptions', subs);

    alert(`¡Tu plan ha sido cambiado exitosamente a ${planName}! La comisión ahora es del ${(rate * 100).toFixed(0)}%.`);
    renderSellerDashboard();
  }
}

// Open add/edit modal actions
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
      
      <!-- Shippo Parcel Dimensions & Collectibles Rules -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0.75rem; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          Configuración de Paquete Shippo (Envío)
        </h4>
        <div class="checkout-form-group" style="margin-bottom:0.5rem;">
          <div class="checkout-input-wrapper">
            <label>Peso (oz)</label>
            <input type="number" id="frm-prod-weight" value="16">
          </div>
          <div class="checkout-input-wrapper">
            <label>Largo (in)</label>
            <input type="number" id="frm-prod-length" value="8">
          </div>
          <div class="checkout-input-wrapper">
            <label>Ancho (in)</label>
            <input type="number" id="frm-prod-width" value="6">
          </div>
          <div class="checkout-input-wrapper">
            <label>Alto (in)</label>
            <input type="number" id="frm-prod-height" value="4">
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
          <label style="display:flex; align-items:center; gap:0.4rem;">
            <input type="checkbox" id="frm-prod-fragile">
            <span>Marcar como artículo frágil (Recomienda embalaje y transportista premium)</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem;">
            <input type="checkbox" id="frm-prod-insurance">
            <span>Requerir Seguro del paquete (Auto-activado si cuesta > $100)</span>
          </label>
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
  lucide.createIcons();
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

  // Shipping inputs
  const weight = parseFloat(document.getElementById('frm-prod-weight').value) || 16;
  const length = parseFloat(document.getElementById('frm-prod-length').value) || 8;
  const width = parseFloat(document.getElementById('frm-prod-width').value) || 6;
  const height = parseFloat(document.getElementById('frm-prod-height').value) || 4;
  const fragile = document.getElementById('frm-prod-fragile').checked;
  const insurance = document.getElementById('frm-prod-insurance').checked || (price > 100);

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
    created_at: new Date().toISOString(),
    
    // Shipping configs
    weight: weight,
    length: length,
    width: width,
    height: height,
    fragile: fragile,
    insurance_required: insurance,
    declared_value: price,
    shipping_origin_address_id: "addr_seller_1" // Maps to default
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

      <!-- Shippo Parcel Dimensions & Collectibles Rules -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0.75rem; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          Configuración de Paquete Shippo (Envío)
        </h4>
        <div class="checkout-form-group" style="margin-bottom:0.5rem;">
          <div class="checkout-input-wrapper">
            <label>Peso (oz)</label>
            <input type="number" id="edit-prod-weight" value="${p.weight || 16}">
          </div>
          <div class="checkout-input-wrapper">
            <label>Largo (in)</label>
            <input type="number" id="edit-prod-length" value="${p.length || 8}">
          </div>
          <div class="checkout-input-wrapper">
            <label>Ancho (in)</label>
            <input type="number" id="edit-prod-width" value="${p.width || 6}">
          </div>
          <div class="checkout-input-wrapper">
            <label>Alto (in)</label>
            <input type="number" id="edit-prod-height" value="${p.height || 4}">
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
          <label style="display:flex; align-items:center; gap:0.4rem;">
            <input type="checkbox" id="edit-prod-fragile" ${p.fragile ? 'checked' : ''}>
            <span>Marcar como artículo frágil</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem;">
            <input type="checkbox" id="edit-prod-insurance" ${p.insurance_required ? 'checked' : ''}>
            <span>Requerir Seguro del paquete</span>
          </label>
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
  lucide.createIcons();
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

  // Shipping
  const weight = parseFloat(document.getElementById('edit-prod-weight').value) || 16;
  const length = parseFloat(document.getElementById('edit-prod-length').value) || 8;
  const width = parseFloat(document.getElementById('edit-prod-width').value) || 6;
  const height = parseFloat(document.getElementById('edit-prod-height').value) || 4;
  const fragile = document.getElementById('edit-prod-fragile').checked;
  const insurance = document.getElementById('edit-prod-insurance').checked;

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
    
    // Shipping configurations
    products[pIndex].weight = weight;
    products[pIndex].length = length;
    products[pIndex].width = width;
    products[pIndex].height = height;
    products[pIndex].fragile = fragile;
    products[pIndex].insurance_required = insurance;
    products[pIndex].declared_value = price;
    
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
