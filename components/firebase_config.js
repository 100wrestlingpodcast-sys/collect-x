// collectors-market/components/firebase_config.js

// TODO: Reemplaza estos valores con las credenciales de tu proyecto de Firebase
// Puedes obtenerlas en la consola de Firebase: https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
