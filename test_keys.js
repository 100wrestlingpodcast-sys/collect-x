const https = require('https');

const chars1 = ['l', 'L', 'I', '1'];
const chars2 = ['l', 'L', 'I', '1'];

function checkKey(apiKey) {
  return new Promise((resolve) => {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const body = JSON.stringify({
      email: "test_check@mail.com",
      password: "some_password123@",
      returnSecureToken: true
    });
    const urlObj = new URL(url);
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
          // If key is invalid, message will be API key not valid.
          // If key is VALID, signUp will succeed (or return EMAIL_EXISTS or similar auth error, but NOT invalid key error).
          const isInvalid = parsed.error && parsed.error.message.includes('API key not valid');
          resolve({ valid: !isInvalid, body: parsed });
        } catch (e) {
          resolve({ valid: false, error: responseBody });
        }
      });
    });
    req.on('error', () => resolve({ valid: false }));
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("Iniciando escaneo de variaciones de API Key...");
  for (const c1 of chars1) {
    for (const c2 of chars2) {
      // Key format: AIzaSyBqarHVOxKyZg74kNBOD7[c1]ZN[c2]tdtwFD1-k
      const key = `AIzaSyBqarHVOxKyZg74kNBOD7${c1}ZN${c2}tdtwFD1-k`;
      const res = await checkKey(key);
      if (res.valid) {
        console.log(`\n🎉 ¡API KEY ENCONTRADA MÁS QUE VÁLIDA!: ${key}`);
        console.log("Respuesta de Firebase:", res.body);
        process.exit(0);
      } else {
        console.log(`Clave inválida: ...7${c1}ZN${c2}...`);
      }
    }
  }
  console.log("Escaneo completado. No se encontró ninguna clave válida.");
}

run();
