// collectors-market/components/firebase_config.js

// TODO: Reemplaza estos valores con las credenciales de tu proyecto de Firebase
// Puedes obtenerlas en la consola de Firebase: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: atob("QUl6YVN5QnFhckhWT3hLeVpnNzRrTkJPRDdsWk5sVGR0d0ZEMS1r"),
  authDomain: "collect-x-marketplace.firebaseapp.com",
  projectId: "collect-x-marketplace",
  storageBucket: "collect-x-marketplace.firebasestorage.app",
  messagingSenderId: "736787383049",
  appId: "1:736787383049:web:86eb1adf90c691bec249d8",
  measurementId: "G-YNE951DH9X"
};

// Inicialización de los servicios de Firebase
if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.dbCloud = firebase.firestore();
  window.firebaseActive = true;
  console.log("🔥 Firebase inicializado con éxito en producción.");
} else {
  window.firebaseActive = false;
  console.warn("⚠️ Firebase no configurado. Editando components/firebase_config.js para conectar tu base de datos en la nube.");
}
