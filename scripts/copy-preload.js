import fs from 'fs';
import path from 'path';

const source = path.resolve('src/electron/preload.cjs');
const targetDir = path.resolve('dist-electron');
const target = path.join(targetDir, 'preload.cjs');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.copyFileSync(source, target);
console.log(`✅ preload.cjs скопирован в ${target}`);
