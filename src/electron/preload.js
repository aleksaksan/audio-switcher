const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleMute: (isMuted) => ipcRenderer.invoke('toggle-mute', isMuted),
  getPlatform: () => process.platform
});
