// scripts/validate_translations.js
const fs = require('fs');
const path = require('path');

const esPath = path.join(__dirname, '../locales/es/common.json');
const enPath = path.join(__dirname, '../locales/en/common.json');

const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Helper to flatten objects
function flattenKeys(obj, prefix = '') {
  let keys = {};
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(keys, flattenKeys(obj[key], prefix + key + '.'));
    } else {
      keys[prefix + key] = obj[key];
    }
  }
  return keys;
}

const esKeys = flattenKeys(esData);
const enKeys = flattenKeys(enData);

let hasErrors = false;

console.log('--- VALIDATING TRANSLATION KEY SYNC ---');

// Check ES keys in EN
for (let key in esKeys) {
  if (!(key in enKeys)) {
    console.error(`❌ Key "${key}" exists in Spanish but is MISSING in English.`);
    hasErrors = true;
  }
}

// Check EN keys in ES
for (let key in enKeys) {
  if (!(key in esKeys)) {
    console.error(`❌ Key "${key}" exists in English but is MISSING in Spanish.`);
    hasErrors = true;
  }
}

console.log('\n--- SCANNING JS FILES FOR HARDCODED OR INCORRECT tr() CALLS ---');
const projectDir = path.join(__dirname, '..');
const filesToScan = [
  'app.js',
  'components/marketplace.js',
  'components/product.js',
  'components/cart.js',
  'components/seller.js',
  'components/admin.js'
];

const trRegexGlobal = /tr\(\s*(['"`])(.*?)\1\s*(,\s*(['"`])(.*?)\4)?\)/g;

filesToScan.forEach(file => {
  const filePath = path.join(projectDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Warning: file ${file} does not exist.`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    let match;
    // Reset regex lastIndex
    trRegexGlobal.lastIndex = 0;
    
    while ((match = trRegexGlobal.exec(line)) !== null) {
      const fullCall = match[0];
      const keyOrText = match[2];
      const hasSecondary = !!match[3];
      
      // If it has secondary argument, it is an old format
      if (hasSecondary) {
        console.error(`❌ ${file}:${idx + 1}: Old tr format detected with 2 parameters: ${fullCall}`);
        hasErrors = true;
        continue;
      }
      
      // If it is dynamic (e.g. template literal interpolation), skip validation of key existence
      if (keyOrText.includes('${') || line.includes(`tr('${keyOrText}`)) {
        // Just warning if it doesn't look like a standard key path
        if (!keyOrText.includes('.') && !keyOrText.startsWith('admin.') && !keyOrText.startsWith('seller.')) {
          // might be dynamic variable or literal text
          if (!keyOrText.includes('`') && !keyOrText.includes('"') && !keyOrText.includes("'")) {
            // Probably a variable like tr(key)
            continue;
          }
        }
      }
      
      // Check if key is registered
      if (!(keyOrText in esKeys) && !keyOrText.startsWith('categories.')) {
        // Special dynamic keys could be constructed, check if they start with known prefixes
        const knownPrefixes = ['nav.', 'marketplace.', 'product.', 'cart.', 'seller.', 'admin.', 'auth.', 'validation.', 'categories.'];
        const hasPrefix = knownPrefixes.some(p => keyOrText.startsWith(p));
        
        if (!hasPrefix) {
          console.error(`❌ ${file}:${idx + 1}: Key/Text "${keyOrText}" does not have a valid prefix.`);
          hasErrors = true;
        } else {
          // Prefix exists, but exact key is missing (unless it is dynamic with variables)
          if (!keyOrText.includes('${') && !keyOrText.includes('`')) {
            console.error(`❌ ${file}:${idx + 1}: Key "${keyOrText}" is not defined in translation files.`);
            hasErrors = true;
          }
        }
      }
    }
  });
});

if (hasErrors) {
  console.log('\n❌ Translation validation FAILED.');
  process.exit(1);
} else {
  console.log('\n✅ Translation validation SUCCESS! All keys are synced and valid.');
  process.exit(0);
}
