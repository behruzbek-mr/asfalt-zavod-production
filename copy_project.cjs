const fs = require('fs');
const path = require('path');

function copySync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    if (entry.name.includes('node_modules') || entry.name.startsWith('.git') || entry.name === 'exclude.txt' || entry.name === 'copy_project.cjs' || entry.name === 'v2') {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      try {
         copySync(srcPath, destPath);
      } catch (e) { console.error('Skipping dir', srcPath); }
    } else {
      try {
         fs.copyFileSync(srcPath, destPath);
      } catch (e) { console.error('Skipping file', srcPath); }
    }
  }
}

copySync('.', 'd:\\Asfalt zavod sayt\\v2');
console.log('Copy complete to v2');
