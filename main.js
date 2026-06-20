const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, WebContentsView } = require('electron');
const contextMenu = require('electron-context-menu');
const path = require('path');
const fs = require('fs');

contextMenu({
  showSaveImageAs: true,
  showInspectElement: false
});

let mainWindow;
let geminiView;
let settingsView = null;
let tray = null;

const TITLE_BAR_HEIGHT = 38;

const WINDOW_SIZES = {
  Compact: { width: 450, height: 650 },
  Standard: { width: 600, height: 800 },
  Tall: { width: 600, height: 1000 },
  Large: { width: 800, height: 1000 }
};

// Built-in settings manager
const configPath = path.join(app.getPath('userData'), 'settings.json');
const defaultSettings = {
  hotkey: 'Alt+Space',
  windowSize: 'Standard',
  alwaysOnTop: true,
  lockSize: false,
  launchOnStartup: false,
  hardwareAcceleration: false
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
  const initialSize = WINDOW_SIZES[currentSettings.windowSize] || WINDOW_SIZES.Standard;
  mainWindow = new BrowserWindow({
    width: initialSize.width,
    height: initialSize.height,
    icon: path.join(__dirname, 'icon.png'),
    frame: false, // Frameless for custom title bar
    backgroundColor: '#121212',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    alwaysOnTop: currentSettings.alwaysOnTop,
    resizable: !currentSettings.lockSize,
    show: false
  });

  mainWindow.loadFile('index.html');

  // Create WebContentsView for the external website
  geminiView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.contentView.addChildView(geminiView);
  
  function updateViewBounds() {
    if (!mainWindow) return;
    const bounds = mainWindow.getContentBounds();
    const viewBounds = { 
      x: 0, 
      y: TITLE_BAR_HEIGHT, 
      width: bounds.width, 
      height: bounds.height - TITLE_BAR_HEIGHT 
    };
    if (geminiView) {
        geminiView.setBounds(viewBounds);
    }
    if (settingsView) {
        settingsView.setBounds(viewBounds);
    }
  }

  mainWindow.on('resize', updateViewBounds);
  
  mainWindow.once('ready-to-show', () => {
    updateViewBounds();
    mainWindow.show();
    mainWindow.webContents.send('settings-update', currentSettings);
  });

  geminiView.webContents.loadURL('https://gemini.google.com');

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function toggleSettings() {
  if (!settingsView) {
    settingsView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'settings_preload.js')
      }
    });
    settingsView.setBackgroundColor('#00000000'); // Transparent background
    settingsView.webContents.loadFile('settings.html');
    mainWindow.contentView.addChildView(settingsView);
    
    // Resize immediately
    const bounds = mainWindow.getContentBounds();
    settingsView.setBounds({ 
      x: 0, 
      y: TITLE_BAR_HEIGHT, 
      width: bounds.width, 
      height: bounds.height - TITLE_BAR_HEIGHT 
    });
  } else {
    mainWindow.contentView.removeChildView(settingsView);
    settingsView = null;
  }
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

// Hardware Acceleration logic
if (currentSettings.hardwareAcceleration === false) {
  app.disableHardwareAcceleration(); 
}

// Memory optimizations
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
    { label: 'Settings', click: toggleSettings },
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
  
  app.setLoginItemSettings({
    openAtLogin: currentSettings.launchOnStartup === true,
    path: app.getPath('exe')
  });

  mainWindow.setResizable(true); // Temporarily unlock to ensure size change
  const newSize = WINDOW_SIZES[currentSettings.windowSize] || WINDOW_SIZES.Standard;
  mainWindow.setSize(newSize.width, newSize.height);
  
  mainWindow.setAlwaysOnTop(currentSettings.alwaysOnTop);
  mainWindow.setResizable(!currentSettings.lockSize);
  mainWindow.webContents.send('settings-update', currentSettings);
  registerHotkey(currentSettings.hotkey);
});

// IPC Listeners for Custom Title Bar
ipcMain.on('window-control', (event, action) => {
  if (action === 'hide') {
    mainWindow.hide();
  } else if (action === 'close') {
    app.isQuiting = true;
    app.quit();
  } else if (action === 'pin') {
    currentSettings.alwaysOnTop = !currentSettings.alwaysOnTop;
    saveSettings(currentSettings);
    mainWindow.setAlwaysOnTop(currentSettings.alwaysOnTop);
    mainWindow.webContents.send('settings-update', currentSettings);
  } else if (action === 'settings') {
    toggleSettings();
  } else if (action === 'close-settings') {
    if (settingsView) toggleSettings();
  } else if (action === 'back') {
    if (geminiView && geminiView.webContents.canGoBack()) {
      geminiView.webContents.goBack();
    }
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
