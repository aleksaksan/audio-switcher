import path from 'path';
import { app } from 'electron';
import { isDev } from './util.js';
import fs from 'fs';

function validatePath(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.error(`${fileName} not found at path: ${filePath}`);
    throw new Error(`${fileName} not found`);
  }
  return filePath;
}

export function getPreloadPath() {
  const preloadPath = path.join(
    app.getAppPath(),
    isDev() ? 'src/electron' : 'dist-electron',
    'preload.cjs'
  );
  return validatePath(preloadPath, 'preload.cjs');
}

export function getUIPath() {
  const uiPath = path.join(app.getAppPath(), 'dist-react', 'index.html');
  return validatePath(uiPath, 'index.html');
}

export function getAssetPath() {
  const assetPath = path.join(app.getAppPath(), isDev() ? 'src/assets' : 'dist/assets');
  return validatePath(assetPath, 'assets directory');
}

export function getIconPath(iconName) {
  const iconPath = path.join(app.getAppPath(), 'build', iconName);
  return validatePath(iconPath, iconName);
}