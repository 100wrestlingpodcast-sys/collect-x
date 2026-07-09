const https = require('https');

const apiKey = "AIzaSyBqarHVOxKyZg74kNBOD7lZNLtdtwFD1-k";
const projectId = "collect-x-marketplace";
const email = "100wrestlingpodcast@gmail.com";
const password = "admin123@";

function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function put(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const body = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH', // Firestore REST API uses PATCH to create/update document
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, error: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("Creando usuario en Firebase Auth...");
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const authRes = await post(authUrl, {
    email,
    password,
    returnSecureToken: true
  });
  
  let uid = '';
  if (authRes.status === 200) {
    uid = authRes.body.localId;
    console.log("Usuario creado en Auth con UID:", uid);
  } else if (authRes.body && authRes.body.error && authRes.body.error.message === 'EMAIL_EXISTS') {
    console.log("El email ya está registrado. Obteniendo UID mediante login...");
    const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const loginRes = await post(loginUrl, {
      email,
      password,
      returnSecureToken: true
    });
    if (loginRes.status === 200) {
      uid = loginRes.body.localId;
      console.log("UID recuperado:", uid);
    } else {
      console.error("Error al iniciar sesión:", loginRes.body);
      process.exit(1);
    }
  } else {
    console.error("Error al crear usuario en Auth:", authRes.body || authRes.error);
    process.exit(1);
  }

  const newUserId = "usr_" + uid;
  console.log("Guardando documento de Administrador en Firestore con ID:", newUserId);
  
  // Format Firestore document REST body
  const docData = {
    fields: {
      id: { stringValue: newUserId },
      name: { stringValue: "Administrador COLLECT X" },
      email: { stringValue: email },
      password_hash: { stringValue: "" },
      role: { stringValue: "admin" },
      avatar: { stringValue: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&auto=format&fit=crop&q=80" },
      created_at: { stringValue: new Date().toISOString() },
      status: { stringValue: "active" }
    }
  };

  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${newUserId}`;
  const firestoreRes = await put(firestoreUrl, docData);
  
  if (firestoreRes.status === 200) {
    console.log("¡Documento en Firestore guardado con éxito!");
    console.log("Usuario de Administrador creado y configurado correctamente.");
  } else {
    console.error("Error al escribir en Firestore:", firestoreRes.body || firestoreRes.error);
  }
}

run();
