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
        <h2>${tr('seller.profile_pending_approval_title')}</h2>
        <p style="color:var(--text-secondary); margin-top:1rem;">${tr('seller.profile_pending_approval_desc')}</p>
        <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">${tr('nav.home')}</button>
      </div>
    `;
    return;
  }

  // Comprobar aceptación de directrices vigentes
  const guidelinesVersions = db.get('seller_guidelines_versions') || [];
  const activeGuidelinesVer = guidelinesVersions.find(v => v.status === 'active') || { version: 'seller-policy-v1.0' };
  
  const guidelinesAcceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAcceptedGuidelines = guidelinesAcceptances.some(a => 
    a.sellerId === sellerProf.id && 
    a.policyVersion === activeGuidelinesVer.version && 
    a.acceptanceStatus === 'accepted'
  );

  if (!hasAcceptedGuidelines || sellerProf.requiresGuidelinesReacceptance) {
    const errorMsg = sellerProf.requiresGuidelinesReacceptance
      ? tr("sellerGuidelines.newVersionNotice")
      : tr("sellerGuidelines.requiredMessage");

    viewport.innerHTML = `
      <div class="section-container" style="max-width: 600px; margin: 4rem auto;">
        <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:2rem; border-radius:12px; box-shadow:0 8px 30px rgba(0,0,0,0.3);">
          <div style="text-align:center; margin-bottom:1.5rem;">
            <i data-lucide="shield-alert" style="width:3rem; height:3rem; color:var(--gold-light); margin-bottom:0.5rem; display:block; margin-left:auto; margin-right:auto;"></i>
            <h2 style="font-family:var(--font-heading); color:var(--text-primary); font-size:1.4rem;">${tr('seller.guidelines_agreement_title')}</h2>
          </div>
          
          <p style="font-size:0.9rem; color:var(--text-primary); line-height:1.6; margin-bottom:1.5rem; font-weight:600; text-align:center;">
            ${errorMsg}
          </p>

          <div style="background:rgba(255,255,255,0.03); padding:1rem; border-radius:6px; font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.5; border:1px solid var(--border-color); text-align:center;">
            <strong>${tr('seller.required_version')}</strong> ${activeGuidelinesVer.version}<br>
            <a onclick="viewFullGuidelinesText('${activeGuidelinesVer.version}')" style="color:var(--gold-light); font-weight:700; cursor:pointer; text-decoration:underline; font-size:0.85rem; display:inline-block; margin-top:0.5rem;">
              ${tr('seller.view_full_guidelines')}
            </a>
          </div>

          <div style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:2rem; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:6px;">
            <input type="checkbox" id="blocker-accept-checkbox" style="width:1.2rem; height:1.2rem; margin-top:0.1rem; cursor:pointer;" onchange="document.getElementById('blocker-accept-btn').disabled = !this.checked">
            <label for="blocker-accept-checkbox" style="font-size:0.8rem; color:var(--text-primary); cursor:pointer; line-height:1.4;">
              ${tr('sellerGuidelines.checkbox').replace('Reglas para Vendedores', `<a onclick="viewFullGuidelinesText('${activeGuidelinesVer.version}')" style="color:var(--gold-light); cursor:pointer; text-decoration:underline; font-weight:700;">Reglas para Vendedores</a>`).replace('Seller Guidelines', `<a onclick="viewFullGuidelinesText('${activeGuidelinesVer.version}')" style="color:var(--gold-light); cursor:pointer; text-decoration:underline; font-weight:700;">Seller Guidelines</a>`)}
            </label>
          </div>

          <button id="blocker-accept-btn" class="btn-large primary-btn" disabled onclick="submitBlockerGuidelinesAcceptance('${activeGuidelinesVer.version}')">
            ${tr('sellerGuidelines.acceptButton')}
          </button>
        </div>
      </div>
    `;
    lucide.createIcons();
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
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom: 1.5rem;">
        <div>
          <h2 class="section-title">${tr('seller.dashboard_title')}</h2>
          <p style="color:var(--text-secondary); margin-top:0.25rem;">
            ${tr('seller.manage_your_store')} <strong>${sellerProf.store_name}</strong>
          </p>
        </div>
      </div>

      <div class="dashboard-shell">
        <!-- Sidebar Navigation -->
        <aside class="dashboard-sidebar">
          <a class="db-menu-item ${window.activeSellerTab === 'overview' ? 'active' : ''}" onclick="setSellerTab('overview')">
            <i data-lucide="bar-chart-3" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_financial_overview')}
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'products' ? 'active' : ''}" onclick="setSellerTab('products')">
            <i data-lucide="tag" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_my_products')} (${sellerProducts.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'shipping' ? 'active' : ''}" onclick="setSellerTab('shipping')">
            <i data-lucide="package" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_shipping_labels')} (${shipments.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'orders' ? 'active' : ''}" onclick="setSellerTab('orders')">
            <i data-lucide="truck" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_orders_received')} (${sellerOrders.length})
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'fees' ? 'active' : ''}" onclick="setSellerTab('fees')">
            <i data-lucide="percent" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_commissions_guidelines')}
          </a>
          <a class="db-menu-item ${window.activeSellerTab === 'reviews' ? 'active' : ''}" onclick="setSellerTab('reviews')">
            <i data-lucide="star" style="width:1.05rem;height:1.05rem;"></i>
            ${tr('seller.tab_ratings')} (${sellerReviews.length})
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
              <h4 style="font-weight:700; margin-bottom:0.15rem; color:#b91c1c; margin-top:0;">${tr('seller.stripe_disconnected_title')}</h4>
              <p style="font-size:0.8rem; color:#7f1d1d; margin:0;">${tr('seller.stripe_disconnected_desc')}</p>
            </div>
          </div>
          <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem; background:#b91c1c; border-color:#b91c1c; font-size:0.85rem;" onclick="startStripeOnboarding()">
            <i data-lucide="external-link"></i> ${tr('seller.link_stripe_btn')}
          </button>
        </div>
      </div>
    `;
  }

  if (tab === 'overview') {
    const displayRate = (data.sellerProf.user_id !== 'usr_admin_1') ? (data.sellerProf.commission_rate !== 0.10 ? data.sellerProf.commission_rate * 100 : (db.get('marketplace_settings').commission_general || 5)) : 0;
    
    container.innerHTML = `
      ${stripeAlertHtml}
      <!-- Stats Cards -->
      <div class="stat-cards-grid">
        <div class="stat-card">
          <div class="stat-card-title">${tr('seller.total_gross_sales')}</div>
          <div class="stat-card-value">$${data.totalSales.toFixed(2)}</div>
          <div class="stat-card-change up">${tr('seller.total_gross_sales_desc')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">${tr('seller.held_funds')}</div>
          <div class="stat-card-value" style="color:#d97706;">$${data.pendingPayouts.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">${tr('seller.held_funds_desc')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">${tr('seller.commissions_charged')}</div>
          <div class="stat-card-value" style="color:var(--primary-light);">$${data.commissionsPaid.toFixed(2)}</div>
          <div class="stat-card-change" style="color:var(--text-secondary);">${tr('seller.active_commission_rate')} ${displayRate.toFixed(0)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-title">${tr('seller.listed_products')}</div>
          <div class="stat-card-value">
            ${data.sellerProducts.length}
          </div>
          <div class="stat-card-change" style="color:var(--text-secondary);">${tr('seller.listed_products_desc')}</div>
        </div>
      </div>

      <!-- Resumen de Comisión -->
      <div style="background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.2); border-radius:8px; padding:1rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="flex:1; min-width:280px;">
          <h4 style="margin:0 0 0.25rem 0; color:var(--text-primary); font-size:0.9rem;">${tr('seller.commission_structure_title')}</h4>
          <p style="margin:0; font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">
            ${tr('seller.commission_structure_desc', { rate: displayRate.toFixed(0) })}
          </p>
        </div>
        <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1rem; font-size:0.8rem;" onclick="setSellerTab('fees')">
          ${tr('seller.view_fees_guidelines_btn')}
        </button>
      </div>

      <!-- sales history chart -->
      <div class="db-table-card">
        <div class="db-table-header">
          <h3>${tr('seller.recent_transactions_title')}</h3>
        </div>
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('seller.table_transaction_id')}</th>
                <th>${tr('seller.table_date')}</th>
                <th>${tr('seller.table_gross')}</th>
                <th>${tr('seller.table_platform_commission')}</th>
                <th>${tr('seller.table_net_payout')}</th>
                <th>${tr('seller.table_status')}</th>
              </tr>
            </thead>
            <tbody>
              ${db.get('transactions').filter(t => t.seller_id === state.currentUser.id).length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem;">${tr('seller.no_transactions_recorded')}</td>
                </tr>
              ` : db.get('transactions').filter(t => t.seller_id === state.currentUser.id).map(t => `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td>${window.formatDate(t.created_at)}</td>
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
        <h3>${tr('seller.figure_inventory_title')} (${data.sellerProducts.length})</h3>
        <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem;" onclick="openAddProductModal()">
          <i data-lucide="plus"></i> ${tr('seller.publish_figure_btn_short')}
        </button>
      </div>

      <div class="db-table-card" style="margin-top:1.5rem;">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('seller.table_title')}</th>
                <th>${tr('seller.table_brand_cat')}</th>
                <th>${tr('seller.table_condition')}</th>
                <th>${tr('seller.table_price')}</th>
                <th>${tr('seller.table_stock')}</th>
                <th>${tr('seller.table_dimensions_weight')}</th>
                <th>${tr('seller.table_status')}</th>
                <th>${tr('seller.table_action')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerProducts.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem;">${tr('seller.no_figures_published')}</td>
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
                        ${p.status === 'approved' ? tr('seller.status_approved') : p.status === 'pending' ? tr('seller.status_pending_admin') : p.status === 'rejected' ? tr('seller.status_rejected') : tr('product.out_of_stock')}
                      </span>
                    </td>
                    <td>
                      <button class="action-btn-small suspend" onclick="openEditProductModal('${p.id}')">${tr('seller.edit_btn')}</button>
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
          <h3>${tr('seller.performance_shipping')}</h3>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
            ${tr('seller.reliability_desc')}
          </p>
        </div>
        
        <div style="display: flex; gap: 1rem;">
          <div style="background:var(--bg-card); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
            <div style="font-size:2rem; font-weight:800; color: ${data.sellerProf.reliability_score >= 90 ? '#10b981' : data.sellerProf.reliability_score >= 70 ? '#f59e0b' : '#ef4444'};">
              ${data.sellerProf.reliability_score}<span style="font-size:1rem;">/100</span>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${tr('seller.reliability')}</div>
              <div style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">
                ${data.sellerProf.reliability_score >= 90 ? tr('seller.reliability_excellent') : data.sellerProf.reliability_score >= 70 ? tr('seller.reliability_fair') : tr('seller.reliability_at_risk')}
              </div>
            </div>
          </div>
          
          <div style="background:var(--bg-card); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
            <div style="font-size:1.8rem; font-weight:800; color: ${data.sellerProf.active_strikes > 0 ? '#ef4444' : '#10b981'};">
              ${data.sellerProf.active_strikes}
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">${tr('seller.active_strikes_title')}</div>
              <div style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">
                ${data.sellerProf.active_strikes >= 4 ? tr('seller.banned_account') : data.sellerProf.active_strikes >= 3 ? tr('seller.suspended_account_30') : data.sellerProf.active_strikes >= 2 ? tr('seller.creation_blocked') : tr('seller.healthy_account')}
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
                <th>${tr('seller.table_order_id_date')}</th>
                <th>${tr('checkout.recipient')}</th>
                <th>${tr('seller.table_carrier_rate')}</th>
                <th>${tr('seller.table_tracking_code')}</th>
                <th>${tr('seller.table_insurance_fragile')}</th>
                <th>${tr('seller.table_packing_evidence')}</th>
                <th>${tr('seller.table_shipping_status')}</th>
                <th>${tr('seller.table_management')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.shipments.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); font-style:italic;">${tr('seller.no_shipments_registered')}</td>
                </tr>
              ` : data.shipments.map(s => {
                const evidence = evidenceLogs.find(ev => ev.shipment_id === s.id);
                const isPaidOrder = db.get('orders').find(o => o.id === s.order_id)?.payment_status === 'paid';
                
                return `
                  <tr>
                    <td>
                      <code>${s.order_id}</code>
                      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">${window.formatDate(s.created_at)}</div>
                    </td>
                    <td>${db.get('shipping_addresses').find(a => a.user_id === s.buyer_id)?.name || tr('seller.buyer')}</td>
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
                      ` : `<span style="color:var(--text-muted);">${tr('seller.not_generated')}</span>`}
                    </td>
                    <td>
                      <div style="font-size:0.8rem;">
                        ${s.insurance_amount > 0 ? `🛡️ ${tr('seller.insured')} ($${s.insurance_amount.toFixed(2)})` : `❌ ${tr('seller.no_insurance')}`}<br>
                        ${db.get('orders').find(o => o.id === s.order_id)?.total_amount > 100 ? `⚠️ ${tr('seller.high_value')} (>100)` : ''}
                      </div>
                    </td>
                    <td id="evidence-td-${s.id}">
                      ${evidence ? `
                        <div style="display:flex; flex-direction:column; align-items:center; gap:0.25rem;">
                          <img src="${evidence.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1.5px solid var(--border-metallic-yellow);" onclick="viewEvidencePhoto('${evidence.image_url}')">
                          <span style="font-size:0.6rem; color:#10b981; font-weight:700;">${tr('seller.evidence_registered')}</span>
                        </div>
                      ` : `
                        <button class="action-btn-small suspend" style="padding:0.2rem 0.4rem; font-size:0.7rem;" onclick="openUploadEvidenceModal('${s.id}')">
                          📸 ${tr('seller.upload_photo')}
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
                        🖨️ ${tr('seller.print_label')}
                      </button>
                      
                      ${s.status === 'label_generado' ? `
                        <button class="action-btn-small suspend" style="background:#4f46e5; border-color:#4f46e5;" onclick="triggerDeliverToCarrier('${s.id}')">
                          🚚 ${tr('seller.deliver_to_carrier')}
                        </button>
                      ` : ''}

                      ${s.status === 'entregado_al_carrier' ? `
                        <button class="action-btn-small approve" style="background:#f59e0b; border-color:#f59e0b;" onclick="triggerSimulateTransit('${s.id}')">
                          ${tr('seller.simulate_in_transit')}
                        </button>
                      ` : ''}

                      ${s.status === 'en_transito' ? `
                        <button class="action-btn-small approve" style="background:#10b981; border-color:#10b981;" onclick="triggerSimulateDelivery('${s.id}')">
                          ${tr('seller.simulate_delivered')}
                        </button>
                      ` : ''}

                      <div style="font-size:0.65rem; color:var(--text-muted); text-align:center; max-width:100px; margin-top:0.25rem;">
                        ${s.status !== 'delivered' ? tr('seller.stripe_custody_active') : tr('seller.funds_released')}
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
      <h3>${tr('seller.orders_received_title')}</h3>
      
      <div class="db-table-card">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>${tr('seller.table_transaction_id')}</th>
                <th>${tr('seller.table_date')}</th>
                <th>${tr('seller.table_items_purchased')}</th>
                <th>${tr('seller.table_payout_amount')}</th>
                <th>${tr('seller.table_shipping_status')}</th>
                <th>${tr('seller.table_tracking_deadline')}</th>
                <th>${tr('seller.table_actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${data.sellerOrders.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center; padding:3rem;">${tr('seller.no_orders_received')}</td>
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
                    deadlineHtml = `<div style="color:#ef4444; font-size:0.75rem; font-weight:700;">${tr('seller.deadline_timeout')}</div>`;
                  } else if (hoursLeft < 48) {
                    deadlineHtml = `<div style="color:#ef4444; font-size:0.75rem; font-weight:700;">${tr('seller.deadline_at_risk', { hours: Math.floor(hoursLeft) })}</div>`;
                  } else if (hoursLeft < 72) {
                    deadlineHtml = `<div style="color:#f59e0b; font-size:0.75rem; font-weight:600;">${tr('seller.deadline_urgent', { hours: Math.floor(hoursLeft) })}</div>`;
                  } else {
                    deadlineHtml = `<div style="color:var(--text-secondary); font-size:0.75rem;">${tr('seller.deadline_remaining', { hours: Math.floor(hoursLeft) })}</div>`;
                  }
                }

                return `
                  <tr>
                    <td><code>${o.id}</code></td>
                    <td>${window.formatDate(o.created_at)}</td>
                    <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsDescription}">
                      ${itemsDescription}
                    </td>
                    <td style="font-weight:600; color:#10b981;">$${o.seller_payout.toFixed(2)}</td>
                    <td><span class="status-tag ${o.order_status}">${o.order_status}</span></td>
                    <td>
                      ${o.tracking_number ? `
                        <span style="font-size:0.8rem;"><code>${o.tracking_number}</code> (${o.shipping_carrier})</span>
                      ` : `
                        <span style="color:var(--text-muted); font-size:0.8rem;">${tr('seller.label_pending')}</span>
                        ${deadlineHtml}
                      `}
                    </td>
                    <td>
                      <button class="btn-large primary-btn" style="width:auto; padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="openOrderDetailsModal('${o.id}')">
                        <i data-lucide="eye" style="width:0.8rem;height:0.8rem;display:inline-block;vertical-align:middle;margin-right:0.2rem;"></i> ${tr('seller.detail_btn')}
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
  
  else if (tab === 'reviews') {
    container.innerHTML = `
      <h3>${tr('seller.ratings_reviews_title')}</h3>
      <div style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:1rem;">
        ${tr('seller.rating_average_text', { rating: data.sellerProf.rating_average.toFixed(1) })}
      </div>

      <div class="reviews-list">
        ${data.sellerReviews.length === 0 ? `
          <p style="text-align:center; padding: 2rem; color:var(--text-muted); font-style:italic;">${tr('seller.no_reviews_received')}</p>
        ` : data.sellerReviews.map(r => `
          <div class="review-item" style="background:var(--bg-card); padding:1rem; border-radius:8px; border:1px solid var(--border-color);">
            <div class="review-header">
              <span style="font-weight:600; color:var(--text-primary);">${tr('seller.purchase_id')} <code>${r.id}</code></span>
              <span style="color:var(--text-muted); font-size:0.8rem;">${window.formatDate(r.created_at)}</span>
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
  
  else if (tab === 'fees') {
    renderSellerFeesTab(container, data);
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
        <strong>${tr('seller.label_order_id')}</strong> ${s.order_id} | <strong>${tr('seller.label_insured_value')}</strong> $${order ? order.total_amount.toFixed(2) : '100.00'}<br>
        <strong>${tr('seller.label_tracking')}</strong> ${s.tracking_number}
      </div>.tracking_number}
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

  toggleGlobalModal(true, tr('seller.shippo_print_label_title'), printHtml);
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
  showToast(tr("seller.packing_evidence_saved"), 'success');
  renderSellerDashboard();
}

function viewEvidencePhoto(imgUrl) {
  const bodyHtml = `
    <div style="text-align:center;">
      <img src="${imgUrl}" style="max-width:100%; max-height:400px; border-radius:8px; border:2px solid var(--border-metallic-yellow); object-fit:contain;">
      <button class="btn-large secondary-btn" style="margin-top:1.5rem; width:auto; padding: 0.5rem 1rem;" onclick="toggleGlobalModal(false)">${tr('seller.close_btn')}</button>
    </div>
  `;
  toggleGlobalModal(true, tr('seller.packing_evidence_title'), bodyHtml);
}

// Carrier transitions
function triggerDeliverToCarrier(shipmentId) {
  const evidenceLogs = db.get('package_evidence');
  const hasEvidence = evidenceLogs.some(ev => ev.shipment_id === shipmentId);

  if (!hasEvidence) {
    showToast(tr("seller.shipper_rule_evidence"), 'error');
    return;
  }

  shippoAPI.updateShipmentStatus(shipmentId, "entregado_al_carrier");
  showToast(tr("seller.marked_dropped_off"), 'success');
  renderSellerDashboard();
}

function triggerSimulateTransit(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "en_transito");
  showToast(tr("seller.in_transit"), 'info');
  renderSellerDashboard();
}

function triggerSimulateDelivery(shipmentId) {
  shippoAPI.updateShipmentStatus(shipmentId, "delivered");
  showToast(tr("seller.delivered_escrow_released"), 'success');
  renderSellerDashboard();
}


// Open add/edit modal actions
function openAddProductModal() {
  verifyGuidelinesAcceptanceFlow(() => {
    openAddProductModalReal();
  });
}

function openAddProductModalReal() {
  const sellerProf = db.get('seller_profiles').find(p => p.user_id === state.currentUser.id);
  if (sellerProf && sellerProf.active_strikes >= 2) {
    showToast(tr("seller.strikes_blocked"), 'error');
    return;
  }
  
  window.newProductMedia = []; // Reset local media storage
  const categoriesOptions = CATEGORIES.slice(1).map(cat => `<option value="${cat}">${tr('categories.' + cat)}</option>`).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>${tr('seller.figure_title')}</label>
        <input type="text" id="frm-prod-title" placeholder="${tr('seller.figure_title_placeholder')}">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('product.brand')}</label>
          <input type="text" id="frm-prod-brand" placeholder="${tr('seller.brand_placeholder')}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_category')}</label>
          <select id="frm-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_condition')}</label>
          <select id="frm-prod-condition">
            <option value="Sellado">${tr('seller.cond_sealed_desc')}</option>
            <option value="Nuevo">${tr('seller.cond_new_desc')}</option>
            <option value="Usado">${tr('seller.cond_used_desc')}</option>
            <option value="Caja dañada">${tr('seller.cond_damaged')}</option>
            <option value="Sin caja">${tr('seller.cond_loose_desc')}</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_stock')}</label>
          <input type="number" id="frm-prod-stock" value="1">
        </div>
      </div>
      
      <!-- Shippo Parcel Dimensions & Collectibles Rules (Collapsible) -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem; cursor:pointer;" onclick="const t = document.getElementById('shipping-advanced-opts'); t.style.display = t.style.display === 'none' ? 'block' : 'none';">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          ${tr('seller.advanced_shipping_options')} 
          <i data-lucide="chevron-down" style="width:0.9rem;height:0.9rem; margin-left:auto;"></i>
        </h4>
        <div id="shipping-advanced-opts" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--border-color);">
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">${tr('seller.advanced_shipping_desc')}</p>
          <div class="checkout-form-group" style="margin-bottom:0.5rem;">
            <div class="checkout-input-wrapper">
              <label>${tr('seller.weight_oz')}</label>
              <input type="number" id="frm-prod-weight" value="16">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.length_in')}</label>
              <input type="number" id="frm-prod-length" value="8">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.width_in')}</label>
              <input type="number" id="frm-prod-width" value="6">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.height_in')}</label>
              <input type="number" id="frm-prod-height" value="4">
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="frm-prod-fragile">
              <span>${tr('seller.fragile_recommends')}</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="frm-prod-insurance">
              <span>${tr('seller.insurance_required_auto')}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_price')} ($USD)</label>
          <input type="number" id="frm-prod-price" placeholder="49.99" oninput="updateProfitEstimator('frm-prod-price', 'profit-estimator')">
          <div id="profit-estimator" style="margin-top:0.4rem; padding:0.5rem; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:6px; font-size:0.75rem; color:var(--text-secondary); display:none;"></div>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.media_photos_videos')}</label>
          <div style="display:flex; gap:0.4rem; margin-bottom:0.4rem;">
            <input type="text" id="frm-prod-media-url" placeholder="${tr('seller.paste_media_url')}" style="flex:1; margin-bottom:0;">
            <button type="button" class="btn-small primary-btn" onclick="handleAddMediaUrl('frm-prod-media-url')" style="width:auto; padding: 0 0.8rem; font-size:0.8rem; height:38px;">+</button>
          </div>
          <input type="file" id="frm-prod-media-input" style="display:none;" accept="image/*,video/*" multiple onchange="handleProductFormMultiMediaUpload(this)">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn-small secondary-btn" onclick="document.getElementById('frm-prod-media-input').click()" style="padding: 0.45rem 0.8rem; font-size:0.75rem; display:flex; align-items:center; gap:0.3rem; width:auto; border-color:var(--border-metallic-yellow);">
              <i data-lucide="camera" style="width:0.85rem; height:0.85rem;"></i> ${tr('seller.upload_take_photo_video')}
            </button>
            <span id="frm-media-count" style="font-size:0.7rem; color:var(--text-secondary);">${tr('seller.media_added_count', { count: 0, max: 5 })}</span>
          </div>
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.preview_gallery')}</label>
        <div id="frm-media-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:0.5rem; min-height:75px; border:1px dashed var(--border-color); padding:0.5rem; border-radius:6px; background:rgba(0,0,0,0.1); align-items:center;">
          <!-- Previews will go here -->
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.detailed_description')}</label>
        <textarea class="form-textarea" id="frm-prod-desc" placeholder="${tr('seller.desc_placeholder')}"></textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitAddProduct()">${tr('seller.publish_figure_btn')}</button>
    </div>
  `;
  
  toggleGlobalModal(true, tr('seller.publish_collectible_title'), formHtml);
  lucide.createIcons();
  renderFormMediaGallery(); // Load empty gallery view initially
}

async function submitAddProduct() {
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
    showToast(tr("seller.fill_main_fields_error"), 'error');
    return;
  }

  const productData = {
    title: title,
    description: desc,
    brand: brand,
    category: category,
    condition: condition,
    price: price,
    stock: stock,
    ebay_url: "",
    is_external_ebay: false,
    weight: weight,
    length: length,
    width: width,
    height: height,
    fragile: fragile,
    insurance_required: insurance,
    declared_value: price,
    shipping_origin_address_id: "addr_seller_1"
  };

  const res = await window.simulatedApiCall('/api/products', 'POST', {
    productData: productData,
    mediaData: window.newProductMedia
  });

  if (res.status === 201) {
    toggleGlobalModal(false);
    if (state.currentUser.role === 'admin') {
      showToast(tr("seller.publish_success_admin"), 'success');
      notifyFollowers(res.data.seller_id, res.data);
    } else {
      showToast(tr("seller.publish_success_pending"), 'success');
    }
    renderSellerDashboard();
  } else if (res.status === 403 && res.error === 'SELLER_GUIDELINES_ACCEPTANCE_REQUIRED') {
    showToast(res.message, 'error');
    toggleGlobalModal(false);
    setSellerTab('fees');
  } else {
    showToast(res.message || tr("seller.publish_error"), 'error');
  }
}

function openEditProductModal(prodId) {
  verifyGuidelinesAcceptanceFlow(() => {
    openEditProductModalReal(prodId);
  });
}

function openEditProductModalReal(prodId) {
  const products = db.get('products');
  const media = db.get('product_media');
  
  const p = products.find(prod => prod.id === prodId);
  if (!p) return;

  // Load existing media items into newProductMedia array
  const pMedia = media.filter(m => m.product_id === p.id);
  window.newProductMedia = pMedia.map(m => ({ media_url: m.media_url, media_type: m.media_type }));
  const pMed = pMedia.length > 0 ? pMedia[0] : null;

  const categoriesOptions = CATEGORIES.slice(1).map(cat => `
    <option value="${cat}" ${p.category === cat ? 'selected' : ''}>${tr('categories.' + cat)}</option>
  `).join('');
  
  const formHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label>${tr('seller.figure_title')}</label>
        <input type="text" id="edit-prod-title" value="${p.title}">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('product.brand')}</label>
          <input type="text" id="edit-prod-brand" value="${p.brand}">
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_category')}</label>
          <select id="edit-prod-category">${categoriesOptions}</select>
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_condition')}</label>
          <select id="edit-prod-condition">
            <option value="Sellado" ${p.condition === 'Sellado' ? 'selected' : ''}>${tr('seller.cond_sealed_desc')}</option>
            <option value="Nuevo" ${p.condition === 'Nuevo' ? 'selected' : ''}>${tr('seller.cond_new_desc')}</option>
            <option value="Usado" ${p.condition === 'Usado' ? 'selected' : ''}>${tr('seller.cond_used_desc')}</option>
            <option value="Caja dañada" ${p.condition === 'Caja dañada' ? 'selected' : ''}>${tr('seller.cond_damaged')}</option>
            <option value="Sin caja" ${p.condition === 'Sin caja' ? 'selected' : ''}>${tr('seller.cond_loose_desc')}</option>
          </select>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_stock')}</label>
          <input type="number" id="edit-prod-stock" value="${p.stock}">
        </div>
      </div>

      <!-- Shippo Parcel Dimensions & Collectibles Rules (Collapsible) -->
      <div style="border: 1px solid var(--border-color); padding:0.8rem; border-radius:6px; background:#fafafa;">
        <h4 style="font-size:0.85rem; margin-bottom:0; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem; cursor:pointer;" onclick="const t = document.getElementById('edit-shipping-advanced-opts'); t.style.display = t.style.display === 'none' ? 'block' : 'none';">
          <i data-lucide="package" style="width:1rem;height:1rem;color:var(--gold-light);"></i>
          ${tr('seller.advanced_shipping_options')}
          <i data-lucide="chevron-down" style="width:0.9rem;height:0.9rem; margin-left:auto;"></i>
        </h4>
        <div id="edit-shipping-advanced-opts" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--border-color);">
          <div class="checkout-form-group" style="margin-bottom:0.5rem;">
            <div class="checkout-input-wrapper">
              <label>${tr('seller.weight_oz')}</label>
              <input type="number" id="edit-prod-weight" value="${p.weight || 16}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.length_in')}</label>
              <input type="number" id="edit-prod-length" value="${p.length || 8}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.width_in')}</label>
              <input type="number" id="edit-prod-width" value="${p.width || 6}">
            </div>
            <div class="checkout-input-wrapper">
              <label>${tr('seller.height_in')}</label>
              <input type="number" id="edit-prod-height" value="${p.height || 4}">
            </div>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem; margin-top:0.75rem;">
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="edit-prod-fragile" ${p.fragile ? 'checked' : ''}>
              <span>${tr('seller.fragile_item_title')}</span>
            </label>
            <label style="display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="edit-prod-insurance" ${p.insurance_required ? 'checked' : ''}>
              <span>${tr('seller.insurance_required')}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label>${tr('seller.table_price')} ($USD)</label>
          <input type="number" id="edit-prod-price" value="${p.price}" oninput="updateProfitEstimator('edit-prod-price', 'edit-profit-estimator')">
          <div id="edit-profit-estimator" style="margin-top:0.4rem; padding:0.5rem; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); border-radius:6px; font-size:0.75rem; color:var(--text-secondary); display:none;"></div>
        </div>
        <div class="checkout-input-wrapper">
          <label>${tr('seller.media_photos_videos')}</label>
          <div style="display:flex; gap:0.4rem; margin-bottom:0.4rem;">
            <input type="text" id="edit-prod-media-url" placeholder="${tr('seller.paste_media_url')}" style="flex:1; margin-bottom:0;">
            <button type="button" class="btn-small primary-btn" onclick="handleAddMediaUrl('edit-prod-media-url')" style="width:auto; padding: 0 0.8rem; font-size:0.8rem; height:38px;">+</button>
          </div>
          <input type="file" id="edit-prod-media-input" style="display:none;" accept="image/*,video/*" multiple onchange="handleProductFormMultiMediaUpload(this)">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button type="button" class="btn-small secondary-btn" onclick="document.getElementById('edit-prod-media-input').click()" style="padding: 0.45rem 0.8rem; font-size:0.75rem; display:flex; align-items:center; gap:0.3rem; width:auto; border-color:var(--border-metallic-yellow);">
              <i data-lucide="camera" style="width:0.85rem; height:0.85rem;"></i> ${tr('seller.upload_take_photo_video')}
            </button>
            <span id="frm-media-count" style="font-size:0.7rem; color:var(--text-secondary);">${tr('seller.media_added_count', { count: pMedia.length, max: 5 })}</span>
          </div>
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.preview_gallery')}</label>
        <div id="frm-media-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:0.5rem; min-height:75px; border:1px dashed var(--border-color); padding:0.5rem; border-radius:6px; background:rgba(0,0,0,0.1); align-items:center;">
          <!-- Previews will go here -->
        </div>
      </div>
      <div class="checkout-input-wrapper">
        <label>${tr('seller.detailed_description')}</label>
        <textarea class="form-textarea" id="edit-prod-desc">${p.description}</textarea>
      </div>
      <button class="btn-large primary-btn" onclick="submitEditProduct('${p.id}')">${tr('seller.save_changes')}</button>
    </div>
  `;
  
  toggleGlobalModal(true, tr('seller.edit_collectible_title'), formHtml);
  lucide.createIcons();
  renderFormMediaGallery(); // Load media previews inside the gallery
  updateProfitEstimator('edit-prod-price', 'edit-profit-estimator');
}

