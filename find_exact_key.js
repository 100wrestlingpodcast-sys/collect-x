const https = require('https');

// Key base: AIzaSyBqarHV[c1]xKyZg74kNB[c2]D7[c3]ZN[c4][c5][c6]twFD1-k
// Wait! Let's define the parts:
// part1: AIzaSyBqarHV
// part2: xKyZg74kNB
// part3: D7
// part4: ZN
// part5: twFD1-k

const options1 = ['O', 'o', '0']; // character at HVOx
const options2 = ['O', 'o', '0']; // character at NBOD
const options3 = ['l', 'L', 'I', '1']; // character after D7
const options4 = ['l', 'L', 'I', '1']; // character after ZN
const options5 = ['t', 'T']; // character after ZNL
const options6 = ['d', 'D']; // character after ZNLt

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
          const isInvalid = parsed.error && parsed.error.message.includes('API key not valid');
          resolve({ valid: !isInvalid, body: parsed });
        } catch (e) {
          resolve({ valid: false });
        }
      });
    });
    req.on('error', () => resolve({ valid: false }));
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("Iniciando escaneo de 576 variaciones de la API Key...");
  const keys = [];
  
  for (const c1 of options1) {
    for (const c2 of options2) {
      for (const c3 of options3) {
        for (const c4 of options4) {
          for (const c5 of options5) {
            for (const c6 of options6) {
              const key = `AIzaSyBqarHV${c1}xKyZg74kNB${c2}D7${c3}ZN${c4}${c5}${c6}twFD1-k`;
              keys.push(key);
            }
          }
        }
      }
    }
  }

  console.log(`Creadas ${keys.length} combinaciones. Probando...`);
  
  // Test in chunks to avoid rate limiting
  const chunkSize = 20;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const promises = chunk.map(async (key) => {
      const res = await checkKey(key);
      if (res.valid) {
        console.log(`\n🎉 ¡API KEY CORRECTA ENCONTRADA!: ${key}`);
        console.log("Respuesta de Firebase:", res.body);
        process.exit(0);
      }
    });
    await Promise.all(promises);
    // Short pause
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log("Escaneo completado. No se encontró ninguna clave válida.");
}

run();
