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
        <h2>${tr('Tu perfil de vendedor está pendiente de aprobación', 'Your seller profile is pending approval')}</h2>
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
        <h2 class="section-title">${tr('Panel del Vendedor', 'Seller Dashboard')}</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">
          Gestiona tu tienda: <strong>${sellerProf.store_name}</strong> | Plan: <span class="status-tag approved" style="font-weight:700;">${sellerProf.subscription_plan}</span>
        </p>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeSellerTab === 'overview' ? 'active' : ''}" onclick="setSellerTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Resumen Financiero', 'Financial Overview')}
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'products' ? 'active' : ''}" onclick="setSellerTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Mis Productos', 'My Products')} (${sellerProducts.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'shipping' ? 'active' : ''}" onclick="setSellerTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Envíos y Etiquetas', 'Shipping & Labels')} (${shipments.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'orders' ? 'active' : ''}" onclick="setSellerTab('orders')">
            <i data-lucide="truck" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Órdenes Recibidas', 'Orders Received')} (${sellerOrders.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'reviews' ? 'active' : ''}" onclick="setSellerTab('reviews')">
            <i data-lucide="star" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Valoraciones', 'Ratings')} (${sellerReviews.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'subscription' ? 'active' : ''}" onclick="setSellerTab('subscription')">
            <i data-lucide="credit-card" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Mi Suscripción', 'My Subscription')}
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

  let stripeAlertHtml = '';
  if (!data.sellerProf.stripe_connect_id) {
    stripeAlertHtml = `
      <div class="alert-info-box" style="background:#fee2e2; border: 1px solid #fecaca; border-radius:8px; padding:1.2rem; margin-bottom:1.5rem; color:#b91c1c; font-family:var(--font-body, sans-serif);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <i data-lucide="shield-alert" style="width:2rem; height:2rem; flex-shrink:0;"></i>
            <div>
              <h4 style="font-weight:700; margin-bottom:0.15rem; color:#b91c1c; margin-top:0;">${tr('Stripe Connect Desconectado', 'Stripe Connect Disconnected')}</h4>
              <p style="font-size:0.8rem; color:#7f1d1d; margin:0;">${tr('Para recibir transferencias bancarias reales por tus ventas, necesitas configurar tus datos de cobro con Stripe.', 'To receive real bank transfers for your sales, you need to configure your payout details with Stripe.')}</p>
            </div>
          </div>
          <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem; background:#b91c1c; border-color:#b91c1c; font-size:0.85rem;" onclick="startStripeOnboarding()">
            <i data-lucide="external-link"></i> ${tr('Vincular Cuenta de Stripe', 'Link Stripe Account')}
          </button>
        </div>
      </div>
    `;
  }

  if (tab === 'overview') {
    container.innerHTML = `
      ${stripeAlertHtml}
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
          <h3>${tr('Historial de Transacciones Recientes (Stripe Connect)', 'Recent Transaction History (Stripe Connect)')}</h3>
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
        <h3>${tr('Inventario de Figuras', 'Figure Inventory')} (${data.sellerProducts.length})</h3>
        <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem;" onclick="openAddProductModal()">
          <i data-lucide="plus"></i> ${tr('Publicar Figura', 'Publish Figure')}
        </button>
      </div>

      <div class="db-table-card" style="margin-top:1.5rem;">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('Título', 'Title')}</th>
                <th>${tr('Marca / Cat', 'Brand / Cat')}</th>
                <th>${tr('Condición', 'Condition')}</th>
                <th>${tr('Precio', 'Price')}</th>
                <th>${tr('Stock', 'Stock')}</th>
                <th>${tr('Dimensiones / Peso', 'Dimensions / Weight')}</th>
                <th>${tr('Estado', 'Status')}</th>
                <th>${tr('Acción', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerProducts.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem;">${tr('No tienes figuras publicadas aún. Presiona "Publicar Figura" para comenzar.', 'You have no figures published yet. Press "Publish Figure" to begin.')}</td>
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
                        ${p.status === 'approved' ? tr('Aprobado', 'Approved') : p.status === 'pending' ? tr('Pendiente Admin', 'Pending Admin') : p.status === 'rejected' ? tr('Rechazado', 'Rejected') : tr('Agotado', 'Sold Out')}
                      </span>
                    </td>
                    <td>
                      <button class="action-btn-small suspend" onclick="openEditProductModal('${p.id}')">${tr('Editar', 'Edit')}</button>
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
      <div style="margin-bottom:1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3>${tr('Rendimiento y Envíos', 'Performance & Shipping')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('Tu índice de confiabilidad determina tu posicionamiento en el marketplace. Mantén tus envíos a tiempo.', 'Your reliability index determines your marketplace ranking. Keep your shipments on time.')}
          </p>
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <div style="background:var(--bg-card); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
            <div style="font-size:2rem; font-weight:800; color: ${data.sellerProf.reliability_score >= 90 ? '#10b981' : data.sellerProf.reliability_score >= 70 ? '#f59e0b' : '#ef4444'};">
              ${data.sellerProf.reliability_score}<span style="font-size:1rem;">/100</span>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${tr('Confiabilidad', 'Reliability')}</div>
              <div style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">
                ${data.sellerProf.reliability_score >= 90 ? tr('Excelente (Prioridad Alta)', 'Excellent (High Priority)') : data.sellerProf.reliability_score >= 70 ? tr('Regular', 'Fair') : tr('En Riesgo', 'At Risk')}
              </div>
            </div>
          </div>
          
          <div style="background:var(--bg-card); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
            <div style="font-size:1.8rem; font-weight:800; color: ${data.sellerProf.active_strikes > 0 ? '#ef4444' : '#10b981'};">
              ${data.sellerProf.active_strikes}
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${tr('Strikes Activos', 'Active Strikes')}</div>
              <div style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">
                ${data.sellerProf.active_strikes >= 4 ? tr('Cuenta Baneada', 'Account Banned') : data.sellerProf.active_strikes >= 3 ? tr('Cuenta Suspendida (30d)', 'Account Suspended (30d)') : data.sellerProf.active_strikes >= 2 ? tr('Creación Bloqueada', 'Creation Blocked') : tr('Cuenta Saludable', 'Healthy Account')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('ID Orden / Fecha', 'Order ID / Date')}</th>
                <th>${tr('Destinatario', 'Recipient')}</th>
                <th>${tr('Carrier / Tarifa', 'Carrier / Rate')}</th>
                <th>${tr('Código de Tracking', 'Tracking Code')}</th>
                <th>${tr('Seguro / Frágil', 'Insurance / Fragile')}</th>
                <th>${tr('Evidencia Empaque', 'Packing Evidence')}</th>
                <th>${tr('Estado Envío', 'Shipping Status')}</th>
                <th>${tr('Gestión', 'Management')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.shipments.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); font-style:italic;">${tr('No tienes envíos registrados aún.', 'You have no registered shipments yet.')}</td>
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
                    <td>${db.get('shipping_addresses').find(a => a.user_id === s.buyer_id)?.name || tr('Comprador', 'Buyer')}</td>
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
                      ` : `<span style="color:var(--text-muted);">${tr('Sin generar', 'Not generated')}</span>`}
                    </td>
                    <td>
                      <div style="font-size:0.8rem;">
                        ${s.insurance_amount > 0 ? `🛡️ ${tr('Seguro', 'Insured')} ($${s.insurance_amount.toFixed(2)})` : `❌ ${tr('Sin seguro', 'No insurance')}`}<br>
                        ${db.get('orders').find(o => o.id === s.order_id)?.total_amount > 100 ? `⚠️ ${tr('Valor alto', 'High value')} (>100)` : ''}
                      </div>
                    </td>
                    <td id="evidence-td-${s.id}">
                      ${evidence ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                          <img src="${evidence.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1.5px solid var(--border-metallic-yellow);" onclick="viewEvidencePhoto('${evidence.image_url}')">
                          <span style="font-size:0.6rem; color:#10b981; font-weight:700;">${tr('REGISTRADA', 'REGISTERED')}</span>
                        </div>
                      ` : `
                        <button class="action-btn-small suspend" style="padding:0.2rem 0.4rem; font-size:0.7rem;" onclick="openUploadEvidenceModal('${s.id}')">
                          📸 ${tr('Subir Foto', 'Upload Photo')}
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
                        🖨️ ${tr('Imprimir Label', 'Print Label')}
                      </button>
                      
                      ${s.status === 'label_generado' ? `
                        <button class="action-btn-small suspend" style="background:#4f46e5; border-color:#4f46e5;" onclick="triggerDeliverToCarrier('${s.id}')">
                          🚚 ${tr('Entregar al Carrier', 'Deliver to Carrier')}
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
      <h3>${tr('Órdenes Recibidas por Compradores', 'Orders Received from Buyers')}</h3>
      
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
                <th>Tracking / Deadline</th>
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
                
                // Calculate compliance time limit
                let deadlineHtml = '';
                if (!o.tracking_number && o.order_status !== 'cancelled' && o.order_status !== 'refunded') {
                  const hoursPassed = Math.abs(new Date() - new Date(o.created_at)) / 36e5;
                  const hoursLeft = 120 - hoursPassed;
                  
                  if (hoursLeft <= 0) {
                    deadlineHtml = `<div style="color:#ef4444; font-size:0.75rem; font-weight:700;">TIEMPO AGOTADO</div>`;
                  } else if (hoursLeft < 48) {
                    deadlineHtml = `<div style="color:#ef4444; font-size:0.75rem; font-weight:700;">EN RIESGO (${Math.floor(hoursLeft)}h restantes)</div>`;
                  } else if (hoursLeft < 72) {
                    deadlineHtml = `<div style="color:#f59e0b; font-size:0.75rem; font-weight:600;">URGENTE (${Math.floor(hoursLeft)}h restantes)</div>`;
                  } else {
                    deadlineHtml = `<div style="color:var(--text-secondary); font-size:0.75rem;">${Math.floor(hoursLeft)}h restantes</div>`;
                  }
                }

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
                      ` : `
                        <span style="color:var(--text-muted); font-size:0.8rem;">Label Pendiente</span>
                        ${deadlineHtml}
                      `}
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
      <h3>${tr('Valoraciones y Reseñas de tu Tienda', 'Store Ratings and Reviews')}</h3>
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
        <h3>${tr('Administración de Suscripción', 'Subscription Management')}</h3>
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
  showToast(tr("📸 ¡Evidencia de empaque guardada con éxito! El sistema ahora te permitirá entregar la orden al carrier.", "📸 Packing evidence saved successfully! The system will now allow you to hand over the order to the carrier."), 'success');
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
    showToast(tr("⚠️ REGLA DE COLECCIONABLES: Debes subir una foto de evidencia del empaque antes de marcar el paquete como entregado al transportista.", "⚠️ COLLECTIBLES RULE: You must upload packing evidence before marking the package as dropped off."), 'error');
    return;
  }

  shippoAPI.updateShipmentStatus(shipmentId, "entregado_al_carrier");
  showToast(tr("🚚 El paquete ha sido marcado como entregado al carrier. El tracking se ha activado.", "🚚 Package marked as dropped off. Tracking is now active."), 'success');
  renderSellerDashboard();
}