async function submitEditProduct(productId) {
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

  if (!title || !brand || !price || !desc) {
    showToast(tr("seller.fill_main_fields_error"), 'error');
    return;
  }

  const productData = {
    id: productId,
    title: title,
    description: desc,
    brand: brand,
    category: category,
    condition: condition,
    price: price,
    stock: stock,
    weight: weight,
    length: length,
    width: width,
    height: height,
    fragile: fragile,
    insurance_required: insurance,
    declared_value: price
  };

  const res = await window.simulatedApiCall('/api/products', 'POST', {
    productData: productData,
    mediaData: window.newProductMedia
  });

  if (res.status === 200) {
    toggleGlobalModal(false);
    showToast(tr("seller.edit_success"), 'success');
    renderSellerDashboard();
  } else if (res.status === 403 && res.error === 'SELLER_GUIDELINES_ACCEPTANCE_REQUIRED') {
    showToast(res.message, 'error');
    toggleGlobalModal(false);
    setSellerTab('fees');
  } else {
    showToast(res.message || tr("seller.edit_error"), 'error');
  }
}

function handleProductFormMultiMediaUpload(input) {
  const files = input.files;
  if (!files || files.length === 0) return;

  const remainingSlots = 5 - window.newProductMedia.length;
  if (remainingSlots <= 0) {
    showToast(tr("seller.media_limit_reached"), 'error');
    return;
  }

  const targetFiles = Array.from(files).slice(0, remainingSlots);
  if (files.length > remainingSlots) {
    showToast(tr("seller.media_limit_partial", { count: remainingSlots }), 'error');
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
    showToast(tr("seller.media_max_reached_toast"), 'error');
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
    countSpan.textContent = tr('seller.media_added_count', { count: window.newProductMedia.length, max: 5 });
  }

  if (window.newProductMedia.length === 0) {
    gallery.innerHTML = `
      <p id="frm-media-empty-text" style="grid-column: span 5; text-align:center; color:var(--text-secondary); font-size:0.75rem; margin: 1rem 0;">${tr('seller.no_media_added')}</p>
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

  showToast(tr("seller.generating_stripe_link"), 'info');

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
      showToast(tr("seller.stripe_link_success"), 'success');
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
    showToast(tr("seller.stripe_conn_error", { error: err.message }), 'error');
  });
}

function openOrderDetailsModal(orderId) {
  const orders = db.get('orders');
  const o = orders.find(ord => ord.id === orderId);
  if (!o) return;

  const orderItems = db.get('order_items').filter(oi => oi.order_id === orderId);
  const products = db.get('products');
  
  // Calculate or retrieve values in cents (representing as dollar floats for display)
  const itemsSubtotalVal = o.itemsSubtotal !== undefined ? o.itemsSubtotal / 100 : (o.total_amount - (o.shippingAmount || 0)/100);
  const shippingAmountVal = o.shippingAmount !== undefined ? o.shippingAmount / 100 : 0.00;
  const taxAmountVal = o.taxAmount !== undefined ? o.taxAmount / 100 : 0.00;
  const buyerTotalVal = o.buyerTotal !== undefined ? o.buyerTotal / 100 : o.total_amount;
  const platformFeePercentageVal = o.platformFeePercentage !== undefined ? o.platformFeePercentage : 5;
  const platformFeeAmountVal = o.platformFeeAmount !== undefined ? o.platformFeeAmount / 100 : o.platform_fee;
  const paymentProcessingFeeVal = o.paymentProcessingFee !== undefined ? o.paymentProcessingFee / 100 : (o.processing_fee || (buyerTotalVal * 0.029 + 0.30));
  const sellerShippingLabelCostVal = o.sellerShippingLabelCost !== undefined ? o.sellerShippingLabelCost / 100 : 0.00;
  const refundAmountVal = o.refundAmount !== undefined ? o.refundAmount / 100 : 0.00;
  const sellerNetAmountVal = o.sellerNetAmount !== undefined ? o.sellerNetAmount / 100 : o.seller_payout;
  const currencyVal = o.currency ? o.currency.toUpperCase() : 'USD';
  const payoutStatusVal = o.payoutStatus || 'held_in_escrow';

  // Items detail
  const itemsHtml = orderItems.map(oi => {
    const p = products.find(prod => prod.id === oi.product_id);
    const priceStr = o.itemsSubtotal !== undefined ? `$${((p ? p.price : 0)).toFixed(2)}` : `$${(oi.price || 0).toFixed(2)}`;
    return `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-primary); margin-bottom:0.4rem;">
        <span>${p ? p.title : 'Figura'} (x${oi.quantity})</span>
        <span>${priceStr}</span>
      </div>
    `;
  }).join('');

  const estDepositDate = new Date(new Date(o.created_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const detailsHtml = `
    <div style="font-family:var(--font-body, sans-serif); color:var(--text-primary); padding: 0.5rem 0;">
      <div style="border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1rem;">
        <h4 style="margin:0 0 0.5rem 0; color:var(--text-primary); font-size:0.95rem;">Resumen de Artículos</h4>
        ${itemsHtml}
      </div>

      <div style="display:flex; flex-direction:column; gap:0.6rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1rem; font-size:0.85rem;">
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-secondary);">Subtotal de productos:</span>
          <span style="font-weight:600;">$${itemsSubtotalVal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-secondary);">Costo de envío (pagado por comprador):</span>
          <span>+$${shippingAmountVal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span style="color:var(--text-secondary);">Impuestos cobrados (8% IVA):</span>
          <span>+$${taxAmountVal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem; border-top: 1px dashed var(--border-color); padding-top:0.4rem;">
          <span>Total pagado por comprador:</span>
          <span style="color:var(--text-primary);">$${buyerTotalVal.toFixed(2)}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.6rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1rem; font-size:0.85rem;">
        <h4 style="margin:0 0 0.5rem 0; color:var(--text-primary); font-size:0.95rem;">Descuentos y Deducciones del Vendedor</h4>
        <div style="display:flex; justify-content:space-between; color:#ef4444;">
          <span>Comisión Geek Collector (${platformFeePercentageVal}%):</span>
          <span>-$${platformFeeAmountVal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; color:#ef4444;">
          <span>Procesamiento de Pago (Stripe Connect):</span>
          <span>-$${paymentProcessingFeeVal.toFixed(2)}</span>
        </div>
        ${sellerShippingLabelCostVal > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#ef4444;">
            <span>Costo de etiqueta de envío:</span>
            <span>-$${sellerShippingLabelCostVal.toFixed(2)}</span>
          </div>
        ` : ''}
        ${refundAmountVal > 0 ? `
          <div style="display:flex; justify-content:space-between; color:#ef4444; font-weight:600;">
            <span>Monto reembolsado:</span>
            <span>-$${refundAmountVal.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>

      <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); padding:0.8rem; border-radius:6px; margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; font-weight:700; color:#10b981;">
          <span>Ganancia Neta Estimada Vendedor:</span>
          <span>$${sellerNetAmountVal.toFixed(2)} ${currencyVal}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); border-top: 1px solid rgba(16,185,129,0.2); padding-top:0.4rem; margin-top:0.2rem;">
          <span>Estado del Pago: <strong style="text-transform:uppercase; color:var(--text-primary);">${o.payment_status}</strong></span>
          <span>Estado del Depósito: <strong style="text-transform:uppercase; color:var(--text-primary);">${payoutStatusVal}</strong></span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary);">
          <span>Fecha estimada de depósito:</span>
          <span><strong>${estDepositDate}</strong></span>
        </div>
      </div>

      <div style="text-align:center; margin-top:0.8rem; border-top:1px dashed var(--border-color); padding-top:0.8rem;">
        <a onclick="toggleGainCalculationDetails()" style="font-size:0.8rem; color:var(--gold-light); cursor:pointer; text-decoration:underline; font-weight:600; display:block;">${tr('seller.view_earnings_calc')}</a>
        <div id="gain-calc-details" style="display:none; text-align:left; background:rgba(0,0,0,0.2); padding:0.8rem; border-radius:6px; margin-top:0.5rem; font-size:0.75rem; line-height:1.5; color:var(--text-secondary);">
          <strong>${tr('seller.net_formula_title')}</strong><br>
          ${tr('seller.net_formula_text')}<br><br>
          <strong>${tr('seller.calc_in_cents_title')}</strong><br>
          - ${tr('seller.items_subtotal')}: ${o.itemsSubtotal || 0}¢ ($${itemsSubtotalVal.toFixed(2)})<br>
          - ${tr('seller.geek_commission', { pct: platformFeePercentageVal })}: -${o.platformFeeAmount || 0}¢ (-$${platformFeeAmountVal.toFixed(2)})<br>
          - ${tr('seller.stripe_processing')}: -${o.paymentProcessingFee || 0}¢ (-$${paymentProcessingFeeVal.toFixed(2)})<br>
          ${sellerShippingLabelCostVal > 0 ? `- ${tr('seller.seller_shipping_cost')}: -${o.sellerShippingLabelCost || 0}¢ (-$${sellerShippingLabelCostVal.toFixed(2)})<br>` : ''}
          ${refundAmountVal > 0 ? `- ${tr('seller.refunds_label')}: -${o.refundAmount || 0}¢ (-$${refundAmountVal.toFixed(2)})<br>` : ''}
          --------------------------------------------------<br>
          <strong>${tr('seller.seller_total_label')}: ${o.sellerNetAmount || 0}¢ ($${sellerNetAmountVal.toFixed(2)})</strong>
        </div>
      </div>
      
      <div style="text-align:right;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1rem;" onclick="toggleGlobalModal(false)">Cerrar</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, `Detalle de Orden: ${o.id}`, detailsHtml);
  lucide.createIcons();
}

