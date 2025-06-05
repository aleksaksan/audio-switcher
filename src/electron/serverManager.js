import http from 'http';
import { Server } from 'socket.io';
import os from 'os';

let server = null;
let io = null;
let clientList = [];
let clientMuteStates = {};
let isConnected = false;

// Получение URL-адресов сервера
export function getServerUrls(port) {
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

// Обновление списка клиентов
export function getServerPort() {
  if (!server || !server.address()) return null;
  return server.address().port;
}

// Исправить вызовы updateClientList
export function updateClientList(mainWindow, trayWindow = null) {
  if (!io) {
    const emptyList = [];
    updateWindowsWithClientList(emptyList, mainWindow, trayWindow);
    return emptyList;
  }

  const clients = Array.from(io.sockets.sockets).map(([id, socket]) => ({
    id,
    name: socket.data.name || os.hostname(),
    connected: socket.connected,
    isMuted: clientMuteStates[id] || false,
    order: socket.data.order || 0 
  }));

  clientList = [...clients];
  updateWindowsWithClientList(clientList, mainWindow, trayWindow);
  io.emit('client-list', clients);
  
  return clientList;
}

// Обновление окон с новым списком клиентов
function updateWindowsWithClientList(clients, mainWindow, trayWindow) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('client-list', clients);
  }
  if (trayWindow && !trayWindow.isDestroyed()) {
    trayWindow.webContents.send('client-list', clients);
  }
}

// Запуск сервера
export function startServer(port, mainWindow) {
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

      updateClientList(mainWindow);

      socket.on('register-client', ({ id, name, order }) => {
        socket.data.id = id;
        socket.data.name = name || os.hostname();
        socket.data.order = order || 0;
        updateClientList(mainWindow);
      });

      socket.on('change-client-name', ({ id, name }) => {
        const targetSocket = io.sockets.sockets.get(id);
        if (targetSocket) {
          targetSocket.data.name = name;
          setTimeout(() => updateClientList(mainWindow), 10);
        }
      });

      socket.on('change-client-order', ({ id, order }) => {
        const targetSocket = io.sockets.sockets.get(id);
        if (targetSocket) {
          targetSocket.data.order = order;
          setTimeout(() => updateClientList(mainWindow), 10);
        }
      });

      socket.on('change-client-info', ({ id, name, order }) => {
        const targetSocket = io.sockets.sockets.get(id);
        if (targetSocket) {
          if (name) targetSocket.data.name = name;
          if (order !== undefined) targetSocket.data.order = order;
          setTimeout(() => updateClientList(mainWindow), 10);
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
        setTimeout(() => updateClientList(mainWindow), 10);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        delete clientMuteStates[socket.id];
        updateClientList(mainWindow);
      });

      socket.on('broadcast-toggle-mute', () => {
        for (const [, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('apply-mute');
        }
      });

      socket.on('force-mute-all', () => {
        console.log('Forcing mute on all clients');
        for (const [, targetSocket] of io.sockets.sockets) {
          targetSocket.emit('force-mute');
        }
      });
    });

    // В функции startServer нужно использовать getServerPort
    newServer.listen(port, () => {
      server = newServer;
      io = newIO;
      isConnected = true;
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
}

// Остановка сервера
export function stopServer(mainWindow) {
  return new Promise((resolve) => {
    if (server) {
      if (io) {
        io.sockets.disconnectSockets(true);
        io.close();
        io = null;
      }

      server.close(() => {
        server = null;
        isConnected = false;
        console.log('Server stopped');
        resolve(true);
      });
    } else {
      resolve(false);
    }

    mainWindow.webContents.send('server-status-updated', false);
  });
}

// Отправка команды mute всем клиентам
export function muteAllClients() {
  if (io) {
    for (const [, targetSocket] of io.sockets.sockets) {
      targetSocket.emit('apply-mute');
    }
    return true;
  }
  return false;
}

export function getServerStatus() {
  return !!server;
}

export function getConnectionStatus() {
  return isConnected;
}

export function getClientList() {
  return clientList;
}

export function toggleClientMute(clientId) {
  if (io) {
    const targetSocket = io.sockets.sockets.get(clientId);
    if (targetSocket) {
      targetSocket.emit('apply-mute');
      return true;
    }
  }
  return false;
}

export function closeServer() {
  if (io) {
    io.sockets.disconnectSockets(true);
    io.close();
    io = null;
  }

  if (server) {
    server.close(() => {
      console.log('Server closed on app exit');
      server = null;
    });
  }
}