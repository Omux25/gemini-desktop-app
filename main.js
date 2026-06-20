const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let settingsWindow;
let tray = null;

// Built-in settings manager
const configPath = path.join(app.getPath('userData'), 'settings.json');
const defaultSettings = {
  hotkey: 'Alt+Space',
  alwaysOnTop: true,
  lockSize: false
};

function getSettings() {
  try {
    if (fs.existsSync(configPath)) {
      return { ...defaultSettings, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    }
  } catch (err) {
    console.error('Error reading settings', err);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
}

let currentSettings = getSettings();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    alwaysOnTop: currentSettings.alwaysOnTop,
    resizable: !currentSettings.lockSize,
    show: false // Don't show immediately
  });

  mainWindow.loadURL('https://gemini.google.com');

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 400,
    title: 'Gemini Settings',
    icon: path.join(__dirname, 'icon.png'),
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'settings_preload.js')
    }
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function registerHotkey(hotkey) {
  globalShortcut.unregisterAll();
  const ret = globalShortcut.register(hotkey, toggleWindow);
  if (!ret) {
    console.log('Shortcut registration failed for', hotkey);
  }
}

// Memory optimizations
app.disableHardwareAcceleration(); 
app.commandLine.appendSwitch('js-flags', '--expose_gc'); 

app.whenReady().then(() => {
  createWindow();
  registerHotkey(currentSettings.hotkey);

  // Force garbage collection every 30 seconds when idle
  setInterval(() => {
      if (!mainWindow.isVisible() && global.gc) {
          global.gc();
      }
  }, 30000);

  // Create Tray
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide Gemini', click: toggleWindow },
    { label: 'Settings', click: createSettingsWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  
  tray.setToolTip('Gemini Desktop');
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC Listeners for Settings
ipcMain.handle('get-settings', () => {
  return currentSettings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  currentSettings = newSettings;
  saveSettings(currentSettings);
  
  // Apply changes instantly
  mainWindow.setAlwaysOnTop(currentSettings.alwaysOnTop);
  mainWindow.setResizable(!currentSettings.lockSize);
  registerHotkey(currentSettings.hotkey);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
