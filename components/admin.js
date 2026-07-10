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
          <h2 class="section-title">${tr('admin.dashboard_title')}</h2>
          <p style="color:var(--text-secondary); margin-top:0.25rem;">${tr('admin.dashboard_desc')}</p>
        </div>
        <button class="btn-large secondary-btn" style="width:auto; padding:0.6rem 1.2rem; font-size:0.85rem;" onclick="router.navigate('seller')">
          <i data-lucide="store" style="width:1rem;height:1rem;display:inline-block;vertical-align:middle;margin-right:0.3rem;color:var(--gold-light);"></i>
          ${tr('admin.go_to_seller_store_btn')}
        </button>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Menu -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeAdminTab === 'overview' ? 'active' : ''}" onclick="setAdminTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_overview')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'users' ? 'active' : ''}" onclick="setAdminTab('users')">
            <i data-lucide="users" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_users')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'approvals' ? 'active' : ''}" onclick="setAdminTab('approvals')">
            <i data-lucide="user-check" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_approvals')} (${pendingProducts.length + pendingSellers.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'compliance' ? 'active' : ''}" onclick="setAdminTab('compliance')">
            <i data-lucide="shield-alert" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_compliance_strikes')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'shipping' ? 'active' : ''}" onclick="setAdminTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_shipping_management')} (${shipments.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'products' ? 'active' : ''}" onclick="setAdminTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_catalog_inventory')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'transactions' ? 'active' : ''}" onclick="setAdminTab('transactions')">
            <i data-lucide="dollar-sign" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_sales_payouts')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'commissions' ? 'active' : ''}" onclick="setAdminTab('commissions')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_commissions')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'guidelines' ? 'active' : ''}" onclick="setAdminTab('guidelines')">
            <i data-lucide="shield-check" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_guidelines')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'reviews' ? 'active' : ''}" onclick="setAdminTab('reviews')">
            <i data-lucide="message-square" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_moderate_reviews')} (${reviews.length})
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'marketing' ? 'active' : ''}" onclick="setAdminTab('marketing')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_banners_coupons')}
          </a>
          <a class="db-menu-item ${window.activeAdminTab === 'notifications' ? 'active' : ''}" onclick="setAdminTab('notifications')">
            <i data-lucide="bell" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('admin.tab_alert_logs')}
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
          <div class="stat-card-title">${tr('admin.stats_sales_gross')}</div>
          <div class="stat-card-value">$${data.totalSalesGross.toFixed(2)}</div>
          <div class="stat-card-change up">${tr('admin.stats_sales_gross_desc')}</div>
        </div>
        <div class="stat-card" style="border-color: var(--gold-light);">
          <div class="stat-card-title" style="color:var(--gold-light);">${tr('admin.stats_platform_commission')}</div>
          <div class="stat-card-value">$${data.totalCommissions.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">${tr('admin.stats_platform_commission_desc')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">${tr('admin.stats_pending_approvals')}</div>
          <div class="stat-card-value">${data.pendingProducts.length + data.pendingSellers.length}</div>
          <div class="stat-card-change" style="color:#fbbf24;">${tr('admin.stats_pending_approvals_desc', { sellers: data.pendingSellers.length, items: data.pendingProducts.length })}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">${tr('admin.stats_active_orders')}</div>
          <div class="stat-card-value">${data.pendingOrders}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">${tr('admin.stats_active_orders_desc')}</div>
        </div>
      </div>

      <!-- CSS Charts for Sales Analytics -->
      <div class="chart-container">
        <div class="chart-title">${tr('admin.chart_title')}</div>
        <div class="chart-bars-wrapper">
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 40px;" data-val="$450.00"></div>
            <div class="chart-bar-label">${tr('months.jan')}</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 60px;" data-val="$680.00"></div>
            <div class="chart-bar-label">${tr('months.feb')}</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 90px;" data-val="$1,020.00"></div>
            <div class="chart-bar-label">${tr('months.mar')}</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 120px;" data-val="$1,450.00"></div>
            <div class="chart-bar-label">${tr('months.apr')}</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 160px;" data-val="$2,100.00"></div>
            <div class="chart-bar-label">${tr('months.may')}</div>
          </div>
          <div class="chart-bar-col">
            <div class="chart-bar-value" style="height: 200px;" data-val="$2,850.00"></div>
            <div class="chart-bar-label">${tr('months.jun')}</div>
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
          <h3>${tr('admin.users_stores_title')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('admin.users_stores_subtitle')}
          </p>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header">
          <h4 style="margin:0; color:var(--text-primary);">${tr('admin.stats_active_users')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_user_name')}</th>
                <th>${tr('admin.col_email')}</th>
                <th>${tr('admin.col_role')}</th>
                <th>${tr('admin.col_status')}</th>
                <th>${tr('admin.audit_col_date')}</th>
                <th style="text-align:right;">${tr('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${usersList.map(u => {
                const statusTag = u.status === 'suspended' ? 
                  `<span class="status-tag rejected">${tr('admin.status_suspended')}</span>` : 
                  `<span class="status-tag approved">${tr('admin.status_active')}</span>`;
                
                const roleTag = u.role === 'admin' ? 
                  `<span style="color:var(--gold-light); font-weight:700;">Admin</span>` : 
                  `<span>${tr('nav.buyer')}</span>`;
                  
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
                          ${u.status === 'suspended' ? tr('admin.btn_reactivate') : tr('admin.btn_suspend')}
                        </button>
                      ` : tr('admin.no_actions')}
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
          <h4 style="margin:0; color:var(--text-primary);">${tr('admin.guidelines_history_title')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_store')}</th>
                <th>${tr('admin.table_seller')}</th>
                <th>${tr('admin.col_plan')}</th>
                <th>${tr('admin.col_plan_commission')}</th>
                <th>${tr('admin.col_connect_id')}</th>
                <th style="text-align:right;">${tr('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${profiles.map(p => {
                const owner = usersList.find(u => u.id === p.user_id);
                const commissionPercent = p.commission_rate !== undefined ? `${(p.commission_rate * 100).toFixed(0)}%` : 'N/A';
                
                const stripeStatus = p.stripe_connect_id ? 
                  `<span class="status-tag approved" title="${p.stripe_connect_id}">${tr('admin.stripe_connected_status')}</span>` : 
                  `<span class="status-tag pending">${tr('admin.stripe_disconnected_status')}</span>`;
                  
                const planTag = p.subscription_plan === 'Elite' ? 
                  `<span style="color:var(--gold-light); font-weight:700;">★ Elite</span>` : 
                  `<span>Free</span>`;
                
                return `
                  <tr>
                    <td><strong>${p.store_name}</strong></td>
                    <td>${owner ? owner.email : tr('admin.unknown')}</td>
                    <td>${planTag}</td>
                    <td>${commissionPercent}</td>
                    <td>${stripeStatus}</td>
                    <td style="text-align:right; display:flex; gap:0.4rem; justify-content:flex-end;">
                      <button class="action-btn-small" style="background:var(--border-metallic-yellow); color:#000000;" 
                        onclick="adminEditStorePlan('${p.id}')">
                        ${tr('admin.btn_change_plan')}
                      </button>
                      <button class="action-btn-small approve" onclick="adminEditStoreCommission('${p.id}')">
                        % ${tr('admin.col_plan_commission')}
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
        <h3>${tr('admin.approvals_sellers_title', { count: data.pendingSellers.length })}</h3>
        <div class="db-table-card" style="margin-top:1rem;">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>${tr('admin.col_seller_name')}</th>
                  <th>${tr('admin.col_email')}</th>
                  <th>${tr('admin.col_proposed_store')}</th>
                  <th>${tr('admin.col_description')}</th>
                  <th>${tr('admin.col_registration_date')}</th>
                  <th>${tr('admin.col_management')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.pendingSellers.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">${tr('admin.no_pending_sellers')}</td>
                  </tr>
                ` : data.pendingSellers.map(sel => {
                  const u = data.users.find(usr => usr.id === sel.user_id);
                  return `
                    <tr>
                      <td><strong>${u ? u.name : tr('admin.col_seller')}</strong></td>
                      <td>${u ? u.email : ''}</td>
                      <td>${sel.store_name}</td>
                      <td style="max-width:250px; font-size:0.85rem; color:var(--text-secondary);">${sel.description}</td>
                      <td>${new Date(u.created_at).toLocaleDateString()}</td>
                      <td style="display:flex; gap:0.5rem;">
                        <button class="action-btn-small approve" onclick="approveSellerProfile('${sel.user_id}', true)">${tr('admin.btn_approve')}</button>
                        <button class="action-btn-small reject" onclick="approveSellerProfile('${sel.user_id}', false)">${tr('admin.btn_reject')}</button>
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
        <h3>${tr('admin.approvals_products_title', { count: data.pendingProducts.length })}</h3>
        <div class="db-table-card" style="margin-top:1rem;">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>${tr('admin.col_item_name')}</th>
                  <th>${tr('admin.col_brand_category')}</th>
                  <th>${tr('admin.col_condition')}</th>
                  <th>${tr('admin.col_price')}</th>
                  <th>${tr('admin.col_seller')}</th>
                  <th>${tr('admin.col_management')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.pendingProducts.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">${tr('admin.no_pending_products')}</td>
                  </tr>
                ` : data.pendingProducts.map(p => {
                  const sName = data.profiles.find(sp => sp.user_id === p.seller_id)?.store_name || tr('admin.col_seller');
                  return `
                    <tr>
                      <td><strong>${p.title}</strong></td>
                      <td>${p.brand} / ${p.category}</td>
                      <td>${p.condition}</td>
                      <td style="font-weight:600; color:var(--text-primary);">$${p.price.toFixed(2)}</td>
                      <td>${sName}</td>
                      <td style="display:flex; gap:0.5rem;">
                        <button class="action-btn-small approve" onclick="approveProduct('${p.id}', true)">${tr('admin.btn_approve')}</button>
                        <button class="action-btn-small reject" onclick="approveProduct('${p.id}', false)">${tr('admin.btn_reject')}</button>
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
        <h3>${tr('admin.shipping_title')}</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          ${tr('admin.shipping_subtitle')}
        </p>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_label_order')}</th>
                <th>${tr('admin.col_seller_buyer')}</th>
                <th>${tr('admin.col_carrier_service')}</th>
                <th>${tr('admin.col_shipping_cost')}</th>
                <th>${tr('admin.col_additional_insurance')}</th>
                <th>${tr('admin.col_packing_evidence')}</th>
                <th>${tr('admin.col_shippo_status')}</th>
                <th>${tr('admin.col_control_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.shipments.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); font-style:italic;">${tr('admin.no_shipments')}</td>
                </tr>
              ` : data.shipments.map(s => {
                const evidence = evidenceLogs.find(ev => ev.shipment_id === s.id);
                const sellerName = data.profiles.find(p => p.user_id === s.seller_id)?.store_name || tr('admin.col_seller');
                const buyerName = data.users.find(u => u.id === s.buyer_id)?.name || tr('admin.col_buyer');

                return `
                  <tr>
                    <td>
                      <strong>${s.id}</strong>
                      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">${tr('seller.label_order_id')} <code>${s.order_id}</code></div>
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
                      ${s.insurance_amount > 0 ? tr('admin.insurance_active', { amount: s.insurance_amount.toFixed(2) }) : tr('admin.insurance_none')}
                    </td>
                    <td>
                      ${evidence ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                          <img src="${evidence.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid var(--border-metallic-yellow);" onclick="viewEvidencePhoto('${evidence.image_url}')">
                          <span style="font-size:0.6rem; color:#10b981; font-weight:700;">OK</span>
                        </div>
                      ` : `<span style="color:#ef4444; font-size:0.75rem; font-weight:700;">⚠️ ${tr('admin.col_no_photo')}</span>`}
                    </td>
                    <td>
                      <span class="status-tag ${s.status === 'delivered' ? 'approved' : s.status === 'label_generado' ? 'pending' : 'disputed'}" style="font-size:0.7rem; text-transform:uppercase;">
                        ${s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style="display:flex; flex-direction:column; gap:0.4rem;">
                      ${s.status !== 'delivered' && s.status !== 'problema' ? `
                        <button class="action-btn-small reject" style="font-size:0.7rem; padding:0.25rem 0.5rem;" onclick="adminTriggerDisputedShipping('${s.id}')">
                          ${tr('admin.btn_mark_disputed')}
                        </button>
                      ` : ''}

                      ${s.status === 'problema' ? `
                        <button class="action-btn-small approve" style="font-size:0.7rem; padding:0.25rem 0.5rem; background:#10b981; border-color:#10b981;" onclick="adminResolveDisputedShipping('${s.id}')">
                          ${tr('admin.btn_release_escrow')}
                        </button>
                      ` : ''}

                      ${s.status !== 'devuelto' && s.status !== 'delivered' ? `
                        <button class="action-btn-small suspend" style="font-size:0.7rem; padding:0.25rem 0.5rem;" onclick="adminTriggerReturnedShipping('${s.id}')">
                          ${tr('admin.btn_register_return')}
                        </button>
                      ` : ''}

                      <div style="font-size:0.6rem; color:var(--text-muted); text-align:center;">
                        ${s.status === 'delivered' ? tr('admin.funds_liquidated') : tr('admin.payout_held_stripe')}
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
        <h3>${tr('admin.catalog_title', { count: data.products.length })}</h3>
        <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem;" onclick="openAdminAddProductModal()">
          ${tr('admin.btn_publish_official_short')}
        </button>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_item')}</th>
                <th>${tr('admin.col_store_seller')}</th>
                <th>${tr('admin.col_price')}</th>
                <th>${tr('admin.col_stock')}</th>
                <th>${tr('admin.col_inventory_type')}</th>
                <th>${tr('admin.col_status')}</th>
                <th>${tr('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.products.map(p => {
                const sName = p.seller_id === 'usr_admin_1' 
                  ? tr('admin.collectors_shop_official') 
                  : (data.profiles.find(sp => sp.user_id === p.seller_id)?.store_name || tr('admin.col_seller'));
                  
                return `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${sName}</td>
                    <td style="font-weight:600; color:var(--text-primary);">$${p.price.toFixed(2)}</td>
                    <td>${p.stock} u.</td>
                    <td>
                      ${p.is_external_ebay ? `
                        <span class="status-tag disputed" style="font-size:0.7rem; border-color:#002f87; color:#3b82f6;">${tr('admin.inventory_external')}</span>
                      ` : `<span class="status-tag approved" style="font-size:0.7rem; background:none; border:1px solid #10b981; color:#10b981;">${tr('admin.inventory_internal')}</span>`}
                    </td>
                    <td><span class="status-tag ${p.status}">${p.status}</span></td>
                    <td style="display:flex; gap:0.4rem;">
                      <button class="action-btn-small suspend" style="padding:0.25rem 0.5rem;" onclick="openAdminEditProductModal('${p.id}')">${tr('admin.btn_edit')}</button>
                      <button class="action-btn-small reject" style="padding:0.25rem 0.5rem;" onclick="removeProductAdmin('${p.id}')">${tr('admin.btn_delete')}</button>
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
      <h3>${tr('admin.transactions_title')}</h3>
      
      <div class="db-table-card">
        <div class="db-table-header">
          <h4>${tr('admin.transactions_subtitle')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_transaction_id')}</th>
                <th>${tr('admin.col_date')}</th>
                <th>${tr('admin.col_buyer')}</th>
                <th>${tr('admin.col_seller')}</th>
                <th>${tr('admin.col_gross')}</th>
                <th>${tr('admin.col_stripe_fee')}</th>
                <th>${tr('admin.col_platform_commission')}</th>
                <th>${tr('admin.col_status')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.transactions.map(t => {
                const bName = data.users.find(u => u.id === t.buyer_id)?.name || 'Buyer';
                const sName = t.seller_id === 'usr_admin_1' 
                  ? 'Collectors Shop' 
                  : (data.profiles.find(sp => sp.user_id === t.seller_id)?.store_name || tr('admin.col_seller'));

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
      <h3>${tr('admin.reviews_title')}</h3>
      
      <div class="reviews-list" style="margin-top:1.5rem;">
        ${data.reviews.map(r => {
          const item = data.products.find(p => p.id === r.product_id);
          const buyer = data.users.find(u => u.id === r.buyer_id);
          
          return `
            <div class="review-item" style="background:var(--bg-card); padding:1rem; border-radius:8px; border:1px solid var(--border-color); margin-bottom:1rem;">
              <div class="review-header">
                <span style="font-weight:600; color:var(--text-primary);">${tr('admin.review_from', { name: buyer ? buyer.name : 'Usuario' })}</span>
                <span class="status-tag ${r.status === 'approved' ? 'approved' : 'rejected'}">${r.status === 'approved' ? tr('admin.review_active') : tr('admin.review_hidden')}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); margin: 0.2rem 0;">
                ${tr('admin.review_item', { title: item ? item.title : 'Figura' })}
              </div>
              <div style="color:var(--gold-light); margin-bottom:0.5rem;">
                ${drawStarRatingHtml(r.rating)}
              </div>
              <p style="color:var(--text-primary); font-size:0.9rem;">"${r.comment}"</p>
              
              <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:0.75rem;">
                <button class="action-btn-small approve" onclick="moderateReviewAdmin('${r.id}', 'approved')">${tr('admin.btn_enable')}</button>
                <button class="action-btn-small reject" onclick="moderateReviewAdmin('${r.id}', 'rejected')">${tr('admin.btn_hide_censure')}</button>
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
          <h3>${tr('admin.marketing_coupons_title')}</h3>
          <button class="btn-large primary-btn" style="width:auto; padding:0.4rem 0.8rem; font-size:0.85rem;" onclick="openAddCouponModal()">
            ${tr('admin.btn_create_coupon_short')}
          </button>
        </div>

        <div class="db-table-card">
          <div class="db-table-wrapper">
            <table class="db-table">
              <thead>
                <tr>
                  <th>${tr('admin.col_code')}</th>
                  <th>${tr('admin.col_discount_type')}</th>
                  <th>${tr('admin.col_value')}</th>
                  <th>${tr('admin.col_min_purchase')}</th>
                  <th>${tr('admin.col_status')}</th>
                  <th>${tr('admin.col_action')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.coupons.map(c => `
                  <tr>
                    <td><code>${c.code}</code></td>
                    <td>${c.discount_type === 'percentage' ? tr('admin.coupon_percentage') : tr('admin.coupon_fixed')}</td>
                    <td>${c.discount_type === 'percentage' ? `${c.value}%` : `$${c.value}`}</td>
                    <td>$${c.min_purchase.toFixed(2)}</td>
                    <td>
                      <span class="status-tag ${c.active ? 'approved' : 'rejected'}">
                        ${c.active ? tr('admin.status_active') : tr('admin.status_inactive')}
                      </span>
                    </td>
                    <td>
                      <button class="action-btn-small reject" onclick="toggleCouponStatus('${c.code}', ${c.active})">
                        ${c.active ? tr('admin.btn_deactivate') : tr('admin.btn_activate')}
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
        <h3>${tr('admin.marketing_banners_title')}</h3>
        <div class="banners-management-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:1rem;">
          ${data.banners.map(b => `
            <div style="border:1px solid var(--border-color); border-radius:8px; overflow:hidden; background:var(--bg-card);">
              <img src="${b.image}" style="width:100%; height:120px; object-fit:cover;">
              <div style="padding:1rem;">
                <h4 style="margin-bottom:0.25rem;">${b.title}</h4>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">${b.subtitle}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="status-tag ${b.active ? 'approved' : 'rejected'}">${b.active ? tr('admin.status_active') : tr('admin.status_paused_banner')}</span>
                  <button class="action-btn-small suspend" onclick="toggleBannerActive('${b.id}', ${b.active})">
                    ${b.active ? tr('admin.btn_pause') : tr('admin.btn_activate')}
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
          <h3>${tr('admin.compliance_title')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">${tr('admin.compliance_subtitle')}</p>
        </div>
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1rem;" onclick="ComplianceEngine.runFulfillmentChecker()">
          <i data-lucide="refresh-cw" style="width:1rem;height:1rem;"></i> ${tr('admin.btn_force_audit')}
        </button>
      </div>

      <!-- Sellers in Risk -->
      <div class="db-table-card" style="margin-bottom: 2rem;">
        <div class="db-table-header" style="background:var(--bg-lighter);">
          <h4 style="margin:0;">${tr('admin.risky_sellers_title')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_seller')}</th>
                <th>${tr('admin.col_reliability')}</th>
                <th>${tr('admin.col_strikes')}</th>
                <th>${tr('admin.col_delayed_shipping')}</th>
                <th>${tr('admin.col_suspension_status')}</th>
                <th>${tr('admin.col_admin_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${riskySellers.length === 0 ? `
                <tr><td colspan="6" style="text-align:center; padding:2rem;">${tr('admin.all_sellers_optimal')}</td></tr>
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
                      ${p.banned_permanently ? `<span class="status-tag rejected">${tr('admin.banned_permanent')}</span>` :
                        p.suspension_until && new Date(p.suspension_until) > new Date() ? 
                        `<span class="status-tag pending">${tr('admin.suspended_until', { date: new Date(p.suspension_until).toLocaleDateString() })}</span>` : 
                        `<span class="status-tag approved">${tr('admin.status_active_seller')}</span>`
                      }
                    </td>
                    <td style="display:flex; gap:0.5rem; flex-direction:column;">
                      <button class="action-btn-small approve" onclick="adminRemoveStrike('${p.id}')">${tr('admin.btn_remove_strike')}</button>
                      ${!p.banned_permanently ? `<button class="action-btn-small suspend" onclick="adminForceBan('${p.id}')">${tr('admin.btn_ban_account')}</button>` : ''}
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
          <h4 style="margin:0;">${tr('admin.audit_logs_title')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_date')}</th>
                <th>${tr('admin.col_seller')} ID</th>
                <th>${tr('admin.col_order_item')}</th>
                <th>${tr('admin.col_event')}</th>
                <th>${tr('admin.col_details')}</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.length === 0 ? `
                <tr><td colspan="5" style="text-align:center; padding:2rem;">${tr('admin.no_audit_logs')}</td></tr>
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
  if(!confirm(tr('admin.confirm_remove_strike'))) return;
  const profiles = db.get('seller_profiles');
  const idx = profiles.findIndex(p => p.id === sellerId);
  if (idx > -1 && profiles[idx].active_strikes > 0) {
    profiles[idx].active_strikes -= 1;
    if (profiles[idx].active_strikes < 4) profiles[idx].banned_permanently = false;
    
    // Recalculate
    ComplianceEngine.recalculateReliability(profiles[idx]);
    db.set('seller_profiles', profiles);
    showToast(tr("admin.strike_removed_toast"), 'success');
    renderAdminDashboard();
  }
}

function adminForceBan(sellerId) {
  if(!confirm(tr('admin.confirm_force_ban'))) return;
  const profiles = db.get('seller_profiles');
  const idx = profiles.findIndex(p => p.id === sellerId);
  if (idx > -1) {
    profiles[idx].banned_permanently = true;
    profiles[idx].active_strikes = 4;
    ComplianceEngine.recalculateReliability(profiles[idx]);
    db.set('seller_profiles', profiles);
    
    // Auto reject all their pending products or set approved to pending maybe?
    // Not done here for brevity, but good practice
    
    showToast(tr("admin.seller_banned_toast"), 'success');
    renderAdminDashboard();
  }
}


function renderAdminNotificationsTab(container) {
  const notifications = db.get('notifications') || [];
  const users = db.get('users');

  container.innerHTML = `
    <div>
      <div style="margin-bottom:1.5rem;">
        <h3>${tr('admin.notifications_title')}</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">${tr('admin.notifications_subtitle')}</p>
      </div>

      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_recipient')}</th>
                <th>${tr('admin.col_type')}</th>
                <th>${tr('admin.col_contact')}</th>
                <th>${tr('admin.col_message_sent')}</th>
                <th>${tr('admin.col_sent_date')}</th>
                <th>${tr('admin.col_status')}</th>
              </tr>
            </thead>
            <tbody>
              ${notifications.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted); font-style:italic;">
                    ${tr('admin.no_alerts_sent')}
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
  showToast(tr("admin.dispute_opened_toast"), 'error');
  renderAdminDashboard();
}

function adminResolveDisputedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  showToast(tr("admin.dispute_resolved_toast"), 'success');
  renderAdminDashboard();
}

function adminTriggerReturnedShipping(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "devuelto");
  showToast(tr("admin.returned_shipping_toast"), 'info');
  renderAdminDashboard();
}

function viewEvidencePhoto(imgUrl) {
  const bodyHtml = `
    <div style="text-align:center;">
      <img src="${imgUrl}" style="max-width:100%; max-height:400px; border-radius:8px; border:2px solid var(--border-metallic-yellow); object-fit:contain;">
      <button class="btn-large secondary-btn" style="margin-top:1.5rem; width:auto; padding: 0.5rem 1rem;" onclick="toggleGlobalModal(false)">${tr('seller.close')}</button>
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
      showToast(tr("admin.seller_approved_toast"), 'success');
    } else {
      profiles.splice(index, 1);
      showToast(tr("admin.seller_rejected_toast"), 'info');
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
      showToast(tr("admin.product_approved_toast"), 'success');
      notifyFollowers(products[index].seller_id, products[index]);
    } else {
      products[index].status = "rejected";
      showToast(tr("admin.product_rejected_toast"), 'error');
    }
    db.set('products', products);
    renderAdminDashboard();
  }
}

function removeProductAdmin(prodId) {
  if (confirm(tr("admin.confirm_delete_product"))) {
    const products = db.get('products').filter(p => p.id !== prodId);
    db.set('products', products);
    showToast(tr("admin.product_deleted_toast"), 'success');
    renderAdminDashboard();
  }
}

function moderateReviewAdmin(reviewId, status) {
  const reviews = db.get('reviews');
  const index = reviews.findIndex(r => r.id === reviewId);
  if (index > -1) {
    reviews[index].status = status;
    db.set('reviews', reviews);
    showToast(tr('admin.review_status_changed_toast', { status: status === 'approved' ? tr('admin.review_enabled') : tr('admin.review_hidden') }), 'info');
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
    showToast(tr('admin.coupon_status_changed_toast', { code: code, status: !currentStatus ? tr('admin.status_activated') : tr('admin.status_deactivated') }), 'success');
    renderAdminDashboard();
  }
}

function toggleBannerActive(id, currentStatus) {
  const banners = db.get('banners');
  const index = banners.findIndex(b => b.id === id);
  if (index > -1) {
    banners[index].active = !currentStatus;
    db.set('banners', banners);
    showToast(tr('admin.banner_status_changed_toast', { status: !currentStatus ? tr('admin.status_activated') : tr('admin.status_paused') }), 'success');
    renderAdminDashboard();
  }
}

function openAddCouponModal() {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>${tr('admin.coupon_code_label')}</label>
        <input type="text" id="frm-coupon-code" placeholder="EJ: ANIME20" style="text-transform:uppercase;">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('admin.discount_type_label')}</label>
          <select id="frm-coupon-type">
            <option value="percentage">${tr('admin.discount_percentage')}</option>
            <option value="fixed">${tr('admin.discount_fixed')}</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('admin.coupon_val_label')}</label>
          <input type="number" id="frm-coupon-val" placeholder="10">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('admin.min_purchase_label')}</label>
        <input type="number" id="frm-coupon-min" value="30">
      </div>
      <button class="btn-large primary-btn" onclick="submitCreateCoupon()">${tr('admin.create_coupon_btn')}</button>
    </div>
  `;
  toggleGlobalModal(true, tr("admin.coupon_modal_title"), bodyHtml);
}

function submitCreateCoupon() {
  const code = document.getElementById('frm-coupon-code').value.trim().toUpperCase();
  const type = document.getElementById('frm-coupon-type').value;
  const val = parseFloat(document.getElementById('frm-coupon-val').value) || 0;
  const min = parseFloat(document.getElementById('frm-coupon-min').value) || 0;

  if (!code || val <= 0) {
    showToast(tr("validation.all_fields_required"), 'error');
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
  showToast(tr('admin.coupon_status_changed_toast', { code: code, status: tr('admin.status_activated') }), 'success');
  renderAdminDashboard();
}

function openAdminAddProductModal() {
  const categoriesOptions = CATEGORIES.slice(1).map(cat => `<option value="${cat}">${cat}</option>`).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>${tr('admin.title_official_store')}</label>
        <input type="text" id="adm-prod-title" placeholder="Ej: Iron Man Retro carded">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_brand')}</label>
          <input type="text" id="adm-prod-brand" value="Hasbro">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_category')}</label>
          <select id="adm-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_condition')}</label>
          <select id="adm-prod-condition">
            <option value="Sellado">${tr('seller.cond_sealed_desc')}</option>
            <option value="Nuevo">${tr('seller.cond_new_desc')}</option>
            <option value="Usado">${tr('seller.cond_used_desc')}</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_stock')}</label>
          <input type="number" id="adm-prod-stock" value="5">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_price')} ($USD)</label>
          <input type="number" id="adm-prod-price" placeholder="29.99">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_image')}</label>
          <input type="text" id="adm-prod-img" placeholder="https://images.unsplash.com/photo-...">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.frm_desc')}</label>
        <textarea class="form-textarea" id="adm-prod-desc" placeholder="..."></textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAdminAddProduct()">${tr('admin.btn_publish_official')}</button>
    </div>
  `;
  
  toggleGlobalModal(true, tr("admin.modal_publish_official_title"), formHtml);
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
    showToast(tr("validation.all_fields_required"), 'error');
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
  showToast(tr("admin.official_product_published"), 'success');
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
        <label>${tr('seller.frm_title')}</label>
        <input type="text" id="adm-edit-title" value="${p.title}">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_brand')}</label>
          <input type="text" id="adm-edit-brand" value="${p.brand}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_category')}</label>
          <select id="adm-edit-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_condition')}</label>
          <select id="adm-edit-condition">
            <option value="Sellado" ${p.condition === 'Sellado' ? 'selected' : ''}>${tr('seller.cond_sealed_desc')}</option>
            <option value="Nuevo" ${p.condition === 'Nuevo' ? 'selected' : ''}>${tr('seller.cond_new_desc')}</option>
            <option value="Usado" ${p.condition === 'Usado' ? 'selected' : ''}>${tr('seller.cond_used_desc')}</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_stock')}</label>
          <input type="number" id="adm-edit-stock" value="${p.stock}">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_price')} ($USD)</label>
          <input type="number" id="adm-edit-price" value="${p.price}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.frm_image')}</label>
          <input type="text" id="adm-edit-img" value="${pMed ? pMed.media_url : ''}">
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.frm_desc')}</label>
        <textarea class="form-textarea" id="adm-edit-desc">${p.description}</textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAdminEditProduct('${p.id}')">${tr('admin.btn_save_catalog')}</button>
    </div>
  `;
  
  toggleGlobalModal(true, tr("admin.modal_edit_admin_title"), formHtml);
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
    showToast(tr("admin.catalog_changes_applied"), 'success');
    renderAdminDashboard();
  }
}

function adminToggleUserStatus(userId) {
  const users = db.get('users');
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = user.status === 'suspended' ? 'active' : 'suspended';
    db.set('users', users);
    showToast(tr("admin.user_status_updated"), 'success');
    renderAdminDashboard();
  }
}

function adminEditStorePlan(profileId) {
  const profiles = db.get('seller_profiles');
  const prof = profiles.find(p => p.id === profileId);
  if (prof) {
    prof.subscription_plan = prof.subscription_plan === 'Elite' ? 'Free' : 'Elite';
    db.set('seller_profiles', profiles);
    showToast(tr("admin.store_plan_updated"), 'success');
    renderAdminDashboard();
  }
}

function adminEditStoreCommission(profileId) {
  const profiles = db.get('seller_profiles');
  const prof = profiles.find(p => p.id === profileId);
  if (prof) {
    const rateStr = prompt(
      tr("admin.prompt_new_commission_rate"),
      prof.commission_rate !== undefined ? prof.commission_rate : "0.05"
    );
    if (rateStr !== null) {
      const rate = parseFloat(rateStr);
      if (!isNaN(rate) && rate >= 0 && rate <= 1) {
        prof.commission_rate = rate;
        db.set('seller_profiles', profiles);
        showToast(tr("admin.commission_rate_updated"), 'success');
        renderAdminDashboard();
      } else {
        showToast(tr("admin.commission_rate_invalid"), 'error');
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
        <h3>${tr('admin.commissions_title')}</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          ${tr('admin.commissions_subtitle')}
        </p>
      </div>

      <div class="db-table-card" style="margin-bottom:2rem; padding:1.5rem; background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">
        <h4 style="margin-top:0; margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; color:var(--text-primary);">${tr('admin.config_title')}</h4>
        
        <div style="display:flex; flex-direction:column; gap:1.2rem; max-width:600px;">
          <!-- platform commission percentage input -->
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label for="commission-general" style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${tr('admin.frm_general_commission')}</label>
            <input type="number" id="commission-general" value="${settings.commission_general}" min="0" max="100" step="0.1" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; color:#000000; width:150px; outline:none;">
            <span style="font-size:0.75rem; color:var(--text-muted);">${tr('admin.frm_general_commission_desc')}</span>
          </div>

          <!-- minimum fee -->
          <div style="display:flex; flex-direction:column; gap:0.4rem;">
            <label for="min-fee-per-sale" style="font-size:0.85rem; font-weight:600; color:var(--text-primary);">${tr('admin.frm_min_fee')}</label>
            <input type="number" id="min-fee-per-sale" value="${settings.min_fee_per_sale || 0}" min="0" step="0.01" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.6rem; color:#000000; width:150px; outline:none;">
            <span style="font-size:0.75rem; color:var(--text-muted);">${tr('admin.frm_min_fee_desc')}</span>
          </div>

          <!-- toggles -->
          <div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="commission-on-shipping" ${settings.commission_on_shipping ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;">
              <label for="commission-on-shipping" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('admin.frm_shipping_commission')}</label>
            </div>
            
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="commission-on-taxes" ${settings.commission_on_taxes ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;">
              <label for="commission-on-taxes" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('admin.frm_taxes_commission')}</label>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; opacity:0.6;">
              <input type="checkbox" id="buyer-protection-fee" ${settings.buyer_protection_fee ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;" disabled>
              <label for="buyer-protection-fee" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('admin.frm_buyer_protection')}</label>
            </div>

            <div style="display:flex; align-items:center; gap:0.5rem; opacity:0.6;">
              <input type="checkbox" id="additional-buyer-fee" ${settings.additional_buyer_fee ? 'checked' : ''} style="width:1.1rem; height:1.1rem; cursor:pointer;" disabled>
              <label for="additional-buyer-fee" style="font-size:0.85rem; color:var(--text-primary); cursor:pointer;">${tr('admin.frm_additional_protection')}</label>
            </div>
          </div>

          <!-- categories rates & pro discounts MOCK options -->
          <div style="border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem; display:flex; flex-direction:column; gap:0.8rem;">
            <h5 style="margin:0 0 0.4rem 0; color:var(--text-primary); font-size:0.9rem;">${tr('admin.special_config')}</h5>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div style="display:flex; flex-direction:column; gap:0.25rem;">
                <label style="font-size:0.8rem; color:var(--text-secondary);">${tr('admin.category_rates_label')}</label>
                <select style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" disabled>
                  <option>${tr('admin.cat_funko_pop')}</option>
                  <option>${tr('admin.cat_action_figures')}</option>
                  <option>${tr('admin.cat_statues')}</option>
                </select>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.25rem;">
                <label style="font-size:0.8rem; color:var(--text-secondary);">${tr('admin.commission_discounts_label')}</label>
                <select style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" disabled>
                  <option>${tr('admin.no_discounts_option')}</option>
                </select>
              </div>
            </div>
          </div>

          <div style="margin-top:1rem;">
            <button class="btn-large primary-btn" style="width:auto; padding:0.6rem 1.5rem; font-size:0.85rem;" onclick="saveMarketplaceCommissionsSubmit()">
              ${tr('admin.save_config_btn')}
            </button>
          </div>
        </div>
      </div>

      <!-- History of Audit changes -->
      <div class="db-table-card">
        <div class="db-table-header" style="background:var(--bg-lighter);">
          <h4 style="margin:0; font-size:0.95rem; color:var(--text-primary);">${tr('admin.audit_title')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.audit_col_date')}</th>
                <th>${tr('admin.audit_col_admin')}</th>
                <th>${tr('admin.audit_col_desc')}</th>
              </tr>
            </thead>
            <tbody>
              ${historyHtml ? historyHtml : `
                <tr>
                  <td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">${tr('admin.no_audit_records')}</td>
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
    showToast(tr("validation.commission_percentage_range"), 'error');
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
    changes.push(tr('admin.audit_commission_changed', { prev: settings.commission_general, curr: commissionGeneral }));
  }
  if (settings.min_fee_per_sale !== minFee) {
    changes.push(tr('admin.audit_min_fee_changed', { prev: settings.min_fee_per_sale || 0, curr: minFee }));
  }
  if (settings.commission_on_shipping !== onShipping) {
    changes.push(tr('admin.audit_shipping_changed', { status: onShipping ? tr('admin.audit_status_enabled') : tr('admin.audit_status_disabled') }));
  }
  if (settings.commission_on_taxes !== onTaxes) {
    changes.push(tr('admin.audit_taxes_changed', { status: onTaxes ? tr('admin.audit_status_enabled') : tr('admin.audit_status_disabled') }));
  }

  if (changes.length === 0) {
    showToast(tr("admin.no_config_changes"), 'info');
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
          title: tr('admin.policy_notification_title'),
          message: tr('admin.policy_notification_msg', { rate: commissionGeneral }),
          read: false,
          created_at: new Date().toISOString()
        });
      }
    });
    db.set('notifications', notifications);
  }

  showToast(tr("admin.config_saved_success"), 'success');
  
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
        <td>${v.is_material ? `<span style="color:#ef4444; font-weight:700;">${tr('admin.val_material')}</span>` : `<span style="color:var(--text-secondary);">${tr('admin.val_informative')}</span>`}</td>
        <td>${window.formatDate(v.effective_date)}</td>
        <td>
          ${v.status === 'active' 
            ? `<span class="status-tag approved">${tr('admin.val_active')}</span>` 
            : `<span class="status-tag suspended">${tr('admin.val_archived')}</span>`}
        </td>
        <td><strong>${accCount}</strong> ${tr('admin.signatures_label')}</td>
        <td>
          ${isLocked 
            ? `<button class="action-btn-small" style="background:#4b5563; cursor:not-allowed; opacity:0.6;" disabled title="${tr('admin.locked_title')}"><i data-lucide="lock" style="width:0.8rem; height:0.8rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${tr('admin.locked_label')}</button>`
            : `<button class="action-btn-small approve" onclick="openEditGuidelinesVersionModal('${v.version}')"><i data-lucide="edit" style="width:0.8rem; height:0.8rem; display:inline-block; vertical-align:middle; margin-right:2px;"></i> ${tr('admin.edit_label')}</button>`}
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
      statusTextHtml = `<span class="status-tag approved">${tr('seller.status_accepted')}</span>`;
      acceptDate = window.formatDate(acc.acceptedAt);
      acceptLang = acc.policyLanguage ? acc.policyLanguage.toUpperCase() : 'ES';
      acceptIp = acc.ipAddress || '-';
      acceptSource = acc.acceptanceSource || '-';
      filterStatusType = 'accepted';
    } else {
      if (prof.requiresGuidelinesReacceptance) {
        statusTextHtml = `<span class="status-tag suspended" style="background:#f59e0b; color:black; font-weight:700;">${tr('admin.status_reacceptance_required')}</span>`;
        filterStatusType = 'reacceptance';
      } else {
        statusTextHtml = `<span class="status-tag suspended">${tr('seller.status_acceptance_required')}</span>`;
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
      ? `<button class="action-btn-small approve" style="background:#10b981; border-color:#10b981;" onclick="toggleSellerPublishingSuspension('${s.profId}', false)">${tr('admin.btn_reactivate')}</button>`
      : `<button class="action-btn-small reject" style="background:#ef4444; border-color:#ef4444;" onclick="toggleSellerPublishingSuspension('${s.profId}', true)">${tr('admin.btn_suspend')}</button>`;
    
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
          <h3>${tr('admin.guidelines_title')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('admin.guidelines_subtitle')}
          </p>
        </div>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="openCreateGuidelinesVersionModal()">
          <i data-lucide="plus-circle" style="width:1rem; height:1rem; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${tr('admin.upload_version_btn')}
        </button>
      </div>

      <!-- Sección 1: Versiones -->
      <div class="db-table-card" style="margin-bottom:2rem;">
        <div class="db-table-header">
          <h4>${tr('admin.guidelines_history_title')}</h4>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.table_col_version')}</th>
                <th>${tr('admin.table_col_type')}</th>
                <th>${tr('admin.table_col_date')}</th>
                <th>${tr('admin.table_col_status')}</th>
                <th>${tr('admin.table_col_signatures')}</th>
                <th>${tr('admin.table_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${versionRowsHtml || `<tr><td colspan="6" style="text-align:center;">${tr('admin.no_guidelines_versions')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sección 2: Aceptación y Firmas de Vendedores -->
      <div class="db-table-card">
        <div class="db-table-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding:1.2rem;">
          <h4 style="margin:0;">${tr('admin.seller_signatures_log')}</h4>
          <button class="btn-large secondary-btn" style="width:auto; padding:0.4rem 1rem; font-size:0.8rem; border-color:var(--border-metallic-yellow);" onclick="exportGuidelinesAcceptancesCSV()">
            <i data-lucide="download" style="width:0.85rem; height:0.85rem; display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${tr('admin.btn_export_csv')}
          </button>
        </div>

        <!-- Filtros interactivos -->
        <div style="background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border-color); padding:1rem; display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
          <div style="display:flex; flex-direction:column; gap:0.25rem; min-width:150px;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('admin.filter_version')}</label>
            <select id="flt-guide-version" onchange="applyAdminGuidelinesFilter('version', this.value)" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
              <option value="all" ${window.adminGuidelinesFilterVersion === 'all' ? 'selected' : ''}>${tr('categories.Todos')}</option>
              ${versionOptions}
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.25rem; min-width:150px;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('admin.filter_status')}</label>
            <select id="flt-guide-status" onchange="applyAdminGuidelinesFilter('status', this.value)" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
              <option value="all" ${window.adminGuidelinesFilterStatus === 'all' ? 'selected' : ''}>${tr('admin.all_statuses_option')}</option>
              <option value="accepted" ${window.adminGuidelinesFilterStatus === 'accepted' ? 'selected' : ''}>${tr('admin.status_accepted_active')}</option>
              <option value="reacceptance" ${window.adminGuidelinesFilterStatus === 'reacceptance' ? 'selected' : ''}>${tr('admin.status_reacceptance_required')}</option>
              <option value="pending" ${window.adminGuidelinesFilterStatus === 'pending' ? 'selected' : ''}>${tr('admin.status_pending_new')}</option>
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.25rem; min-width:200px; flex:1;">
            <label style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('admin.search_seller_placeholder_label')}</label>
            <input type="text" id="flt-guide-search" value="${window.adminGuidelinesSearchQuery}" oninput="applyAdminGuidelinesFilter('search', this.value)" placeholder="${tr('admin.search_seller_placeholder')}" style="background:#111; color:white; border:1px solid var(--border-color); border-radius:6px; padding:0.35rem; font-size:0.8rem; outline:none;">
          </div>
        </div>

        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('admin.col_seller')}</th>
                <th>${tr('admin.filter_status')}</th>
                <th>${tr('admin.col_version')}</th>
                <th>${tr('admin.col_date')}</th>
                <th>${tr('admin.col_language')}</th>
                <th>${tr('admin.col_ip')}</th>
                <th>${tr('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${sellerRowsHtml || `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-secondary);">${tr('admin.no_signatures')}</td></tr>`}
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
        title: tr("admin.publishing_suspended_title"),
        message: tr("admin.publishing_suspended_msg"),
        read: false,
        created_at: new Date().toISOString()
      });
      showToast(tr("admin.publishing_suspended_toast"), 'info');
    } else {
      notifications.push({
        id: "not_" + Math.random().toString(36).substr(2, 9),
        user_id: prof.user_id,
        title: tr("admin.publishing_reactivated_title"),
        message: tr("admin.publishing_reactivated_msg"),
        read: false,
        created_at: new Date().toISOString()
      });
      showToast(tr("admin.publishing_reactivated_toast"), 'success');
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
  
  showToast(tr("admin.signatures_csv_exported"), 'success');
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
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="toggleGlobalModal(false)">${tr('seller.cancel_btn')}</button>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="submitCreateGuidelinesVersion()">${tr('admin.publish_version_btn')}</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, tr('admin.create_version_modal_title'), html);
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
    showToast(tr('admin.fill_all_fields'), "error");
    return;
  }

  const versions = db.get('seller_guidelines_versions') || [];
  if (versions.some(v => v.version === version)) {
    showToast(tr('admin.version_id_exists', { version }), "error");
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
          title: tr("admin.policy_notification_title"),
          message: tr("admin.policy_notification_msg_ver", { version: version }),
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
  showToast(tr("admin.save_policy_success"), "success");
  renderAdminDashboard();
}

function openEditGuidelinesVersionModal(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const ver = versions.find(v => v.version === version);
  if (!ver) return;

  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAcceptances = acceptances.some(a => a.policyVersion === version && a.acceptanceStatus === 'accepted');

  if (hasAcceptances) {
    showToast(tr("admin.guidelines_locked_edit_error"), "error");
    return;
  }

  const html = `
    <div style="display:flex; flex-direction:column; gap:1rem; font-family:var(--font-body, sans-serif); color:var(--text-primary); max-height: 500px; overflow-y: auto; padding-right: 0.5rem;">
      <div class="checkout-input-wrapper">
        <label>${tr('admin.frm_ver_label_locked')}</label>
        <input type="text" id="frm-ver-id" value="${ver.version}" disabled style="background:#ddd; cursor:not-allowed; color:#555;">
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('admin.frm_ver_title_es')}</label>
          <input type="text" id="frm-ver-title-es" value="${ver.title_es}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('admin.frm_ver_title_en')}</label>
          <input type="text" id="frm-ver-title-en" value="${ver.title_en}">
        </div>
      </div>

      <div class="checkout-input-wrapper">
        <label>${tr('admin.frm_ver_content_es')}</label>
        <textarea id="frm-ver-content-es" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${ver.content_es}</textarea>
      </div>

      <div class="checkout-input-wrapper">
        <label>${tr('admin.frm_ver_content_en')}</label>
        <textarea id="frm-ver-content-en" style="height:120px; font-size:0.8rem; background:white; color:black; border-radius:6px; padding:0.5rem; outline:none;">${ver.content_en}</textarea>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('admin.frm_ver_date')}</label>
          <input type="datetime-local" id="frm-ver-date" value="${new Date(ver.effective_date).toISOString().slice(0, 16)}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('admin.table_col_type')}</label>
          <select id="frm-ver-material">
            <option value="true" ${ver.is_material ? 'selected' : ''}>${tr('admin.frm_ver_material_yes')}</option>
            <option value="false" ${!ver.is_material ? 'selected' : ''}>${tr('admin.frm_ver_material_no')}</option>
          </select>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="toggleGlobalModal(false)">${tr('seller.cancel_btn')}</button>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="submitEditGuidelinesVersion('${version}')">${tr('seller.save_changes')}</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, tr('admin.version_modal_edit_title'), html);
  lucide.createIcons();
}

function submitEditGuidelinesVersion(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const verIndex = versions.findIndex(v => v.version === version);
  if (verIndex === -1) return;

  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAcceptances = acceptances.some(a => a.policyVersion === version && a.acceptanceStatus === 'accepted');
  if (hasAcceptances) {
    showToast(tr("admin.guidelines_locked_edit_error"), "error");
    return;
  }

  const titleEs = document.getElementById('frm-ver-title-es').value.trim();
  const titleEn = document.getElementById('frm-ver-title-en').value.trim();
  const contentEs = document.getElementById('frm-ver-content-es').value.trim();
  const contentEn = document.getElementById('frm-ver-content-en').value.trim();
  const dateVal = document.getElementById('frm-ver-date').value;
  const isMaterial = document.getElementById('frm-ver-material').value === 'true';

  if (!titleEs || !titleEn || !contentEs || !contentEn || !dateVal) {
    showToast(tr("validation.all_fields_required"), "error");
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
  showToast(tr("admin.config_saved_success"), "success");
  renderAdminDashboard();
}
