// collectors-market/mock_data.js

const INITIAL_USERS = [
  {
    id: "usr_admin_1",
    name: "Administrador COLLECT X",
    email: "100wrestlingpodcast@gmail.com",
    password_hash: "admin123@",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80",
    created_at: new Date().toISOString(),
    status: "active"
  }
];

const INITIAL_SELLER_PROFILES = [
  {
    id: "sel_prof_admin",
    user_id: "usr_admin_1",
    store_name: "COLLECT X Tienda Oficial",
    description: "Tienda oficial de la plataforma. Artículos exclusivos y garantizados.",
    stripe_connect_id: "acct_admin_mock_123",
    subscription_plan: "Elite",
    commission_rate: 0.00, // Admin pays 0% commission on sales
    approved: true,
    rating_average: 5.0,
    total_sales: 0.00
  }
];
const INITIAL_PRODUCTS = [];
const INITIAL_PRODUCT_MEDIA = [];
const INITIAL_REVIEWS = [];
const INITIAL_REVIEW_MEDIA = [];
const INITIAL_ORDERS = [];
const INITIAL_ORDER_ITEMS = [];
const INITIAL_TRANSACTIONS = [];
const INITIAL_SELLER_SUBSCRIPTIONS = [];

const INITIAL_BANNERS = [
  {
    id: "ban_1",
    title: "Bienvenidos a COLLECT X",
    subtitle: "El marketplace oficial para coleccionistas de figuras de acción, Funko Pop y cómics.",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    link: "#",
    active: true
  }
];

const INITIAL_COUPONS = [];

// Only keep the admin's shipping origin address
const INITIAL_SHIPPING_ADDRESSES = [
  {
    id: "addr_admin_1",
    user_id: "usr_admin_1",
    name: "COLLECT X Main Office",
    street: "500 Commerce Rd, Floor 2",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US",
    phone: "212-555-0122",
    is_default: true
  }
];

const INITIAL_SHIPMENTS = [];
const INITIAL_PACKAGE_EVIDENCE = [];

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
window.INITIAL_SHIPPING_ADDRESSES = INITIAL_SHIPPING_ADDRESSES;
window.INITIAL_SHIPMENTS = INITIAL_SHIPMENTS;
window.INITIAL_PACKAGE_EVIDENCE = INITIAL_PACKAGE_EVIDENCE;
