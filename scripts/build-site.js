const fs   = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('📦 Building static site for Vercel deployment...');

// Ensure dist directory exists
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy directory helper
function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(source)) return;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach(file => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

// 1. Copy entire website folder to dist root
if (fs.existsSync(path.join(rootDir, 'website'))) {
  copyFolderRecursiveSync(path.join(rootDir, 'website'), distDir);
  console.log('✓ Copied website/ → dist/');
}

// 2. Copy Web IDE folder
if (fs.existsSync(path.join(rootDir, 'ide'))) {
  copyFolderRecursiveSync(path.join(rootDir, 'ide'), path.join(distDir, 'ide'));
  console.log('✓ Copied ide/ → dist/ide/');
}

// 3. Copy Examples folder
if (fs.existsSync(path.join(rootDir, 'examples'))) {
  copyFolderRecursiveSync(path.join(rootDir, 'examples'), path.join(distDir, 'examples'));
  console.log('✓ Copied examples/ → dist/examples/');
}

console.log('✅ Static build complete! Output folder: dist/');
