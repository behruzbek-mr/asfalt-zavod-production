const fs = require('fs');
const path = require('path');

function copySync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcDir = 'C:\\AsfaltProject\\dist';
const targetDir = 'dist';
console.log('Copying from', srcDir, 'to', targetDir);
copySync(srcDir, targetDir);
console.log('Copy complete');
