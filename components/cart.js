// collectors-market/components/cart.js

let stripeInstance = null;
let cardElementInstance = null;

async function initStripeElements() {
  if (!window.firebaseActive) return;
  const container = document.getElementById('stripe-card-element');
  if (!container) return;

  try {
    // 1. Get or initialize Stripe instance
    if (!stripeInstance) {
      const res = await fetch('/.netlify/functions/get-stripe-config');
      const { publishableKey } = await res.json();
      if (!publishableKey || publishableKey.includes("PLACEHOLDER") || publishableKey === "") {
        console.warn("Stripe public key not configured in environment variables.");
        container.innerHTML = `<div style="color:var(--danger-color, #ef4444); padding:8px; border:1px solid #fecaca; border-radius:6px; background:#fef2f2; font-size:0.85rem;">Stripe no está configurado en el servidor.</div>`;
        return;
      }
      stripeInstance = Stripe(publishableKey);
    }

    // 2. Create and mount a new Card Element
    const elements = stripeInstance.elements();
    cardElementInstance = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#1f2937',
          fontFamily: '"Outfit", sans-serif',
          '::placeholder': { color: '#9ca3af' }
        },
        invalid: {
          color: '#ef4444',
          iconColor: '#ef4444'
        }
      }
    });
    cardElementInstance.mount('#stripe-card-element');

    // Add error handler
    cardElementInstance.on('change', (event) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      }
    });
  } catch (e) {
    console.error("Error setting up Stripe Elements:", e);
    container.innerHTML = `<div style="color:var(--danger-color, #ef4444); padding:8px; border:1px solid #fecaca; border-radius:6px; background:#fef2f2; font-size:0.85rem;">Error cargando Stripe: ${e.message}</div>`;
  }
}

// --- Cart Drawer Renderer ---
function renderCartDrawer() {
  const container = document.getElementById('cart-drawer-items');
  if (!container) return;

  const products = db.get('products');

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary);">
        <i data-lucide="shopping-cart" style="width:3rem; height:3rem; color:var(--border-metallic-yellow); margin-bottom:1rem; opacity:0.6;"></i>
        <p>${tr('Tu carrito está vacío', 'Your cart is empty')}</p>
        <button class="btn-large primary-btn" style="margin-top:1.5rem; font-size:0.85rem;" onclick="toggleCartDrawer(false)">${tr('Continuar Comprando', 'Continue Shopping')}</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  let cartHtml = '';
  let subtotal = 0;

  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      const itemTotal = p.price * item.quantity;
      subtotal += itemTotal;
      const condClass = p.condition.toLowerCase().replace(/\s+/g, '');
      const media = db.get('product_media').find(m => m.product_id === p.id);
      const img = media ? media.media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=150&auto=format&fit=crop&q=80';

      cartHtml += `
        <div class="cart-item">
          <img src="${img}" class="cart-item-img">
          <div class="cart-item-details">
            <h4 class="cart-item-title" onclick="router.navigate('product/${p.id}')">${p.title}</h4>
            <div style="display:flex; align-items:center; gap:0.5rem; margin:0.2rem 0;">
              <span class="condition-badge ${condClass}" style="position:static; font-size:0.65rem; padding:0.1rem 0.3rem;">${p.condition}</span>
              <span style="font-size:0.8rem; color:var(--text-muted);">x${item.quantity}</span>
            </div>
            <div style="font-weight:700; color:var(--gold-light); font-size:0.95rem;">$${p.price.toFixed(2)}</div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${p.id}')" title="${tr('Eliminar de carrito', 'Remove from cart')}">
            <i data-lucide="trash-2" style="width:0.95rem; height:0.95rem;"></i>
          </button>
        </div>
      `;
    }
  });

  container.innerHTML = `
    <div class="cart-items-list">${cartHtml}</div>
    
    <div style="margin-top:auto; padding-top:1.5rem; border-top:1px solid var(--border-color);">
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-primary);">
        <span>${tr('Subtotal', 'Subtotal')}</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
        <button class="btn-large primary-btn" onclick="router.navigate('checkout')">
          ${tr('Proceder al Checkout', 'Proceed to Checkout')}
        </button>
        <button class="btn-large secondary-btn" onclick="toggleCartDrawer(false)">
          ${tr('Seguir Comprando', 'Continue Shopping')}
        </button>
      </div>
    </div>
  `;

  lucide.createIcons();
}

function addToCart(productId) {
  const products = db.get('products');
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  if (p.stock <= 0) {
    showToast(tr("Lo sentimos, este artículo se encuentra agotado.", "Sorry, this item is out of stock."), 'error');
    return;
  }

  const existing = state.cart.find(item => item.product_id === productId);
  if (existing) {
    if (existing.quantity >= p.stock) {
      showToast(tr(`No puedes añadir más piezas. Stock disponible: ${p.stock}`, `You cannot add more items. Stock available: ${p.stock}`), 'error');
      return;
    }
    existing.quantity += 1;
  } else {
    state.cart.push({ product_id: productId, quantity: 1 });
  }

  state.saveCart();
  showToast(tr(`¡${p.title} añadida al carrito!`, `¡${p.title} added to cart!`), 'success');
  renderCartDrawer();
  toggleCartDrawer(true);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.product_id !== productId);
  state.saveCart();
  renderCartDrawer();
}

