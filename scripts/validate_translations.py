# scripts/validate_translations.py
import os
import json
import re
import sys

# Define paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
es_path = os.path.join(base_dir, 'locales/es/common.json')
en_path = os.path.join(base_dir, 'locales/en/common.json')

with open(es_path, 'r', encoding='utf-8') as f:
    es_data = json.load(f)

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Helper to flatten dict keys
def flatten_keys(d, prefix=''):
    keys = {}
    for k, v in d.items():
        if isinstance(v, dict):
            keys.update(flatten_keys(v, prefix + k + '.'))
        else:
            keys[prefix + k] = v
    return keys

es_keys = flatten_keys(es_data)
en_keys = flatten_keys(en_data)

has_errors = False

print('--- VALIDATING TRANSLATION KEY SYNC ---')

# Check ES in EN
for key in es_keys:
    if key not in en_keys:
        print(f'❌ Key "{key}" exists in Spanish but is MISSING in English.')
        has_errors = True

# Check EN in ES
for key in en_keys:
    if key not in es_keys:
        print(f'❌ Key "{key}" exists in English but is MISSING in Spanish.')
        has_errors = True

print('\n--- SCANNING JS FILES FOR HARDCODED OR INCORRECT tr() CALLS ---')
files_to_scan = [
    'app.js',
    'components/marketplace.js',
    'components/product.js',
    'components/cart.js',
    'components/seller.js',
    'components/admin.js'
]

# Find tr('key') or tr('key', { variables }) or old tr('es', 'en') format
# We'll use a regex that finds the tr( part and extracts the first string literal argument,
# and checks if the call matches the old format.
old_tr_pattern = re.compile(r"tr\(\s*(['\"`])([^()]*?)\1\s*,\s*(['\"`])([^()]*?)\3\s*\)")
first_arg_pattern = re.compile(r"tr\(\s*(['\"`])([^()]*?)\1")

for file in files_to_scan:
    file_path = os.path.join(base_dir, file)
    if not os.path.exists(file_path):
        print(f'⚠️ Warning: file {file} does not exist.')
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find old format calls in the whole content
    for match in old_tr_pattern.finditer(content):
        # Calculate line number
        start_pos = match.start()
        line_num = content.count('\n', 0, start_pos) + 1
        quote_char, key_content = match.group(1), match.group(2)
        print(f'❌ {file}:{line_num}: Old tr format detected with 2 parameters: tr({quote_char}{key_content}{quote_char}, ...)')
        has_errors = True

    # Find and validate first argument of all tr calls
    for match in first_arg_pattern.finditer(content):
        # Calculate line number
        start_pos = match.start()
        line_num = content.count('\n', 0, start_pos) + 1
        quote_char, key_content = match.group(1), match.group(2)

        # Skip dynamic variable interpolation like tr(someVar) or tr(`some_${var}`)
        if '${' in key_content:
            continue

        # Validate key exists in locales
        is_defined = (key_content in es_keys) or (key_content + '_one' in es_keys) or (key_content + '_other' in es_keys)
        if not is_defined and not key_content.startswith('categories.'):
            known_prefixes = ['nav.', 'marketplace.', 'product.', 'cart.', 'seller.', 'admin.', 'auth.', 'validation.', 'categories.', 'checkout.', 'search.']
            has_prefix = any(key_content.startswith(p) for p in known_prefixes)
            
            if not has_prefix:
                if key_content in ['key', 'planKey', 'k', 'statusKey', 'actionKey']:
                    continue
                print(f'❌ {file}:{line_num}: Key/Text "{key_content}" does not have a valid prefix.')
                has_errors = True
            else:
                print(f'❌ {file}:{line_num}: Key "{key_content}" is not defined in translation files.')
                has_errors = True

if has_errors:
    print('\n❌ Translation validation FAILED.')
    sys.exit(1)
else:
    print('\n✅ Translation validation SUCCESS! All keys are synced and valid.')
    sys.exit(0)
