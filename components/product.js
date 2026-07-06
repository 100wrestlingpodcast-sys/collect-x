// collectors-market/components/product.js

function renderProductDetail(productId) {
  const viewport = document.getElementById('app-viewport');
  if (!viewport) return;

  const products = db.get('products');
  const media = db.get('product_media');
  const profiles = db.get('seller_profiles');
  const reviews = db.get('reviews').filter(r => r.product_id === productId && r.status === 'approved');
  const reviewMedia = db.get('review_media');
  const users = db.get('users');

  const product = products.find(p => p.id === productId);
  if (!product) {
    viewport.innerHTML = `
      <div class="section-container" style="text-align:center; padding:5rem 0;">
        <h2>Producto no encontrado</h2>
        <p style="color:var(--text-secondary); margin-top:1rem;">La figura que buscas no existe o ha sido eliminada.</p>
        <button class="btn-large primary-btn" style="width:auto; margin: 1.5rem auto 0;" onclick="router.navigate('')">Volver al Marketplace</button>
      </div>
    `;
    return;
  }

  // Find media items for this product
  const pMedia = media.filter(m => m.product_id === product.id);
  const mainImage = pMedia.length > 0 ? pMedia[0].media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';

  // Find seller details
  let sellerName = 'Collectors Shop';
  let sellerRating = 4.9;
  let isOwnProduct = false;
  let sellerUserId = 'usr_admin_1';
  let commissionText = 'Producto Oficial';

  if (product.seller_id !== 'usr_admin_1') {
    const prof = profiles.find(s => s.user_id === product.seller_id);
    sellerUserId = product.seller_id;
    if (prof) {
      sellerName = prof.store_name;
      sellerRating = prof.rating_average;
      commissionText = `Vendido por: ${sellerName} (Verificado)`;
    } else {
      sellerName = 'Vendedor Externo';
      sellerRating = 4.0;
    }
  } else {
    isOwnProduct = true;
  }

  // Calculate product average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'Sin ratings';

  // Condition Badge Class
  const condClass = product.condition.toLowerCase().replace(/\s+/g, '');

  // Check if this product is in current user's favorites
  const isFav = state.favorites.includes(product.id);

  // Check if current user is verified buyer of this product
  const orders = db.get('orders');
  const orderItems = db.get('order_items');
  const userOrders = state.currentUser
    ? orders.filter(o => o.buyer_id === state.currentUser.id && o.order_status === 'delivered')
    : [];
  const hasPurchased = userOrders.some(order => 
    orderItems.some(item => item.order_id === order.id && item.product_id === product.id)
  );

  // Find related products (same category, excluding current product)
  const related = products
    .filter(p => p.category === product.category && p.id !== product.id && p.status === 'approved')
    .slice(0, 4);

  // Render HTML structure
  viewport.innerHTML = `
    <div class="section-container">
      <!-- Breadcrumb -->
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">
        <span style="cursor:pointer;" onclick="router.navigate('')">Marketplace</span> &gt; 
        <span style="cursor:pointer;" onclick="router.navigate('category/${encodeURIComponent(product.category)}')">${product.category}</span> &gt; 
        <span style="color:var(--text-secondary);">${product.title}</span>
      </p>

      <div class="product-details-container">
        <!-- Gallery -->
        <div class="product-gallery">
          <div class="gallery-main-wrapper">
            <img src="${mainImage}" alt="${product.title}" class="gallery-main" id="product-detail-main-img">
          </div>
          ${pMedia.length > 1 ? `
            <div class="gallery-thumbs">
              ${pMedia.map((m, index) => `
                <img src="${m.media_url}" class="gallery-thumb ${index === 0 ? 'active' : ''}" onclick="setMainImage('${m.media_url}', this)">
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Info details -->
        <div class="product-info-panel">
          <div class="product-meta-header">
            <span class="product-condition-tag condition-badge ${condClass}">${product.condition}</span>
            <span style="color:var(--gold-light); font-weight:600; font-size:0.9rem; margin-left:0.5rem; display:inline-flex; align-items:center; gap:0.25rem;">
              <i data-lucide="star" style="width:0.9rem; height:0.9rem; fill:var(--gold-light);"></i> ${avgRating} (${reviews.length} reviews)
            </span>
            <h1 class="product-title-detail" style="margin-top:0.5rem;">${product.title}</h1>
            <p class="product-brand-category">Marca: <strong>${product.brand}</strong> | Categoría: <strong>${product.category}</strong></p>
          </div>

          <div class="product-price-section">
            <span class="product-price-detail">$${product.price.toFixed(2)}</span>
            ${product.is_external_ebay ? `
              <span class="stock-indicator in-stock">Disponible en eBay</span>
            ` : product.stock > 3 ? `
              <span class="stock-indicator in-stock">En Stock (${product.stock} disp.)</span>
            ` : product.stock > 0 ? `
              <span class="stock-indicator low-stock">¡Pocas unidades! (Solo ${product.stock})</span>
            ` : `
              <span class="stock-indicator out-of-stock">Agotado</span>
            `}
          </div>

          <!-- Description -->
          <div style="margin: 1rem 0; line-height: 1.6; color: var(--text-secondary);">
            <h4 style="color:var(--text-primary); margin-bottom:0.5rem;">Descripción del artículo</h4>
            <p>${product.description}</p>
          </div>

          <!-- Seller Profile Box -->
          <div class="seller-profile-card" style="display:flex; justify-content:space-between; align-items:center;">
            <div class="seller-profile-info">
              <i data-lucide="store" style="width:2rem;height:2rem;color:var(--gold-light);"></i>
              <div>
                <div class="seller-name">${sellerName}</div>
                <div class="seller-rating">
                  <i data-lucide="star" style="width:0.8rem;height:0.8rem;fill:var(--gold-light);"></i>
                  <span>${sellerRating.toFixed(1)} / 5.0 Rating</span>
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic; display:block; margin-top:0.25rem;">
                  ${commissionText}
                </span>
              </div>
            </div>
            
            <!-- Follow/Favorite Seller Button -->
            ${!isOwnProduct ? `
              <button class="btn-small ${state.currentUser && isFollowingSeller(sellerUserId) ? 'primary-btn' : 'secondary-btn'}" 
                      style="width:auto; padding:0.4rem 0.8rem; font-size:0.75rem; display:flex; align-items:center; gap:0.25rem;" 
                      onclick="toggleFollowSeller('${sellerUserId}', '${sellerName.replace(/'/g, "\\'")}')">
                <i data-lucide="heart" style="width:0.85rem; height:0.85rem; fill:${state.currentUser && isFollowingSeller(sellerUserId) ? 'var(--text-primary)' : 'none'};"></i>
                <span>${state.currentUser && isFollowingSeller(sellerUserId) ? 'Siguiendo' : 'Seguir Tienda'}</span>
              </button>
            ` : ''}
          </div>

          <!-- Action buttons -->
          <div class="action-buttons-group">
            ${product.is_external_ebay ? `
              <button class="btn-large ebay-action-btn" onclick="openEbayLink('${product.id}', '${product.ebay_url}')">
                <i data-lucide="external-link"></i> Comprar en eBay (Link Externo)
              </button>
            ` : product.stock === 0 ? `
              <button class="btn-large secondary-btn" style="grid-column: span 2; opacity:0.5; cursor:not-allowed;" disabled>
                Agotado Temporalmente
              </button>
            ` : `
              <button class="btn-large secondary-btn" onclick="addToCart('${product.id}')">
                <i data-lucide="shopping-cart"></i> Añadir al Carrito
              </button>
              <button class="btn-large primary-btn" onclick="buyNow('${product.id}')">
                Comprar Ahora
              </button>
            `}
            
            <button class="btn-large favorite-action-btn ${isFav ? 'active' : ''}" onclick="toggleProductFavorite('${product.id}')">
              <i data-lucide="heart" style="fill:${isFav ? 'white' : 'none'};"></i> 
              <span>${isFav ? 'Guardado en Favoritos' : 'Guardar en Favoritos'}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab sections for reviews -->
      <div class="product-tabs">
        <div class="tabs-headers">
          <div class="tab-header active" id="tab-btn-reviews">Opiniones de compradores (${reviews.length})</div>
        </div>
        
        <div class="tab-content">
          <!-- Reviews list -->
          <div class="reviews-summary-row">
            <div class="rating-big-box">
              <div class="rating-big-num">${reviews.length > 0 ? avgRating : '0.0'}</div>
              <div class="review-stars" style="margin: 0.25rem 0;">
                ${drawStarRatingHtml(reviews.length > 0 ? parseFloat(avgRating) : 0)}
              </div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">${reviews.length} valoraciones</div>
            </div>
            <div style="font-size:0.9rem; color:var(--text-secondary);">
              <strong>Garantía COLLECT X:</strong> Solo compradores verificados que han recibido físicamente la figura pueden dejar reseñas aquí. Esto asegura un feedback libre de bots y especuladores.
            </div>
          </div>

          <!-- Review Form if verified user -->
          ${hasPurchased ? `
            <div class="review-form-card" id="product-review-form-section">
              <h3 style="color:var(--text-primary); margin-bottom:0.5rem; display:flex;align-items:center;gap:0.5rem;">
                <i data-lucide="edit-3" style="color:var(--gold-light);"></i> Escribir Reseña de Comprador Verificado
              </h3>
              <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1rem;">Cuéntale a la comunidad sobre la condición, empaque y rapidez de envío de esta figura.</p>
              
              <div class="review-form-stars" id="review-stars-selector">
                <i data-lucide="star" class="star-select" onclick="setReviewFormRating(1)" id="frm-star-1"></i>
                <i data-lucide="star" class="star-select" onclick="setReviewFormRating(2)" id="frm-star-2"></i>
                <i data-lucide="star" class="star-select" onclick="setReviewFormRating(3)" id="frm-star-3"></i>
                <i data-lucide="star" class="star-select" onclick="setReviewFormRating(4)" id="frm-star-4"></i>
                <i data-lucide="star" class="star-select" onclick="setReviewFormRating(5)" id="frm-star-5"></i>
              </div>
              <input type="hidden" id="review-form-rating-val" value="0">
              
              <textarea class="form-textarea" id="review-form-comment" placeholder="¿Qué te pareció el empaque? ¿La figura está en perfecto estado?"></textarea>
              
              <div class="form-file-input-wrapper">
                <label class="custom-file-upload">
                  <input type="file" id="review-form-file" accept="image/*" onchange="simulateReviewMediaUpload(event)" style="display:none;">
                  <i data-lucide="image" style="width:0.9rem;height:0.9rem;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
                  Subir Foto de la Figura
                </label>
                <span id="review-upload-feedback" style="font-size:0.8rem; color:var(--text-secondary);">Sin archivos adjuntos</span>
              </div>
              <input type="hidden" id="review-form-media-url" value="">
              
              <button class="btn-large primary-btn" style="width:auto; margin-top:1.25rem; padding: 0.6rem 1.5rem;" onclick="submitProductReview('${product.id}')">
                Publicar Reseña
              </button>
            </div>
          ` : `
            <div style="background:rgba(255,255,255,0.02); border:1px dashed var(--border-color); padding:1.25rem; border-radius:8px; text-align:center; color:var(--text-secondary); margin-bottom:2rem; font-size:0.9rem;">
              <i data-lucide="info" style="width:1.2rem; height:1.2rem; vertical-align:middle; margin-right:4px; color:var(--gold-light);"></i>
              Debes comprar esta figura y tener la orden en estado <strong>Entregada</strong> para poder publicar una reseña calificada.
            </div>
          `}

          <!-- Reviews Listings -->
          <div class="reviews-list">
            ${reviews.length === 0 ? `
              <p style="text-align:center; padding: 2rem; color:var(--text-muted); font-style:italic;">No hay reseñas para esta figura aún.</p>
            ` : reviews.map(r => {
              const reviewer = users.find(u => u.id === r.buyer_id) || { name: 'Comprador Anónimo', avatar: '' };
              const rMedia = reviewMedia.filter(m => m.review_id === r.id);
              
              return `
                <div class="review-item">
                  <div class="review-header">
                    <div class="review-user-info">
                      <img src="${reviewer.avatar || window.GUEST_AVATAR}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                      <span style="font-weight:600; color:var(--text-primary);">${reviewer.name}</span>
                      <span class="status-tag approved" style="font-size:0.6rem; padding: 0.05rem 0.3rem;">Compra Verificada</span>
                    </div>
                    <span style="color:var(--text-muted); font-size:0.8rem;">${new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div class="review-stars" style="margin-bottom:0.5rem;">
                    ${drawStarRatingHtml(r.rating)}
                  </div>
                  
                  <p class="review-comment">${r.comment}</p>
                  
                  ${rMedia.length > 0 ? `
                    <div class="review-media-gallery">
                      ${rMedia.map(m => `
                        <img src="${m.media_url}" class="review-media-item" onclick="viewFullImage('${m.media_url}')" style="cursor:pointer;">
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Related products -->
      ${related.length > 0 ? `
        <div style="margin-top: 5rem;">
          <h3 class="section-title" style="margin-bottom:1.5rem;">Productos Relacionados</h3>
          <div class="products-grid">
            ${related.map(p => {
              const pMedia = media.find(m => m.product_id === p.id);
              const imgSrc = pMedia ? pMedia.media_url : 'https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80';
              const condClass = p.condition.toLowerCase().replace(/\s+/g, '');
              const isPfav = state.favorites.includes(p.id);

              return `
                <article class="product-card">
                  <div class="card-img-wrapper" onclick="router.navigate('product/${p.id}')" style="cursor:pointer;">
                    <img src="${imgSrc}" alt="${p.title}" class="card-img">
                    <span class="condition-badge ${condClass}">${p.condition}</span>
                  </div>
                  
                  <button class="favorite-btn-floating ${isPfav ? 'favorited' : ''}" onclick="toggleFavorite('${p.id}')">
                    <i data-lucide="heart" style="width:1.2rem; height:1.2rem; fill:${isPfav ? '#ef4444' : 'none'};"></i>
                  </button>
                  
                  <div class="card-body">
                    <span class="card-category">${p.category}</span>
                    <a onclick="router.navigate('product/${p.id}')" class="card-title">${p.title}</a>
                    <div class="card-footer">
                      <span class="card-price">$${p.price.toFixed(2)}</span>
                      <button class="card-btn" onclick="addToCart('${p.id}')">Añadir</button>
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  lucide.createIcons();
}

// --- Image Gallery Helper ---
function setMainImage(url, thumbEl) {
  document.getElementById('product-detail-main-img').src = url;
  document.querySelectorAll('.gallery-thumb').forEach(el => el.classList.remove('active'));
  thumbEl.classList.add('active');
}

// --- Review Rating Select Simulation ---
function setReviewFormRating(stars) {
  document.getElementById('review-form-rating-val').value = stars;
  
  for (let i = 1; i <= 5; i++) {
    const starIcon = document.getElementById(`frm-star-${i}`);
    if (i <= stars) {
      starIcon.classList.add('active');
      starIcon.style.fill = 'var(--gold-light)';
    } else {
      starIcon.classList.remove('active');
      starIcon.style.fill = 'none';
    }
  }
}

// Simulated Media Upload for Reviews
function simulateReviewMediaUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) { // 5MB limit check
    alert("El archivo es demasiado grande. El límite para subir es 5MB.");
    return;
  }

  // Create temporary local URL or use a pre-determined mock toy image
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('review-form-media-url').value = e.target.result;
    document.getElementById('review-upload-feedback').textContent = file.name + " (Listo para publicar)";
  };
  reader.readAsDataURL(file);
}

// Submit review
function submitProductReview(productId) {
  const rating = parseInt(document.getElementById('review-form-rating-val').value);
  const comment = document.getElementById('review-form-comment').value.trim();
  const mediaUrl = document.getElementById('review-form-media-url').value;

  if (rating === 0) {
    alert("Por favor, selecciona una calificación de 1 a 5 estrellas.");
    return;
  }
  if (!comment) {
    alert("Por favor, escribe un comentario descriptivo.");
    return;
  }

  const reviews = db.get('reviews');
  const reviewMedia = db.get('review_media');
  const products = db.get('products');
  const profiles = db.get('seller_profiles');

  const product = products.find(p => p.id === productId);

  // Sanitizar comentario simple
  const sanitizedComment = comment.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const newReviewId = "rev_" + Date.now();
  const newReview = {
    id: newReviewId,
    product_id: productId,
    seller_id: product.seller_id,
    buyer_id: state.currentUser.id,
    rating: rating,
    comment: sanitizedComment,
    status: "approved", // Autosubmitted as approved for simulation, admins can hide it later
    created_at: new Date().toISOString()
  };

  reviews.push(newReview);
  db.set('reviews', reviews);

  if (mediaUrl) {
    const newMedia = {
      id: "rev_med_" + Date.now(),
      review_id: newReviewId,
      media_url: mediaUrl,
      media_type: "image"
    };
    reviewMedia.push(newMedia);
    db.set('review_media', reviewMedia);
  }

  // Re-calculate ratings for seller profile
  if (product.seller_id !== 'usr_admin_1') {
    const sellerReviews = reviews.filter(r => r.seller_id === product.seller_id);
    const sellerAvg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
    
    const sProfiles = db.get('seller_profiles');
    const sProfIndex = sProfiles.findIndex(sp => sp.user_id === product.seller_id);
    if (sProfIndex > -1) {
      sProfiles[sProfIndex].rating_average = parseFloat(sellerAvg.toFixed(1));
      db.set('seller_profiles', sProfiles);
    }
  }

  alert("¡Reseña calificada publicada con éxito!");
  
  // Refresh page
  renderProductDetail(productId);
}

// --- Star Rating Drawer Helper ---
function drawStarRatingHtml(ratingVal) {
  let starsHtml = '';
  const fullStars = Math.floor(ratingVal);
  const halfStar = ratingVal % 1 >= 0.5;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHtml += '<i data-lucide="star" style="width:0.95rem; height:0.95rem; fill:var(--gold-light); color:var(--gold-light); display:inline-block; margin-right:1px;"></i>';
    } else if (i === fullStars + 1 && halfStar) {
      starsHtml += '<i data-lucide="star-half" style="width:0.95rem; height:0.95rem; fill:var(--gold-light); color:var(--gold-light); display:inline-block; margin-right:1px;"></i>';
    } else {
      starsHtml += '<i data-lucide="star" style="width:0.95rem; height:0.95rem; color:var(--text-muted); display:inline-block; margin-right:1px;"></i>';
    }
  }
  return starsHtml;
}

// Buy Now shortcut
function buyNow(productId) {
  if (!state.currentUser) {
    alert("Por favor inicia sesión o crea una cuenta para comprar este artículo.");
    renderLoginFormModal();
    return;
  }
  addToCart(productId);
  router.navigate('checkout');
}

// Toggle favorites inside product details
function toggleProductFavorite(productId) {
  if (!state.currentUser) {
    alert("Por favor inicia sesión para guardar productos en tus favoritos.");
    renderLoginFormModal();
    return;
  }

  const index = state.favorites.indexOf(productId);
  if (index > -1) {
    state.favorites.splice(index, 1);
  } else {
    state.favorites.push(productId);
  }
  state.saveFavorites();
  
  // Re-render info panel
  renderProductDetail(productId);
}

// Modal zoom on images
function viewFullImage(url) {
  const html = `<img src="${url}" style="width:100%; height:auto; max-height:80vh; object-fit:contain; border-radius:8px;">`;
  toggleGlobalModal(true, "Visualizador de Media", html);
}