function fetchRealShippoRates(parcel, fromAddress, toAddress) {
  if (window.shippoRatesLoading) return;
  window.shippoRatesLoading = true;
  window.currentShippoRates = null;
  window.selectedRateId = null;
  window.shippoInsuranceSuggested = false;
  window.shippoFragileWarning = false;

  // Render immediately to show the loading spinner
  renderCheckoutView();

  const url = window.firebaseActive 
    ? '/.netlify/functions/get-shippo-rates' 
    : null; // Fallback to local simulator if Firebase is inactive
    
  if (!url) {
    // Local simulator fallback
    setTimeout(() => {
      const data = shippoAPI.calculateRates(parcel, fromAddress, toAddress);
      window.currentShippoRates = data.rates;
      window.selectedRateId = data.recommended_rate_id;
      window.recommendedRateId = data.recommended_rate_id;
      window.shippoInsuranceSuggested = data.insurance_suggested;
      window.shippoFragileWarning = data.fragile_warning;
      window.shippoRatesLoading = false;
      renderCheckoutView();
    }, 1000);
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parcel, fromAddress, toAddress })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    window.currentShippoRates = data.rates;
    window.selectedRateId = data.recommended_rate_id;
    window.recommendedRateId = data.recommended_rate_id;
    window.shippoInsuranceSuggested = data.insurance_suggested;
    window.shippoFragileWarning = data.fragile_warning;
    window.shippoRatesLoading = false;
    renderCheckoutView();
  })
  .catch(err => {
    console.error("Shippo fetch error:", err);
    window.shippoRatesLoading = false;
    showToast(tr("Error al cotizar envío con Shippo. Usando simulación local.", "Error quoting shipping with Shippo. Using local simulation."), "error");
    // Fallback to simulator
    const data = shippoAPI.calculateRates(parcel, fromAddress, toAddress);
    window.currentShippoRates = data.rates;
    window.selectedRateId = data.recommended_rate_id;
    window.recommendedRateId = data.recommended_rate_id;
    window.shippoInsuranceSuggested = data.insurance_suggested;
    window.shippoFragileWarning = data.fragile_warning;
    renderCheckoutView();
  });
}

