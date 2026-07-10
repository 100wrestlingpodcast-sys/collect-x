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
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom: 1.5rem;">
        <div>
          <h2 class="section-title">${tr('Panel de Administración', 'Admin Dashboard')}</h2>
          <p style="color:var(--text-secondary); margin-top:0.25rem;">${tr('Control global del marketplace, comisiones, aprobaciones y catálogo.', 'Global control of marketplace, commissions, approvals and catalog.')}</p>
        </div>
        <button class="btn-large secondary-btn" style="width:auto; padding:0.6rem 1.2rem; font-size:0.85rem;" onclick="router.navigate('seller')">
          <i data-lucide="store" style="width:1rem;height:1rem;display:inline-block;vertical-align:middle;margin-right:0.3rem;color:var(--gold-light);"></i>
          ${tr('Ir a Mi Tienda Vendedor', 'Go to My Seller Store')}
        </button>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Menu -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeAdminTab === 'overview' ? 'active' : ''}" onclick="setAdminTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Resumen General', 'General Overview')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'users' ? 'active' : ''}" onclick="setAdminTab('users')">
            <i data-lucide="users" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Usuarios y Tiendas', 'Users & Stores')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'approvals' ? 'active' : ''}" onclick="setAdminTab('approvals')">
            <i data-lucide="user-check" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Aprobaciones', 'Approvals')} (${pendingProducts.length + pendingSellers.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'compliance' ? 'active' : ''}" onclick="setAdminTab('compliance')">
            <i data-lucide="shield-alert" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Cumplimiento y Strikes', 'Compliance & Strikes')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'shipping' ? 'active' : ''}" onclick="setAdminTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Gestión de Envíos', 'Shipping Management')} (${shipments.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'products' ? 'active' : ''}" onclick="setAdminTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Catálogo / Inventario', 'Catalog / Inventory')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'transactions' ? 'active' : ''}" onclick="setAdminTab('transactions')">
            <i data-lucide="dollar-sign" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Ventas y Payouts', 'Sales & Payouts')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'commissions' ? 'active' : ''}" onclick="setAdminTab('commissions')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Comisiones del Marketplace', 'Marketplace Commissions')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'guidelines' ? 'active' : ''}" onclick="setAdminTab('guidelines')">
            <i data-lucide="shield-check" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Reglas para Vendedores', 'Seller Guidelines')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'reviews' ? 'active' : ''}" onclick="setAdminTab('reviews')">
            <i data-lucide="message-square" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Moderar Reseñas', 'Moderate Reviews')} (${reviews.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'marketing' ? 'active' : ''}" onclick="setAdminTab('marketing')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Banners y Cupones', 'Banners & Coupons')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'notifications' ? 'active' : ''}" onclick="setAdminTab('notifications')">
            <i data-lucide="bell" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('Logs de Alertas', 'Alert Logs')}
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
  
  else if (tab === 'users') {
    const usersList = db.get('users') || [];
    const profiles = db.get('seller_profiles') || [];
    
    container.innerHTML = `
      <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3>${tr('Gestión de Usuarios y Tiendas', 'Users & Stores Management')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('Administra las cuentas de compradores, administradores y los perfiles de tiendas de los vendedores.', 'Manage accounts of buyers, admins, and seller store profiles.')}
          </p>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header">
          <h4 style="margin:0; color:var(--text-primary);">${tr('Usuarios Registrados', 'Registered Users')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('Nombre', 'Name')}</th>
                <th>${tr('Email', 'Email')}</th>
                <th>${tr('Rol', 'Role')}</th>
                <th>${tr('Estado', 'Status')}</th>
                <th>${tr('Registro', 'Registered')}</th>
                <th style="text-align:right;">${tr('Acciones', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${usersList.map(u => {
                const statusTag = u.status === 'suspended' ? 
                  `<span class="status-tag rejected">${tr('Suspendido', 'Suspended')}</span>` : 
                  `<span class="status-tag approved">${tr('Activo', 'Active')}</span>`;
                
                const roleTag = u.role === 'admin' ? 
                  `<span style="color:var(--gold-light); font-weight:700;">Admin</span>` : 
                  `<span>${tr('Comprador', 'Buyer')}</span>`;
                  
                return `
                  <tr>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td>${roleTag}</td>
                    <td>${statusTag}</td>
                    <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td style="text-align:right;">
                      ${u.role !== 'admin' ? `
                        <button class="action-btn-small ${u.status === 'suspended' ? 'approve' : 'suspend'}" 
                          onclick="adminToggleUserStatus('${u.id}')">
                          ${u.status === 'suspended' ? tr('Reactivar', 'Reactivate') : tr('Suspender', 'Suspend')}
                        </button>
                      ` : tr('Sin acciones', 'No actions')}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Stores Table Card -->
      <div class="db-table-card">
        <div class="db-table-header">
          <h4 style="margin:0; color:var(--text-primary);">${tr('Perfiles de Vendedores y Tiendas', 'Seller Profiles & Stores')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('Tienda', 'Store')}</th>
                <th>${tr('Dueño', 'Owner')}</th>
                <th>${tr('Plan', 'Plan')}</th>
                <th>${tr('Comisión', 'Commission')}</th>
                <th>${tr('Stripe Connect', 'Stripe Connect')}</th>
                <th style="text-align:right;">${tr('Acciones', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${profiles.map(p => {
                const owner = usersList.find(u => u.id === p.user_id);
                const commissionPercent = p.commission_rate !== undefined ? `${(p.commission_rate * 100).toFixed(0)}%` : 'N/A';
                
                const stripeStatus = p.stripe_connect_id ? 
                  `<span class="status-tag approved" title="${p.stripe_connect_id}">Conectado</span>` : 
                  `<span class="status-tag pending">Desconectado</span>`;
                  
                const planTag = p.subscription_plan === 'Elite' ? 
                  `<span style="color:var(--gold-light); font-weight:700;">★ Elite</span>` : 
                  `<span>Free</span>`;
                
                return `
                  <tr>
                    <td><strong>${p.store_name}</strong></td>
                    <td>${owner ? owner.email : tr('Desconocido', 'Unknown')}</td>
                    <td>${planTag}</td>
                    <td>${commissionPercent}</td>
                    <td>${stripeStatus}</td>
                    <td style="text-align:right; display:flex; gap:0.4rem; justify-content:flex-end;">
                      <button class="action-btn-small" style="background:var(--border-metallic-yellow); color:#000000;" 
                        onclick="adminEditStorePlan('${p.id}')">
                        ${tr('Cambiar Plan', 'Change Plan')}
                      </button>
                      <button class="action-btn-small approve" onclick="adminEditStoreCommission('${p.id}')">
                        % ${tr('Comisión', 'Commission')}
                      </button>
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
  } else if (tab === 'compliance') {
    renderAdminComplianceTab(container, data);
  } else if (tab === 'notifications') {
    renderAdminNotificationsTab(container);
  } else if (tab === 'commissions') {
    renderAdminCommissionsTab(container);
  } else if (tab === 'guidelines') {
    renderAdminGuidelinesTab(container, data);
  }
}

function renderAdminComplianceTab(container, data) {
  const strikes = db.get('strikes');
  const auditLogs = db.get('compliance_audit_logs');
  
  // Find sellers in risk (strikes > 0 or reliability < 90)
  const riskySellers = data.profiles.filter(p => p.active_strikes > 0 || p.reliability_score < 90)
    .sort((a, b) => a.reliability_score - b.reliability_score);

  container.innerHTML = `
    <div>
      <div style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3>Cumplimiento de Envíos y Strikes</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Supervisa la salud de la plataforma, aplica reembolsos automáticos y maneja baneos de vendedores problemáticos.</p>
        </div>
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1rem;" onclick="ComplianceEngine.runFulfillmentChecker()">
          <i data-lucide="refresh-cw" style="width:1rem;height:1rem;"></i> Forzar Auditoría
        </button>
      </div>

      <!-- Sellers in Risk -->
      <div class="db-table-card" style="margin-bottom: 2rem;">
        <div class="db-table-header" style="background:var(--bg-lighter);">
          <h4 style="margin:0;">Vendedores en Riesgo / Sancionados</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Confiabilidad</th>
                <th>Strikes</th>
                <th>Envíos Tarde</th>
                <th>Estado Suspensión</th>
                <th>Acciones Admin</th>
              </tr>
            </thead>
            <tbody>
              ${riskySellers.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; padding:2rem;">Todos los vendedores están en estado óptimo.</td></tr>
              ` : riskySellers.map(p => {
                const user = data.users.find(u => u.id === p.user_id);
                return `
                  <tr>
                    <td>
                      <strong>${p.store_name}</strong><br>
                      <span style="font-size:0.75rem; color:var(--text-muted);">${user ? user.email : ''}</span>
                    </td>
                    <td>
                      <span style="font-weight:700; color:${p.reliability_score >= 90 ? '#10b981' : p.reliability_score >= 70 ? '#f59e0b' : '#ef4444'};">
                        ${p.reliability_score} / 100
                      </span>
                    </td>
                    <td>
                      <span style="font-weight:800; font-size:1.1rem; color:${p.active_strikes > 0 ? '#ef4444' : '#10b981'};">${p.active_strikes}</span>
                    </td>
                    <td>${p.delayed_orders}</td>
                    <td>
                      ${p.banned_permanently ? '<span class="status-tag rejected">BANEADO PERMANENTE</span>' :
                        p.suspension_until && new Date(p.suspension_until) > new Date() ? 
                        `<span class="status-tag pending">SUSPENDIDO hasta ${new Date(p.suspension_until).toLocaleDateString()}</span>` : 
                        '<span class="status-tag approved">Activo</span>'
                      }
                    </td>
                    <td style="display:flex; gap:0.5rem; flex-direction:column;">
                      <button class="action-btn-small approve" onclick="adminRemoveStrike('${p.id}')">Quitar Strike</button>
                      ${!p.banned_permanently ? `<button class="action-btn-small suspend" onclick="adminForceBan('${p.id}')">Banear Cuenta</button>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Audit Logs -->
      <div class="db-table-card">
        <div class="db-table-header">
          <h4 style="margin:0;">Logs de Auditoría (Fulfillment)</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vendedor ID</th>
                <th>Orden / Item</th>
                <th>Evento</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.length === 0 ? `
                <tr><td colspan="5" style="text-align:center; padding:2rem;">No hay logs registrados.</td></tr>
              ` : auditLogs.slice().reverse().slice(0,20).map(log => `
                <tr>
                  <td style="font-size:0.8rem; color:var(--text-secondary);">${new Date(log.created_at).toLocaleString()}</td>
                  <td><code>${log.seller_id}</code></td>
                  <td><code>${log.order_id || 'N/A'}</code></td>
                  <td>
                    <span class="status-tag ${log.type.includes('strike') ? 'rejected' : 'pending'}">${log.type.toUpperCase()}</span>
                  </td>
                  <td style="font-size:0.8rem; max-width:250px;">${log.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => lucide.createIcons(), 50);
}

function adminRemoveStrike(sellerId) {
  if(!confirm('¿Estás seguro de quitar 1 strike a este vendedor?')) return;
  const profiles = db.get('seller_profiles');
  const idx = profiles.findIndex(p => p.id === sellerId);
  if (idx > -1 && profiles[idx].active_strikes > 0) {
    profiles[idx].active_strikes -= 1;
    if (profiles[idx].active_strikes < 4) profiles[idx].banned_permanently = false;
    
    // Recalculate
    ComplianceEngine.recalculateReliability(profiles[idx]);
    db.set('seller_profiles', profiles);
    showToast(tr("Strike removido con éxito.", "Strike successfully removed."), 'success');
    renderAdminDashboard();
  }
}

function adminForceBan(sellerId) {
  if(!confirm('¿Estás seguro de BANEAR PERMANENTEMENTE a este vendedor? Sus productos no serán visibles.')) return;
  const profiles = db.get('seller_profiles');
  const idx = profiles.findIndex(p => p.id === sellerId);
  if (idx > -1) {
    profiles[idx].banned_permanently = true;
    profiles[idx].active_strikes = 4;
    ComplianceEngine.recalculateReliability(profiles[idx]);
    db.set('seller_profiles', profiles);
    
    // Auto reject all their pending products or set approved to pending maybe?
    // Not done here for brevity, but good practice
    
    showToast(tr("Vendedor baneado permanentemente.", "Seller permanently banned."), 'success');
    renderAdminDashboard();
  }
}


function renderAdminNotificationsTab(container) {
  const notifications = db.get('notifications') || [];
  const users = db.get('users');

  container.innerHTML = `
    <div>
      <div style="margin-bottom:1.5rem;">
        <h3>Logs de Alertas a Compradores</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Historial de notificaciones automáticas por Email y SMS enviadas a los seguidores de vendedores favoritos.</p>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Destinatario</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Mensaje enviado</th>
                <th>Fecha de Envío</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${notifications.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted); font-style:italic;">
                    No se han registrado envíos de alertas todavía.
                  </td>
                </tr>
              ` : notifications.slice().reverse().map(n => {
                const u = users.find(usr => usr.id === n.user_id);
                const userName = u ? u.name : 'Usuario';
                return `
                  <tr>
                    <td><strong>${userName}</strong></td>
                    <td>
                      <span class="status-tag ${n.type === 'email' ? 'approved' : 'pending'}" style="text-transform:uppercase; font-size:0.65rem;">
                        ${n.type}
                      </span>
                    </td>
                    <td><code>${n.recipient}</code></td>
                    <td style="max-width:300px; white-space:normal; font-size:0.75rem; line-height:1.4;">${n.message}</td>
                    <td>${new Date(n.sent_at).toLocaleString()}</td>
                    <td>
                      <span class="status-tag approved" style="font-size:0.65rem;">
                        ${n.status}
                      </span>
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

// Admin Shipping Operations
function adminTriggerDisputedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "problema");
  showToast(tr("🚨 Se ha registrado una Disputa sobre este envío. El Payout correspondiente quedará bloqueado en Stripe Connect.", "🚨 A Dispute has been registered for this shipment. The corresponding Payout will be locked in Stripe Connect."), 'error');
  renderAdminDashboard();
}

function adminResolveDisputedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  showToast(tr("🔓 Disputa resuelta. Se ha liberado la retención de los fondos. El vendedor recibirá su payout.", "🔓 Dispute resolved. Funds hold has been released. The seller will receive their payout."), 'success');
  renderAdminDashboard();
}

function adminTriggerReturnedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "devuelto");
  showToast(tr("🔄 Se ha registrado la devolución del paquete al vendedor. La orden se considerará reembolsada.", "🔄 Package return to seller registered. The order will be considered refunded."), 'info');
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
      showToast(tr("¡Cuenta de Vendedor aprobada exitosamente y cuenta de Stripe Connect vinculada!", "Seller account successfully approved and Stripe Connect account linked!"), 'success');
    } else {
      profiles.splice(index, 1);
      showToast(tr("Solicitud de vendedor rechazada y perfil eliminado.", "Seller request rejected and profile deleted."), 'info');
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
      showToast(tr("¡Producto aprobado y publicado en la tienda!", "Product approved and published in the store!"), 'success');
      notifyFollowers(products[index].seller_id, products[index]);
    } else {
      products[index].status = "rejected";
      showToast(tr("Producto rechazado.", "Product rejected."), 'error');
    }
    db.set('products', products);
    renderAdminDashboard();
  }
}

function removeProductAdmin(prodId) {
  if (confirm("¿Estás seguro de eliminar este producto del marketplace permanentemente?")) {
    const products = db.get('products').filter(p => p.id !== prodId);
    db.set('products', products);
    showToast(tr("Producto eliminado exitosamente.", "Product successfully deleted."), 'success');
    renderAdminDashboard();
  }
}

function moderateReviewAdmin(reviewId, status) {
  const reviews = db.get('reviews');
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index > -1) {
    reviews[index].status = status;
    db.set('reviews', reviews);
    showToast(tr(`Estado de la reseña cambiado a: ${status === 'approved' ? 'Habilitada' : 'Oculta'}`, `Review status changed to: ${status === 'approved' ? 'Enabled' : 'Hidden'}`), 'info');
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
    showToast(tr(`Cupón ${code} ha sido ${!currentStatus ? 'activado' : 'desactivado'}.`, `Coupon ${code} has been ${!currentStatus ? 'activated' : 'deactivated'}.`), 'success');
    renderAdminDashboard();
  }
}

function toggleBannerActive(id, currentStatus) {
  const banners = db.get('banners');
  const index = banners.findIndex(b => b.id === id);
  if (index > -1) {
    banners[index].active = !currentStatus;
    db.set('banners', banners);
    showToast(tr(`El banner ha sido ${!currentStatus ? 'activado' : 'pausado'}.`, `The banner has been ${!currentStatus ? 'activated' : 'paused'}.`), 'success');
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
    showToast(tr("Por favor completa los datos del cupón.", "Please fill in the coupon details."), 'error');
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
  showToast(tr(`¡Cupón ${code} creado exitosamente!`, `Coupon ${code} successfully created!`), 'success');
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
    showToast(tr("Por favor completa los campos principales.", "Please fill in the main fields."), 'error');
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
  showToast(tr("¡Producto de la tienda oficial publicado con éxito!", "Official store product published successfully!"), 'success');
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
    showToast(tr("¡Cambios aplicados exitosamente en el catálogo!", "Changes successfully applied to the catalog!"), 'success');
    renderAdminDashboard();
  }
}

function adminToggleUserStatus(userId) {
  const users = db.get('users');
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = user.status === 'suspended' ? 'active' : 'suspended';
    db.set('users', users);
    showToast(tr(`Estado de usuario cambiado con éxito.`, `User status updated successfully.`), 'success');
    renderAdminDashboard();
  }
}

function adminEditStorePlan(profileId) {
  const profiles = db.get('seller_profiles');
  const prof = profiles.find(p => p.id === profileId);
  if (prof) {
    prof.subscription_plan = prof.subscription_plan === 'Elite' ? 'Free' : 'Elite';
    db.set('seller_profiles', profiles);
    showToast(tr(`Plan de tienda actualizado con éxito.`, `Store plan updated successfully.`), 'success');
    renderAdminDashboard();
  }
}

function adminEditStoreCommission(profileId) {
  const profiles = db.get('seller_profiles');
  const prof = profiles.find(p => p.id === profileId);
  if (prof) {
    const rateStr = prompt(
      tr("Ingresa la nueva tasa de comisión para esta tienda (ej. 0.05 para 5%):", "Enter the new commission rate for this store (e.g. 0.05 for 5%):"),
      prof.commission_rate !== undefined ? prof.commission_rate : "0.05"
    );
    if (rateStr !== null) {
      const rate = parseFloat(rateStr);
      if (!isNaN(rate) && rate >= 0 && rate <= 1) {
        prof.commission_rate = rate;
        db.set('seller_profiles', profiles);
        showToast(tr(`Tasa de comisión actualizada con éxito.`, `Commission rate updated successfully.`), 'success');
        renderAdminDashboard();
      } else {
        showToast(tr(`Tasa de comisión inválida. Debe ser un número entre 0 y 1.`, `Invalid commission rate. Must be a number between 0 and 1.`), 'error');
      }
    }
  }
}

function renderAdminCommissionsTab(container) {
  const settings = db.get('marketplace_settings') || {
    commission_general: 5,
    commission_on_shipping: false,
    commission_on_taxes: false,
    min_fee_per_sale: 0,
    buyer_protection_fee: false,
    additional_buyer_fee: false,
    categories_fees: {},
    sellers_fees: {},
    pro_discounts: {},
    history: []
  };

  const historyHtml = (settings.history || []).reverse().map(h => `
    <tr>
      <td style="white-space:nowrap;">${new Date(h.date).toLocaleString()}</td>
      <td><code>${h.user}</code></td>
      <td style="color:var(--text-secondary);">${h.description}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div>
      <div style="margin-bottom:1.5rem;">
        <h3>Comisiones del Marketplace</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          Define los porcentajes de cobro y los costos de procesamiento del negocio.
        </p>
      </div>

      <div class="db-table-card" style="margin-bottom:2rem; padding:1.5rem; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">
        <h4 style="margin-top:0; margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; color:var(--text-primary);">Configuración General</h4>
        
        <div style="display:flex; flex-direction:column; gap:1.2rem; max-width:600px;">
          <!-- platform commission percentage input -->
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label for="commission-general" style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">Comisión general de Geek Collector (%):</label>
            <input type="number" id="commission-general" value="${settings.commission_general}" min="0" max="100" step="0.1" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; color:#000000; width:150px; outline:none;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Comisión fija cobrada al vendedor en cada transacción. Predeterminado: 5%</span>
          </div>

          <!-- minimum fee -->
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label for="min-fee-per-sale" style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">Tarifa mínima por venta ($):</label>
            <input type="number" id="min-fee-per-sale" value="${settings.min_fee_per_sale || 0}" min="0" step="0.01" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; color:#000000; width:150px; outline:none;">
            <span style="font-size:0.75rem; color:var(--text-muted);">Tarifa fija mínima si la comisión porcentual es menor. Usar 0 para desactivar.</span>
          </div>

          <!-- toggles -->
          <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="commission-on-shipping" ${settings.commission_on_shipping ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;">
              <label for="commission-on-shipping" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">Cobrar comisión sobre el costo de envío</label>
            </div>
            
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="commission-on-taxes" ${settings.commission_on_taxes ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;">
              <label for="commission-on-taxes" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('Cobrar comisión sobre impuestos (8% IVA)', 'Charge commission on taxes (8% VAT)')}</label>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; opacity:0.6;">
              <input type="checkbox" id="buyer-protection-fee" ${settings.buyer_protection_fee ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;" disabled>
              <label for="buyer-protection-fee" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('Activar Buyer Protection Fee (Inactivo - Eliminado por el Administrador)', 'Activate Buyer Protection Fee (Inactive - Removed by Administrator)')}</label>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; opacity:0.6;">
              <input type="checkbox" id="additional-buyer-fee" ${settings.additional_buyer_fee ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;" disabled>
              <label for="additional-buyer-fee" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('Activar cargo de protección adicional (Inactivo - Eliminado por el Administrador)', 'Activate additional protection fee (Inactive - Removed by Administrator)')}</label>
            </div>
          </div>

          <!-- categories rates & pro discounts MOCK options -->
          <div style="border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.8rem;">
            <h5 style="margin:0 0 0.4rem 0; color:var(--text-primary); font-size:0.9rem;">${tr('Configuraciones Especiales', 'Special Configurations')}</h5>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div style="display:flex; flex-direction:column; gap:0.25rem;">
                <label style="font-size:0.8rem; color:var(--text-secondary);">${tr('Tarifas por Categoría:', 'Category Rates:')}</label>
                <select style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" disabled>
                  <option>${tr('Funko Pop (General: 5%)', 'Funko Pop (General: 5%)')}</option>
                  <option>${tr('Figuras de Acción (General: 5%)', 'Action Figures (General: 5%)')}</option>
                  <option>${tr('Estatuas y Réplicas (General: 5%)', 'Statues & Replicas (General: 5%)')}</option>
                </select>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.25rem;">
                <label style="font-size:0.8rem; color:var(--text-secondary);">${tr('Descuentos sobre comisiones:', 'Commission Discounts:')}</label>
                <select style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" disabled>
                  <option>${tr('Sin Descuentos (Todos pagan tarifa plana)', 'No Discounts (Flat fee for everyone)')}</option>
                </select>
              </div>
            </div>
          </div>

          <div style="margin-top:1rem;">
            <button class="btn-large primary-btn" style="width:auto; padding:0.6rem 1.5rem; font-size:0.85rem;" onclick="saveMarketplaceCommissionsSubmit()">
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>

      <!-- History of Audit changes -->
      <div class="db-table-card">
        <div class="db-table-header" style="background:var(--bg-lighter);">
          <h4 style="margin:0; font-size:0.95rem; color:var(--text-primary);">Historial de Auditoría de Comisiones</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Administrador</th>
                <th>Descripción del Cambio</th>
              </tr>
            </thead>
            <tbody>
              ${historyHtml ? historyHtml : `
                <tr>
                  <td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">No se registran cambios de configuración.</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function saveMarketplaceCommissionsSubmit() {
  const commissionInput = document.getElementById('commission-general');
  const minFeeInput = document.getElementById('min-fee-per-sale');
  const shippingCheckbox = document.getElementById('commission-on-shipping');
  const taxesCheckbox = document.getElementById('commission-on-taxes');

  if (!commissionInput) return;

  const commissionGeneral = parseFloat(commissionInput.value);
  const minFee = parseFloat(minFeeInput.value || 0);
  const onShipping = shippingCheckbox.checked;
  const onTaxes = taxesCheckbox.checked;

  if (isNaN(commissionGeneral) || commissionGeneral < 0 || commissionGeneral > 100) {
    showToast(tr("Por favor, ingrese un porcentaje de comisión válido (0% - 100%).", "Please enter a valid commission percentage (0% - 100%)."), 'error');
    return;
  }

  const settings = db.get('marketplace_settings') || {
    commission_general: 5,
    commission_on_shipping: false,
    commission_on_taxes: false,
    min_fee_per_sale: 0,
    buyer_protection_fee: false,
    additional_buyer_fee: false,
    categories_fees: {},
    sellers_fees: {},
    pro_discounts: {},
    history: []
  };

  // Build audit description
  let changes = [];
  if (settings.commission_general !== commissionGeneral) {
    changes.push(`Comisión general ajustada de ${settings.commission_general}% a ${commissionGeneral}%`);
  }
  if (settings.min_fee_per_sale !== minFee) {
    changes.push(`Tarifa mínima por venta cambiada de $${settings.min_fee_per_sale || 0} a $${minFee}`);
  }
  if (settings.commission_on_shipping !== onShipping) {
    changes.push(`Comisión sobre envíos: ${onShipping ? 'activada' : 'desactivada'}`);
  }
  if (settings.commission_on_taxes !== onTaxes) {
    changes.push(`Comisión sobre impuestos: ${onTaxes ? 'activada' : 'desactivada'}`);
  }

  if (changes.length === 0) {
    showToast(tr("No se detectaron cambios en la configuración.", "No changes detected in configuration."), 'info');
    return;
  }

  const prevRate = settings.commission_general;
  const isRateChanged = prevRate !== commissionGeneral;

  // Update settings values
  settings.commission_general = commissionGeneral;
  settings.min_fee_per_sale = minFee;
  settings.commission_on_shipping = onShipping;
  settings.commission_on_taxes = onTaxes;

  // Add history record
  settings.history.push({
    date: new Date().toISOString(),
    user: state.currentUser ? state.currentUser.id : "usr_admin_1",
    description: changes.join(', ')
  });

  db.set('marketplace_settings', settings);

  // If commission rate changed, generate new policy version and notify sellers
  if (isRateChanged) {
    const historyList = db.get('commission_policy_history') || [];
    
    // Archive old active policies
    historyList.forEach(p => {
      if (p.status === 'active') p.status = 'archived';
    });

    const nextVerNum = (historyList.length + 1).toFixed(1);
    const newVersionStr = `v${nextVerNum}`;
    
    const newPolicy = {
      version: newVersionStr,
      commission_percentage: commissionGeneral,
      published_at: new Date().toISOString(),
      effective_date: new Date().toISOString(),
      status: "active",
      description: `Actualización de comisión general del vendedor del ${prevRate}% al ${commissionGeneral}% por el Administrador.`
    };
    
    historyList.push(newPolicy);
    db.set('commission_policy_history', historyList);

    // Send notifications to all active sellers
    const users = db.get('users') || [];
    const notifications = db.get('notifications') || [];
    
    users.forEach(u => {
      if (u.role === 'seller') {
        notifications.push({
          id: "not_" + Math.random().toString(36).substr(2, 9),
          user_id: u.id,
          title: "Actualización de Política de Comisiones",
          message: `Geek Collector actualizará su comisión de vendedor al ${commissionGeneral}% a partir de hoy. Debes aceptar los nuevos términos.`,
          read: false,
          created_at: new Date().toISOString()
        });
      }
    });
    db.set('notifications', notifications);
  }

  showToast(tr("¡Configuración de comisiones guardada exitosamente!", "Commissions configuration saved successfully!"), 'success');
  
  // Refresh page tab
  renderAdminDashboard();
}

function renderAdminGuidelinesTab(container, data) {
  const versions = db.get('seller_guidelines_versions') || [];
  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const profiles = db.get('seller_profiles') || [];
  const users = db.get('users') || [];

  // 1. Version History Table Rows
  const versionRowsHtml = versions.map(v => {
    const accCount = acceptances.filter(a => a.policyVersion === v.version && a.acceptanceStatus === 'accepted').length;
    const isLocked = accCount > 0;
    
    return `
      <tr>
        <td><strong>${v.version}</strong></td>
        <td>${v.is_material ? `<span style="color:#ef4444; font-weight:700;">${tr('Material', 'Material')}</span>` : `<span style="color:var(--text-secondary);">${tr('Informativo', 'Informative')}</span>`}</td>
        <td>${new Date(v.effective_date).toLocaleDateString()}</td>
        <td>
          ${v.status === 'active' 
            ? `<span class="status-tag approved">${tr('Vigente', 'Active')}</span>` 
            : `<span class="status-tag suspended">${tr('Archivada', 'Archived')}</span>`}
        </td>
        <td><strong>${accCount}</strong> ${tr('aceptaciones', 'acceptances')}</td>
        <td>
          ${isLocked 
            ? `<button class="action-btn-small" style="background:#4b5563; cursor:not-allowed; opacity:0.6;" disabled title="${tr('Bloqueado: Esta versión ya tiene firmas de aceptación.', 'Locked: This version has already been signed by sellers.')}"><i data-lucide="lock" style="width:0.8rem; height:0.8rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${tr('Bloqueado', 'Locked')}</button>`
            : `<button class="action-btn-small approve" onclick="openEditGuidelinesVersionModal('${v.version}')"><i data-lucide="edit" style="width:0.8rem; height:0.8rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${tr('Editar', 'Edit')}</button>`}
        </td>
      </tr>
    `;
  }).join('');

  // 2. Filters
  if (!window.adminGuidelinesFilterVersion) window.adminGuidelinesFilterVersion = 'all';
  if (!window.adminGuidelinesFilterStatus) window.adminGuidelinesFilterStatus = 'all';
  if (!window.adminGuidelinesSearchQuery) window.adminGuidelinesSearchQuery = '';

  const activeVer = versions.find(v => v.status === 'active') || { version: 'none' };

  // Calculate lists of sellers
  const sellerRows = profiles.map(prof => {
    const userObj = users.find(u => u.id === prof.user_id) || { name: 'Desconocido', email: '' };
    const acc = acceptances.find(a => a.sellerId === prof.id && a.policyVersion === activeVer.version && a.acceptanceStatus === 'accepted');
    
    let statusTextHtml = '';
    let acceptDate = '-';
    let acceptLang = '-';
    let acceptIp = '-';
    let acceptSource = '-';
    let filterStatusType = 'pending';

    if (acc) {
      statusTextHtml = `<span class="status-tag approved">${tr('Aceptado', 'Accepted')}</span>`;
      acceptDate = new Date(acc.acceptedAt).toLocaleString();
      acceptLang = acc.policyLanguage ? acc.policyLanguage.toUpperCase() : 'ES';
      acceptIp = acc.ipAddress || '-';
      acceptSource = acc.acceptanceSource || '-';
      filterStatusType = 'accepted';
    } else {
      if (prof.requiresGuidelinesReacceptance) {
        statusTextHtml = `<span class="status-tag suspended" style="background:#f59e0b; color:black; font-weight:700;">${tr('Reaceptación Requerida', 'Reacceptance Required')}</span>`;
        filterStatusType = 'reacceptance';
      } else {
        statusTextHtml = `<span class="status-tag suspended">${tr('Falta Aceptar', 'Pending')}</span>`;
        filterStatusType = 'pending';
      }
    }

    const isSuspendedFromPublishing = prof.publishing_suspended === true;

    return {
      profId: prof.id,
      storeName: prof.store_name,
      ownerName: userObj.name,
      ownerEmail: userObj.email,
      version: acc ? acc.policyVersion : activeVer.version,
      statusHtml: statusTextHtml,
      statusType: filterStatusType,
      date: acceptDate,
      lang: acceptLang,
      ip: acceptIp,
      source: acceptSource,
      isSuspended: isSuspendedFromPublishing
    };
  });

  // Apply filters
  const filteredSellers = sellerRows.filter(s => {
    const matchVersion = window.adminGuidelinesFilterVersion === 'all' || s.version === window.adminGuidelinesFilterVersion;
    const matchStatus = window.adminGuidelinesFilterStatus === 'all' || s.statusType === window.adminGuidelinesFilterStatus;
    
    const query = window.adminGuidelinesSearchQuery.toLowerCase();
    const matchSearch = s.storeName.toLowerCase().includes(query) || s.ownerName.toLowerCase().includes(query) || s.ownerEmail.toLowerCase().includes(query);
    
    return matchVersion && matchStatus && matchSearch;
  });

  const sellerRowsHtml = filteredSellers.map(s => {
    const actionBtnHtml = s.isSuspended 
      ? `<button class="action-btn-small approve" style="background:#10b981; border-color:#10b981;" onclick="toggleSellerPublishingSuspension('${s.profId}', false)">${tr('Reactivar', 'Reinstate')}</button>`
      : `<button class="action-btn-small reject" style="background:#ef4444; border-color:#ef4444;" onclick="toggleSellerPublishingSuspension('${s.profId}', true)">${tr('Suspender', 'Suspend')}</button>`;
    
    return `
      <tr>
        <td>
          <strong>${s.storeName}</strong><br>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${s.ownerName} (${s.ownerEmail})</span>
        </td>
        <td>${s.statusHtml}</td>
        <td><code>${s.version}</code></td>
        <td>${s.date}</td>
        <td><strong style="color:var(--gold-light);">${s.lang}</strong></td>
        <td>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${s.source}</span><br>
          <span style="font-size:0.7rem; color:var(--text-muted);">${s.ip}</span>
        </td>
        <td>${actionBtnHtml}</td>
      </tr>
    `;
  }).join('');

  const versionOptions = versions.map(v => `<option value="${v.version}" ${window.adminGuidelinesFilterVersion === v.version ? 'selected' : ''}>${v.version}</option>`).join('');

  container.innerHTML = `
    <div style="font-family:var(--font-body, sans-serif);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h3>${tr('Gestión de Reglas y Directrices para Vendedores', 'Seller Rules & Guidelines Management')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('Controla las políticas del marketplace, crea nuevas versiones materiales e informativas y audita las aceptaciones.', 'Control marketplace guidelines, release material or informative updates, and audit acceptances.')}
          </p>
        </div>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="openCreateGuidelinesVersionModal()">
          <i data-lucide="plus-circle" style="width:1rem; height:1rem; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${tr('Crear Nueva Versión', 'Create New Version')}
        </button>
      </div>

      <!-- Sección 1: Versiones -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header">
          <h4>${tr('Versiones de Políticas y Reglas', 'Guidelines Versions & Policies')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('Versión', 'Version')}</th>
                <th>${tr('Tipo de Cambio', 'Change Type')}</th>
                <th>${tr('Vigente Desde', 'Effective Since')}</th>
                <th>${tr('Estado', 'Status')}</th>
                <th>${tr('Firmas Realizadas', 'Signed Acceptances')}</th>
                <th>${tr('Acciones', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${versionRowsHtml || `<tr><td colspan="6" style="text-align:center;">${tr('No hay versiones cargadas.', 'No versions loaded.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sección 2: Aceptación y Firmas de Vendedores -->
      <div class="db-table-card">
        <div class="db-table-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding:1.2rem;">
          <h4 style="margin:0;">${tr('Auditoría de Aceptación de Vendedores', 'Sellers Acceptance Audit Log')}</h4>
          <button class="btn-large secondary-btn" style="width:auto; padding:0.4rem 1rem; font-size:0.8rem; border-color:var(--border-metallic-yellow);" onclick="exportGuidelinesAcceptancesCSV()">
            <i data-lucide="download" style="width:0.85rem; height:0.85rem; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${tr('Exportar a CSV', 'Export to CSV')}
          </button>
        </div>

        <!-- Filtros interactivos -->
        <div style="background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border-color); padding:1rem; display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
          <div style="display:flex; flex-direction:column; gap:0.25rem; min-width:150px;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('Filtrar por Versión', 'Filter by Version')}</label>
            <select id="flt-guide-version" onchange="applyAdminGuidelinesFilter('version', this.value)" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
              <option value="all" ${window.adminGuidelinesFilterVersion === 'all' ? 'selected' : ''}>${tr('Todas', 'All')}</option>
              ${versionOptions}
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.25rem; min-width:150px;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('Estado Firma', 'Signature Status')}</label>
            <select id="flt-guide-status" onchange="applyAdminGuidelinesFilter('status', this.value)" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
              <option value="all" ${window.adminGuidelinesFilterStatus === 'all' ? 'selected' : ''}>${tr('Todos los Estados', 'All Statuses')}</option>
              <option value="accepted" ${window.adminGuidelinesFilterStatus === 'accepted' ? 'selected' : ''}>${tr('Aceptado (Vigente)', 'Accepted (Active)')}</option>
              <option value="reacceptance" ${window.adminGuidelinesFilterStatus === 'reacceptance' ? 'selected' : ''}>${tr('Reaceptación Requerida', 'Reacceptance Required')}</option>
              <option value="pending" ${window.adminGuidelinesFilterStatus === 'pending' ? 'selected' : ''}>${tr('Falta Aceptar (Nuevo)', 'Pending Accept (New)')}</option>
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1; min-width:200px;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('Buscar Vendedor', 'Search Seller')}</label>
            <input type="text" id="flt-guide-search" value="${window.adminGuidelinesSearchQuery}" oninput="applyAdminGuidelinesFilter('search', this.value)" placeholder="${tr('Nombre de tienda, usuario o email...', 'Store name, owner, or email...')}" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
          </div>
        </div>

        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('Vendedor / Tienda', 'Seller / Store')}</th>
                <th>${tr('Estado Firma', 'Signature Status')}</th>
                <th>${tr('Versión Aceptada', 'Accepted Version')}</th>
                <th>${tr('Fecha Firma', 'Signing Date')}</th>
                <th>${tr('Idioma', 'Language')}</th>
                <th>${tr('Origen y Auditoría IP', 'Source & IP Audit')}</th>
                <th>${tr('Acción Capacidad', 'Publishing Action')}</th>
              </tr>
            </thead>
            <tbody>
              ${sellerRowsHtml || `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-secondary);">${tr('No se encontraron registros de vendedores para el filtro seleccionado.', 'No seller records found for the selected filter.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function applyAdminGuidelinesFilter(filterType, value) {
  if (filterType === 'version') window.adminGuidelinesFilterVersion = value;
  else if (filterType === 'status') window.adminGuidelinesFilterStatus = value;
  else if (filterType === 'search') window.adminGuidelinesSearchQuery = value;
  renderAdminDashboard();
}

function toggleSellerPublishingSuspension(profId, doSuspend) {
  const profiles = db.get('seller_profiles');
  const prof = profiles.find(p => p.id === profId);
  if (prof) {
    prof.publishing_suspended = doSuspend;
    db.set('seller_profiles', profiles);
    
    const userObj = db.get('users').find(u => u.id === prof.user_id);
    const notifications = db.get('notifications') || [];
    if (doSuspend) {
      notifications.push({
        id: "not_" + Math.random().toString(36).substr(2, 9),
        user_id: prof.user_id,
        title: tr("Capacidad de Publicación Suspendida", "Publishing Privileges Suspended"),
        message: tr(
          "El Administrador ha suspendido temporalmente tu capacidad para publicar nuevos artículos.",
          "The Administrator has temporarily suspended your ability to list new products."
        ),
        read: false,
        created_at: new Date().toISOString()
      });
      showToast(tr("Publicación del vendedor suspendida.", "Seller publishing suspended."), 'info');
    } else {
      notifications.push({
        id: "not_" + Math.random().toString(36).substr(2, 9),
        user_id: prof.user_id,
        title: tr("Capacidad de Publicación Reactivada", "Publishing Privileges Reinstated"),
        message: tr(
          "El Administrador ha reactivado tu capacidad para publicar artículos. Asegúrate de cumplir con todas las directrices.",
          "The Administrator has reinstated your ability to list items. Make sure to adhere to all guidelines."
        ),
        read: false,
        created_at: new Date().toISOString()
      });
      showToast(tr("Publicación del vendedor reactivada.", "Seller publishing reinstated."), 'success');
    }
    db.set('notifications', notifications);
    renderAdminDashboard();
  }
}

function exportGuidelinesAcceptancesCSV() {
  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const profiles = db.get('seller_profiles') || [];
  const users = db.get('users') || [];

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID Aceptacion,ID Vendedor,Nombre Tienda,Nombre Propietario,Email,Version Politica,Idioma,Porcentaje Comision,Fecha Aceptado,Origen,IP\n";

  acceptances.forEach(a => {
    const prof = profiles.find(p => p.id === a.sellerId) || { store_name: 'N/A' };
    const user = users.find(u => u.id === a.userId) || { name: 'N/A', email: 'N/A' };
    
    const row = [
      a.id,
      a.sellerId,
      `"${prof.store_name.replace(/"/g, '""')}"`,
      `"${user.name.replace(/"/g, '""')}"`,
      user.email,
      a.policyVersion,
      a.policyLanguage,
      a.platformFeePercentage + "%",
      a.acceptedAt,
      a.acceptanceSource,
      a.ipAddress
    ].join(",");
    
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `historial_aceptacion_reglas_vendedores_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast(tr("Historial de aceptaciones exportado en formato CSV.", "Acceptance history exported in CSV format."), 'success');
}

function openCreateGuidelinesVersionModal() {
  const versions = db.get('seller_guidelines_versions') || [];
  let nextVer = "seller-policy-v1.0";
  if (versions.length > 0) {
    const lastVer = versions[versions.length - 1].version;
    const numMatch = lastVer.match(/v(\d+(\.\d+)?)/);
    if (numMatch) {
      const nextNum = (parseFloat(numMatch[1]) + 0.1).toFixed(1);
      nextVer = `seller-policy-v${nextNum}`;
    }
  }

  const defaultContentEs = `1. Comisiones: Geek Collector cobra una comisión del 5% sobre el subtotal de artículos vendidos.\n2. Pagos: Tarifas de Stripe (2.9% + $0.30) asumidas por el vendedor.\n3. Envíos y Devoluciones: El vendedor es responsable de enviar el artículo a tiempo utilizando Shippo o su transportista.\n4. Conducta: Está prohibido vender artículos prohibidos, falsificaciones o acosar a los compradores.`;
  const defaultContentEn = `1. Fees: Geek Collector charges a 5% commission on the items subtotal.\n2. Payouts: Stripe fees (2.9% + $0.30) are assumed by the seller.\n3. Shipping & Refunds: The seller is responsible for timely shipping using Shippo or their carrier.\n4. Conduct: Selling prohibited items, counterfeits, or harassing buyers is forbidden.`;

  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem; font-family:var(--font-body, sans-serif); color:var(--text-primary); max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
      <div class="checkout-input-wrapper">
        <label>Identificador de Versión</label>
        <input type="text" id="frm-ver-id" value="${nextVer}" placeholder="Ej: seller-policy-v1.1">
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Título (Español)</label>
          <input type="text" id="frm-ver-title-es" value="Reglas para Vendedores de Geek Collector" placeholder="Título en español">
        </div>
        <div class="checkout-input-wrapper">
          <label>Título (Inglés)</label>
          <input type="text" id="frm-ver-title-en" value="Geek Collector Seller Guidelines" placeholder="Título en inglés">
        </div>
      </div>

      <div class="checkout-input-wrapper">
        <label>Contenido del Documento (Español)</label>
        <textarea id="frm-ver-content-es" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${defaultContentEs}</textarea>
      </div>

      <div class="checkout-input-wrapper">
        <label>Contenido del Documento (Inglés)</label>
        <textarea id="frm-ver-content-en" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${defaultContentEn}</textarea>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Fecha de Entrada en Vigor</label>
          <input type="datetime-local" id="frm-ver-date" value="${new Date().toISOString().slice(0, 16)}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Tipo de Cambio</label>
          <select id="frm-ver-material">
            <option value="true">Material (Requiere reaceptación obligatoria)</option>
            <option value="false">Informativo (Sin bloqueo inmediato)</option>
          </select>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.25rem;">
        <input type="checkbox" id="frm-ver-active" checked>
        <label for="frm-ver-active" style="font-size:0.8rem; cursor:pointer; color:var(--text-secondary);">Marcar como versión vigente (Archivará la versión activa anterior)</label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="toggleGlobalModal(false)">Cancelar</button>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="submitCreateGuidelinesVersion()">Publicar Versión</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, "Crear Nueva Versión de Reglas", html);
  lucide.createIcons();
}

function submitCreateGuidelinesVersion() {
  const version = document.getElementById('frm-ver-id').value.trim();
  const titleEs = document.getElementById('frm-ver-title-es').value.trim();
  const titleEn = document.getElementById('frm-ver-title-en').value.trim();
  const contentEs = document.getElementById('frm-ver-content-es').value.trim();
  const contentEn = document.getElementById('frm-ver-content-en').value.trim();
  const dateVal = document.getElementById('frm-ver-date').value;
  const isMaterial = document.getElementById('frm-ver-material').value === 'true';
  const makeActive = document.getElementById('frm-ver-active').checked;

  if (!version || !titleEs || !titleEn || !contentEs || !contentEn || !dateVal) {
    showToast("Por favor completa todos los campos para crear la política.", "error");
    return;
  }

  const versions = db.get('seller_guidelines_versions') || [];
  if (versions.some(v => v.version === version)) {
    showToast(`El identificador de versión "${version}" ya existe. Elige uno diferente.`, "error");
    return;
  }

  if (makeActive) {
    versions.forEach(v => {
      if (v.status === 'active') v.status = 'archived';
    });
  }

  const docHash = "hash_" + Math.random().toString(36).substr(2, 9);
  const newVer = {
    version: version,
    title_es: titleEs,
    title_en: titleEn,
    content_es: contentEs,
    content_en: contentEn,
    effective_date: new Date(dateVal).toISOString(),
    is_material: isMaterial,
    requires_reacceptance: isMaterial,
    status: makeActive ? "active" : "archived",
    document_hash: docHash,
    created_at: new Date().toISOString()
  };

  versions.push(newVer);
  db.set('seller_guidelines_versions', versions);

  if (makeActive && isMaterial) {
    const profiles = db.get('seller_profiles') || [];
    profiles.forEach(p => {
      p.requiresGuidelinesReacceptance = true;
    });
    db.set('seller_profiles', profiles);

    const users = db.get('users') || [];
    const notifications = db.get('notifications') || [];
    
    users.forEach(u => {
      if (u.role === 'seller') {
        notifications.push({
          id: "not_" + Math.random().toString(36).substr(2, 9),
          user_id: u.id,
          title: tr("Actualización de Reglas de Vendedor", "Seller Guidelines Updated"),
          message: tr(
            `Hemos actualizado las reglas para vendedores (${version}). Debes revisar y aceptar la nueva versión antes de publicar artículos adicionales.`,
            `We updated the Seller Guidelines (${version}). You must review and accept the new version before listing additional items.`
          ),
          read: false,
          created_at: new Date().toISOString()
        });
      }
    });
    db.set('notifications', notifications);
  }

  const auditLogs = db.get('compliance_audit_logs') || [];
  auditLogs.push({
    id: "aud_" + Date.now(),
    event: "SELLER_GUIDELINES_VERSION_CREATED",
    userId: state.currentUser ? state.currentUser.id : "usr_admin_1",
    policyVersion: version,
    timestamp: new Date().toISOString(),
    details: `Nueva versión de reglas ${version} publicada (${isMaterial ? 'Material' : 'Informativo'}).`
  });
  db.set('compliance_audit_logs', auditLogs);

  toggleGlobalModal(false);
  showToast(tr("¡Nueva versión de reglas publicada con éxito!", "New guidelines version published successfully!"), "success");
  renderAdminDashboard();
}

function openEditGuidelinesVersionModal(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const ver = versions.find(v => v.version === version);
  if (!ver) return;

  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAcceptances = acceptances.some(a => a.policyVersion === version && a.acceptanceStatus === 'accepted');

  if (hasAcceptances) {
    showToast(tr("Esta versión ya tiene aceptaciones y no se puede editar.", "This version has acceptances and cannot be edited."), "error");
    return;
  }

  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem; font-family:var(--font-body, sans-serif); color:var(--text-primary); max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
      <div class="checkout-input-wrapper">
        <label>Identificador de Versión (Bloqueado)</label>
        <input type="text" id="frm-ver-id" value="${ver.version}" disabled style="background:#ddd; cursor:not-allowed; color:#555;">
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Título (Español)</label>
          <input type="text" id="frm-ver-title-es" value="${ver.title_es}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Título (Inglés)</label>
          <input type="text" id="frm-ver-title-en" value="${ver.title_en}">
        </div>
      </div>

      <div class="checkout-input-wrapper">
        <label>Contenido del Documento (Español)</label>
        <textarea id="frm-ver-content-es" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${ver.content_es}</textarea>
      </div>

      <div class="checkout-input-wrapper">
        <label>Contenido del Documento (Inglés)</label>
        <textarea id="frm-ver-content-en" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${ver.content_en}</textarea>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>Fecha de Entrada en Vigor</label>
          <input type="datetime-local" id="frm-ver-date" value="${new Date(ver.effective_date).toISOString().slice(0, 16)}">
        </div>
        <div class="checkout-input-wrapper">
          <label>Tipo de Cambio</label>
          <select id="frm-ver-material">
            <option value="true" ${ver.is_material ? 'selected' : ''}>Material (Requiere reaceptación obligatoria)</option>
            <option value="false" ${!ver.is_material ? 'selected' : ''}>Informativo (Sin bloqueo inmediato)</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="toggleGlobalModal(false)">Cancelar</button>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="submitEditGuidelinesVersion('${version}')">Guardar Cambios</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, "Editar Versión de Reglas", html);
  lucide.createIcons();
}

function submitEditGuidelinesVersion(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const verIndex = versions.findIndex(v => v.version === version);
  if (verIndex === -1) return;

  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAcceptances = acceptances.some(a => a.policyVersion === version && a.acceptanceStatus === 'accepted');
  if (hasAcceptances) {
    showToast(tr("Esta versión ya tiene aceptaciones y no se puede editar.", "This version has acceptances and cannot be edited."), "error");
    return;
  }

  const titleEs = document.getElementById('frm-ver-title-es').value.trim();
  const titleEn = document.getElementById('frm-ver-title-en').value.trim();
  const contentEs = document.getElementById('frm-ver-content-es').value.trim();
  const contentEn = document.getElementById('frm-ver-content-en').value.trim();
  const dateVal = document.getElementById('frm-ver-date').value;
  const isMaterial = document.getElementById('frm-ver-material').value === 'true';

  if (!titleEs || !titleEn || !contentEs || !contentEn || !dateVal) {
    showToast("Por favor completa todos los campos para editar la política.", "error");
    return;
  }

  versions[verIndex].title_es = titleEs;
  versions[verIndex].title_en = titleEn;
  versions[verIndex].content_es = contentEs;
  versions[verIndex].content_en = contentEn;
  versions[verIndex].effective_date = new Date(dateVal).toISOString();
  versions[verIndex].is_material = isMaterial;
  versions[verIndex].requires_reacceptance = isMaterial;

  db.set('seller_guidelines_versions', versions);

  const auditLogs = db.get('compliance_audit_logs') || [];
  auditLogs.push({
    id: "aud_" + Date.now(),
    event: "SELLER_GUIDELINES_VERSION_EDITED",
    userId: state.currentUser ? state.currentUser.id : "usr_admin_1",
    policyVersion: version,
    timestamp: new Date().toISOString(),
    details: `Edición de reglas versión ${version}.`
  });
  db.set('compliance_audit_logs', auditLogs);

  toggleGlobalModal(false);
  showToast(tr("¡Cambios guardados con éxito!", "Changes saved successfully!"), "success");
  renderAdminDashboard();
}