function triggerSimulateTransit(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "en_transito");
  showToast(tr("📡 En tránsito. El paquete está siendo transportado al destino final.", "📡 In transit. The package is being transported to the final destination."), 'info');
  renderSellerDashboard();
}

function triggerSimulateDelivery(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  showToast(tr("🎯 Paquete entregado. El tracking ha marcado entrega exitosa. El saldo ha sido liberado de la custodia.", "🎯 Package delivered. Tracking shows successful delivery. Balance has been released from escrow."), 'success');
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

    showToast(tr(`¡Tu plan ha sido cambiado exitosamente a ${planName}! La comisión ahora es del ${(rate * 100).toFixed(0)}%.`, `Your plan has been successfully changed to ${planName}! The commission is now ${(rate * 100).toFixed(0)}%.`), 'success');
    renderSellerDashboard();
  }
}

// Open add/edit modal actions
function openAddProductModal() {
  const sellerProf = db.get('seller_profiles').find(p => p.user_id === state.currentUser.id);
  if (sellerProf && sellerProf.active_strikes >= 2) {
    showToast(tr("⛔ Tienes 2 o más strikes activos por retrasos en envíos. La creación de nuevos artículos ha sido temporalmente bloqueada.", "⛔ You have 2 or more active strikes for shipping delays. Creating new items has been temporarily blocked."), 'error');
    return;
  }
  
  window.newProductMedia = []; // Reset local media storage
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
      
      <!-- Shippo Parcel Dimensions & Collectibles Rules (Collapsible) -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem; cursor:pointer;" onclick="const t = document.getElementById('shipping-advanced-opts'); t.style.display = t.style.display === 'none' ? 'block' : 'none';">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          ${tr('Opciones de Envío Avanzadas (Peso y Tamaño)', 'Advanced Shipping Options')} 
          <i data-lucide="chevron-down" style="width:0.9rem;height:0.9rem; margin-left:auto;"></i>
        </h4>
        <div id="shipping-advanced-opts" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--border-color);">
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">${tr('Los valores por defecto aplican para figuras tamaño estándar (ej. Funko Pops). Si vendes una edición de coleccionista grande o una estatua, actualiza estos valores.', 'Default values apply for standard size figures (e.g. Funko Pops). Update these if selling large editions or statues.')}</p>
          <div class="checkout-form-group" style="margin-bottom:0.5rem;">
            <div class="checkout-input-wrapper">
              <label>${tr('Peso (oz)', 'Weight (oz)')}</label>
              <input type="number" id="frm-prod-weight" value="16">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Largo (in)', 'Length (in)')}</label>
              <input type="number" id="frm-prod-length" value="8">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Ancho (in)', 'Width (in)')}</label>
              <input type="number" id="frm-prod-width" value="6">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Alto (in)', 'Height (in)')}</label>
              <input type="number" id="frm-prod-height" value="4">
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="frm-prod-fragile">
              <span>${tr('Marcar como artículo frágil (Recomienda embalaje y transportista premium)', 'Mark as fragile (Recommends premium carrier)')}</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="frm-prod-insurance">
              <span>${tr('Requerir Seguro del paquete (Auto-activado si cuesta > $100)', 'Require parcel insurance (Auto-activated if > $100)')}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="frm-prod-price" placeholder="49.99">
        </div>
        <div class="checkout-input-wrapper">
          <label>Fotos y Videos (Máx 5)</label>
          <div style="display:flex; gap:0.4rem; margin-bottom:0.4rem;">
            <input type="text" id="frm-prod-media-url" placeholder="Pegar URL de foto/video..." style="flex:1; margin-bottom:0;">
            <button type="button" class="btn-small primary-btn" onclick="handleAddMediaUrl('frm-prod-media-url')" style="width:auto; padding: 0 0.8rem; font-size:0.8rem; height:38px;">+</button>
          </div>
          <input type="file" id="frm-prod-media-input" style="display:none;" accept="image/*,video/*" multiple onchange="handleProductFormMultiMediaUpload(this)">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn-small secondary-btn" onclick="document.getElementById('frm-prod-media-input').click()" style="padding: 0.45rem 0.8rem; font-size:0.75rem; display:flex; align-items:center; gap:0.3rem; width:auto; border-color:var(--border-metallic-yellow);">
              <i data-lucide="camera" style="width:0.85rem; height:0.85rem;"></i> Subir o Tomar Foto/Video
            </button>
            <span id="frm-media-count" style="font-size:0.7rem; color:var(--text-secondary);">(0 de 5 agregados)</span>
          </div>
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Galería de Previsualización</label>
        <div id="frm-media-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:0.5rem; min-height:75px; border:1px dashed var(--border-color); padding:0.5rem; border-radius:6px; background:rgba(0,0,0,0.1); align-items:center;">
          <!-- Previews will go here -->
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
  renderFormMediaGallery(); // Load empty gallery view initially
}

