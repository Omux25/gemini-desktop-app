const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, WebContentsView, session, screen } = require('electron');
const path = require('path');
const fs = require('fs');

(async () => {
  const contextMenu = (await import('electron-context-menu')).default;
  contextMenu({
    showSaveImageAs: true,
    showInspectElement: false
  });
})();

let mainWindow;
let geminiView;
let settingsView;
let isSettingsOpen = false;
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
  hotkey: process.platform === 'darwin' ? 'Command+Option+Space' : 'Alt+Space',
  windowSize: 'Standard',
  windowX: null,
  windowY: null,
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (mainWindow) {
    if (commandLine.includes('--toggle')) {
      toggleWindow();
    } else {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  }
});
function createWindow() {
  const initialSize = WINDOW_SIZES[currentSettings.windowSize] || WINDOW_SIZES.Standard;
  
  // Validate saved coordinates to ensure they are still on-screen
  let validX = undefined;
  let validY = undefined;
  if (currentSettings.windowX !== null && currentSettings.windowY !== null) {
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(display => {
      const bounds = display.bounds;
      return currentSettings.windowX >= bounds.x && currentSettings.windowY >= bounds.y &&
             currentSettings.windowX < bounds.x + bounds.width && currentSettings.windowY < bounds.y + bounds.height;
    });
    if (isVisible) {
      validX = currentSettings.windowX;
      validY = currentSettings.windowY;
    }
  }

  mainWindow = new BrowserWindow({
    width: initialSize.width,
    height: initialSize.height,
    x: validX,
    y: validY,
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
  
  settingsView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'settings_preload.js')
    }
  });
  settingsView.setBackgroundColor('#00000000');
  settingsView.webContents.loadFile('settings.html');
  mainWindow.contentView.addChildView(settingsView);
  
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
        if (isSettingsOpen) {
            settingsView.setBounds(viewBounds);
        } else {
            settingsView.setBounds({ x: -9999, y: -9999, width: 0, height: 0 });
        }
    }
  }

  mainWindow.on('resize', updateViewBounds);
  
  mainWindow.once('ready-to-show', () => {
    updateViewBounds();
    mainWindow.show();
    mainWindow.webContents.send('settings-update', currentSettings);
  });

  geminiView.webContents.loadURL('https://gemini.google.com');

  // Handle Offline Status
  geminiView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore aborted requests (-3) which happen normally during some navigations
    if (errorCode !== -3 && validatedURL.includes('google.com')) {
      geminiView.webContents.loadFile('offline.html');
    }
  });

  // Security: Prevent external links from hijacking the wrapper
  geminiView.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  geminiView.webContents.on('will-navigate', (event, url) => {
    // Only allow navigation to google domains (for auth and gemini)
    if (!url.includes('google.com') && !url.includes('google.co')) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    } else {
      const bounds = mainWindow.getBounds();
      currentSettings.windowX = bounds.x;
      currentSettings.windowY = bounds.y;
      saveSettings(currentSettings);
    }
  });
}

function toggleSettings() {
  isSettingsOpen = !isSettingsOpen;
  
  if (isSettingsOpen) {
    settingsView.webContents.send('settings-update', currentSettings);
  }
  
  // Update bounds based on the new state
  const bounds = mainWindow.getContentBounds();
  const viewBounds = { 
    x: 0, 
    y: TITLE_BAR_HEIGHT, 
    width: bounds.width, 
    height: bounds.height - TITLE_BAR_HEIGHT 
  };
  
  if (isSettingsOpen) {
      settingsView.setBounds(viewBounds);
  } else {
      settingsView.setBounds({ x: -9999, y: -9999, width: 0, height: 0 });
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

// Native Wayland support for Linux (Fixes resizing bugs in tiling WMs)
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

// Spoof UserAgent to prevent Google from blocking logins
app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

app.whenReady().then(() => {
  // Explicitly grant microphone permissions to Gemini for voice input, and allow basic permissions for login
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (url.includes('google.com') || url.includes('google.co')) {
      callback(true);
    } else {
      callback(false);
    }
  });

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
ipcMain.on('retry-connection', () => {
  if (geminiView) {
    geminiView.webContents.loadURL('https://gemini.google.com');
  }
});

ipcMain.handle('get-settings', () => {
  return currentSettings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  const previousSize = currentSettings.windowSize;
  currentSettings = newSettings;
  saveSettings(currentSettings);
  
  app.setLoginItemSettings({
    openAtLogin: currentSettings.launchOnStartup === true,
    path: app.getPath('exe')
  });

  if (previousSize !== currentSettings.windowSize) {
    mainWindow.setResizable(true); // Temporarily unlock to ensure size change
    const newSize = WINDOW_SIZES[currentSettings.windowSize] || WINDOW_SIZES.Standard;
    mainWindow.setSize(newSize.width, newSize.height);
  }
  
  mainWindow.setAlwaysOnTop(currentSettings.alwaysOnTop);
  mainWindow.setResizable(!currentSettings.lockSize);
  mainWindow.webContents.send('settings-update', currentSettings);
  registerHotkey(currentSettings.hotkey);
});

// IPC Listeners for Custom Title Bar
ipcMain.on('window-control', (event, action) => {
  if (action === 'hide') {
    mainWindow.minimize();
  } else if (action === 'close') {
    mainWindow.hide();
  } else if (action === 'pin') {
    currentSettings.alwaysOnTop = !currentSettings.alwaysOnTop;
    saveSettings(currentSettings);
    mainWindow.setAlwaysOnTop(currentSettings.alwaysOnTop);
    mainWindow.webContents.send('settings-update', currentSettings);
    if (settingsView) {
      settingsView.webContents.send('settings-update', currentSettings);
    }
  } else if (action === 'settings') {
    toggleSettings();
  } else if (action === 'close-settings') {
    if (isSettingsOpen) toggleSettings();
  } else if (action === 'back') {
    if (isSettingsOpen) {
      toggleSettings(); // Close settings if open
    } else if (geminiView && geminiView.webContents.canGoBack()) {
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
