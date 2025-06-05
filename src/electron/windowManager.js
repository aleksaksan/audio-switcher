import { BrowserWindow, app } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';

let mainWindow = null;

export function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: true
    },
    show: false // Не показывать окно при запуске
  });
  
  // Проверяем, был ли запуск автоматическим
  const wasAutoLaunched = process.argv.includes('--autostart') || 
                        !app.commandLine.hasSwitch('hidden') || 
                        app.getLoginItemSettings().wasOpenedAtLogin;
  
  // Показываем окно только если это не автозапуск
  if (!wasAutoLaunched) {
    mainWindow.show();
  }
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'));
  }
  
  return mainWindow;
}

export function getMainWindow() {
  return mainWindow;
}