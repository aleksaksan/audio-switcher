const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  toggleMute: (isMuted) => ipcRenderer.invoke('toggle-mute', isMuted),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
});

// contextBridge.exposeInMainWorld('electron', {
//   homeDir: () => os.homedir(),
//   osVersion: () => os.arch(),
// });

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
});