function submitAddProduct() {
  const title = document.getElementById('frm-prod-title').value.trim();
  const brand = document.getElementById('frm-prod-brand').value.trim();
  const category = document.getElementById('frm-prod-category').value;
  const condition = document.getElementById('frm-prod-condition').value;
  const stock = parseInt(document.getElementById('frm-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('frm-prod-price').value) || 0.00;
  const desc = document.getElementById('frm-prod-desc').value.trim();

  // Shipping inputs
  const weight = parseFloat(document.getElementById('frm-prod-weight').value) || 16;
  const length = parseFloat(document.getElementById('frm-prod-length').value) || 8;
  const width = parseFloat(document.getElementById('frm-prod-width').value) || 6;
  const height = parseFloat(document.getElementById('frm-prod-height').value) || 4;
  const fragile = document.getElementById('frm-prod-fragile').checked;
  const insurance = document.getElementById('frm-prod-insurance').checked || (price > 100);

  if (!title || !brand || !price || !desc) {
    showToast(tr("Por favor completa los campos principales (Título, Marca, Precio y Descripción).", "Please fill in the main fields (Title, Brand, Price, and Description)."), 'error');
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
    status: state.currentUser.role === 'admin' ? "approved" : "pending",
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

  // Save multiple media files
  if (window.newProductMedia.length === 0) {
    // Default fallback image
    media.push({
      id: "med_" + Date.now(),
      product_id: newProdId,
      media_url: 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80',
      media_type: 'image'
    });
  } else {
    window.newProductMedia.forEach((m, idx) => {
      media.push({
        id: `med_${Date.now()}_${idx}`,
        product_id: newProdId,
        media_url: m.media_url,
        media_type: m.media_type
      });
    });
  }
  db.set('product_media', media);

  toggleGlobalModal(false);
  if (state.currentUser.role === 'admin') {
    showToast(tr("¡Figura publicada con éxito! Al ser el Administrador, se ha auto-aprobado y publicado.", "Figure published successfully! Since you are an Admin, it has been auto-approved and published."), 'success');
    notifyFollowers(newProd.seller_id, newProd);
  } else {
    showToast(tr("¡Figura publicada con éxito! Queda pendiente de aprobación por el Administrador.", "Figure published successfully! It is pending approval by an Administrator."), 'success');
  }
  renderSellerDashboard();
}

function openEditProductModal(prodId) {
  const products = db.get('products');
  const media = db.get('product_media');
  
  const p = products.find(prod => prod.id === prodId);
  if (!p) return;

  // Load existing media items into newProductMedia array
  const pMedia = media.filter(m => m.product_id === p.id);
  window.newProductMedia = pMedia.map(m => ({ media_url: m.media_url, media_type: m.media_type }));
  const pMed = pMedia.length > 0 ? pMedia[0] : null;

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

      <!-- Shippo Parcel Dimensions & Collectibles Rules (Collapsible) -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem; cursor:pointer;" onclick="const t = document.getElementById('edit-shipping-advanced-opts'); t.style.display = t.style.display === 'none' ? 'block' : 'none';">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          ${tr('Opciones de Envío Avanzadas (Peso y Tamaño)', 'Advanced Shipping Options')}
          <i data-lucide="chevron-down" style="width:0.9rem;height:0.9rem; margin-left:auto;"></i>
        </h4>
        <div id="edit-shipping-advanced-opts" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--border-color);">
          <div class="checkout-form-group" style="margin-bottom:0.5rem;">
            <div class="checkout-input-wrapper">
              <label>${tr('Peso (oz)', 'Weight (oz)')}</label>
              <input type="number" id="edit-prod-weight" value="${p.weight || 16}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Largo (in)', 'Length (in)')}</label>
              <input type="number" id="edit-prod-length" value="${p.length || 8}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Ancho (in)', 'Width (in)')}</label>
              <input type="number" id="edit-prod-width" value="${p.width || 6}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('Alto (in)', 'Height (in)')}</label>
              <input type="number" id="edit-prod-height" value="${p.height || 4}">
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="edit-prod-fragile" ${p.fragile ? 'checked' : ''}>
              <span>${tr('Marcar como artículo frágil', 'Mark as fragile')}</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="edit-prod-insurance" ${p.insurance_required ? 'checked' : ''}>
              <span>${tr('Requerir Seguro del paquete', 'Require parcel insurance')}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="edit-prod-price" value="${p.price}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Fotos y Videos (Máx 5)</label>
          <div style="display:flex; gap:0.4rem; margin-bottom:0.4rem;">
            <input type="text" id="edit-prod-media-url" placeholder="Pegar URL de foto/video..." style="flex:1; margin-bottom:0;">
            <button type="button" class="btn-small primary-btn" onclick="handleAddMediaUrl('edit-prod-media-url')" style="width:auto; padding: 0 0.8rem; font-size:0.8rem; height:38px;">+</button>
          </div>
          <input type="file" id="edit-prod-media-input" style="display:none;" accept="image/*,video/*" multiple onchange="handleProductFormMultiMediaUpload(this)">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn-small secondary-btn" onclick="document.getElementById('edit-prod-media-input').click()" style="padding: 0.45rem 0.8rem; font-size:0.75rem; display:flex; align-items:center; gap:0.3rem; width:auto; border-color:var(--border-metallic-yellow);">
              <i data-lucide="camera" style="width:0.85rem; height:0.85rem;"></i> Subir o Tomar Foto/Video
            </button>
            <span id="frm-media-count" style="font-size:0.7rem; color:var(--text-secondary);">(0 de 5 agregados)</span>
          </div>
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Galería de Previsualización</label>
        <div id="frm-media-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:0.5rem; min-height:75px; border:1px dashed var(--border-color); padding:0.5rem; border-radius:6px; background:rgba(0,0,0,0.1); align-items:center;">
          <!-- Previews will go here -->
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
  renderFormMediaGallery(); // Load media previews inside the gallery
}

function submitEditProduct(productId) {
  const title = document.getElementById('edit-prod-title').value.trim();
  const brand = document.getElementById('edit-prod-brand').value.trim();
  const category = document.getElementById('edit-prod-category').value;
  const condition = document.getElementById('edit-prod-condition').value;
  const stock = parseInt(document.getElementById('edit-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('edit-prod-price').value) || 0.00;
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

    // Filter out old media
    let updatedMedia = media.filter(m => m.product_id !== productId);
    
    // Save updated media list
    if (window.newProductMedia.length === 0) {
      updatedMedia.push({
        id: "med_" + Date.now(),
        product_id: productId,
        media_url: 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80',
        media_type: 'image'
      });
    } else {
      window.newProductMedia.forEach((m, idx) => {
        updatedMedia.push({
          id: `med_${Date.now()}_${idx}`,
          product_id: productId,
          media_url: m.media_url,
          media_type: m.media_type
        });
      });
    }
    db.set('product_media', updatedMedia);

    toggleGlobalModal(false);
    showToast(tr("¡Cambios guardados con éxito! El producto volverá a revisión administrativa antes de salir a la venta.", "Changes saved successfully! The product will go back to admin review before going live."), 'success');
    renderSellerDashboard();
  }
}

function handleProductFormMultiMediaUpload(input) {
  const files = input.files;
  if (!files || files.length === 0) return;

  const remainingSlots = 5 - window.newProductMedia.length;
  if (remainingSlots <= 0) {
    showToast(tr("Ya has alcanzado el límite de 5 fotos o videos por artículo.", "You have already reached the limit of 5 photos or videos per item."), 'error');
    return;
  }

  const targetFiles = Array.from(files).slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    showToast(tr(`Solo se agregaron los primeros ${remainingSlots} archivos para no exceder el límite de 5.`, `Only the first ${remainingSlots} files were added to not exceed the limit of 5.`), 'error');
  }

  let loadedCount = 0;
  targetFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64String = e.target.result;
      const type = file.type.startsWith('video/') ? 'video' : 'image';

      window.newProductMedia.push({ media_url: base64String, media_type: type });
      loadedCount++;
      if (loadedCount === targetFiles.length) {
        renderFormMediaGallery();
      }
    };
    reader.readAsDataURL(file);
  });
}

