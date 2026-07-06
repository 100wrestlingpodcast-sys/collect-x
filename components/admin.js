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
  const shipments = db.get('shipments');

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
          <a class="db-menu-item ${window.activeAdminTab === 'shipping' ? 'active' : ''}" onclick="setAdminTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            Gestión de Envíos (${shipments.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'products' ? 'active' : ''}" onclick="setAdminTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
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
    users, products, profiles, orders, transactions, reviews, banners, coupons, shipments,
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
            <div class="chart-bar-label">Ene</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 60px;" data-val="$680.00"></div>
            <div class="chart-bar-label">Feb</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 90px;" data-val="$1,020.00"></div>
            <div class="chart-bar-label">Mar</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 120px;" data-val="$1,450.00"></div>
            <div class="chart-bar-label">Abr</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 160px;" data-val="$2,100.00"></div>
            <div class="chart-bar-label">May</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 200px;" data-val="$2,850.00"></div>
            <div class="chart-bar-label">Jun</div>
          </div>
        </div>
      </div>
    `;
  } 
  
  else if (tab === 'approvals') {
    container.innerHTML = `
      <!-- Pending Sellers Section -->
      <div style="margin-bottom: 2rem;">
        <h3>Solicitudes de Nuevos Vendedores (${data.pendingSellers.length})</h3>
        <div class="db-table-card" style="margin-top:1rem;">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>Nombre Vendedor</th>
                  <th>Correo</th>
                  <th>Tienda Propuesta</th>
                  <th>Descripción</th>
                  <th>Fecha Registro</th>
                  <th>Gestión</th>
                </tr>
              </thead>
              <tbody>
                ${data.pendingSellers.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay registros de vendedores pendientes.</td>
                  </tr>
                ` : data.pendingSellers.map(sel => {
                  const u = data.users.find(usr => usr.id === sel.user_id);
                  return `
                    <tr>
                      <td><strong>${u ? u.name : 'Vendedor'}</strong></td>
                      <td>${u ? u.email : ''}</td>
                      <td>${sel.store_name}</td>
                      <td style="max-width:250px; font-size:0.85rem; color:var(--text-secondary);">${sel.description}</td>
                      <td>${new Date(u.created_at).toLocaleDateString()}</td>
                      <td style="display:flex; gap:0.5rem;">
                        <button class="action-btn-small approve" onclick="approveSellerProfile('${sel.user_id}', true)">Aprobar</button>
                        <button class="action-btn-small reject" onclick="approveSellerProfile('${sel.user_id}', false)">Rechazar</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pending Products Catalog Approval -->
      <div>
        <h3>Figuras Pendientes de Aprobación en Catálogo (${data.pendingProducts.length})</h3>
        <div class="db-table-card" style="margin-top:1rem;">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>Nombre Artículo</th>
                  <th>Marca / Categoría</th>
                  <th>Condición</th>
                  <th>Precio</th>
                  <th>Vendedor</th>
                  <th>Gestión</th>
                </tr>
              </thead>
              <tbody>
                ${data.pendingProducts.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay figuras pendientes de aprobación.</td>
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
      </div>
    `;
  } 

  else if (tab === 'shipping') {
    // Global Shippo shipping monitors
    const evidenceLogs = db.get('package_evidence');

    container.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <h3>Administrador de Envíos Shippo</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          Supervisa el estado de todas las guías del marketplace, valida la evidencia de empaque y gestiona disputas de payouts Connect.
        </p>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Código Guía / Orden</th>
                <th>Vendedor ➡️ Comprador</th>
                <th>Carrier / Servicio</th>
                <th>Costo Envío</th>
                <th>Seguro Adicional</th>
                <th>Evidencia Empaque</th>
                <th>Estado Shippo</th>
                <th>Acciones Control</th>
              </tr>
            </thead>
            <tbody>
              ${data.shipments.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); font-style:italic;">No hay envíos registrados en el sistema.</td>
                </tr>
              ` : data.shipments.map(s => {
                const evidence = evidenceLogs.find(ev => ev.shipment_id === s.id);
                const sellerName = data.profiles.find(p => p.user_id === s.seller_id)?.store_name || 'Vendedor';
                const buyerName = data.users.find(u => u.id === s.buyer_id)?.name || 'Comprador';

                return `
                  <tr>
                    <td>
                      <strong>${s.id}</strong>
                      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">Orden: <code>${s.order_id}</code></div>
                    </td>
                    <td>
                      <span style="font-weight:600;">${sellerName}</span><br>
                      <i data-lucide="arrow-right" style="width:0.8rem;height:0.8rem;display:inline-block;vertical-align:middle;color:var(--text-muted);"></i>
                      <span style="font-size:0.85rem; color:var(--text-secondary);">${buyerName}</span>
                    </td>
                    <td>
                      <strong>${s.carrier}</strong>
                      <div style="font-size:0.75rem; color:var(--text-secondary);">${s.service_level}</div>
                      <a href="${s.tracking_url}" target="_blank" style="font-size:0.8rem; color:var(--primary-light); text-decoration:underline;">
                        <code>${s.tracking_number}</code>
                      </a>
                    </td>
                    <td style="font-weight:600; color:var(--text-primary);">$${s.shipping_cost.toFixed(2)}</td>
                    <td>
                      ${s.insurance_amount > 0 ? `🛡️ Activo ($${s.insurance_amount.toFixed(2)})` : '❌ Sin seguro'}
                    </td>
                    <td>
                      ${evidence ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                          <img src="${evidence.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid var(--border-metallic-yellow);" onclick="viewEvidencePhoto('${evidence.image_url}')">
                          <span style="font-size:0.6rem; color:#10b981; font-weight:700;">OK</span>
                        </div>
                      ` : '<span style="color:#ef4444; font-size:0.75rem; font-weight:700;">⚠️ SIN FOTO</span>'}
                    </td>
                    <td>
                      <span class="status-tag ${s.status === 'delivered' ? 'approved' : s.status === 'label_generado' ? 'pending' : 'disputed'}" style="font-size:0.7rem; text-transform:uppercase;">
                        ${s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style="display:flex; flex-direction:column; gap:0.4rem;">
                      ${s.status !== 'delivered' && s.status !== 'problema' ? `
                        <button class="action-btn-small reject" style="font-size:0.7rem; padding:0.25rem 0.5rem;" onclick="adminTriggerDisputedShipping('${s.id}')">
                          🚨 Marcar Disputa
                        </button>
                      ` : ''}

                      ${s.status === 'problema' ? `
                        <button class="action-btn-small approve" style="font-size:0.7rem; padding:0.25rem 0.5rem; background:#10b981; border-color:#10b981;" onclick="adminResolveDisputedShipping('${s.id}')">
                          🔓 Liberar Custodia
                        </button>
                      ` : ''}

                      ${s.status !== 'devuelto' && s.status !== 'delivered' ? `
                        <button class="action-btn-small suspend" style="font-size:0.7rem; padding:0.25rem 0.5rem;" onclick="adminTriggerReturnedShipping('${s.id}')">
                          🔄 Registrar Devolución
                        </button>
                      ` : ''}

                      <div style="font-size:0.6rem; color:var(--text-muted); text-align:center;">
                        ${s.status === 'delivered' ? 'Fondos Liquidados' : 'Payout Retenido en Stripe'}
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
  
  else if (tab === 'products') {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3>Catálogo de Productos del Marketplace (${data.products.length})</h3>
        <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem;" onclick="openAdminAddProductModal()">
          + Publicar Oficial
        </button>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Tienda / Seller</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Tipo Inventario</th>
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
      <h3>Moderar Reseñas de Compradores</h3>
      
      <div class="reviews-list" style="margin-top:1.5rem;">
        ${data.reviews.map(r => {
          const item = data.products.find(p => p.id === r.product_id);
          const buyer = data.users.find(u => u.id === r.buyer_id);
          
          return `
            <div class="review-item" style="background:var(--bg-card); padding:1rem; border-radius:8px; border:1px solid var(--border-color); margin-bottom:1rem;">
              <div class="review-header">
                <span style="font-weight:600; color:var(--text-primary);">Reseña de: ${buyer ? buyer.name : 'Usuario'}</span>
                <span class="status-tag ${r.status === 'approved' ? 'approved' : 'rejected'}">${r.status === 'approved' ? 'Activa' : 'Oculta'}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); margin: 0.2rem 0;">
                Artículo: <strong>${item ? item.title : 'Figura'}</strong>
              </div>
              <div style="color:var(--gold-light); margin-bottom:0.5rem;">
                ${drawStarRatingHtml(r.rating)}
              </div>
              <p style="color:var(--text-primary); font-size:0.9rem;">"${r.comment}"</p>
              
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:0.75rem;">
                <button class="action-btn-small approve" onclick="moderateReviewAdmin('${r.id}', 'approved')">Habilitar</button>
                <button class="action-btn-small reject" onclick="moderateReviewAdmin('${r.id}', 'rejected')">Ocultar / Censurar</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  else if (tab === 'marketing') {
    container.innerHTML = `
      <!-- Coupons Design -->
      <div style="margin-bottom: 2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3>Cupones de Descuento Activos</h3>
          <button class="btn-large primary-btn" style="width:auto; padding:0.4rem 0.8rem; font-size:0.85rem;" onclick="openAddCouponModal()">
            Crear Cupón
          </button>
        </div>

        <div class="db-table-card">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo Descuento</th>
                  <th>Valor</th>
                  <th>Compra Mínima</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${data.coupons.map(c => `
                  <tr>
                    <td><code>${c.code}</code></td>
                    <td>${c.discount_type === 'percentage' ? 'Porcentual' : 'Fijo (Monto)'}</td>
                    <td>${c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                    <td>$${c.min_purchase.toFixed(2)}</td>
                    <td>
                      <span class="status-tag ${c.active ? 'approved' : 'rejected'}">
                        ${c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button class="action-btn-small reject" onclick="toggleCouponStatus('${c.code}', ${c.active})">
                        ${c.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Banners design -->
      <div>
        <h3>Diseño de Banners del Home</h3>
        <div class="banners-management-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:1rem;">
          ${data.banners.map(b => `
            <div style="border:1px solid var(--border-color); border-radius:8px; overflow:hidden; background:var(--bg-card);">
              <img src="${b.image}" style="width:100%; height:120px; object-fit:cover;">
              <div style="padding:1rem;">
                <h4 style="margin-bottom:0.25rem;">${b.title}</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">${b.subtitle}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="status-tag ${b.active ? 'approved' : 'rejected'}">${b.active ? 'Activo' : 'Pausado'}</span>
                  <button class="action-btn-small suspend" onclick="toggleBannerActive('${b.id}', ${b.active})">
                    ${b.active ? 'Pausar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

// Admin Shipping Operations
function adminTriggerDisputedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "problema");
  alert("🚨 Se ha registrado una Disputa sobre este envío. El Payout correspondiente quedará bloqueado en Stripe Connect.");
  renderAdminDashboard();
}

function adminResolveDisputedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  alert("🔓 Disputa resuelta. Se ha liberado la retención de los fondos. El vendedor recibirá su payout.");
  renderAdminDashboard();
}

function adminTriggerReturnedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "devuelto");
  alert("🔄 Se ha registrado la devolución del paquete al vendedor. La orden se considerará reembolsada.");
  renderAdminDashboard();
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

// Moderations callbacks
function approveSellerProfile(userId, isApproved) {
  const profiles = db.get('seller_profiles');
  const index = profiles.findIndex(p => p.user_id === userId);
  
  if (index > -1) {
    if (isApproved) {
      profiles[index].approved = true;
      profiles[index].stripe_connect_id = `acct_1N_${userId}`;
      alert("¡Cuenta de Vendedor aprobada exitosamente y cuenta de Stripe Connect vinculada!");
    } else {
      profiles.splice(index, 1);
      alert("Solicitud de vendedor rechazada y perfil eliminado.");
    }
    db.set('seller_profiles', profiles);
    renderAdminDashboard();
  }
}

function approveProduct(prodId, isApproved) {
  const products = db.get('products');
  const index = products.findIndex(p => p.id === prodId);
  
  if (index > -1) {
    if (isApproved) {
      products[index].status = "approved";
      alert("¡Producto aprobado y publicado en la tienda!");
    } else {
      products[index].status = "rejected";
      alert("Producto rechazado.");
    }
    db.set('products', products);
    renderAdminDashboard();
  }
}

function removeProductAdmin(prodId) {
  if (confirm("¿Estás seguro de eliminar este producto del marketplace permanentemente?")) {
    const products = db.get('products').filter(p => p.id !== prodId);
    db.set('products', products);
    alert("Producto eliminado exitosamente.");
    renderAdminDashboard();
  }
}

function moderateReviewAdmin(reviewId, status) {
  const reviews = db.get('reviews');
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index > -1) {
    reviews[index].status = status;
    db.set('reviews', reviews);
    alert(`Estado de la reseña cambiado a: ${status === 'approved' ? 'Habilitada' : 'Oculta'}`);
    renderAdminDashboard();
  }
}

// Marketing callbacks
function toggleCouponStatus(code, currentStatus) {
  const coupons = db.get('coupons');
  const index = coupons.findIndex(c => c.code === code);
  if (index > -1) {
    coupons[index].active = !currentStatus;
    db.set('coupons', coupons);
    alert(`Cupón ${code} ha sido ${!currentStatus ? 'activado' : 'desactivado'}.`);
    renderAdminDashboard();
  }
}

function toggleBannerActive(id, currentStatus) {
  const banners = db.get('banners');
  const index = banners.findIndex(b => b.id === id);
  if (index > -1) {
    banners[index].active = !currentStatus;
    db.set('banners', banners);
    alert(`El banner ha sido ${!currentStatus ? 'activado' : 'pausado'}.`);
    renderAdminDashboard();
  }
}

function openAddCouponModal() {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Código de Cupón</label>
        <input type="text" id="frm-coupon-code" placeholder="EJ: ANIME20" style="text-transform:uppercase;">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Tipo Descuento</label>
          <select id="frm-coupon-type">
            <option value="percentage">Porcentaje (%)</option>
            <option value="fixed">Monto Fijo ($USD)</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Valor</label>
          <input type="number" id="frm-coupon-val" placeholder="10">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Compra Mínima ($USD)</label>
        <input type="number" id="frm-coupon-min" value="30">
      </div>
      <button class="btn-large primary-btn" onclick="submitCreateCoupon()">Crear Cupón</button>
    </div>
  `;
  toggleGlobalModal(true, "Crear Nuevo Cupón de Descuento", bodyHtml);
}

function submitCreateCoupon() {
  const code = document.getElementById('frm-coupon-code').value.trim().toUpperCase();
  const type = document.getElementById('frm-coupon-type').value;
  const val = parseFloat(document.getElementById('frm-coupon-val').value) || 0;
  const min = parseFloat(document.getElementById('frm-coupon-min').value) || 0;

  if (!code || val <= 0) {
    alert("Por favor completa los datos del cupón.");
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
  alert(`¡Cupón ${code} creado exitosamente!`);
  renderAdminDashboard();
}

function openAdminAddProductModal() {
  const categoriesOptions = CATEGORIES.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>Título de la figura (Tienda Oficial)</label>
        <input type="text" id="adm-prod-title" placeholder="Ej: Iron Man Retro carded">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Marca</label>
          <input type="text" id="adm-prod-brand" value="Hasbro">
        </div>
        <div class="checkout-input-wrapper">
          <label>Categoría</label>
          <select id="adm-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Condición</label>
          <select id="adm-prod-condition">
            <option value="Sellado">Sellado</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>Cantidad (Stock)</label>
          <input type="number" id="adm-prod-stock" value="5">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Precio ($USD)</label>
          <input type="number" id="adm-prod-price" placeholder="29.99">
        </div>
        <div class="checkout-input-wrapper">
          <label>Imagen (URL)</label>
          <input type="text" id="adm-prod-img" placeholder="https://images.unsplash.com/photo-...">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>Descripción detallada</label>
        <textarea class="form-textarea" id="adm-prod-desc" placeholder="Descripción..."></textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAdminAddProduct()">Publicar en Catálogo Oficial</button>
    </div>
  `;
  
  toggleGlobalModal(true, "Publicar Producto Oficial (Admin Shop)", formHtml);
}

function submitAdminAddProduct() {
  const title = document.getElementById('adm-prod-title').value.trim();
  const brand = document.getElementById('adm-prod-brand').value.trim();
  const category = document.getElementById('adm-prod-category').value;
  const condition = document.getElementById('adm-prod-condition').value;
  const stock = parseInt(document.getElementById('adm-prod-stock').value) || 0;
  const price = parseFloat(document.getElementById('adm-prod-price').value) || 0.00;
  const imgUrl = document.getElementById('adm-prod-img').value.trim() || 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
  const desc = document.getElementById('adm-prod-desc').value.trim();

  if (!title || !brand || !price || !desc) {
    alert("Por favor completa los campos principales.");
    return;
  }

  const products = db.get('products');
  const media = db.get('product_media');
  
  const newProdId = "prod_" + Date.now();
  const newProd = {
    id: newProdId,
    seller_id: "usr_admin_1", // Admin shop
    title: title,
    description: desc,
    brand: brand,
    category: category,
    condition: condition,
    price: price,
    stock: stock,
    status: "approved", // Pre-approved since it is created by admin
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
