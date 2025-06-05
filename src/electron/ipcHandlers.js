import { ipcMain } from 'electron';
import os from 'os';
import { exec } from 'child_process';
import loudness from 'loudness';
import { 
  startServer, 
  stopServer, 
  getServerUrls, 
  getServerStatus, 
  getClientList,
  getConnectionStatus,
  muteAllClients,
  updateClientList,
  getServerPort
} from './serverManager.js';
import {
  setTrayPosition,
  getTrayPosition,
  updateTrayWindow,
  resizeTrayWindow
} from './trayManager.js';

export function registerIpcHandlers(mainWindow) {
  // Серверные функции
  ipcMain.handle('start-server', (event, port) => startServer(port, mainWindow));
  ipcMain.handle('stop-server', () => stopServer(mainWindow));
  ipcMain.handle('get-server-urls', () => {
    if (!getServerStatus()) return [];
    // Получаем порт из серверного менеджера
    const urls = getServerUrls(getServerPort());
    return urls.map(url => ({ url }));
  });
  ipcMain.handle('get-server-status', () => getServerStatus());
  
  // Аудио функции
  ipcMain.handle('toggle-mute', async (event, isMuted) => {
    await loudness.setMuted(isMuted);
    updateClientList(mainWindow);
  });
  ipcMain.handle('get-mute', async () => await loudness.getMuted());
  
  // Системная информация
  ipcMain.handle('get-info', () => {
    return {
      platform: os.platform(),
      hostname: os.hostname(),
    };
  });
  
  // Linux-специфичные функции
  ipcMain.handle('open-linux-install-terminal', () => {
    if (os.platform() === 'linux') {
      exec(`x-terminal-emulator -e 'bash -c "echo Установка ALSA-utils...; sudo apt update && sudo apt install alsa-utils; exec bash"'`);
    }
  });
  
  // Функции для трея
  ipcMain.handle('get-tray-position', () => getTrayPosition());
  ipcMain.handle('request-client-list', () => getClientList());
  ipcMain.handle('request-connection-status', () => getConnectionStatus());
  
  // События
  ipcMain.on('connection-status', (_, status) => {
    updateTrayWindow(getClientList(), status);
  });
  
  ipcMain.on('client-list', (_, clients) => {
    updateTrayWindow(clients, getConnectionStatus());
  });
  
  ipcMain.on('send-mute-all', () => {
    muteAllClients();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mute-all-triggered');
    }
  });
  
  ipcMain.on('toggle-client-mute', (event, clientId) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-toggle-client', clientId);
    }
  });
  
  ipcMain.on('tray-ready', () => {
    updateTrayWindow(getClientList(), getConnectionStatus());
  });
  
  ipcMain.on('request-send-toggle', (event, clientId) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('request-toggle-client', clientId);
    }
  });
  
  ipcMain.on('resize-window', (event, width, height) => {
    resizeTrayWindow(width, height);
  });
  
  ipcMain.on('set-tray-position', (event, position) => {
    setTrayPosition(position);
  });
}