function updateProfitEstimator(inputId, estimatorId) {
  const priceInput = document.getElementById(inputId);
  const estimator = document.getElementById(estimatorId);
  if (!priceInput || !estimator) return;

  const price = parseFloat(priceInput.value);
  if (isNaN(price) || price <= 0) {
    estimator.style.display = 'none';
    return;
  }

  const settings = db.get('marketplace_settings') || { commission_general: 5 };
  const commPct = settings.commission_general !== undefined ? settings.commission_general : 5;
  const platformFee = price * (commPct / 100);
  
  const stripeFee = (price * 0.029) + 0.30;
  const netEarnings = price - platformFee - stripeFee;

  estimator.style.display = 'block';
  estimator.innerHTML = `
    <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.25rem;">Estimación de Ganancias Vendedor:</div>
    <div style="display:flex; justify-content:space-between; margin-bottom:0.15rem; font-size:0.75rem;">
      <span>Comisión Geek Collector (${commPct}%):</span>
      <span style="color:#ef4444;">-$${platformFee.toFixed(2)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom:0.15rem; font-size:0.75rem;">
      <span>Tarifa Stripe (Aprox. 2.9% + 30¢):</span>
      <span style="color:#ef4444;">-$${stripeFee.toFixed(2)}</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-weight:700; color:#10b981; border-top:1px dashed rgba(99,102,241,0.3); padding-top:0.25rem; margin-top:0.25rem; font-size:0.75rem;">
      <span>Ganancia Neta Estimada:</span>
      <span>$${Math.max(0, netEarnings).toFixed(2)} USD</span>
    </div>
  `;
}

