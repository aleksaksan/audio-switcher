import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';
import os from 'os';
import { Server } from 'socket.io';
import http from 'http';
import loudness from 'loudness';
import { exec } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Константы для позиций трея
const TRAY_POSITIONS = {
  TOP_CENTER: 'top-center',
  BOTTOM_CENTER: 'bottom-center',
  LEFT_CENTER: 'left-center',
  RIGHT_CENTER: 'right-center',
};

let mainWindow;
let tray = null;
let trayWindow = null;
let io = null;
let server = null;
let trayPosition = TRAY_POSITIONS.BOTTOM_CENTER; // Позиция по умолчанию
const clientMuteStates = {};
let isConnected = false;
let clientList = [];

// =========================
// App ready
// =========================
app.on('ready', () => {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: ['--hidden']
  });
  // Основное окно

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
  // Иконка трея
  const iconPath = isDev()
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(app.getAppPath(), 'dist/assets/icon.ico');

  const icon = nativeImage.createFromPath(pathToFileURL(iconPath).pathname);
  tray = new Tray(icon);
  

  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Развернуть',
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
    if (trayWindow && trayWindow.isVisible()) {
      trayWindow.hide();
    } else {
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
          resizable: true,
          autoHideMenuBar: true,
          movable: true, 
          webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            sandbox: true
          }
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
          trayWindow.setBackgroundColor('#00000000')
          trayWindow.setOpacity(1) 
        });

        trayWindow.on('close', (event) => {
          event.preventDefault();
          trayWindow.hide();
        });
    
        trayWindow.webContents.on('did-finish-load', () => {
          trayWindow.webContents.send('client-list', clientList);
          trayWindow.webContents.send('connection-status', isConnected);
          trayWindow.webContents.executeJavaScript(`
            const { width, height } = document.body.getBoundingClientRect()
            window.electron.resizeWindow(width, height)
          `)
        });
      }

      // Позиционируем окно трея в соответствии с настройками
      positionTrayWindow(bounds);
      trayWindow.show();
    }
  });

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
});

// =========================
// Server logic
// =========================
ipcMain.handle('start-server', (event, port) => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close();
      server = null;
      io = null;
    }

    const newServer = http.createServer();
    const newIO = new Server(newServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    newIO.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      clientMuteStates[socket.id] = false;
      socket.data.name = os.hostname();

      updateClientList();

      socket.on('register-client', ({ id, name }) => {
        socket.data.id = id;
        socket.data.name = name || os.hostname();
        updateClientList();
      });

      socket.on('change-client-name', ({ id, name }) => {
        const targetSocket = io.sockets.sockets.get(id);
        if (targetSocket) {
          targetSocket.data.name = name;
          setTimeout(updateClientList, 10);
        }
      });

      socket.on('mute-client', (targetId) => {
        const targetSocket = io.sockets.sockets.get(targetId);
        if (targetSocket) {
          targetSocket.emit('apply-mute');
        }
      });

      socket.on('client-muted-state-updated', (isMuted) => {
        clientMuteStates[socket.id] = isMuted;
        setTimeout(updateClientList, 10);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete clientMuteStates[socket.id];
        updateClientList();
      });

      socket.on('broadcast-toggle-mute', () => {
        for (const [, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('apply-mute');
        }
      });

      socket.on('force-mute-all', () => {
        console.log('Forcing mute on all clients');
        for (const [, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('apply-mute');
        }
      });
    });

    newServer.listen(port, () => {
      server = newServer;
      io = newIO;
      const urls = getServerUrls(port).map(url => ({ url }));
      mainWindow.webContents.send('server-urls', urls);
      mainWindow.webContents.send('server-status-updated', true);
      resolve(urls);
    });

    newServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });
  });
});

ipcMain.handle('stop-server', () => {
  return new Promise((resolve) => {
    if (server) {
      if (io) {
        io.sockets.disconnectSockets(true);
        io.close();
        io = null;
      }

      server.close(() => {
        server = null;
        console.log('Server stopped');
        resolve(true);
      });
    } else {
      resolve(false);
    }

    mainWindow.webContents.send('server-status-updated', false);
  });
});

function getServerUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        urls.push(`http://${addr.address}:${port}`);
      }
    });
  });

  return urls;
}

function updateClientList() {
  if (!io) {
    const emptyList = [];
    updateWindowsWithClientList(emptyList);
    return;
  }

  const clients = Array.from(io.sockets.sockets).map(([id, socket]) => ({
    id,
    name: socket.data.name || os.hostname(),
    connected: socket.connected,
    isMuted: clientMuteStates[id] || false,
  }));

  clientList = [...clients];
  updateWindowsWithClientList(clientList);
  io.emit('client-list', clients);
}

function updateWindowsWithClientList(clients) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('client-list', clients);
  }
  if (trayWindow && !trayWindow.isDestroyed()) {
    trayWindow.webContents.send('client-list', clients);
  }
}

// =========================
// IPC handlers
// =========================
ipcMain.handle('get-server-urls', () => {
  if (!server || !server.address()) return [];
  const port = server.address().port;
  return getServerUrls(port).map(url => ({ url }));
});

ipcMain.handle('get-server-status', () => {
  return !!server;
});

ipcMain.handle('toggle-mute', async (event, isMuted) => {
  await loudness.setMuted(isMuted);
  updateClientList();
});

ipcMain.handle('get-mute', async () => {
  return await loudness.getMuted();
});

ipcMain.handle('get-info', () => {
  return {
    platform: os.platform(),
    hostname: os.hostname(),
  };
});

ipcMain.handle('open-linux-install-terminal', () => {
  if (os.platform() === 'linux') {
    exec(`x-terminal-emulator -e 'bash -c "echo Установка ALSA-utils...; sudo apt update && sudo apt install alsa-utils; exec bash"'`);
  }
});

ipcMain.on('connection-status', (_, status) => {
  isConnected = status;
  if (trayWindow) {
    trayWindow.webContents.send('connection-status', isConnected);
  }
});

ipcMain.on('client-list', (_, clients) => {
  clientList = clients;
  if (trayWindow) {
    trayWindow.webContents.send('client-list', clientList);
  }
});

ipcMain.on('send-mute-all', () => {
  if (io) {
    for (const [, targetSocket] of io.sockets.sockets) {
      targetSocket.emit('apply-mute');
    }
    updateClientList();
  }
  
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mute-all-triggered');
  }
});

ipcMain.handle('request-client-list', () => clientList);
ipcMain.handle('request-connection-status', () => isConnected);

ipcMain.on('toggle-client-mute', (event, clientId) => {
  // Пересылаем запрос в главное окно
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('request-toggle-client', clientId);
  }
});

ipcMain.on('tray-ready', () => {
  if (trayWindow && trayWindow.webContents) {
    trayWindow.webContents.send('client-list', clientList);
    trayWindow.webContents.send('connection-status', isConnected);
  }
});

ipcMain.on('request-send-toggle', (event, clientId) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('request-toggle-client', clientId);
  }
});

ipcMain.on('resize-window', (event, width, height) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.setSize(width, height);
  }
})

// =========================
// App exit
// =========================
app.on('before-quit', () => {
  app.isQuitting = true;

  if (trayWindow) {
    trayWindow.destroy();
    trayWindow = null;
  }

  if (server) {
    if (io) {
      io.sockets.disconnectSockets(true);
      io.close();
      io = null;
    }

    server.close(() => {
      console.log('Server closed on app exit');
      server = null;
    });
  }
});


setTimeout(() => {
const bounds = tray.getBounds();
tray.emit('click', {}, bounds);
}, 1000); // Небольшая задержка для уверенности, что приложение полностью загрузилось


// Функция для позиционирования окна трея
function positionTrayWindow(bounds) {
  if (!trayWindow) return;
  
  const { width: trayWidth, height: trayHeight } = trayWindow.getBounds();
  const { x, y, } = bounds;
  // Используем импортированный electron вместо require
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

ipcMain.on('set-tray-position', (event, position) => {
  trayPosition = position;
  // Если окно трея открыто, обновляем его позицию
  if (trayWindow && trayWindow.isVisible()) {
    positionTrayWindow(tray.getBounds());
  }
});

ipcMain.handle('get-tray-position', () => {
  return trayPosition;
});

