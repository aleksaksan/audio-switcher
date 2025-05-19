const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  toggleMute: (isMuted) => ipcRenderer.invoke('toggle-mute', isMuted),
  getMute: () => ipcRenderer.invoke('get-mute'),
  getInfo: () => ipcRenderer.invoke('get-info'),
  getCurrentUrls: () => ipcRenderer.invoke('get-server-urls'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  isServerRunning: () => ipcRenderer.invoke('get-server-status'),
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  openLinuxInstallTerminal: () => ipcRenderer.invoke('open-linux-install-terminal'),
  //Tray:
  sendClientList: (clients) => ipcRenderer.send('client-list', clients),
  onClientListUpdate: (callback) => ipcRenderer.on('client-list', (_, clients) => callback(clients)),
  removeClientListListener: () => ipcRenderer.removeAllListeners('client-list'),

  sendConnectionStatus: (status) => ipcRenderer.send('connection-status', status),
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (_, status) => callback(status)),
  removeConnectionStatusListener: () => ipcRenderer.removeAllListeners('connection-status'),

  callMainWindowAction: (action) => ipcRenderer.invoke('call-main-window-action', action),
  onActionFromTray: (callback) => ipcRenderer.on('action-from-tray', callback),
  removeActionFromTrayListener: () => ipcRenderer.removeAllListeners('action-from-tray')
});
