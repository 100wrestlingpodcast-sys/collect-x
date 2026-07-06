// collectors-market/components/cart.js

// --- Cart Drawer Renderer ---
function renderCartDrawer() {
  const container = document.getElementById('cart-drawer-items');
  const subtotalEl = document.getElementById('cart-drawer-subtotal');
  const commissionEl = document.getElementById('cart-drawer-commissions-sim');
  const totalEl = document.getElementById('cart-drawer-total');
  
  if (!container) return;

  const products = db.get('products');
  const media = db.get('product_media');
  const profiles = db.get('seller_profiles');

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 0; color:var(--text-muted);">
        <i data-lucide="shopping-cart" style="width:2.5rem; height:2.5rem; margin-bottom:0.75rem; opacity:0.5;"></i>
        <p>Tu carrito está vacío</p>
      </div>
    `;
    subtotalEl.textContent = '$0.00';
    commissionEl.textContent = '$0.00';
    totalEl.textContent = '$0.00';
    lucide.createIcons();
    return;
  }

  let subtotal = 0;
  let estimatedPlatformCommissions = 0;

  const itemsHtml = state.cart.map(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (!p) return '';

    const pMedia = media.find(m => m.product_id === p.id);
    const imgSrc = pMedia ? pMedia.media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=150&auto=format&fit=crop&q=80';
    
    const itemTotal = p.price * item.quantity;
    subtotal += itemTotal;

    // Calculate commission if seller is not admin
    if (p.seller_id !== 'usr_admin_1') {
      const prof = profiles.find(s => s.user_id === p.seller_id);
      const rate = prof ? prof.commission_rate : 0.10; // Default 10%
      estimatedPlatformCommissions += itemTotal * rate;
    }

    return `
      <div class="cart-item">
        <img src="${imgSrc}" class="cart-item-img">
        <div class="cart-item-details">
          <h4 class="cart-item-title">${p.title}</h4>
          <div class="cart-item-price">$${p.price.toFixed(2)}</div>
          <div class="cart-item-qty-row">
            <div class="qty-counter">
              <button class="qty-btn" onclick="updateCartQty('${item.product_id}', -1)">-</button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn" onclick="updateCartQty('${item.product_id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeCartItem('${item.product_id}')">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = itemsHtml;
  
  // Set prices
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  commissionEl.textContent = `$${estimatedPlatformCommissions.toFixed(2)}`;
  totalEl.textContent = `$${subtotal.toFixed(2)}`;

  lucide.createIcons();
}

function updateCartQty(productId, delta) {
  const products = db.get('products');
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const index = state.cart.findIndex(i => i.product_id === productId);
  if (index > -1) {
    const newQty = state.cart[index].quantity + delta;
    if (newQty <= 0) {
      state.cart.splice(index, 1);
    } else {
      if (newQty > product.stock) {
        alert(`Stock insuficiente. Solo quedan ${product.stock} unidades de este artículo.`);
        return;
      }
      state.cart[index].quantity = newQty;
    }
    state.saveCart();
    renderCartDrawer();
  }
}

function removeCartItem(productId) {
  const index = state.cart.findIndex(i => i.product_id === productId);
  if (index > -1) {
    state.cart.splice(index, 1);
    state.saveCart();
    renderCartDrawer();
  }
}

function proceedToCheckout() {
  if (state.cart.length === 0) {
    alert("Agrega artículos al carrito antes de pagar.");
    return;
  }
  toggleCartDrawer(false);
  router.navigate('checkout');
}

// --- Checkout Page View ---
function renderCheckoutView() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const products = db.get('products');
  const profiles = db.get('seller_profiles');

  if (state.cart.length === 0) {
    viewport.innerHTML = `
      <div class="section-container" style="text-align:center; padding:5rem 0;">
        <h2>Tu Carrito está vacío</h2>
        <p style="color:var(--text-secondary); margin-top:1rem;">No tienes artículos para comprar en este momento.</p>
        <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">Explorar Marketplace</button>
      </div>
    `;
    return;
  }

  // Calculate financials
  let subtotal = 0;
  let hasExternalSeller = false;
  let processingFees = 0;
  let platformCommissionTotal = 0;
  let splitPayoutsHtml = '';

  // Setup arrays to loop payouts
  const payoutsBySeller = {};

  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      const itemCost = p.price * item.quantity;
      subtotal += itemCost;

      const sellerId = p.seller_id;
      if (!payoutsBySeller[sellerId]) {
        payoutsBySeller[sellerId] = {
          gross: 0,
          commissionRate: 0.10, // Default base fee
          sellerName: 'Collectors Shop',
          stripeAcct: 'Cuenta Principal'
        };
      }
      payoutsBySeller[sellerId].gross += itemCost;

      if (sellerId !== 'usr_admin_1') {
        hasExternalSeller = true;
        const prof = profiles.find(s => s.user_id === sellerId);
        if (prof) {
          payoutsBySeller[sellerId].commissionRate = prof.commission_rate;
          payoutsBySeller[sellerId].sellerName = prof.store_name;
          payoutsBySeller[sellerId].stripeAcct = prof.stripe_connect_id || 'acct_Connected';
        }
      }
    }
  });

  // Calculate discount coupon
  const activeCoupon = window.appliedCoupon || null;
  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.discount_type === 'percentage') {
      discount = subtotal * (activeCoupon.value / 100);
    } else {
      discount = activeCoupon.value;
    }
  }

  // Apply discount proportionally to seller payouts for fee calculations
  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  
  let shippingCost = subtotal > 150 ? 0.00 : 5.99; // Free shipping over $150
  if (activeCoupon && activeCoupon.code === 'FREESHIP') {
    shippingCost = 0.00;
  }

  const grandTotal = subtotal - discount + shippingCost;

  // Process visual split payouts
  let stripeProcessingFeeTotal = (grandTotal * 0.029) + 0.30;
  
  Object.keys(payoutsBySeller).forEach(sId => {
    const pData = payoutsBySeller[sId];
    // Scale gross based on discount ratio
    const adjustedGross = pData.gross * discountRatio;
    
    let comm = 0;
    let net = adjustedGross;
    let desc = '';

    if (sId !== 'usr_admin_1') {
      comm = adjustedGross * pData.commissionRate;
      const stripeRatio = adjustedGross / (subtotal - discount || 1);
      const shareOfStripeFee = stripeProcessingFeeTotal * stripeRatio;
      net = adjustedGross - comm - shareOfStripeFee;
      platformCommissionTotal += comm;

      desc = `
        <div class="stripe-flow-step">
          <span style="color:#818cf8;"><strong>${pData.sellerName}</strong> (${pData.stripeAcct})</span>
          <span>Recibe: <strong>$${net.toFixed(2)}</strong></span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top:-0.25rem; margin-bottom:0.5rem; padding-left:0.5rem;">
          Bruto: $${pData.gross.toFixed(2)} | Comisión (${(pData.commissionRate*100).toFixed(0)}%): -$${comm.toFixed(2)} | Stripe Share: -$${shareOfStripeFee.toFixed(2)}
        </div>
      `;
    } else {
      // Store own inventory
      net = adjustedGross; // Keeps 100% of sales
      desc = `
        <div class="stripe-flow-step">
          <span style="color:#34d399;"><strong>Collectors Shop (Inventario Propio)</strong></span>
          <span>Recibe: <strong>$${net.toFixed(2)}</strong></span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top:-0.25rem; margin-bottom:0.5rem; padding-left:0.5rem;">
          El administrador recibe el 100% de esta venta.
        </div>
      `;
    }
    splitPayoutsHtml += desc;
  });

  // Set coupon label
  const couponText = activeCoupon 
    ? `<span style="color:#10b981;">Cupón: ${activeCoupon.code} (-$${discount.toFixed(2)})</span>`
    : '<span style="color:var(--text-muted);">Ninguno</span>';

  viewport.innerHTML = `
    <div class="section-container">
      <div style="margin-bottom: 2rem;">
        <h2>Pasarela de Pago Segura</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">Completa tu orden utilizando Stripe Checkout</p>
      </div>

      <div class="checkout-grid">
        <!-- Form Details -->
        <div>
          <!-- Shipping Address -->
          <div class="checkout-card">
            <h3 class="checkout-subtitle">
              <i data-lucide="map-pin" style="color:var(--primary-light);"></i>
              Dirección de Envío
            </h3>
            
            <div class="checkout-form-group">
              <div class="checkout-input-wrapper">
                <label for="ship-name">Nombre Completo</label>
                <input type="text" id="ship-name" placeholder="Carlos Mendoza" value="${state.currentUser.name}">
              </div>
              <div class="checkout-input-wrapper">
                <label for="ship-email">Correo Electrónico</label>
                <input type="email" id="ship-email" placeholder="carlos@mail.com" value="${state.currentUser.email}" disabled>
              </div>
            </div>
            
            <div class="checkout-form-group full-width">
              <div class="checkout-input-wrapper">
                <label for="ship-address">Dirección de Envío</label>
                <input type="text" id="ship-address" placeholder="Av. Principal #456, Col. Centro">
              </div>
            </div>

            <div class="checkout-form-group">
              <div class="checkout-input-wrapper">
                <label for="ship-city">Ciudad / Estado</label>
                <input type="text" id="ship-city" placeholder="Ciudad de México">
              </div>
              <div class="checkout-input-wrapper">
                <label for="ship-zip">Código Postal</label>
                <input type="text" id="ship-zip" placeholder="06700">
              </div>
            </div>
          </div>

          <!-- Stripe Card Form -->
          <div class="checkout-card">
            <h3 class="checkout-subtitle" style="display:flex; justify-content:space-between; align-items:center;">
              <span style="display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="credit-card" style="color:#6366f1;"></i>
                Pago con Stripe
              </span>
              <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Modo Prueba Activo</span>
            </h3>
            
            <!-- Quick Apple / Google Pay mock buttons if compatible -->
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
              <button class="btn-large" style="background:#000; color:white; font-size:0.9rem; padding: 0.6rem; border:1px solid rgba(255,255,255,0.15);" onclick="simulateExpressPay('Apple Pay')">
                <i data-lucide="smartphone" style="width:1rem;height:1rem;"></i> Pagar con Apple Pay
              </button>
              <button class="btn-large" style="background:#fff; color:#000; font-size:0.9rem; padding: 0.6rem; border:1px solid #ddd;" onclick="simulateExpressPay('Google Pay')">
                <i data-lucide="smartphone" style="width:1rem;height:1rem;"></i> Pagar con Google Pay
              </button>
            </div>

            <div style="margin-bottom:1rem; text-align:center; color:var(--text-muted); font-size:0.8rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
              o paga con tarjeta de crédito/débito
            </div>

            <div class="checkout-input-wrapper" style="margin-bottom:1rem;">
              <label>Número de Tarjeta</label>
              <div style="position:relative;">
                <input type="text" id="stripe-card-num" placeholder="4242 4242 4242 4242" maxlength="19" style="padding-left: 2.5rem; letter-spacing:0.1em;" oninput="formatCardNumber(this)">
                <i data-lucide="credit-card" style="position:absolute; left:0.75rem; top:0.75rem; width:1.1rem; height:1.1rem; color:var(--text-muted);"></i>
              </div>
            </div>

            <div class="checkout-form-group">
              <div class="checkout-input-wrapper">
                <label>Vencimiento (MM/AA)</label>
                <input type="text" id="stripe-card-expiry" placeholder="12/28" maxlength="5" oninput="formatExpiry(this)">
              </div>
              <div class="checkout-input-wrapper">
                <label>CVC / Código Seguridad</label>
                <input type="password" id="stripe-card-cvc" placeholder="***" maxlength="4">
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary & Stripe Connect Split visualizer -->
        <div>
          <div class="checkout-card" style="position:sticky; top:90px;">
            <h3 class="checkout-subtitle">Resumen del Pedido</h3>
            
            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>Subtotal Figuras</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>Descuento</span>
                <span>${discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>Envío</span>
                <span>${shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:700; border-top:1px dashed var(--border-color); padding-top:0.75rem; color:var(--text-primary);">
                <span>Total a Pagar</span>
                <span style="color:var(--gold-light);">$${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <!-- Coupon Input -->
            <div style="margin-bottom:1.5rem; display:flex; gap:0.5rem;">
              <input type="text" id="checkout-coupon-code" placeholder="Código de Cupón" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:var(--text-primary); flex-grow:1; text-transform:uppercase; outline:none;" value="${activeCoupon ? activeCoupon.code : ''}">
              <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem; font-size:0.85rem;" onclick="applyCouponCode()">Aplicar</button>
            </div>
            <div style="margin-top:-1rem; margin-bottom:1.5rem; font-size:0.8rem;">
              Estado del Cupón: ${couponText}
            </div>

            <!-- Payout Split Card -->
            <div class="stripe-payout-visualizer">
              <div style="font-family:var(--font-heading); font-size:0.85rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
                <i data-lucide="git-fork" style="width:0.9rem;height:0.9rem;color:#6366f1;"></i>
                Transferencia Automática de Fondos
              </div>
              <div class="stripe-flow-steps">
                <div class="stripe-flow-step">
                  <span>Monto Total Cobrado</span>
                  <span style="color:var(--text-primary); font-weight:700;">$${grandTotal.toFixed(2)}</span>
                </div>
                <div class="stripe-flow-step">
                  <span>Comisión Procesador (Stripe 2.9% + 30¢)</span>
                  <span>-$${stripeProcessingFeeTotal.toFixed(2)}</span>
                </div>
                <div class="stripe-flow-step">
                  <span>Comisión COLLECT X (Plataforma)</span>
                  <span>+$${platformCommissionTotal.toFixed(2)}</span>
                </div>
                
                <div style="margin-top:0.5rem; border-top:1.5px solid rgba(99,102,241,0.3); padding-top:0.5rem;">
                  <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#818cf8; display:block; margin-bottom:0.4rem;">Destino de Payouts (Stripe Connect Split):</span>
                  ${splitPayoutsHtml}
                </div>
              </div>
            </div>

            <!-- Complete Order Button -->
            <button class="btn-large primary-btn" style="margin-top:1.5rem; padding: 1rem;" onclick="processPaymentSubmit(${grandTotal}, ${platformCommissionTotal}, ${stripeProcessingFeeTotal})">
              <i data-lucide="shield-check"></i>
              Confirmar y Pagar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// Format Input fields
function formatCardNumber(input) {
  let v = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let matches = v.match(/\d{4,16}/g);
  let match = matches && matches[0] || '';
  let parts = [];

  for (let i=0, len=match.length; i<len; i+=4) {
    parts.push(match.substring(i, i+4));
  }

  if (parts.length > 0) {
    input.value = parts.join(' ');
  } else {
    input.value = v;
  }
}

function formatExpiry(input) {
  let v = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    input.value = v.substring(0, 2) + '/' + v.substring(2, 4);
  } else {
    input.value = v;
  }
}

// Simulate Quick checkout Express pay
function simulateExpressPay(providerName) {
  alert(`Ventana de ${providerName} emergente. Autenticando biométricos...`);
  // Prefill details and run checkout
  document.getElementById('ship-address').value = "Av. Paseo de la Reforma #115";
  document.getElementById('ship-city').value = "Ciudad de México";
  document.getElementById('ship-zip').value = "06500";
  document.getElementById('stripe-card-num').value = "4242 4242 4242 4242";
  document.getElementById('stripe-card-expiry').value = "09/29";
  document.getElementById('stripe-card-cvc').value = "422";
  
  alert(`¡Autenticación con ${providerName} Exitosa! Información de envío precargada. Presiona 'Confirmar y Pagar' para terminar.`);
}

// Apply Coupon
function applyCouponCode() {
  const code = document.getElementById('checkout-coupon-code').value.trim().toUpperCase();
  if (!code) {
    window.appliedCoupon = null;
    renderCheckoutView();
    return;
  }

  const coupons = db.get('coupons');
  const match = coupons.find(c => c.code === code && c.active);

  if (match) {
    window.appliedCoupon = match;
    alert(`¡Cupón ${code} aplicado correctamente!`);
  } else {
    window.appliedCoupon = null;
    alert("Código de cupón inválido o expirado.");
  }
  renderCheckoutView();
}

// Complete payment submit
function processPaymentSubmit(grandTotal, platformFeeTotal, processingFeeTotal) {
  const name = document.getElementById('ship-name').value.trim();
  const address = document.getElementById('ship-address').value.trim();
  const city = document.getElementById('ship-city').value.trim();
  const zip = document.getElementById('ship-zip').value.trim();
  const cardNum = document.getElementById('stripe-card-num').value.trim();
  const expiry = document.getElementById('stripe-card-expiry').value.trim();
  const cvc = document.getElementById('stripe-card-cvc').value.trim();

  if (!name || !address || !city || !zip) {
    alert("Por favor completa los datos de envío.");
    return;
  }
  if (!cardNum || !expiry || !cvc) {
    alert("Por favor completa la información de pago de tu tarjeta.");
    return;
  }

  // Simulate Payment Intent validation
  alert("Procesando pago de Stripe en los servidores... (Simulando API call)");
  
  const orders = db.get('orders');
  const orderItems = db.get('order_items');
  const transactions = db.get('transactions');
  const products = db.get('products');
  const profiles = db.get('seller_profiles');

  // Create individual order structures grouped by seller (since Stripe Connect handles orders by seller/merchant)
  const cartBySeller = {};
  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      if (!cartBySeller[p.seller_id]) cartBySeller[p.seller_id] = [];
      cartBySeller[p.seller_id].push({ product: p, qty: item.quantity });
    }
  });

  const activeCoupon = window.appliedCoupon || null;
  const subtotal = state.cart.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.product_id);
    return sum + (p ? p.price * item.quantity : 0);
  }, 0);
  
  const discount = activeCoupon 
    ? (activeCoupon.discount_type === 'percentage' ? subtotal * (activeCoupon.value / 100) : activeCoupon.value)
    : 0;
  
  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

  // Loop over each seller and create separate order transactions
  Object.keys(cartBySeller).forEach(sellerId => {
    const items = cartBySeller[sellerId];
    
    // Total for this seller
    const sellerSubtotal = items.reduce((sum, i) => sum + (i.product.price * i.qty), 0);
    const sellerAdjustedGross = sellerSubtotal * discountRatio;
    
    // Platform fee rate
    let commRate = 0.10;
    let sellerName = 'Collectors Shop';
    if (sellerId !== 'usr_admin_1') {
      const prof = profiles.find(p => p.user_id === sellerId);
      if (prof) {
        commRate = prof.commission_rate;
        sellerName = prof.store_name;
      }
    }

    const platformFee = sellerId === 'usr_admin_1' ? 0.00 : sellerAdjustedGross * commRate;
    
    // Stripe fee proportional share
    const stripeShare = processingFeeTotal * (sellerAdjustedGross / (subtotal - discount || 1));
    const sellerPayout = sellerAdjustedGross - platformFee;
    const sellerNet = sellerAdjustedGross - platformFee - stripeShare;

    const newOrderId = "ord_" + Math.random().toString(36).substr(2, 9);
    
    // Create Order Record
    const newOrder = {
      id: newOrderId,
      buyer_id: state.currentUser.id,
      seller_id: sellerId,
      total_amount: sellerAdjustedGross,
      platform_fee: platformFee,
      seller_payout: sellerPayout,
      payment_status: "paid",
      order_status: "paid", // Initial state
      stripe_payment_intent_id: "pi_" + Math.random().toString(36).substr(2, 15),
      tracking_number: "", // None yet
      shipping_carrier: "",
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);

    // Save Order Items
    items.forEach(i => {
      const newOrderItem = {
        id: "ord_it_" + Math.random().toString(36).substr(2, 9),
        order_id: newOrderId,
        product_id: i.product.id,
        quantity: i.qty,
        price: i.product.price
      };
      orderItems.push(newOrderItem);

      // Deduct Stock in database!
      const pIndex = products.findIndex(prod => prod.id === i.product.id);
      if (pIndex > -1) {
        products[pIndex].stock = Math.max(0, products[pIndex].stock - i.qty);
        if (products[pIndex].stock === 0) {
          products[pIndex].status = "sold_out";
        }
      }
    });

    // Create Transaction Record
    const newTransaction = {
      id: "trx_" + Math.random().toString(36).substr(2, 9),
      order_id: newOrderId,
      buyer_id: state.currentUser.id,
      seller_id: sellerId,
      gross_amount: sellerAdjustedGross,
      platform_fee: platformFee,
      processing_fee: stripeShare,
      seller_net: sellerNet,
      payment_provider: "stripe",
      status: "succeeded",
      created_at: new Date().toISOString()
    };
    transactions.push(newTransaction);

    // Update Seller Total Sales profile stats
    if (sellerId !== 'usr_admin_1') {
      const sProfIndex = profiles.findIndex(p => p.user_id === sellerId);
      if (sProfIndex > -1) {
        profiles[sProfIndex].total_sales += sellerAdjustedGross;
      }
    }
  });

  // Save back to db
  db.set('orders', orders);
  db.set('order_items', orderItems);
  db.set('transactions', transactions);
  db.set('products', products);
  db.set('seller_profiles', profiles);

  // Clear cart
  state.cart = [];
  state.saveCart();
  window.appliedCoupon = null;

  alert("¡Compra procesada con éxito! La transacción de Stripe y las transferencias Stripe Connect se han liquidado correctamente.");
  
  // Navigate to marketplace
  router.navigate('');
}