// --- Checkout view renderer with Shippo Integration ---
function renderCheckoutView() {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const products = db.get('products');
  const profiles = db.get('seller_profiles');

  if (!state.currentUser) {
    showToast(tr("Inicia sesión para proceder al checkout de tu compra.", "Log in to proceed to checkout."), 'error');
    renderLoginFormModal();
    router.navigate('');
    return;
  }

  if (state.cart.length === 0) {
    viewport.innerHTML = `
      <div class="section-container" style="text-align:center; padding:5rem 0;">
        <h2>${tr('Tu Carrito está vacío', 'Your Cart is empty')}</h2>
        <p style="color:var(--text-secondary); margin-top:1rem;">${tr('No tienes artículos para comprar en este momento.', 'You have no items to buy at this time.')}</p>
        <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">${tr('Explorar Marketplace', 'Explore Marketplace')}</button>
      </div>
    `;
    return;
  }

  // 1. Gather all unique sellers from cart items
  const cartBySeller = {};
  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      if (!cartBySeller[p.seller_id]) cartBySeller[p.seller_id] = [];
      cartBySeller[p.seller_id].push({ product: p, qty: item.quantity });
    }
  });

  // 2. Load buyer addresses
  const addresses = db.get('shipping_addresses').filter(a => a.user_id === state.currentUser.id);
  
  // Set default address
  if (!window.selectedAddressId && addresses.length > 0) {
    const defAddr = addresses.find(a => a.is_default) || addresses[0];
    window.selectedAddressId = defAddr.id;
  }
  const activeAddress = addresses.find(a => a.id === window.selectedAddressId) || null;

  // 3. Compute package dimensions & weight (aggregate package simulator)
  let totalWeight = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;
  let isFragile = false;
  let declaredValue = 0;
  let mainCategory = "Funko Pop";
  let sellerIdForShipping = "";

  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      sellerIdForShipping = p.seller_id;
      totalWeight += (p.weight || 8) * item.quantity;
      maxLength = Math.max(maxLength, p.length || 6);
      maxWidth = Math.max(maxWidth, p.width || 5);
      maxHeight += (p.height || 4) * item.quantity; // Stack items height-wise
      if (p.fragile) isFragile = true;
      declaredValue += p.price * item.quantity;
      mainCategory = p.category;
      sellerIdForShipping = p.seller_id;
    }
  });

  const parcel = {
    weight: totalWeight,
    length: maxLength,
    width: maxWidth,
    height: maxHeight,
    fragile: isFragile,
    declared_value: declaredValue,
    category: mainCategory,
    seller_id: sellerIdForShipping
  };

  // 4. Fetch Shippo Rates based on active address
  let fromAddressDetails = null;

  if (activeAddress) {
    // Locate seller's origin address
    const allAddresses = db.get('shipping_addresses');
    fromAddressDetails = allAddresses.find(a => a.user_id === sellerIdForShipping) || allAddresses.find(a => a.user_id === "usr_admin_1");
    
    if (window.currentShippoRates === undefined || window.currentShippoRates === null) {
      if (!window.shippoRatesLoading) {
        fetchRealShippoRates(parcel, fromAddressDetails, activeAddress);
      }
    }
  }

  // 5. Select active shipping rate
  const activeRate = window.currentShippoRates ? window.currentShippoRates.find(r => r.id === window.selectedRateId) : null;

  // 6. Calculate Financials
  let subtotal = 0;
  let platformCommissionTotal = 0;
  let splitPayoutsHtml = '';

  state.cart.forEach(item => {
    const p = products.find(prod => prod.id === item.product_id);
    if (p) {
      subtotal += p.price * item.quantity;
    }
  });

  // Coupon calculations
  const activeCoupon = window.appliedCoupon || null;
  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.discount_type === 'percentage') {
      discount = subtotal * (activeCoupon.value / 100);
    } else {
      discount = activeCoupon.value;
    }
  }

  const discountRatio = subtotal > 0 ? (subtotal - discount) / subtotal : 0;

  // Shipping cost
  const shippingCost = activeRate ? activeRate.shipping_cost : 0.00;
  const insuranceCost = activeRate ? activeRate.insurance_cost : 0.00;
  const taxesCost = (subtotal - discount) * 0.08; // 8% sales tax

  const grandTotal = subtotal - discount + shippingCost + insuranceCost + taxesCost;

  // Stripe processing fee
  const stripeProcessingFeeTotal = (grandTotal * 0.029) + 0.30;

  // Build Stripe Connect split visualizer details
  Object.keys(cartBySeller).forEach(sId => {
    const items = cartBySeller[sId];
    const sellerSub = items.reduce((sum, i) => sum + (i.product.price * i.qty), 0);
    const sellerAdjustedGross = sellerSub * discountRatio;
    
    let commRate = 0.10;
    let sellerName = 'Collectors Shop';
    let stripeAcct = 'Cuenta Principal';

    if (sId !== 'usr_admin_1') {
      const prof = profiles.find(p => p.user_id === sId);
      if (prof) {
        commRate = prof.commission_rate;
        sellerName = prof.store_name;
        stripeAcct = prof.stripe_connect_id || 'acct_Connected';
      }
    }

    const platformFee = sId === 'usr_admin_1' ? 0.00 : sellerAdjustedGross * commRate;
    
    // Add proportional shares
    const stripeShare = stripeProcessingFeeTotal * (sellerAdjustedGross / (subtotal - discount || 1));
    const sellerPayout = sellerAdjustedGross - platformFee;
    const sellerNet = sellerAdjustedGross - platformFee - stripeShare;
    
    if (sId !== 'usr_admin_1') {
      platformCommissionTotal += platformFee;
    }

    splitPayoutsHtml += `
      <div class="stripe-flow-step">
        <span style="color:#818cf8;"><strong>${sellerName}</strong> (${stripeAcct})</span>
        <span>Recibe: <strong>$${sellerPayout.toFixed(2)}</strong></span>
      </div>
      <div style="font-size: 0.75rem; color: var(--text-muted); margin-top:-0.25rem; margin-bottom:0.5rem; padding-left:0.5rem;">
        Monto Bruto: $${sellerSub.toFixed(2)} | Comisión (${(commRate*100).toFixed(0)}%): -$${platformFee.toFixed(2)} | Retenido en Escrow hasta Entrega.
      </div>
    `;
  });

  const couponText = activeCoupon 
    ? `<span style="color:#10b981;">${tr('Cupón:', 'Coupon:')} ${activeCoupon.code} (-$${discount.toFixed(2)})</span>`
    : `<span style="color:var(--text-muted);">${tr('Ninguno', 'None')}</span>`;

  // Address Options selector HTML
  const addressOptionsHtml = addresses.map(addr => `
    <option value="${addr.id}" ${addr.id === window.selectedAddressId ? 'selected' : ''}>
      ${addr.name} - ${addr.street}, ${addr.city}, ${addr.state}
    </option>
  `).join('');

  // Shippo rates selectors HTML
  let ratesSelectionHtml = `
    <div style="padding: 1.5rem; text-align:center; border: 1.5px dashed var(--border-color); border-radius:8px; color:var(--text-secondary);">
      <i data-lucide="truck" style="width:2rem; height:2rem; margin-bottom:0.5rem; opacity:0.5;"></i>
      <p style="font-size:0.9rem;">${tr('Por favor selecciona o añade una dirección de envío para cotizar tarifas.', 'Please select or add a shipping address to quote rates.')}</p>
    </div>
  `;

  if (window.shippoRatesLoading) {
    ratesSelectionHtml = `
      <div style="padding: 2rem; text-align:center; border: 1px solid var(--border-color); border-radius:8px;">
        <div class="spinner" style="margin: 0 auto 1rem;"></div>
        <p style="font-size:0.85rem; color:var(--text-secondary);">${tr('Cotizando tarifas reales con Shippo...', 'Quoting real rates with Shippo...')}</p>
      </div>
    `;
  } else if (window.currentShippoRates) {
    ratesSelectionHtml = window.currentShippoRates.map(rate => {
      const isRecommended = rate.id === window.recommendedRateId;
      const isSelected = rate.id === window.selectedRateId;

      return `
        <label class="shipping-rate-card ${isSelected ? 'selected' : ''}" onclick="selectShippingRate('${rate.id}')">
          <input type="radio" name="checkout-shipping-rate" value="${rate.id}" ${isSelected ? 'checked' : ''} style="display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
              <div style="font-weight:700; display:flex; align-items:center; gap:0.4rem; color:var(--text-primary);">
                <span>${rate.carrier} ${rate.service}</span>
                ${isRecommended ? `<span class="status-tag approved" style="font-size:0.6rem; padding: 0.1rem 0.4rem; border-color:#d97706; color:#d97706;">${tr('Recomendado', 'Recommended')}</span>` : ''}
              </div>
              <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.15rem;">
                ${tr('Tiempo de tránsito:', 'Transit time:')} ${rate.days} ${rate.days === 1 ? tr('día', 'day') : tr('días', 'days')} | ${tr('Nivel:', 'Tier:')} ${rate.tier}
              </div>
              ${rate.notes ? `<div style="font-size:0.75rem; color:#f59e0b; margin-top:0.25rem;">⚠️ ${rate.notes}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700; color:var(--gold-light); font-size:1.1rem;">$${rate.shipping_cost.toFixed(2)}</div>
              ${rate.insurance_cost > 0 ? `<div style="font-size:0.7rem; color:var(--text-muted);">${tr('Seguro:', 'Insurance:')} +$${rate.insurance_cost.toFixed(2)}</div>` : ''}
            </div>
          </div>
        </label>
      `;
    }).join('');
  }

  // Address Details Info block
  let activeAddressBlock = '';
  if (activeAddress) {
    activeAddressBlock = `
      <div style="background:#fafafa; border:1px solid var(--border-color); border-radius:6px; padding:0.8rem; margin-top:1rem; font-size:0.85rem; line-height:1.5;">
        <strong>${tr('Destinatario:', 'Recipient:')}</strong> ${activeAddress.name}<br>
        <strong>${tr('Dirección:', 'Address:')}</strong> ${activeAddress.street}, ${activeAddress.city}, ${activeAddress.state} ${activeAddress.zip}, ${activeAddress.country}<br>
        <strong>${tr('Teléfono:', 'Phone:')}</strong> ${activeAddress.phone}
      </div>
    `;
  }
  window.checkoutTotals = {
    grandTotal: grandTotal,
    platformFeeTotal: platformCommissionTotal,
    processingFeeTotal: stripeProcessingFeeTotal,
    shippingCost: shippingCost
  };

  viewport.innerHTML = `
    <div class="section-container">
      <div style="margin-bottom: 2rem;">
        <h2>${tr('Pasarela de Pago Segura', 'Secure Checkout Gateway')}</h2>
        <p style="color:var(--text-secondary); margin-top:0.25rem;">${tr('Completa tu orden utilizando Stripe & Shippo Integrations', 'Complete your order using Stripe & Shippo Integrations')}</p>
      </div>

      <div class="checkout-grid">
        <!-- Form Details -->
        <div>
          <!-- Shipping Address selection -->
          <div class="checkout-card">
            <h3 class="checkout-subtitle" style="display:flex; justify-content:space-between; align-items:center;">
              <span style="display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="map-pin" style="color:var(--primary-light);"></i>
                ${tr('Dirección de Envío', 'Shipping Address')}
              </span>
              <button class="action-btn-small approve" style="font-size:0.75rem; padding:0.3rem 0.6rem;" onclick="openNewAddressModal()">
                ${tr('+ Agregar Nueva', '+ Add New')}
              </button>
            </h3>
            
            <div class="checkout-input-wrapper" style="margin-top:1rem;">
              <label for="checkout-address-select">${tr('Selecciona una dirección guardada', 'Select a saved address')}</label>
              <select id="checkout-address-select" onchange="changeCheckoutAddress(this.value)" style="background:#ffffff; border:1px solid var(--border-color); color:var(--text-primary); width:100%; border-radius:6px; padding:0.5rem; outline:none;">
                ${addresses.length === 0 ? `<option value="">${tr('No tienes direcciones guardadas', 'You have no saved addresses')}</option>` : addressOptionsHtml}
              </select>
            </div>
            
            ${activeAddressBlock}
          </div>

          <!-- Shippo Carriers Comparer -->
          <div class="checkout-card">
            <h3 class="checkout-subtitle">
              <i data-lucide="truck" style="color:#f59e0b;"></i>
              ${tr('Comparador de Envíos Shippo', 'Shippo Shipping Comparer')}
            </h3>
            
            ${window.shippoInsuranceSuggested ? `
              <div class="alert-info-box" style="background:#fef3c7; border: 1px solid #fcd34d; border-radius:6px; padding:0.75rem; margin-bottom:1rem; font-size:0.8rem; color:#b45309; display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="shield" style="width:1.2rem; height:1.2rem; flex-shrink:0;"></i>
                <div>
                  <strong>${tr('Seguro Shippo Recomendado:', 'Shippo Insurance Recommended:')}</strong> ${tr('Este paquete incluye artículos especiales o de alto valor (> $100). El costo del seguro se agregará automáticamente al transportista seleccionado para cubrir posibles daños o pérdida en el correo.', 'This package includes special or high-value items (> $100). The insurance cost will be added automatically to the selected carrier to cover potential damage or loss in transit.')}
                </div>
              </div>
            ` : ''}

            ${window.shippoFragileWarning ? `
              <div class="alert-info-box" style="background:#fee2e2; border: 1px solid #fecaca; border-radius:6px; padding:0.75rem; margin-bottom:1rem; font-size:0.8rem; color:#b91c1c; display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="alert-triangle" style="width:1.2rem; height:1.2rem; flex-shrink:0;"></i>
                <div>
                  <strong>${tr('Artículo Frágil:', 'Fragile Item:')}</strong> ${tr('Se ha añadido un recargo de protección física y se aconseja seleccionar opciones de transporte prioritario.', 'A physical protection surcharge has been added and priority transport options are advised.')}
                </div>
              </div>
            ` : ''}

            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1rem;">
              ${ratesSelectionHtml}
            </div>
          </div>

          <!-- Stripe Card Form -->
          <div class="checkout-card">
            <h3 class="checkout-subtitle" style="display:flex; justify-content:space-between; align-items:center;">
              <span style="display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="credit-card" style="color:#6366f1;"></i>
                ${tr('Pago con Stripe', 'Pay with Stripe')}
              </span>
              <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${tr('Modo Prueba Activo', 'Test Mode Active')}</span>
            </h3>
            
            ${!window.firebaseActive ? `
            <!-- Quick Apple / Google Pay mock buttons if compatible -->
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
              <button class="btn-large" style="background:#000; color:white; font-size:0.9rem; padding: 0.6rem; border:1px solid rgba(255,255,255,0.15);" onclick="simulateExpressPay('Apple Pay')">
                <i data-lucide="smartphone" style="width:1rem;height:1rem;"></i> ${tr('Pagar con Apple Pay', 'Pay with Apple Pay')}
              </button>
              <button class="btn-large" style="background:#fff; color:#000; font-size:0.9rem; padding: 0.6rem; border:1px solid #ddd;" onclick="simulateExpressPay('Google Pay')">
                <i data-lucide="smartphone" style="width:1rem;height:1rem;"></i> ${tr('Pagar con Google Pay', 'Pay with Google Pay')}
              </button>
            </div>

            <div style="margin-bottom:1rem; text-align:center; color:var(--text-muted); font-size:0.8rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
              ${tr('o paga con tarjeta de crédito/débito', 'or pay with credit/debit card')}
            </div>
            ` : ''}

            <div class="checkout-input-wrapper" style="margin-bottom:1rem;">
              <label>${tr('Tarjeta de Crédito o Débito', 'Credit or Debit Card')}</label>
              <div id="stripe-card-element" style="padding: 12px; border: 1px solid var(--border-color, #d1d5db); border-radius: 8px; background: white; min-height: 20px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
                <!-- Stripe Element will be mounted here -->
              </div>
              <div id="card-errors" role="alert" style="color: var(--danger-color, #ef4444); font-size: 0.85rem; margin-top: 0.5rem; font-weight: 500;"></div>
            </div>
          </div>
        </div>

        <!-- Order Summary & Stripe Connect Split visualizer -->
        <div>
          <div class="checkout-card" style="position:sticky; top:90px;">
            <h3 class="checkout-subtitle">${tr('Resumen del Pedido', 'Order Summary')}</h3>
            
            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>${tr('Subtotal Figuras', 'Figures Subtotal')}</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>${tr('Descuento', 'Discount')}</span>
                <span>${discount > 0 ? `-$${discount.toFixed(2)}` : '$0.00'}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>${tr('Envío Shippo', 'Shippo Shipping')} (${activeRate ? activeRate.carrier : 'Carrier'})</span>
                <span>$${shippingCost.toFixed(2)}</span>
              </div>
              ${insuranceCost > 0 ? `
                <div style="display:flex; justify-content:space-between; font-size:0.95rem; color:#b45309;">
                  <span>${tr('Seguro de Coleccionable', 'Collectible Insurance')}</span>
                  <span>+$${insuranceCost.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
                <span>${tr('Impuestos (IVA 8%)', 'Taxes (8% VAT)')}</span>
                <span>$${taxesCost.toFixed(2)}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:700; border-top:1px dashed var(--border-color); padding-top:0.75rem; color:var(--text-primary);">
                <span>${tr('Total a Pagar', 'Total to Pay')}</span>
                <span style="color:var(--gold-light);">$${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <!-- Coupon Input -->
            <div style="margin-bottom:1.5rem; display:flex; gap:0.5rem;">
              <input type="text" id="checkout-coupon-code" placeholder="${tr('Código de Cupón', 'Coupon Code')}" style="background:#ffffff; border:1px solid var(--border-color); border-radius:6px; padding:0.5rem; color:var(--text-primary); flex-grow:1; text-transform:uppercase; outline:none;" value="${activeCoupon ? activeCoupon.code : ''}">
              <button class="btn-large primary-btn" style="width:auto; padding: 0.5rem 1rem; font-size:0.85rem;" onclick="applyCouponCode()">${tr('Aplicar', 'Apply')}</button>
            </div>
            <div style="margin-top:-1rem; margin-bottom:1.5rem; font-size:0.8rem;">
              ${tr('Estado del Cupón:', 'Coupon Status:')} ${couponText}
            </div>

            <!-- Payout Split Card -->
            <div class="stripe-payout-visualizer" style="display:none;">
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
                   <span>Comisión Geek Collector PR (Plataforma)</span>
                   <span>+$${platformCommissionTotal.toFixed(2)}</span>
                </div>
                
                <div style="margin-top:0.5rem; border-top:1.5px solid rgba(99,102,241,0.3); padding-top:0.5rem;">
                  <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#818cf8; display:block; margin-bottom:0.4rem;">Destino de Payouts (Stripe Connect Split):</span>
                  ${splitPayoutsHtml}
                </div>
              </div>
            </div>

            <!-- Complete Order Button -->
            <button class="btn-large primary-btn" style="margin-top:1.5rem; padding: 1rem;" onclick="processPaymentSubmit(${grandTotal}, ${platformCommissionTotal}, ${stripeProcessingFeeTotal}, ${shippingCost})">
              <i data-lucide="shield-check"></i>
              ${tr('Confirmar y Pagar', 'Confirm and Pay')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();
  if (window.firebaseActive) {
    initStripeElements();
  }
}

function changeCheckoutAddress(addrId) {
  window.selectedAddressId = addrId;
  window.selectedRateId = null; // Reset selected rate to recalculate recommended
  window.currentShippoRates = null; // Clear cached rates to trigger a new fetch
  renderCheckoutView();
}

function selectShippingRate(rateId) {
  window.selectedRateId = rateId;
  renderCheckoutView();
}

function openNewAddressModal() {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:1rem;">
      <div class="checkout-input-wrapper">
        <label for="new-addr-name">Nombre Destinatario</label>
        <input type="text" id="new-addr-name" placeholder="Carlos Mendoza">
      </div>
      <div class="checkout-input-wrapper">
        <label for="new-addr-street">Dirección (Calle y Número)</label>
        <input type="text" id="new-addr-street" placeholder="123 Collector Lane, Apt 4B">
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label for="new-addr-city">Ciudad</label>
          <input type="text" id="new-addr-city" placeholder="Miami">
        </div>
        <div class="checkout-input-wrapper">
          <label for="new-addr-state">Estado</label>
          <input type="text" id="new-addr-state" placeholder="FL">
        </div>
      </div>
      <div class="checkout-form-group">
        <div class="checkout-input-wrapper">
          <label for="new-addr-zip">Código Postal</label>
          <input type="text" id="new-addr-zip" placeholder="33101">
        </div>
        <div class="checkout-input-wrapper">
          <label for="new-addr-phone">Teléfono de contacto</label>
          <input type="text" id="new-addr-phone" placeholder="305-555-0199">
        </div>
      </div>
      <button class="btn-large primary-btn" style="margin-top:1rem;" onclick="saveNewAddress()">Guardar Dirección</button>
    </div>
  `;
  toggleGlobalModal(true, "Agregar Nueva Dirección de Envío", bodyHtml);
}

function saveNewAddress() {
  const name = document.getElementById('new-addr-name').value.trim();
  const street = document.getElementById('new-addr-street').value.trim();
  const city = document.getElementById('new-addr-city').value.trim();
  const stateVal = document.getElementById('new-addr-state').value.trim();
  const zip = document.getElementById('new-addr-zip').value.trim();
  const phone = document.getElementById('new-addr-phone').value.trim();

  if (!name || !street || !city || !stateVal || !zip || !phone) {
    showToast(tr("Por favor completa todos los campos.", "Please fill in all fields."), 'error');
    return;
  }

  // Address verification
  const verification = shippoAPI.verifyAddress({ street, zip });
  if (!verification.isValid) {
    showToast(tr(`Error de Verificación Shippo: ${verification.error}`, `Shippo Verification Error: ${verification.error}`), 'error');
    return;
  }

  const addresses = db.get('shipping_addresses');
  const newAddrId = "addr_" + Date.now();
  
  // Set others to false if is_default is true
  addresses.forEach(a => {
    if (a.user_id === state.currentUser.id) a.is_default = false;
  });

  const newAddress = {
    id: newAddrId,
    user_id: state.currentUser.id,
    name: name,
    street: street,
    city: city,
    state: stateVal,
    zip: zip,
    country: "US",
    phone: phone,
    is_default: true
  };

  addresses.push(newAddress);
  db.set('shipping_addresses', addresses);

  window.selectedAddressId = newAddrId;
  window.selectedRateId = null;

  toggleGlobalModal(false);
  renderCheckoutView();
  showToast(tr("¡Dirección agregada y verificada exitosamente con Shippo!", "Address added and verified successfully with Shippo!"), 'success');
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

function simulateExpressPay(providerName) {
  if (window.firebaseActive) {
    showToast(tr("Pago rápido no disponible en entorno real de Stripe.", "Express checkout not available in real Stripe environment."), 'error');
    return;
  }

  const addresses = db.get('shipping_addresses').filter(a => a.user_id === state.currentUser.id);
  if (addresses.length === 0) {
    showToast(tr("Por favor agrega una dirección de envío antes de usar pago rápido.", "Please add a shipping address before using express checkout."), 'error');
    openNewAddressModal();
    return;
  }

  showToast(tr(`Ventana de ${providerName} emergente. Autenticando biométricos...`, `${providerName} popup. Authenticating biometrics...`), 'info');
  
  const defAddr = addresses.find(a => a.is_default) || addresses[0];
  window.selectedAddressId = defAddr.id;
  window.selectedPaymentMethod = providerName;
  
  // Render first so the inputs are in the DOM and won't be cleared
  renderCheckoutView();

  const numInput = document.getElementById('stripe-card-num');
  const expInput = document.getElementById('stripe-card-expiry');
  const cvcInput = document.getElementById('stripe-card-cvc');

  if (numInput) numInput.value = "4242 4242 4242 4242";
  if (expInput) expInput.value = "09/29";
  if (cvcInput) cvcInput.value = "422";
  
  showToast(tr(`¡Autenticación con ${providerName} Exitosa! Procesando pago...`, `Authentication with ${providerName} Successful! Processing payment...`), 'success');

  // Auto-submit checkout after a brief delay
  setTimeout(() => {
    if (window.checkoutTotals) {
      processPaymentSubmit(
        window.checkoutTotals.grandTotal,
        window.checkoutTotals.platformFeeTotal,
        window.checkoutTotals.processingFeeTotal,
        window.checkoutTotals.shippingCost
      );
    }
  }, 1500);
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
    showToast(tr(`¡Cupón ${code} aplicado correctamente!`, `Coupon ${code} applied successfully!`), 'success');
  } else {
    window.appliedCoupon = null;
    showToast(tr("Código de cupón inválido o expirado.", "Invalid or expired coupon code."), 'error');
  }
  renderCheckoutView();
}

// Complete payment submit
function processPaymentSubmit(grandTotal, platformFeeTotal, processingFeeTotal, shippingCost) {
  if (!window.selectedAddressId) {
    showToast(tr("Por favor selecciona o agrega una dirección de envío.", "Please select or add a shipping address."), 'error');
    return;
  }

  // Retrieve active details
  const addresses = db.get('shipping_addresses');
  const activeAddress = addresses.find(a => a.id === window.selectedAddressId);
  const activeRate = window.currentShippoRates.find(r => r.id === window.selectedRateId);

  if (!activeAddress || !activeRate) {
    showToast(tr("Error de configuración de envío.", "Shipping configuration error."), 'error');
    return;
  }

  // Find seller stripe account ID
  const products = db.get('products');
  const profiles = db.get('seller_profiles');
  const firstCartItem = state.cart[0];
  const firstProduct = firstCartItem ? products.find(p => p.id === firstCartItem.product_id) : null;
  const sellerId = firstProduct ? firstProduct.seller_id : null;
  const sellerProfile = sellerId ? profiles.find(p => p.user_id === sellerId) : null;
  const sellerStripeAccountId = sellerProfile ? sellerProfile.stripe_connect_id : null;

  const url = window.firebaseActive ? '/.netlify/functions/create-payment-intent' : null;

  if (!url) {
    // Simulator fallback
    const cardNum = document.getElementById('stripe-card-num') ? document.getElementById('stripe-card-num').value.trim() : "";
    const expiry = document.getElementById('stripe-card-expiry') ? document.getElementById('stripe-card-expiry').value.trim() : "";
    const cvc = document.getElementById('stripe-card-cvc') ? document.getElementById('stripe-card-cvc').value.trim() : "";

    if (!cardNum || !expiry || !cvc) {
      showToast(tr("Por favor completa la información de pago de tu tarjeta.", "Please complete your card payment information."), 'error');
      return;
    }

    showToast(tr("Procesando cobro simulado...", "Processing simulated payment..."), 'info');
    setTimeout(() => {
      completeCheckoutLocal(grandTotal, platformFeeTotal, processingFeeTotal, shippingCost, activeAddress, activeRate);
    }, 1500);
    return;
  }

  // Real secure Stripe Elements payment confirmation
  if (!stripeInstance || !cardElementInstance) {
    showToast(tr("El procesador de pagos Stripe no se ha inicializado.", "The Stripe payment processor has not been initialized."), 'error');
    return;
  }

  showToast(tr("Iniciando cobro seguro con Stripe...", "Starting secure payment with Stripe..."), 'info');

  const paymentData = {
    amount: grandTotal,
    applicationFeeAmount: platformFeeTotal,
    sellerStripeAccountId: sellerStripeAccountId,
    description: `Compra en Geek Collector PR: ${firstProduct ? firstProduct.title : 'Artículos Coleccionables'}`
  };

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) throw new Error(data.error);
    if (!data.clientSecret) throw new Error("No se recibió el token de confirmación (clientSecret) del servidor.");

    showToast(tr("Verificando tarjeta con Stripe...", "Verifying card with Stripe..."), 'info');

    return stripeInstance.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElementInstance,
        billing_details: {
          name: activeAddress.name,
          address: {
            line1: activeAddress.street,
            city: activeAddress.city,
            state: activeAddress.state,
            postal_code: activeAddress.zip,
            country: 'US'
          }
        }
      }
    }).then(result => {
      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        completeCheckoutLocal(grandTotal, platformFeeTotal, processingFeeTotal, shippingCost, activeAddress, activeRate, data.paymentIntentId);
      } else {
        throw new Error("El pago no pudo completarse con éxito.");
      }
    });
  })
  .catch(err => {
    console.error("Stripe payment error:", err);
    showToast(tr(`Error en la pasarela de pago real: ${err.message}`, `Error in real payment gateway: ${err.message}`), 'error');
  });
}

