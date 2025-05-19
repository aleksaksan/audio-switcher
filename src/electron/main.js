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
let isConnected = false;

// =========================
// App ready
// =========================
app.on('ready', () => {
  // Основное окно
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: true
    }
  });

  // Иконка трея
  const icon = nativeImage.createFromPath(
    path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), '../../build/icon.ico')
  );
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

        if (isDev()) {
          trayWindow.loadURL('http://localhost:5123/#/tray');
        } else {
          trayWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'), {
            hash: '/tray'
          });
        }

        trayWindow.on('blur', () => trayWindow.hide());
        trayWindow.on('close', (event) => {
          event.preventDefault();
          trayWindow.hide();
        });
      }

      const { x, y } = bounds;
      trayWindow.setPosition(
        x - trayWindow.getBounds().width / 2,
        y - trayWindow.getBounds().height
      );
      trayWindow.show();

      updateClientList();
      trayWindow.webContents.send('connection-status', isConnected);
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
    if (trayWindow) {
      trayWindow.webContents.send('connection-status', false);
      trayWindow.webContents.send('client-list', []);
    }
    return;
  }

  const clients = Array.from(io.sockets.sockets).map(([id, socket]) => ({
    id,
    name: socket.data.name || os.hostname(),
    connected: socket.connected,
    isMuted: clientMuteStates[id] || false,
  }));

  io.emit('client-list', clients);

  if (trayWindow) {
    trayWindow.webContents.send('connection-status', true);
    trayWindow.webContents.send('client-list', clients);
  }
}

// =========================
// IPC handlers
// =========================
ipcMain.handle('get-server-urls', () => {
  if (!server) return [];
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
  if (trayWindow) {
    trayWindow.webContents.send('client-list', clients);
  }
});

ipcMain.handle('call-main-window-action', (event, action) => {
  if (mainWindow) {
    mainWindow.webContents.send('action-from-tray', action);
    return true;
  }
  return false;
});

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