function renderSellerFeesTab(container, data) {
  const settings = db.get('marketplace_settings') || { commission_general: 5 };
  const commPct = settings.commission_general !== undefined ? settings.commission_general : 5;
  
  const visualSubtotal = 60.00;
  const visualPlatformFee = visualSubtotal * (commPct / 100);
  const visualStripeFee = (visualSubtotal * 0.029) + 0.30;
  const visualNet = visualSubtotal - visualPlatformFee - visualStripeFee;

  const sellerOrders = db.get('orders').filter(o => o.seller_id === state.currentUser.id);
  const availableBalance = sellerOrders.reduce((sum, o) => {
    if (o.order_status === 'delivered' && o.payment_status === 'paid' && o.payoutStatus !== 'paid_out') {
      return sum + o.seller_payout;
    }
    return sum;
  }, 0);

  const pendingBalance = sellerOrders.reduce((sum, o) => {
    if (o.order_status !== 'delivered' && o.order_status !== 'cancelled' && o.order_status !== 'refunded') {
      return sum + o.seller_payout;
    }
    return sum;
  }, 0);

  const nextDepositDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const stripeIdStr = data.sellerProf.stripe_connect_id || 'acct_Connected_Simulado';
  const stripeStatusStr = data.sellerProf.stripe_connect_id ? 'VINCULADO Y ACTIVO' : 'NO VINCULADO';

  // Seller rules acceptance status
  const guidelinesVersions = db.get('seller_guidelines_versions') || [];
  const activeGuidelinesVer = guidelinesVersions.find(v => v.status === 'active') || { version: 'seller-policy-v1.0' };
  
  const guidelinesAcceptances = db.get('seller_guidelines_acceptances') || [];
  const myGuidelinesAcc = guidelinesAcceptances.find(a => 
    a.sellerId === data.sellerProf.id && 
    a.policyVersion === activeGuidelinesVer.version && 
    a.acceptanceStatus === 'accepted'
  );

  let statusCardHtml = '';
  if (myGuidelinesAcc && !data.sellerProf.requiresGuidelinesReacceptance) {
    statusCardHtml = `
      <div style="background:rgba(16,185,129,0.05); border:1px solid #10b981; border-radius:12px; padding:1.5rem; margin-bottom:2rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.6rem; color:var(--text-primary);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(16,185,129,0.2); padding-bottom:0.6rem; margin-bottom:0.4rem;">
          <strong style="color:#10b981; text-transform:uppercase; font-size:0.8rem; font-family:var(--font-heading); display:flex; align-items:center; gap:0.4rem;">
            <i data-lucide="shield-check" style="width:1.1rem; height:1.1rem;"></i> ${tr('sellerGuidelines.title')}
          </strong>
          <span style="background:#10b981; color:#fff; padding:0.25rem 0.6rem; border-radius:20px; font-weight:700; font-size:0.7rem; text-transform:uppercase;">${tr('seller.status_accepted')}</span>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; margin-bottom:0.4rem;">
          <div>
            <span style="color:var(--text-secondary); display:block; font-size:0.75rem;">${tr('seller.accepted_version_label')}</span>
            <strong>${myGuidelinesAcc.policyVersion}</strong>
          </div>
          <div>
            <span style="color:var(--text-secondary); display:block; font-size:0.75rem;">${tr('seller.acceptance_date_label')}</span>
            <strong>${new Date(myGuidelinesAcc.acceptedAt).toLocaleString()}</strong>
          </div>
          <div>
            <span style="color:var(--text-secondary); display:block; font-size:0.75rem;">${tr('seller.acceptance_lang_label')}</span>
            <strong>${myGuidelinesAcc.policyLanguage ? myGuidelinesAcc.policyLanguage.toUpperCase() : 'ES'}</strong>
          </div>
          <div>
            <span style="color:var(--text-secondary); display:block; font-size:0.75rem;">${tr('seller.accepted_comm_label')}</span>
            <strong>${myGuidelinesAcc.platformFeePercentage}%</strong>
          </div>
        </div>

        <div style="text-align:right;">
          <button class="btn-large secondary-btn" style="width:auto; padding:0.4rem 1rem; font-size:0.8rem; border-color:#10b981;" onclick="viewFullGuidelinesText('${myGuidelinesAcc.policyVersion}')">
            ${tr('sellerGuidelines.viewFullPolicy')}
          </button>
        </div>
      </div>
    `;
  } else {
    const errorMsg = data.sellerProf.requiresGuidelinesReacceptance
      ? tr("sellerGuidelines.newVersionNotice")
      : tr("sellerGuidelines.requiredMessage");
    statusCardHtml = `
      <div style="background:rgba(239,68,68,0.05); border:1px solid #ef4444; border-radius:12px; padding:1.5rem; margin-bottom:2rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.6rem; color:var(--text-primary);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(239,68,68,0.2); padding-bottom:0.6rem; margin-bottom:0.4rem;">
          <strong style="color:#ef4444; text-transform:uppercase; font-size:0.8rem; font-family:var(--font-heading); display:flex; align-items:center; gap:0.4rem;">
            <i data-lucide="shield-alert" style="width:1.1rem; height:1.1rem;"></i> ${tr('sellerGuidelines.title')}
          </strong>
          <span style="background:#ef4444; color:#fff; padding:0.25rem 0.6rem; border-radius:20px; font-weight:700; font-size:0.7rem; text-transform:uppercase;">${tr('seller.status_acceptance_required')}</span>
        </div>
        
        <p style="margin:0; font-weight:600; font-size:0.85rem; line-height:1.5; color:var(--text-primary);">
          ${errorMsg}
        </p>
 
        <div style="text-align:right; margin-top:0.4rem;">
          <button class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem; font-size:0.8rem;" onclick="verifyGuidelinesAcceptanceFlow(() => { renderSellerDashboard(); })">
            ${tr('sellerGuidelines.acceptButton')}
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="font-family:var(--font-body, sans-serif);">
      <div style="margin-bottom:1.5rem;">
        <h3>${tr('seller.fees_guidelines_title')}</h3>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
          ${tr('seller.fees_guidelines_desc')}
        </p>
      </div>

      ${statusCardHtml}

      <!-- Tarjeta Destacada -->
      <div style="background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.05)); border:1.5px solid var(--border-metallic-yellow); border-radius:12px; padding:1.5rem; margin-bottom:2rem; box-shadow:0 4px 20px rgba(0,0,0,0.15);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
          <h4 style="margin:0; font-size:1.1rem; color:var(--text-primary); font-family:var(--font-heading);">${tr('seller.commission_card_title')} <span style="color:var(--gold-light); font-size:1.3rem; font-weight:700;">${commPct}%</span></h4>
          <span style="background:var(--gold-light); color:#000000; font-weight:700; font-size:0.7rem; padding:0.25rem 0.6rem; border-radius:10px; text-transform:uppercase;">${tr('seller.guaranteed_transparency')}</span>
        </div>
        <p style="margin:0 0 1rem 0; font-size:0.9rem; color:var(--text-primary); line-height:1.6;">
          ${tr('seller.commission_card_desc', { pct: commPct })}
        </p>
        <div style="background:rgba(255,255,255,0.04); border-radius:6px; padding:0.8rem; border-left:4px solid #10b981; font-size:0.8rem; color:var(--text-secondary); font-style:italic;">
          ${tr('seller.commission_card_note')}
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; align-items:start; flex-wrap:wrap;">
        <!-- Base de Cálculo -->
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:220px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
            <i data-lucide="calculator" style="width:1rem;height:1rem;color:#818cf8;"></i> Sobre Qué se Calcula la Comisión
          </h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1rem;">
            Por defecto, el 5% se calcula únicamente sobre el subtotal de los productos vendidos.
          </p>
          <div style="font-size:0.85rem; color:var(--text-primary); display:flex; flex-direction:column; gap:0.4rem; background:rgba(0,0,0,0.1); padding:0.6rem; border-radius:6px;">
            <div style="display:flex; justify-content:space-between;">
              <span>Subtotal de artículos de ejemplo:</span>
              <span>$${visualSubtotal.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:700; color:#ef4444;">
              <span>Comisión Geek Collector (${commPct}%):</span>
              <span>-$${visualPlatformFee.toFixed(2)}</span>
            </div>
          </div>
          <div style="margin-top:0.8rem; font-size:0.75rem; color:var(--text-muted);">
            <strong>No se calcula comisión sobre:</strong> Impuestos, Costo de envío, Propinas, Créditos promocionales, ni Cantidades reembolsadas.<br>
            <span style="font-style:italic; margin-top:0.25rem; display:block; color:#818cf8;">Esta regla refleja la configuración activa del administrador y se actualiza automáticamente.</span>
          </div>
        </div>

        <!-- Stripe Fees -->
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:220px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
            <i data-lucide="credit-card" style="width:1rem;height:1rem;color:#10b981;"></i> Tarifa de Procesamiento de Pago (Stripe)
          </h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1rem;">
            “Stripe procesa los pagos realizados en Geek Collector. La tarifa de procesamiento de pago se descuenta de las ganancias del vendedor y puede variar según el método de pago, país, tipo de tarjeta o configuración de la cuenta.”
          </p>
          <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2); border-radius:6px; padding:0.6rem; font-size:0.8rem;">
            <strong>Tarifa de Stripe Configurada:</strong> 2.9% + $0.30 por transacción (Estimado)
          </div>
          <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.8rem; line-height:1.4;">
            <strong>Aclaración:</strong> “La tarifa final será la cantidad real confirmada por Stripe. Geek Collector no presenta una tarifa estimada como si fuera una cantidad garantizada.”
          </p>
        </div>
      </div>

      <!-- Ejemplo Completo de Venta -->
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.5rem; margin-bottom:2rem;">
        <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
          <i data-lucide="receipt" style="width:1rem;height:1rem;color:var(--gold-light);"></i> Ejemplo Completo de Liquidación de Fondos
        </h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
          Desglose matemático de una venta de una figura coleccionable de $60.00:
        </p>
        
        <div style="max-width:500px; font-size:0.85rem; display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between;">
            <span>Subtotal de los artículos:</span>
            <span>$${visualSubtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#ef4444;">
            <span>Comisión Geek Collector (${commPct}%):</span>
            <span>-$${visualPlatformFee.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; color:#ef4444;">
            <span>Procesamiento estimado de Stripe:</span>
            <span>-$${visualStripeFee.toFixed(2)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:700; color:#10b981; border-top:1px dashed var(--border-color); padding-top:0.4rem;">
            <span>Ganancia estimada del vendedor:</span>
            <span>$${visualNet.toFixed(2)} USD</span>
          </div>
        </div>

        <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">
          “Este ejemplo no incluye el costo de una etiqueta de envío, reembolsos, disputas, impuestos retenidos u otros ajustes que puedan aplicar.”
        </span>
      </div>

      <!-- Calculadora Interactiva -->
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.5rem; margin-bottom:2rem;">
        <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
          <i data-lucide="percent" style="width:1rem;height:1rem;color:#6366f1;"></i> Calculadora Interactiva de Ganancias
        </h4>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.2rem;">
          Introduce los datos de tu próxima publicación para estimar tus ingresos netos en tiempo real:
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; flex-wrap:wrap;">
          <!-- Inputs -->
          <div style="display:flex; flex-direction:column; gap:0.8rem;">
            <div style="display:flex; flex-direction:column; gap:0.25rem;">
              <label for="calc-price" style="font-size:0.75rem; color:var(--text-primary); font-weight:600;">Precio del artículo ($USD):</label>
              <input type="number" id="calc-price" value="60" min="0" step="0.01" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" oninput="runInteractiveCalculator()">
            </div>
            <div style="display:flex; flex-direction:column; gap:0.25rem;">
              <label for="calc-qty" style="font-size:0.75rem; color:var(--text-primary); font-weight:600;">Cantidad:</label>
              <input type="number" id="calc-qty" value="1" min="1" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" oninput="runInteractiveCalculator()">
            </div>
            <div style="display:flex; flex-direction:column; gap:0.25rem;">
              <label for="calc-discount" style="font-size:0.75rem; color:var(--text-primary); font-weight:600;">Descuento aplicado ($USD):</label>
              <input type="number" id="calc-discount" value="0" min="0" step="0.01" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" oninput="runInteractiveCalculator()">
            </div>
            <div style="display:flex; flex-direction:column; gap:0.25rem;">
              <label for="calc-shipping" style="font-size:0.75rem; color:var(--text-primary); font-weight:600;">Costo de envío asumido por vendedor ($USD):</label>
              <input type="number" id="calc-shipping" value="0" min="0" step="0.01" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:#000000; outline:none;" oninput="runInteractiveCalculator()">
              <span style="font-size:0.65rem; color:var(--text-muted);">Completa este campo solo si ofreces envío gratuito o cubres la etiqueta.</span>
            </div>
          </div>

          <!-- Outputs -->
          <div style="background:rgba(99,102,241,0.04); border:1px solid rgba(99,102,241,0.15); border-radius:6px; padding:1rem; display:flex; flex-direction:column; gap:0.6rem; justify-content:center;">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
              <span style="color:var(--text-secondary);">Subtotal de la venta:</span>
              <strong id="out-calc-subtotal">$60.00</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#ef4444;">
              <span>Comisión de Geek Collector (${commPct}%):</span>
              <strong id="out-calc-fee">-$3.00</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#ef4444;">
              <span>Procesamiento estimado Stripe:</span>
              <strong id="out-calc-stripe">-$2.04</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#ef4444;">
              <span>Costo de envío asumido:</span>
              <strong id="out-calc-shipping">-$0.00</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.95rem; color:#10b981; font-weight:700; border-top:1px solid rgba(99,102,241,0.2); padding-top:0.5rem; margin-top:0.3rem;">
              <span>Ganancia neta estimada:</span>
              <span id="out-calc-net">$54.96</span>
            </div>
            <p style="font-size:0.7rem; color:var(--text-muted); margin:0.3rem 0 0 0; line-height:1.3; font-style:italic;">
              “Esta es una estimación. La ganancia final puede variar según la tarifa real de Stripe, reembolsos, ajustes, envío e impuestos aplicables.”
            </p>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; align-items:start;">
        <!-- Deducciones Posibles -->
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:270px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Posibles deducciones de tus ganancias
          </h4>
          <ul style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6; margin:0; padding-left:1.2rem;">
            <li><strong>Comisión de Geek Collector:</strong> El fee transaccional general sobre el subtotal.</li>
            <li><strong>Tarifa de procesamiento de Stripe:</strong> El cobro por el proceso de fondos a tu cuenta conectada.</li>
            <li><strong>Costo de etiqueta de envío:</strong> Cuando el vendedor ofrece envío gratuito o acepta cubrir la etiqueta.</li>
            <li><strong>Reembolsos totales o parciales:</strong> Devoluciones acordadas con el cliente.</li>
            <li><strong>Contracargos o disputas:</strong> Fondos retenidos por cargos no reconocidos o fraudes de compradores.</li>
            <li><strong>Ajustes del administrador:</strong> Penalizaciones o correcciones aplicadas por auditoría.</li>
            <li><strong>Impuestos o retenciones:</strong> En caso de que legalmente aplique retención fiscal.</li>
          </ul>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.8rem; font-style:italic;">
            * Nota: Estos cargos no son automáticos en todas las compras; se aplican exclusivamente según corresponda en cada orden de venta.
          </div>
        </div>

        <!-- Publicar es Gratis -->
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:270px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Políticas Generales: Publicar es Gratis
          </h4>
          <ul style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6; margin:0; padding-left:1.2rem;">
            <li>No existe costo por crear una cuenta de vendedor en Geek Collector.</li>
            <li>No existe costo por publicar artículos o listados de figuras en el catálogo.</li>
            <li>No existe costo mensual obligatorio para mantener tu tienda en funcionamiento.</li>
            <li>La comisión solo se descuenta cuando se completa una venta pagada.</li>
            <li>Los planes especiales o promociones futuras se mostrarán por separado y nunca se activarán sin tu consentimiento.</li>
          </ul>
        </div>
      </div>

      <!-- Envíos y Reembolsos -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; align-items:start;">
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:240px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Envíos y Etiquetas
          </h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0.8rem;">
            “El comprador puede pagar el costo de envío durante el checkout. Si el vendedor ofrece envío gratis, el costo de la etiqueta se descontará de las ganancias del vendedor.”
          </p>
          <div style="font-size:0.75rem; background:rgba(0,0,0,0.1); padding:0.6rem; border-radius:6px; color:var(--text-secondary); line-height:1.5;">
            <strong>Compra de Etiquetas (Shippo):</strong><br>
            Al generar una etiqueta, se especificará el transportista (USPS, FedEx, UPS), servicio seleccionado, costo de etiqueta, quién asume la cantidad y el número de rastreo que se enviará al comprador.
          </div>
        </div>

        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:240px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Reembolsos y cancelaciones
          </h4>
          <ul style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin:0; padding-left:1.2rem;">
            <li>Si se cancela la orden antes del envío, se actualizará el balance de la tienda.</li>
            <li>En reembolsos totales, las ganancias de la venta se retiran de tu balance.</li>
            <li>En reembolsos parciales, la comisión de Geek Collector se recalcula proporcionalmente.</li>
            <li>Las tarifas de procesamiento de Stripe podrían no ser reembolsables según las políticas de Stripe.</li>
            <li>Tendrás acceso al desglose completo de cada ajuste en tu historial.</li>
          </ul>
        </div>
      </div>

      <!-- Disputas y Depósitos -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; align-items:start;">
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:250px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Disputas de pago
          </h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0.8rem;">
            “Cuando un comprador presenta una disputa o contracargo, Geek Collector puede retener temporalmente los fondos relacionados con la orden mientras se investiga el caso.”
          </p>
          <div style="font-size:0.75rem; color:var(--text-secondary);">
            <strong>Evidencias requeridas en disputas:</strong>
            <ul style="margin:0.25rem 0 0 0; padding-left:1rem; line-height:1.4;">
              <li>Número de rastreo y comprobante de envío.</li>
              <li>Confirmación de entrega y fotos del empaque.</li>
              <li>Fotos originales del artículo y estado del producto.</li>
              <li>Mensajes intercambiados en el chat con el comprador.</li>
            </ul>
          </div>
        </div>

        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; min-height:250px;">
          <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
            Pagos y depósitos
          </h4>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-bottom:0.8rem; font-size:0.8rem;">
            <div style="background:rgba(255,255,255,0.03); padding:0.4rem; border-radius:4px;">
              <span style="font-size:0.7rem; color:var(--text-muted);">Balance Pendiente:</span><br>
              <strong>$${pendingBalance.toFixed(2)}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.4rem; border-radius:4px;">
              <span style="font-size:0.7rem; color:var(--text-muted);">Balance Disponible:</span><br>
              <strong>$${availableBalance.toFixed(2)}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.4rem; border-radius:4px;">
              <span style="font-size:0.7rem; color:var(--text-muted);">Próximo Depósito:</span><br>
              <strong>$${availableBalance > 0 ? availableBalance.toFixed(2) : '0.00'}</strong>
            </div>
            <div style="background:rgba(255,255,255,0.03); padding:0.4rem; border-radius:4px;">
              <span style="font-size:0.7rem; color:var(--text-muted);">Cuenta Conectada:</span><br>
              <strong style="font-size:0.65rem; word-break:break-all;">${stripeIdStr}</strong>
            </div>
          </div>

          <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.4; margin:0 0 0.5rem 0;">
            “Las ganancias no necesariamente estarán disponibles inmediatamente después de la compra. El tiempo de disponibilidad puede depender de la confirmación del pago, el envío, posibles periodos de retención, disputas y el calendario de depósitos de Stripe.”
          </p>
          <div style="font-size:0.7rem; color:var(--text-muted);">
            Estado de Stripe Connect: <strong>${stripeStatusStr}</strong> | Próximo pago: <strong>${nextDepositDate}</strong>
          </div>
        </div>
      </div>

      <!-- Preguntas Frecuentes -->
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.5rem; margin-bottom:2rem;">
        <h4 style="margin-top:0; color:var(--text-primary); font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
          Preguntas Frecuentes
        </h4>
        <div style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem; font-size:0.8rem; line-height:1.5;">
          <div>
            <strong style="color:var(--text-primary);">¿Cuánto cuesta publicar un artículo?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">Publicar es gratis. La comisión se cobra solamente cuando se completa una venta.</p>
          </div>
          <div>
            <strong style="color:var(--text-primary);">¿Cuánto cobra Geek Collector?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">La comisión predeterminada es del ${commPct}% sobre el subtotal de los artículos vendidos.</p>
          </div>
          <div>
            <strong style="color:var(--text-primary);">¿La comisión se cobra sobre el envío?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">No, salvo que la configuración del marketplace cambie por el administrador y seas notificado previamente.</p>
          </div>
          <div>
            <strong style="color:var(--text-primary);">¿El comprador paga la comisión?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">No. La comisión se descuenta de las ganancias del vendedor.</p>
          </div>
          <div>
            <strong style="color:var(--text-primary);">¿Stripe cobra una tarifa adicional?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">Sí. La tarifa real de procesamiento de Stripe se descuenta de la transacción.</p>
          </div>
          <div>
            <strong style="color:var(--text-primary);">¿Cuándo recibo mi pago?</strong>
            <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">Depende del estado de la orden, posibles retenciones y el calendario de depósitos de Stripe.</p>
          </div>
        </div>
      </div>

      <!-- Enlace Historial -->
      <div style="text-align:right;">
        <a onclick="openPolicyHistoryModal()" style="font-size:0.85rem; color:var(--gold-light); cursor:pointer; font-weight:700; text-decoration:underline;">Ver historial de comisiones</a>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function runInteractiveCalculator() {
  const priceInput = document.getElementById('calc-price');
  const qtyInput = document.getElementById('calc-qty');
  const discountInput = document.getElementById('calc-discount');
  const shippingInput = document.getElementById('calc-shipping');

  const outSubtotal = document.getElementById('out-calc-subtotal');
  const outFee = document.getElementById('out-calc-fee');
  const outStripe = document.getElementById('out-calc-stripe');
  const outShipping = document.getElementById('out-calc-shipping');
  const outNet = document.getElementById('out-calc-net');

  if (!priceInput || !outSubtotal) return;

  const price = parseFloat(priceInput.value) || 0;
  const qty = parseInt(qtyInput.value) || 1;
  const discount = parseFloat(discountInput.value) || 0;
  const shipping = parseFloat(shippingInput.value) || 0;

  const subtotal = Math.max(0, price * qty - discount);

  const settings = db.get('marketplace_settings') || { commission_general: 5 };
  const commPct = settings.commission_general !== undefined ? settings.commission_general : 5;
  const platformFee = subtotal * (commPct / 100);

  const stripeFee = subtotal > 0 ? (subtotal * 0.029) + 0.30 : 0;
  const netEarnings = Math.max(0, subtotal - platformFee - stripeFee - shipping);

  outSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  outFee.textContent = `-$${platformFee.toFixed(2)}`;
  outStripe.textContent = `-$${stripeFee.toFixed(2)}`;
  outShipping.textContent = `-$${shipping.toFixed(2)}`;
  outNet.textContent = `$${netEarnings.toFixed(2)} USD`;
}

function openPolicyHistoryModal() {
  const history = db.get('commission_policy_history') || [];
  const acceptances = db.get('seller_policy_acceptances') || [];
  
  const historyRowsHtml = history.map(h => {
    const acc = acceptances.find(a => a.sellerId === state.currentUser.id && a.feePolicyVersion === h.version);
    const acceptDateStr = acc ? new Date(acc.acceptedAt).toLocaleString() : 'PENDIENTE';
    return `
      <tr>
        <td><strong>${h.version}</strong></td>
        <td>${h.commission_percentage}%</td>
        <td>${new Date(h.published_at).toLocaleDateString()}</td>
        <td>${h.status === 'active' ? '<span class="status-tag approved">Vigente</span>' : '<span class="status-tag suspended">Anterior</span>'}</td>
        <td style="color:${acc ? '#10b981' : '#f59e0b'}; font-weight:600;">${acceptDateStr}</td>
      </tr>
    `;
  }).join('');

  const modalHtml = `
    <div style="font-family:var(--font-body, sans-serif); color:var(--text-primary);">
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem;">
        Historial de versiones y aceptación de políticas de comisiones de Geek Collector para tu cuenta de vendedor.
      </p>
      
      <div class="db-table-card" style="margin-bottom:1.5rem;">
        <div class="db-table-wrapper">
          <table class="db-table">
            <thead>
              <tr>
                <th>Versión</th>
                <th>Comisión</th>
                <th>Publicación</th>
                <th>Estado</th>
                <th>Aceptado el</th>
              </tr>
            </thead>
            <tbody>
              ${historyRowsHtml}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style="text-align:right;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1rem;" onclick="toggleGlobalModal(false)">Cerrar</button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, tr('seller.policy_history_title'), modalHtml);
}