function completeCheckoutLocal(grandTotal, platformFeeTotal, processingFeeTotal, shippingCost, activeAddress, activeRate, paymentIntentId) {
  const orders = db.get('orders');
  const orderItems = db.get('order_items');
  const transactions = db.get('transactions');
  const products = db.get('products');
  const profiles = db.get('seller_profiles');

  // Create individual order structures grouped by seller
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
      total_amount: sellerAdjustedGross + shippingCost + (activeRate.insurance_cost || 0),
      platform_fee: platformFee,
      seller_payout: sellerPayout,
      payment_status: "paid",
      order_status: "paid", // Paid status, needs shipment creation
      stripe_payment_intent_id: paymentIntentId || ("pi_" + Math.random().toString(36).substr(2, 15)),
      tracking_number: "", // Filled after transaction
      shipping_carrier: "",
      created_at: new Date().toISOString()
    };
    orders.push(newOrder);

    // Save Order Items
    let maxDimensions = { length: 0, width: 0, height: 0, weight: 0, fragile: false, category: "Funko Pop" };
    items.forEach(i => {
      const newOrderItem = {
        id: "ord_it_" + Math.random().toString(36).substr(2, 9),
        order_id: newOrderId,
        product_id: i.product.id,
        quantity: i.qty,
        price: i.product.price
      };
      orderItems.push(newOrderItem);

      // Track dimensions for shipment record
      maxDimensions.weight += (i.product.weight || 8) * i.qty;
      maxDimensions.length = Math.max(maxDimensions.length, i.product.length || 6);
      maxDimensions.width = Math.max(maxDimensions.width, i.product.width || 5);
      maxDimensions.height += (i.product.height || 4) * i.qty;
      if (i.product.fragile) maxDimensions.fragile = true;
      maxDimensions.category = i.product.category;

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
      gross_amount: sellerAdjustedGross + shippingCost + (activeRate.insurance_cost || 0),
      platform_fee: platformFee,
      processing_fee: stripeShare,
      seller_net: sellerNet,
      payment_provider: (window.selectedPaymentMethod || "Stripe").toLowerCase().replace(" ", "_"),
      status: "succeeded", // Succeeded payout to platform, seller payout is held
      created_at: new Date().toISOString()
    };
    transactions.push(newTransaction);

    // 9. Generate Shippo label transaction automatically on background
    const allAddresses = db.get('shipping_addresses');
    const fromAddr = allAddresses.find(a => a.user_id === sellerId) || allAddresses.find(a => a.user_id === "usr_admin_1");
    
    // Purchase the label via our mock secure Shippo service
    shippoAPI.createShipmentTransaction(newOrderId, activeRate, {
      seller_id: sellerId,
      weight: maxDimensions.weight,
      length: maxDimensions.length,
      width: maxDimensions.width,
      height: maxDimensions.height,
      fragile: maxDimensions.fragile,
      category: maxDimensions.category
    }, fromAddr, activeAddress);

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
  window.selectedRateId = null;

  const activeProvider = window.selectedPaymentMethod || "Stripe";
  showToast(tr(`¡Compra procesada con éxito! Se ha cargado el pago con ${activeProvider}, transferido el split en custodia Connect y generado el Shipping Label automático en Shippo.`, `Purchase processed successfully! Payment charged with ${activeProvider}, split transferred in Connect custody, and automatic Shipping Label generated in Shippo.`), 'success');
  
  // Navigate to marketplace
  router.navigate('');
}

window.proceedToCheckout = function() {
  toggleCartDrawer(false);
  router.navigate('checkout');
};

