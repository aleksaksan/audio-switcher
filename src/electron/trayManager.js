import { Tray, Menu, BrowserWindow, nativeImage, screen, app } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath, getIconPath } from './pathResolver.js';
import { pathToFileURL } from 'url';

// Константы для позиций трея
const TRAY_POSITIONS = {
  TOP_CENTER: 'top-center',
  BOTTOM_CENTER: 'bottom-center',
  LEFT_CENTER: 'left-center',
  RIGHT_CENTER: 'right-center',
};

let tray = null;
let trayWindow = null;
let trayPosition = TRAY_POSITIONS.TOP_CENTER; // Позиция по умолчанию
let clientList = [];
let isConnected = false;
let mainWindow = null;

// Функция для позиционирования окна трея
function positionTrayWindow(bounds) {
  if (!trayWindow) return;
  
  const { width: trayWidth, height: trayHeight } = trayWindow.getBounds();
  const { x, y } = bounds;
  const screenBounds = screen.getPrimaryDisplay().workAreaSize;
  
  let posX, posY;
  
  switch (trayPosition) {
    case TRAY_POSITIONS.TOP_CENTER:
      posX = Math.round(screenBounds.width / 2 - trayWidth / 2);
      posY = 0;
      break;
    case TRAY_POSITIONS.BOTTOM_CENTER:
      posX = Math.round(screenBounds.width / 2 - trayWidth / 2);
      posY = screenBounds.height - trayHeight;
      break;
    case TRAY_POSITIONS.LEFT_CENTER:
      posX = 0;
      posY = Math.round(screenBounds.height / 2 - trayHeight / 2);
      break;
    case TRAY_POSITIONS.RIGHT_CENTER:
      posX = screenBounds.width - trayWidth;
      posY = Math.round(screenBounds.height / 2 - trayHeight / 2);
      break;
    default:
      // По умолчанию - под иконкой трея
      posX = x - trayWidth / 2;
      posY = y - trayHeight;
  }
  
  trayWindow.setPosition(posX, posY);
}

export function initTray(mainWindowInstance) {
  mainWindow = mainWindowInstance;
  
  // Иконка трея
  const iconPath = getIconPath('icon.ico');
  const icon = nativeImage.createFromPath(pathToFileURL(iconPath).pathname);
  tray = new Tray(icon);

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Показать виджет',
      click: () => {
        trayWindow.show();
        trayWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Cкрыть виджет',
      click: () => {
        trayWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Показать основное окно',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        app.quit();
      }
    }
  ]));

  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  tray.on('click', (event, bounds) => {
    if (!trayWindow) {
      trayWindow = new BrowserWindow({
        width: 300,
        height: 100,
        frame: false,
        show: true,
        skipTaskbar: true,
        transparent: true,
        alwaysOnTop: true,
        backgroundColor: '#00000000',
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        resizable: true,
        autoHideMenuBar: true,
        webPreferences: {
          preload: getPreloadPath(),
          contextIsolation: true,
          sandbox: true
        }
      });
      
      // Устанавливаем пустой заголовок
      trayWindow.setTitle('');
      
      // Добавляем обработчик события, чтобы сбрасывать заголовок при его изменении
      trayWindow.on('page-title-updated', (event) => {
        event.preventDefault();
        trayWindow.setTitle('');
      });

      if (isDev()) {
        trayWindow.webContents.openDevTools({ mode: 'detach' });
      }

      if (isDev()) {
        trayWindow.loadURL('http://localhost:5123/#/tray');
      } else {
        trayWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'), {
          hash: '/tray'
        });
      }

      trayWindow.on('blur', () => {
        trayWindow.setBackgroundColor('#00000001');
        trayWindow.setOpacity(1) 
        trayWindow.setBackgroundColor('#00000000');
      });

      trayWindow.on('close', (event) => {
        event.preventDefault();
        trayWindow.hide();
      });
  
      trayWindow.webContents.on('did-finish-load', () => {
        trayWindow.webContents.send('client-list', clientList);
        trayWindow.webContents.send('connection-status', isConnected);
        
        trayWindow.setBackgroundColor('#00000000');
        trayWindow.webContents.executeJavaScript(`
          const { width, height } = document.body.getBoundingClientRect()
          window.electron.resizeWindow(width, height)
        `)
      });
    }

    // Позиционируем окно трея в соответствии с настройками
    positionTrayWindow(bounds);
    trayWindow.show();    
  });
  
  // Симуляция клика по трею для показа окна при запуске
  setTimeout(() => {
    const bounds = tray.getBounds();
    tray.emit('click', {}, bounds);
  }, 100);
  
  return tray;
}

export function updateTrayWindow(clients, connected) {
  clientList = clients;
  isConnected = connected;
  
  if (trayWindow && !trayWindow.isDestroyed()) {
    trayWindow.webContents.send('client-list', clientList);
    trayWindow.webContents.send('connection-status', isConnected);
  }
}

export function setTrayPosition(position) {
  trayPosition = position;
  // Если окно трея открыто, обновляем его позицию
  if (trayWindow && trayWindow.isVisible()) {
    positionTrayWindow(tray.getBounds());
  }
}

export function getTrayPosition() {
  return trayPosition;
}

export function resizeTrayWindow(width, height) {
  if (trayWindow) {
    // Добавляем небольшой запас для предотвращения появления полос прокрутки
    trayWindow.setSize(Math.ceil(width), Math.ceil(height));
    
    // Обновляем позицию
    const bounds = tray.getBounds();
    positionTrayWindow(bounds);
  }
}

export function destroyTray() {
  if (trayWindow) {
    trayWindow.destroy();
    trayWindow = null;
  }
  
  if (tray) {
    tray = null;
  }
}

export { TRAY_POSITIONS };