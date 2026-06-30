const fs = require('fs');
const path = require('path');

// Files to SKIP (XSS test data, not real img tags)
const SKIP_FILES = ['AdminXssProtection.tsx'];

// Above-the-fold images that should NOT be lazy (use fetchpriority="high" instead)
const EAGER_PATTERNS = ['logo.png', 'logo.jpeg', 'pwa-icon', 'App Logo', 'Freelancer Logo'];

function walk(dir) {
  let files = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.(tsx|jsx)$/.test(f)) files.push(full);
  }
  return files;
}

let totalFixed = 0;

for (const file of walk('src')) {
  const basename = path.basename(file);
  if (SKIP_FILES.some(s => basename.includes(s))) continue;

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('<img') || lines[i].includes('onerror=') || lines[i].includes('src=x')) continue;

    // Check block (next 8 lines) for loading=
    const blockEnd = Math.min(i + 8, lines.length);
    const block = lines.slice(i, blockEnd).join('\n');
    if (block.includes('loading=')) continue;

    // Determine if eager (above the fold)
    const isEager = EAGER_PATTERNS.some(p => block.includes(p));

    // Find the closing /> or > of this img tag to insert loading before it
    // We'll insert on the same line as <img or the next available line
    // Strategy: add loading= right after <img on the same line
    if (isEager) {
      lines[i] = lines[i].replace('<img', '<img fetchPriority="high"');
    } else {
      lines[i] = lines[i].replace('<img', '<img loading="lazy" decoding="async"');
    }
    changed = true;
    totalFixed++;
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`✓ ${file}`);
  }
}
console.log(`\nTotal img tags updated: ${totalFixed}`);
