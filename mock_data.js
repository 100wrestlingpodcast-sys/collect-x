// collectors-market/mock_data.js

window.GUEST_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSIjYTBhMGEwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2U1ZTdlYiIvPjxwYXRoIGQ9Ik01MCA1MGM4LjI4IDAgMTUtNi43MiAxNS0xNXMtNi43Mi0xNS0xNS0xNS0xNSA2LjcyLTE1IDE1IDYuNzIgMTUgMTUgMTV6bTAgOGMtMTAuMDIgMC0zMCA1LjAzLTMwIDE1djdoNjB2LTdjMC05Ljk3LTE5Ljk4LTE1LTMwLTE1eiIvPjwvc3ZnPg==`;

const INITIAL_USERS = [
  {
    id: "usr_admin_1",
    name: "Administrador Geek Collector PR",
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
    store_name: "Geek Collector PR Tienda Oficial",
    description: "Tienda oficial de la plataforma. Artículos exclusivos y garantizados.",
    stripe_connect_id: "acct_admin_mock_123",
    subscription_plan: "Standard",
    commission_rate: 0.00, // Admin pays 0% commission on sales
    approved: true,
    rating_average: 5.0,
    total_sales: 0.00,
    
    // Compliance & Shipping Stats
    total_orders: 0,
    ontime_orders: 0,
    delayed_orders: 0,
    cancelled_orders: 0,
    disputes_count: 0,
    active_strikes: 0,
    suspension_until: null,
    banned_permanently: false,
    reliability_score: 100,
    avg_dispatch_hours: 0
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
    title: "Bienvenidos a Geek Collector PR",
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
    name: "Geek Collector PR Main Office",
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

// New Compliance & Fulfillment Tables
const INITIAL_STRIKES = [];
const INITIAL_EXTENSION_REQUESTS = [];
const INITIAL_COMPLIANCE_AUDIT_LOGS = [];

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
window.INITIAL_STRIKES = INITIAL_STRIKES;
window.INITIAL_EXTENSION_REQUESTS = INITIAL_EXTENSION_REQUESTS;
window.INITIAL_COMPLIANCE_AUDIT_LOGS = INITIAL_COMPLIANCE_AUDIT_LOGS;
