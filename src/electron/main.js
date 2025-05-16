import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';
import os from 'os';
import { Server } from 'socket.io';
import http from 'http';
import loudness from 'loudness';
import { exec } from 'child_process';

let mainWindow;
let tray = null;
let trayWindow = null;
let io = null;
let server = null;
const clientMuteStates = {};

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: true
    }
  });

  const icon = nativeImage.createFromPath(path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), '../../build/icon.ico'));
  tray = new Tray(icon);

  // Создаем контекстное меню
  const contextMenu = Menu.buildFromTemplate([
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
  ]);

  // Устанавливаем контекстное меню
  tray.setContextMenu(contextMenu);

  // Обработка двойного клика по иконке
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Обработка одиночного клика по иконке
  tray.on('click', (event, bounds) => {
    if (trayWindow && trayWindow.isVisible()) {
      trayWindow.hide();
    } else {
      if (!trayWindow) {
        trayWindow = new BrowserWindow({
          width: 300,
          height: 600,
          frame: false,
          show: false,
          skipTaskbar: true,
          webPreferences: {
            preload: getPreloadPath(),
            contextIsolation: true,
            sandbox: true
          }
        });
  
        // Загружаем ту же страницу, что и в основном окне
        if (isDev()) {
          trayWindow.loadURL('http://localhost:5123/#/tray');
        } else {
          trayWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'), {
            hash: '/tray'
          });
        }
  
        // Закрываем окно при потере фокуса
        trayWindow.on('blur', () => {
          trayWindow.hide();
        });
  
        // Предотвращаем закрытие окна, просто скрываем его
        trayWindow.on('close', (event) => {
          event.preventDefault();
          trayWindow.hide();
        });
      }
  
      // Позиционируем окно рядом с иконкой трея
      const { x, y } = bounds;
      trayWindow.setPosition(x - trayWindow.getBounds().width/2, y - trayWindow.getBounds().height);
      trayWindow.show();
    }
  });

  // Обработка закрытия окна
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

//SERVER
ipcMain.handle('start-server', (event, port) => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close(); // Закрываем предыдущий сервер, если он был
      server = null;
      io = null;
    }

    const newServer = http.createServer();
    const newIO = new Server(newServer, {
      cors: {
        origin: "*", // Разрешаем подключения с любых источников
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    newServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });

    newIO.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      clientMuteStates[socket.id] = false;
      socket.data.name = os.hostname(); // По умолчанию
    
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
          updateClientList();
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
        updateClientList();
      });
    
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete clientMuteStates[socket.id];
        updateClientList();
      });

      socket.on('broadcast-toggle-mute', () => {
        for (const [_, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('apply-mute');
        }
      });

      socket.on('force-mute-all', () => {
        console.log('Forcing mute on all clients');
        for (const [_, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('apply-mute');
        }
      });
    });

    newServer.listen(port, () => {
      server = newServer;
      io = newIO;
      console.log(`Server started on port ${port}`);
      const urls = getServerUrls(port).map(url => ({ url }));
      mainWindow.webContents.send('server-urls', urls);
      resolve(urls);
      //TODO delete
      mainWindow.webContents.send('server-status-updated', true);
    });
  });
});

ipcMain.handle('stop-server', () => {
  return new Promise((resolve) => {
    if (server) {
      // Закрываем Socket.IO соединения
      if (io) {
        io.sockets.disconnectSockets(true);
        io.close();
        io = null;
      }

      // Закрываем HTTP сервер
      server.close(() => {
        server = null;
        console.log('Server stopped successfully');
        resolve(true);
      });
    } else {
      console.log('Server was not running');
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
  const clients = Array.from(io.sockets.sockets).map(([id, socket]) => ({
    id,
    name: socket.data.name || os.hostname(),
    connected: socket.connected,
    isMuted: clientMuteStates[id] || false,
  }));

  mainWindow.webContents.send('client-list', clients);
  io.emit('client-list', clients);
}

ipcMain.handle('get-server-urls', () => {
  if (!server) return [];
  const port = server.address().port;
  return getServerUrls(port).map(url => ({ url }));
});

ipcMain.handle('get-server-status', () => {
  return !!server;
});

ipcMain.handle('toggle-mute', async () => {
  const isMuted = await loudness.getMuted();
  await loudness.setMuted(!isMuted);
  updateClientList();
});

ipcMain.handle('get-mute', async () => {
  return await loudness.getMuted();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (trayWindow) {
    trayWindow.destroy();
    trayWindow = null;
  }
});

app.on('before-quit', async () => {
  if (server) {
    if (io) {
      io.sockets.disconnectSockets(true);
      io.close();
      io = null;
    }

    server.close(() => {
      console.log('Server stopped');
      server = null;
    });
  }
});

ipcMain.handle('get-info', () => {
  return {
    platform: os.platform(),
    hostname: os.hostname(),
  }
});

ipcMain.handle('open-linux-install-terminal', () => {
  if (os.platform() === 'linux') {
    // Используем x-terminal-emulator, который есть почти на всех дистрибутивах
    exec(`x-terminal-emulator -e 'bash -c "echo Установка ALSA-utils...; sudo apt update && sudo apt install alsa-utils; exec bash"'`);
  }
});