function handleAddMediaUrl(inputId) {
  const urlInput = document.getElementById(inputId);
  if (!urlInput) return;
  const url = urlInput.value.trim();
  if (!url) return;

  if (window.newProductMedia.length >= 5) {
    showToast(tr("Puedes agregar un máximo de 5 fotos o videos por artículo.", "You can add a maximum of 5 photos or videos per item."), 'error');
    return;
  }

  let type = "image";
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
    type = "video";
  }

  window.newProductMedia.push({ media_url: url, media_type: type });
  urlInput.value = '';
  renderFormMediaGallery();
}

function renderFormMediaGallery() {
  const gallery = document.getElementById('frm-media-gallery');
  if (!gallery) return;

  const countSpan = document.getElementById('frm-media-count');
  if (countSpan) {
    countSpan.textContent = `(${window.newProductMedia.length} de 5 agregados)`;
  }

  if (window.newProductMedia.length === 0) {
    gallery.innerHTML = `
      <p id="frm-media-empty-text" style="grid-column: span 5; text-align:center; color:var(--text-secondary); font-size:0.75rem; margin: 1rem 0;">Ningún archivo agregado aún. Sube archivos o pega URLs.</p>
    `;
    return;
  }

  gallery.innerHTML = window.newProductMedia.map((m, index) => {
    const isVideo = m.media_type === 'video';
    const tag = isVideo 
      ? `<video src="${m.media_url}" style="width:100%; height:60px; object-fit:cover; border-radius:4px; background:#000;"></video>`
      : `<img src="${m.media_url}" style="width:100%; height:60px; object-fit:cover; border-radius:4px;">`;
      
    const typeIcon = isVideo 
      ? `<div style="position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.6); border-radius:3px; padding:1px 3px; font-size:0.5rem; color:#fff; display:flex; align-items:center;"><i data-lucide="video" style="width:0.5rem; height:0.5rem; margin-right:1px;"></i>video</div>`
      : ``;
      
    return `
      <div style="position:relative; width:100%; height:60px; border-radius:4px; overflow:hidden; border:1px solid var(--border-color);">
        ${tag}
        ${typeIcon}
        <button type="button" onclick="removeFormMediaItem(${index})" style="position:absolute; top:2px; right:2px; background:var(--alert-red); color:white; border:none; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.6rem; font-weight:bold; box-shadow:0 1px 3px rgba(0,0,0,0.4); z-index:10;">X</button>
      </div>
    `;
  }).join('');
  
  lucide.createIcons();
}

