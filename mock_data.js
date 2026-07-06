// collectors-market/mock_data.js

const INITIAL_USERS = [
  {
    id: "usr_buyer_1",
    name: "Carlos Mendoza",
    email: "carlos@mail.com",
    password_hash: "buyer123", // Simplified for simulation
    role: "buyer",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-01-10T12:00:00Z",
    status: "active"
  },
  {
    id: "usr_seller_1",
    name: "Geek Empire Store",
    email: "geek@mail.com",
    password_hash: "seller123",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-02-15T09:30:00Z",
    status: "active"
  },
  {
    id: "usr_seller_2",
    name: "Retro & Vintage Hunter",
    email: "retro@mail.com",
    password_hash: "seller123",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-03-01T14:15:00Z",
    status: "active"
  },
  {
    id: "usr_seller_3",
    name: "Newbie Collector",
    email: "newbie@mail.com",
    password_hash: "seller123",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    created_at: "2026-06-25T11:00:00Z",
    status: "pending" // Admin needs to approve
  },
  {
    id: "usr_admin_1",
    name: "Collectors Admin",
    email: "admin@mail.com",
    password_hash: "admin123",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80",
    created_at: "2025-12-01T08:00:00Z",
    status: "active"
  }
];

const INITIAL_SELLER_PROFILES = [
  {
    id: "sel_prof_1",
    user_id: "usr_seller_1",
    store_name: "Geek Empire Store",
    description: "Especialistas en figuras de anime premium, Funko Pops limitados y coleccionables de gaming importados.",
    stripe_connect_id: "acct_1N2y3zGeekEmpire",
    subscription_plan: "Elite", // Elite plan (commission 8%, unlimited products)
    commission_rate: 0.08,
    approved: true,
    rating_average: 4.8,
    total_sales: 12500.00
  },
  {
    id: "sel_prof_2",
    user_id: "usr_seller_2",
    store_name: "Retro & Vintage Hunter",
    description: "Buscador de tesoros. Figuras clásicas de los 80s y 90s, wrestling retro y piezas autografiadas.",
    stripe_connect_id: "acct_1N4a5bRetroHunter",
    subscription_plan: "Pro", // Pro plan (commission 10%, up to 100 products)
    commission_rate: 0.10,
    approved: true,
    rating_average: 4.5,
    total_sales: 6400.00
  },
  {
    id: "sel_prof_3",
    user_id: "usr_seller_3",
    store_name: "Newbie Collector Shop",
    description: "Vendedor individual que busca rotar su colección personal.",
    stripe_connect_id: "",
    subscription_plan: "Free", // Free plan (commission 12%, up to 10 products)
    commission_rate: 0.12,
    approved: false,
    rating_average: 0,
    total_sales: 0
  }
];

