import fs from 'fs';
import path from 'path';

const __dirname = path.resolve(); // Используем path.resolve() в ESM
const srcIco = path.join(__dirname, 'build', 'icon.ico');
const srcPng = path.join(__dirname, 'build', 'icon.png');
const destDirElectron = path.join(__dirname, 'dist-electron');
const destDirAssets = path.join(__dirname, 'dist', 'assets');

const targets = [
  { from: srcIco, to: path.join(destDirElectron, 'icon.ico') },
  { from: srcPng, to: path.join(destDirElectron, 'icon.png') },
  { from: srcIco, to: path.join(destDirAssets, 'icon.ico') },
  { from: srcPng, to: path.join(destDirAssets, 'icon.png') },
];

// Создаем директории, если они не существуют
[destDirElectron, destDirAssets].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

targets.forEach(({ from, to }) => {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log(`Copied ${from} -> ${to}`);
  } else {
    console.warn(`File not found: ${from}`);
  }
});
