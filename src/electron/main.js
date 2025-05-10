import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { isDev } from './util.js';
import { getPreloadPath } from './pathResolver.js';
import { exec } from 'child_process';
// // import { pollResources } from './resourceManager.js';

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

// Управление микрофоном (Windows/Linux)
ipcMain.handle('toggle-mute', (_, isMuted) => {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      exec(`nircmd.exe setsysvolume ${isMuted ? 0 : 65535} "Microphone"`);
    } else if (platform === 'linux') {
      exec(`pactl set-source-mute @DEFAULT_SOURCE@ ${isMuted ? 1 : 0}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});