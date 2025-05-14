import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';
import os from 'os';
import { Server } from 'socket.io';
import http from 'http';
import loudness from 'loudness';
import { exec } from 'child_process';

// app.on('ready', () => {
//   const mainWindow = new BrowserWindow({

//   });
//   if (isDev()) {
//     mainWindow.loadURL('http://localhost:5123');
//   } else {
//     mainWindow.loadFile(path.join(app.getAppPath(), './dist-react/index.html'));
//   }
//   // pollResources();
// })


let mainWindow;
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
