const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  toggleMute: (isMuted) => ipcRenderer.invoke('toggle-mute', isMuted),
  getMute: () => ipcRenderer.invoke('get-mute'),
  getInfo: () => ipcRenderer.invoke('get-info'),
  // getMuteAndEmit: async (socket) => {
  //   const isMuted = await ipcRenderer.invoke('get-mute');
  //   socket.emit('client-muted-state-updated', isMuted);
  // },
  // startServer: (port) => ipcRenderer.invoke('start-server', port),
  // onClientList: (callback) => {
  //   ipcRenderer.on('client-list', (_, clients) => {
  //     console.log('client-list via ipcRenderer:', clients);
  //     callback(clients);
  //   });
  // },
  // offClientList: (callback) => ipcRenderer.removeListener('client-list', callback),
  getCurrentUrls: () => ipcRenderer.invoke('get-server-urls'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  isServerRunning: () => ipcRenderer.invoke('get-server-status'),
  // getInfo: () => ipcRenderer.invoke('get-info'),
  startServer: (port) => ipcRenderer.invoke('start-server', port),
  openLinuxInstallTerminal: () => ipcRenderer.invoke('open-linux-install-terminal'),
});


