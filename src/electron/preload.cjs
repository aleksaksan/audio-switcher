const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  toggleMute: (isMuted) => ipcRenderer.invoke('toggle-mute', isMuted),
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  onClientList: (callback) => ipcRenderer.on('client-list', (_, clients) => callback(clients)),
  getCurrentUrls: () => ipcRenderer.invoke('get-server-urls'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  isServerRunning: () => ipcRenderer.invoke('get-server-status'),

  onServerStatusUpdated: (callback) => {
    ipcRenderer.on('server-status-updated', (_, running) => callback(running));
  },

  offServerStatusUpdated: (callback) => {
    ipcRenderer.removeListener('server-status-updated', (_, running) => callback(running));
  }
});