const INITIAL_PRODUCTS = [
  {
    id: "prod_1",
    seller_id: "usr_seller_1", // Geek Empire Store
    title: "Funko Pop! Luffy Gear 5 (Chase Edition)",
    description: "Edición limitada Chase del Luffy Gear 5 de One Piece. Caja impecable en protector de acrílico de 0.5mm. Ideal para coleccionistas exigentes.",
    brand: "Funko",
    category: "Funko Pop",
    condition: "Sellado", // Nuevo, usado, caja dañada, sin caja, sellado
    price: 85.00,
    stock: 5,
    status: "approved", // pending, approved, rejected, sold_out
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-10T10:00:00Z"
  },
  {
    id: "prod_2",
    seller_id: "usr_admin_1", // Admin's own shop inventory
    title: "Figura Action Figure Retro Spawn (Series 1 - 1994)",
    description: "Figura original de Spawn de Todd McFarlane. Blister original un poco desgastado por los años pero la figura nunca ha sido removida de su empaque.",
    brand: "McFarlane Toys",
    category: "Figuras vintage",
    condition: "Caja dañada",
    price: 150.00,
    stock: 1,
    status: "approved",
    ebay_url: "https://www.ebay.com/itm/example-spawn-1994",
    is_external_ebay: true, // Has eBay buy option
    created_at: "2026-06-12T15:30:00Z"
  },
  {
    id: "prod_3",
    seller_id: "usr_seller_2", // Retro & Vintage Hunter
    title: "Figura WWE Randy Savage 'Macho Man' Defining Moments",
    description: "Coleccionable altamente detallado de Macho Man Randy Savage con su capa de tela y lentes icónicos. Figura suelta en excelentes condiciones.",
    brand: "Mattel",
    category: "WWE / Wrestling",
    condition: "Sin caja",
    price: 65.00,
    stock: 2,
    status: "approved",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-15T11:20:00Z"
  },
  {
    id: "prod_4",
    seller_id: "usr_seller_1", // Geek Empire Store
    title: "Estatua Naruto Uzumaki Kurama Link Mode (Kizuna Relation)",
    description: "Estatua oficial de Figuarts ZERO de Bandai Tamashii Nations. Increíbles efectos de resina translúcida que simulan el chakra de Kurama.",
    brand: "Bandai",
    category: "Anime",
    condition: "Nuevo",
    price: 120.00,
    stock: 3,
    status: "approved",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-18T09:00:00Z"
  },
  {
    id: "prod_5",
    seller_id: "usr_seller_2", // Retro & Vintage Hunter
    title: "Balón de Baloncesto Spalding Autografiado por Michael Jordan",
    description: "Artículo oficial con certificado de autenticidad Upper Deck. El balón tiene la firma clara y legible en tinta negra de Michael Jordan.",
    brand: "Spalding",
    category: "Autografiados",
    condition: "Sellado",
    price: 2500.00,
    stock: 1,
    status: "approved",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-20T17:45:00Z"
  },
  {
    id: "prod_6",
    seller_id: "usr_seller_1", // Geek Empire Store
    title: "Figura Marvel Legends Spider-Man Retro Carded",
    description: "Figura de Spiderman clásica de la serie animada de los 90. Blister sellado sin dobleces en el cartón retro.",
    brand: "Hasbro",
    category: "Marvel / DC",
    condition: "Nuevo",
    price: 45.00,
    stock: 10,
    status: "approved",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-22T14:10:00Z"
  },
  {
    id: "prod_7",
    seller_id: "usr_seller_2", // Retro & Vintage Hunter
    title: "Estatua Zelda Breath of the Wild - Link Collector's Edition",
    description: "Estatua de PVC oficial de First 4 Figures. Cuenta con función de iluminación LED en la base y en la flecha ancestral (pilas no incluidas).",
    brand: "First 4 Figures",
    category: "Gaming",
    condition: "Nuevo",
    price: 110.00,
    stock: 4,
    status: "approved",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-24T08:15:00Z"
  },
  {
    id: "prod_8",
    seller_id: "usr_seller_3", // Newbie Collector Shop (not approved yet)
    title: "Hot Toys Iron Man Mark LXXXV (Endgame)",
    description: "Coleccionable escala 1/6 con luces LED y accesorios de batalla intercambiables. Solo posado en vitrina cerrada libre de polvo.",
    brand: "Hot Toys",
    category: "Ediciones limitadas",
    condition: "Usado",
    price: 380.00,
    stock: 1,
    status: "pending", // Pending approval because seller and product are new
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-26T12:00:00Z"
  },
  {
    id: "prod_9",
    seller_id: "usr_seller_1", // Geek Empire
    title: "Funko Pop! Kobe Bryant #24 Yellow Jersey",
    description: "Figura de vinilo exclusiva de la estrella de los Lakers, Kobe Bryant. Caja con desgaste mínimo en las esquinas.",
    brand: "Funko",
    category: "NBA / Deportes",
    condition: "Usado",
    price: 95.00,
    stock: 0, // Out of stock to test filter
    status: "sold_out",
    ebay_url: "",
    is_external_ebay: false,
    created_at: "2026-06-27T10:00:00Z"
  }
];

