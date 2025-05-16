import fs from 'fs';
import path from 'path';

const __dirname = path.resolve(); // Используем path.resolve() в ESM
const srcIco = path.join(__dirname, 'build', 'icon.ico');
const srcPng = path.join(__dirname, 'build', 'icon.png');
const destDir = path.join(__dirname, 'dist-electron');

const targets = [
  { from: srcIco, to: path.join(destDir, 'icon.ico') },
  { from: srcPng, to: path.join(destDir, 'icon.png') },
];

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

targets.forEach(({ from, to }) => {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log(`Copied ${from} -> ${to}`);
  } else {
    console.warn(`File not found: ${from}`);
  }
});
