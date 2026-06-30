const sharp = require('sharp');
const fs = require('fs');
const { execSync } = require('child_process');

const targets = [
  { path: 'public/logo.png', type: 'png' },
  { path: 'public/logo.jpeg', type: 'jpeg' },
  { path: 'public/pwa-icon-512.png', type: 'png' },
  { path: 'public/upi-banner.jpg', type: 'jpeg' },
  { path: 'public/upi-logos/airtel.png', type: 'png' },
  { path: 'public/upi-logos/bank-transfer.png', type: 'png' },
  { path: 'public/upi-logos/freecharge.png', type: 'png' },
  { path: 'public/upi-logos/freo.png', type: 'png' },
  { path: 'public/upi-logos/mobikwik.png', type: 'png' },
  { path: 'public/upi-logos/paytm.png', type: 'png' },
  { path: 'public/upi-logos/phonepe.png', type: 'png' },
  { path: 'public/upi-logos/slice.png', type: 'png' },
  { path: 'public/upi-logos/supermoney.png', type: 'png' },
  { path: 'public/upi-logos/twid.png', type: 'png' },
  { path: 'src/assets/slide-collaborate.jpg', type: 'jpeg' },
  { path: 'src/assets/slide-freelancer.jpg', type: 'jpeg' },
  { path: 'src/assets/slide-payments.jpg', type: 'jpeg' },
];

async function run() {
  let totalBefore = 0, totalAfter = 0;
  for (const { path, type } of targets) {
    try {
      const before = fs.statSync(path).size;
      totalBefore += before;
      const tmp = path + '.tmp';
      const img = sharp(path);
      if (type === 'jpeg') {
        await img.jpeg({ quality: 78, mozjpeg: true }).toFile(tmp);
      } else {
        await img.png({ compressionLevel: 9, palette: true, quality: 80 }).toFile(tmp);
      }
      fs.renameSync(tmp, path);
      const after = fs.statSync(path).size;
      totalAfter += after;
      const pct = ((before - after) / before * 100).toFixed(1);
      console.log(`✓ ${path.padEnd(45)} ${(before/1024).toFixed(0).padStart(6)}KB → ${(after/1024).toFixed(0).padStart(5)}KB  (${pct}% saved)`);
    } catch (e) {
      console.error(`✗ ${path}: ${e.message}`);
    }
  }
  const totalPct = ((totalBefore - totalAfter) / totalBefore * 100).toFixed(1);
  console.log(`\nTOTAL: ${(totalBefore/1024).toFixed(0)}KB → ${(totalAfter/1024).toFixed(0)}KB  (${totalPct}% saved)`);
}

run();