const INITIAL_PRODUCT_MEDIA = [
  { id: "med_1", product_id: "prod_1", media_url: "https://images.unsplash.com/photo-1559863345-02efa691b97f?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_2", product_id: "prod_2", media_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_3", product_id: "prod_3", media_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_4", product_id: "prod_4", media_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_5", product_id: "prod_5", media_url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_6", product_id: "prod_6", media_url: "https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_7", product_id: "prod_7", media_url: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_8", product_id: "prod_8", media_url: "https://images.unsplash.com/photo-1608889174649-414430997ee6?w=600&auto=format&fit=crop&q=80", media_type: "image" },
  { id: "med_9", product_id: "prod_9", media_url: "https://images.unsplash.com/photo-1559863345-02efa691b97f?w=600&auto=format&fit=crop&q=80", media_type: "image" }
];

const INITIAL_REVIEWS = [
  {
    id: "rev_1",
    product_id: "prod_1", // Luffy Chase
    seller_id: "usr_seller_1",
    buyer_id: "usr_buyer_1",
    rating: 5,
    comment: "Increíble pieza, llegó súper rápido y el protector de acrílico es de excelente calidad. Vendedor muy recomendado.",
    status: "approved",
    created_at: "2026-06-15T18:30:00Z"
  },
  {
    id: "rev_2",
    product_id: "prod_3", // Macho Man
    seller_id: "usr_seller_2",
    buyer_id: "usr_buyer_1",
    rating: 4,
    comment: "La figura está tal como se describió en la publicación, sin caja pero súper limpia. Buen embalaje.",
    status: "approved",
    created_at: "2026-06-20T20:00:00Z"
  }
];

const INITIAL_REVIEW_MEDIA = [
  {
    id: "rev_med_1",
    review_id: "rev_1",
    media_url: "https://images.unsplash.com/photo-1559863345-02efa691b97f?w=300&auto=format&fit=crop&q=80",
    media_type: "image"
  }
];

const INITIAL_ORDERS = [
  {
    id: "ord_1",
    buyer_id: "usr_buyer_1",
    seller_id: "usr_seller_1",
    total_amount: 85.00,
    platform_fee: 6.80, // 8% commission based on elite plan
    seller_payout: 78.20,
    payment_status: "paid",
    order_status: "delivered", // pending, paid, processing, shipped, delivered, cancelled, refunded, disputed
    stripe_payment_intent_id: "pi_mock_123456789",
    tracking_number: "USPS9876543210",
    shipping_carrier: "USPS",
    created_at: "2026-06-12T10:00:00Z"
  },
  {
    id: "ord_2",
    buyer_id: "usr_buyer_1",
    seller_id: "usr_seller_2",
    total_amount: 65.00,
    platform_fee: 6.50, // 10% commission based on pro plan
    seller_payout: 58.50,
    payment_status: "paid",
    order_status: "shipped",
    stripe_payment_intent_id: "pi_mock_987654321",
    tracking_number: "FEDEX555444332",
    shipping_carrier: "FedEx",
    created_at: "2026-06-18T14:30:00Z"
  }
];

const INITIAL_ORDER_ITEMS = [
  {
    id: "ord_it_1",
    order_id: "ord_1",
    product_id: "prod_1",
    quantity: 1,
    price: 85.00
  },
  {
    id: "ord_it_2",
    order_id: "ord_2",
    product_id: "prod_3",
    quantity: 1,
    price: 65.00
  }
];

const INITIAL_TRANSACTIONS = [
  {
    id: "trx_1",
    order_id: "ord_1",
    buyer_id: "usr_buyer_1",
    seller_id: "usr_seller_1",
    gross_amount: 85.00,
    platform_fee: 6.80,
    processing_fee: 2.77, // Mock Stripe fee: 2.9% + $0.30 -> $2.47 + $0.30 = $2.77
    seller_net: 75.43, // gross - platform_fee - processing_fee
    payment_provider: "stripe",
    status: "succeeded",
    created_at: "2026-06-12T10:00:00Z"
  },
  {
    id: "trx_2",
    order_id: "ord_2",
    buyer_id: "usr_buyer_1",
    seller_id: "usr_seller_2",
    gross_amount: 65.00,
    platform_fee: 6.50,
    processing_fee: 2.19, // Mock Stripe fee: 2.9% + $0.30 -> $1.89 + $0.30 = $2.19
    seller_net: 56.31,
    payment_provider: "stripe",
    status: "succeeded",
    created_at: "2026-06-18T14:30:00Z"
  }
];

const INITIAL_SELLER_SUBSCRIPTIONS = [
  {
    id: "sub_1",
    seller_id: "usr_seller_1",
    plan_name: "Elite",
    monthly_price: 19.99,
    commission_rate: 0.08,
    status: "active",
    start_date: "2026-02-15T09:30:00Z",
    renewal_date: "2026-07-15T09:30:00Z"
  },
  {
    id: "sub_2",
    seller_id: "usr_seller_2",
    plan_name: "Pro",
    monthly_price: 9.99,
    commission_rate: 0.10,
    status: "active",
    start_date: "2026-03-01T14:15:00Z",
    renewal_date: "2026-07-01T14:15:00Z"
  }
];

// Initial site banners and coupons for marketing simulation
const INITIAL_BANNERS = [
  { id: "ban_1", title: "Coleccionables Exclusivos", subtitle: "Nuevos Drops de Luffy Gear 5 en preventa exclusiva", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80", link: "#category/Anime", active: true },
  { id: "ban_2", title: "Vintage Vault", subtitle: "Consigue figuras selladas de los años 90 con certificación", image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80", link: "#category/Figuras vintage", active: true }
];

const INITIAL_COUPONS = [
  { code: "COLLECTOR10", discount_type: "percentage", value: 10, min_purchase: 50.00, active: true },
  { code: "FREESHIP", discount_type: "fixed", value: 5, min_purchase: 30.00, active: true }
];

// Expose these as global objects for our scripts when loaded
window.INITIAL_USERS = INITIAL_USERS;
window.INITIAL_SELLER_PROFILES = INITIAL_SELLER_PROFILES;
window.INITIAL_PRODUCTS = INITIAL_PRODUCTS;
window.INITIAL_PRODUCT_MEDIA = INITIAL_PRODUCT_MEDIA;
window.INITIAL_REVIEWS = INITIAL_REVIEWS;
window.INITIAL_REVIEW_MEDIA = INITIAL_REVIEW_MEDIA;
window.INITIAL_ORDERS = INITIAL_ORDERS;
window.INITIAL_ORDER_ITEMS = INITIAL_ORDER_ITEMS;
window.INITIAL_TRANSACTIONS = INITIAL_TRANSACTIONS;
window.INITIAL_SELLER_SUBSCRIPTIONS = INITIAL_SELLER_SUBSCRIPTIONS;
window.INITIAL_BANNERS = INITIAL_BANNERS;
window.INITIAL_COUPONS = INITIAL_COUPONS;