function removeFormMediaItem(index) {
  window.newProductMedia.splice(index, 1);
  renderFormMediaGallery();
}

function startStripeOnboarding() {
  const sellerProf = db.get('seller_profiles').find(p => p.user_id === state.currentUser.id);
  if (!sellerProf) return;

  showToast(tr("Generando enlace de vinculación seguro con Stripe...", "Generating secure Stripe onboarding link..."), 'info');

  const payload = {
    email: state.currentUser.email,
    storeName: sellerProf.store_name,
    returnOrigin: window.location.origin
  };

  const url = window.firebaseActive ? '/.netlify/functions/stripe-connect-onboard' : null;

  if (!url) {
    // Simulator fallback
    setTimeout(() => {
      sellerProf.stripe_connect_id = `acct_1N_${state.currentUser.id}_sim`;
      const profiles = db.get('seller_profiles');
      const idx = profiles.findIndex(p => p.user_id === state.currentUser.id);
      if (idx > -1) {
        profiles[idx] = sellerProf;
        db.set('seller_profiles', profiles);
      }
      showToast(tr("¡Vínculo de Stripe Connect simulado con éxito!", "Stripe Connect link simulated successfully!"), 'success');
      renderSellerDashboard();
    }, 1500);
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    
    // Save stripe connect ID in the profile (will sync to Firestore)
    sellerProf.stripe_connect_id = data.stripeConnectId;
    const profiles = db.get('seller_profiles');
    const idx = profiles.findIndex(p => p.user_id === state.currentUser.id);
    if (idx > -1) {
      profiles[idx] = sellerProf;
      db.set('seller_profiles', profiles);
    }
    
    // Redirect the seller to Stripe to complete their bank details
    window.location.href = data.onboardingUrl;
  })
  .catch(err => {
    console.error("Stripe Onboarding error:", err);
    showToast(tr(`Error de conexión con Stripe: ${err.message}`, `Stripe Connection Error: ${err.message}`), 'error');
  });
}