async function submitBlockerGuidelinesAcceptance(version) {
  const checkbox = document.getElementById('blocker-accept-checkbox');
  if (!checkbox || !checkbox.checked) {
    showToast(tr("seller.must_agree_guidelines_toast"), 'error');
    return;
  }

  const lang = localStorage.getItem('cm_language') || 'es';
  const res = await window.simulatedApiCall('/api/seller/accept-guidelines', 'POST', {
    policyVersion: version,
    policyLanguage: lang,
    source: 'dashboard_blocker'
  });

  if (res.status === 200) {
    showToast(tr("seller.guidelines_accepted_success"), 'success');
    renderSellerDashboard();
  } else {
    showToast(res.message || tr("seller.guidelines_accept_error"), 'error');
  }
}

function toggleGainCalculationDetails() {
  const container = document.getElementById('gain-calc-details');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function verifyGuidelinesAcceptanceFlow(onSuccessCallback) {
  const currentUser = state.currentUser;
  if (!currentUser) {
    showToast(tr("seller.login_to_publish_error"), 'error');
    return;
  }

  const profiles = db.get('seller_profiles');
  const sellerProf = profiles.find(p => p.user_id === currentUser.id);
  if (!sellerProf) {
    showToast(tr("seller.no_active_profile_error"), 'error');
    return;
  }

  if (sellerProf.status === 'suspended' || sellerProf.suspended || sellerProf.publishing_suspended) {
    showToast(tr("seller.suspended_publishing_error"), 'error');
    return;
  }

  const versions = db.get('seller_guidelines_versions') || [];
  const activeVer = versions.find(v => v.status === 'active');
  if (!activeVer) {
    onSuccessCallback();
    return;
  }

  const acceptances = db.get('seller_guidelines_acceptances') || [];
  const hasAccepted = acceptances.some(a => 
    a.sellerId === sellerProf.id && 
    a.policyVersion === activeVer.version && 
    a.acceptanceStatus === 'accepted'
  );

  if (hasAccepted && !sellerProf.requiresGuidelinesReacceptance) {
    onSuccessCallback();
    return;
  }

  openGuidelinesModal(activeVer, sellerProf, onSuccessCallback);
}

function openGuidelinesModal(activeVer, sellerProf, onSuccessCallback) {
  const title = tr("seller.before_publishing_first");
  const description = tr("seller.before_publishing_first_desc");

  const lang = localStorage.getItem('cm_language') || 'es';
  const checkboxText = tr("sellerGuidelines.checkbox");
  const acceptButtonText = tr("sellerGuidelines.acceptButton");

  const settings = db.get('marketplace_settings') || { commission_general: 5 };
  const commPct = settings.commission_general;
  
  const content = `
    <div style="font-family:var(--font-body, sans-serif); display:flex; flex-direction:column; gap:1.2rem; color:var(--text-primary);">
      <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.5; margin:0;">
        ${description}
      </p>

      <div style="background:rgba(255,255,255,0.04); border:1px solid var(--border-color); border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem; font-size:0.8rem;">
        <div><strong>${tr('seller.current_commission_label')}</strong> ${commPct}%</div>
        <div><strong>${tr('seller.policy_version_label')}</strong> ${activeVer.version}</div>
        <div><strong>${tr('seller.effective_date_label')}</strong> ${window.formatDate(activeVer.effective_date)}</div>
      </div>

      <div>
        <a onclick="viewFullGuidelinesText('${activeVer.version}')" style="color:var(--gold-light); font-weight:700; cursor:pointer; text-decoration:underline; font-size:0.85rem;">
          ${tr('seller.view_full_guidelines_btn')}
        </a>
      </div>

      <div style="display:flex; align-items:flex-start; gap:0.5rem; background:rgba(0,0,0,0.1); padding:0.8rem; border-radius:6px;">
        <input type="checkbox" id="modal-guidelines-accept-chk" style="width:1.2rem; height:1.2rem; margin-top:0.1rem; cursor:pointer;" onchange="document.getElementById('modal-guidelines-accept-btn').disabled = !this.checked">
        <label for="modal-guidelines-accept-chk" style="font-size:0.8rem; color:var(--text-primary); cursor:pointer; line-height:1.4;">
          ${checkboxText.replace('Reglas para Vendedores', `<a onclick="viewFullGuidelinesText('${activeVer.version}')" style="color:var(--gold-light); cursor:pointer; text-decoration:underline; font-weight:700;">Reglas para Vendedores</a>`).replace('Seller Guidelines', `<a onclick="viewFullGuidelinesText('${activeVer.version}')" style="color:var(--gold-light); cursor:pointer; text-decoration:underline; font-weight:700;">Seller Guidelines</a>`)}
        </label>
      </div>

      <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top:0.5rem;">
        <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="toggleGlobalModal(false)">
          ${tr('seller.cancel_btn')}
        </button>
        <button id="modal-guidelines-accept-btn" class="btn-large primary-btn" style="width:auto; padding:0.5rem 1.2rem;" disabled>
          ${acceptButtonText}
        </button>
      </div>
    </div>
  `;

  toggleGlobalModal(true, title, content);
  
  const btn = document.getElementById('modal-guidelines-accept-btn');
  if (btn) {
    btn.onclick = async () => {
      const res = await window.simulatedApiCall('/api/seller/accept-guidelines', 'POST', {
        policyVersion: activeVer.version,
        policyLanguage: lang,
        source: 'listing_creation'
      });
      
      if (res.status === 200) {
        showToast(tr("seller.guidelines_accepted_success"), 'success');
        toggleGlobalModal(false);
        onSuccessCallback();
      } else {
        showToast(res.message || tr("seller.guidelines_accept_error"), 'error');
      }
    };
  }
}

function viewFullGuidelinesText(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const ver = versions.find(v => v.version === version);
  if (!ver) return;

  const lang = localStorage.getItem('cm_language') || 'es';
  const title = lang === 'en' ? ver.title_en : ver.title_es;
  const content = lang === 'en' ? ver.content_en : ver.content_es;

  const html = `
    <div style="font-family:var(--font-body, sans-serif); color:var(--text-primary); max-height:400px; overflow-y:auto; padding-right:0.5rem; line-height:1.6; font-size:0.9rem; white-space:pre-wrap; background:rgba(0,0,0,0.15); padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
      ${content}
    </div>
    <div style="text-align:right; margin-top:1.2rem;">
      <button class="btn-large secondary-btn" style="width:auto; padding:0.5rem 1.2rem;" onclick="goBackToGuidelinesAcceptanceModal('${version}')">${tr('seller.back_btn')}</button>
    </div>
  `;

  toggleGlobalModal(true, title, html);
}

function goBackToGuidelinesAcceptanceModal(version) {
  const versions = db.get('seller_guidelines_versions') || [];
  const activeVer = versions.find(v => v.status === 'active');
  const profiles = db.get('seller_profiles');
  const sellerProf = profiles.find(p => p.user_id === state.currentUser.id);
  openGuidelinesModal(activeVer, sellerProf, () => {
    if (window.activeSellerTab === 'products') {
      openAddProductModalReal();
    } else {
      renderSellerDashboard();
    }
  });
}



