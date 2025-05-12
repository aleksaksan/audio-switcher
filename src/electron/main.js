import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';
import os from 'os';
import { Server } from 'socket.io';
import http from 'http';

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
    const newIO = new Server(newServer);

    newServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });

    // (3) Отслеживание состояния звука и передача всем клиентам
    newIO.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // (5) Отправляем список подключённых клиентов
      updateClientList();

      // (2) Клиент вызывает метод управления звуком
      socket.on('toggle-sound', () => {
        console.log(`Client ${socket.id} toggled sound`);
        // (3) Сообщаем всем клиентам, что звук переключен
        io.emit('sound-toggled', { clientId: socket.id });
      });

      // (5) Отслеживаем отключение клиента
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        updateClientList();
      });
    });

    newServer.listen(port, () => {
      server = newServer;
      io = newIO;
      console.log(`Server started on port ${port}`);
      const urls = getServerUrls(port).map(url => ({ url }));
      mainWindow.webContents.send('server-urls', urls);
      resolve(urls);
      
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

// (5) Обновляем список клиентов и отправляем в React
function updateClientList() {
  if (!io) return;
  const clients = Array.from(io.sockets.sockets).map(([id, socket]) => ({
    id,
    address: socket.handshake.address,
    connected: socket.connected
  }));
  console.log('Updating client list:', clients);
  mainWindow.webContents.send('client-list', clients);
}

ipcMain.handle('get-server-urls', () => {
  if (!server) return [];
  const port = server.address().port;
  return getServerUrls(port).map(url => ({ url }));
});

ipcMain.handle('get-server-status', () => {
  return !!server;
});
