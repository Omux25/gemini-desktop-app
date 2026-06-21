const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, WebContentsView, session, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

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
let isOverlayActive = false;
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
  hardwareAcceleration: false,
  dismissedUpdateVersion: null
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
      mainWindow.webContents.send('window-shown');
      
      if (isSettingsOpen && settingsView) {
        settingsView.webContents.focus();
      } else if (geminiView) {
        geminiView.webContents.focus();
        geminiView.webContents.executeJavaScript(`
          (function() {
            var active = document.activeElement;
            if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
            var selectors = ['rich-textarea [contenteditable="true"]', 'textarea', '[role="textbox"][contenteditable="true"]', 'rich-textarea', '[contenteditable="true"]'];
            for (var s of selectors) {
              var els = document.querySelectorAll(s);
              for (var i = els.length - 1; i >= 0; i--) {
                if (els[i].offsetWidth > 0 && els[i].offsetHeight > 0) { els[i].focus({ preventScroll: true }); return; }
              }
            }
          })();
        `).catch(()=>{});
      }
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
    icon: path.join(__dirname, '../assets/icon.png'),
    frame: process.platform === 'darwin', // Frameless on Win/Linux, Native on macOS
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
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
        if (isOverlayActive) {
            geminiView.setBounds({ x: -9999, y: -9999, width: 0, height: 0 });
        } else {
            geminiView.setBounds(viewBounds);
        }
    }
    if (settingsView) {
        if (isSettingsOpen && !isOverlayActive) {
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
    mainWindow.webContents.send('settings-update', { ...currentSettings, appVersion: app.getVersion() });
  });

  geminiView.webContents.loadURL('https://gemini.google.com');

  // Handle Offline Status
  geminiView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignore aborted requests (-3) which happen normally during some navigations
    if (errorCode !== -3 && validatedURL.includes('google.com')) {
      geminiView.webContents.loadFile('offline.html');
    }
  });

  // Auto-recover from renderer crashes (black screens)
  geminiView.webContents.on('render-process-gone', (event, details) => {
    console.log('Renderer process gone:', details.reason);
    if (details.reason === 'crashed' || details.reason === 'oom' || details.reason === 'killed') {
      geminiView.webContents.reload();
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

  // Windows Bug Fix: Frameless windows with WebContentsView lose WS_EX_TOPMOST 
  // when the child view is clicked. We must force Win32 to re-apply the style.
  const enforceTopmost = () => {
    if (currentSettings.alwaysOnTop && mainWindow) {
      mainWindow.setAlwaysOnTop(false);
      const topmostLevel = process.platform === 'win32' ? 'pop-up-menu' : 'floating';
      mainWindow.setAlwaysOnTop(true, topmostLevel);
    }
  };
  mainWindow.on('focus', enforceTopmost);
  geminiView.webContents.on('focus', enforceTopmost);

  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      if (geminiView) {
        geminiView.webContents.setBackgroundThrottling(true);
      }
      if (global.gc) global.gc();
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
    settingsView.webContents.send('settings-update', { ...currentSettings, appVersion: app.getVersion() });
  }
  
  if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.emit('resize'); // Trigger bounds update natively
  }
}

function toggleWindow() {
  if (mainWindow.isVisible() && !mainWindow.isMinimized() && (mainWindow.isFocused() || currentSettings.alwaysOnTop)) {
    mainWindow.hide();
    if (geminiView) {
      geminiView.webContents.setBackgroundThrottling(true);
    }
    if (global.gc) global.gc();
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    
    if (geminiView) {
      geminiView.webContents.setBackgroundThrottling(false);
    }
    
    // Windows force-focus hack: temporarily set to always on top to force it to the front
    mainWindow.setAlwaysOnTop(true, process.platform === 'win32' ? 'pop-up-menu' : 'floating');
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
    
    if (isSettingsOpen && settingsView) {
      settingsView.webContents.focus();
    } else if (geminiView) {
      geminiView.webContents.focus();
      // Forcefully focus the Gemini prompt input box
      geminiView.webContents.executeJavaScript(`
        (function() {
          var active = document.activeElement;
          if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
          var selectors = ['rich-textarea [contenteditable="true"]', 'textarea', '[role="textbox"][contenteditable="true"]', 'rich-textarea', '[contenteditable="true"]'];
          for (var s of selectors) {
            var els = document.querySelectorAll(s);
            for (var i = els.length - 1; i >= 0; i--) {
              if (els[i].offsetWidth > 0 && els[i].offsetHeight > 0) { els[i].focus({ preventScroll: true }); return; }
            }
          }
        })();
      `).catch(()=>{});
    }
    
    // If the user hasn't actually pinned it, immediately disable always on top after it surfaces
    if (!currentSettings.alwaysOnTop) {
      mainWindow.setAlwaysOnTop(false);
    } else {
      mainWindow.setAlwaysOnTop(false);
      const topmostLevel = process.platform === 'win32' ? 'pop-up-menu' : 'floating';
      mainWindow.setAlwaysOnTop(true, topmostLevel);
    }
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
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService'); // Disable unused heavy features

// Native Wayland support for Linux (Fixes resizing bugs in tiling WMs)
app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

// Hide from macOS Dock (skipTaskbar only works on Windows/Linux)
if (process.platform === 'darwin' && app.dock) {
  app.dock.hide();
}

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

  // Auto Updater Logic
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();
  
  autoUpdater.on('update-available', (info) => {
    const version = info.version;
    // Notify settings page regardless of dismiss state so manual check works
    if (settingsView) settingsView.webContents.send('update-available', version);
    
    // Only notify main UI if the user hasn't explicitly dismissed this version
    if (version !== currentSettings.dismissedUpdateVersion) {
      if (mainWindow) mainWindow.webContents.send('update-available', version);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (settingsView) settingsView.webContents.send('update-progress', progressObj.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('update-downloaded');
    if (settingsView) settingsView.webContents.send('update-downloaded');
  });

  autoUpdater.on('update-not-available', () => {
    if (settingsView) settingsView.webContents.send('update-not-available');
  });

  autoUpdater.on('error', (err) => {
    if (settingsView) settingsView.webContents.send('update-error', err.message);
  });

  // Removed global GC polling loop; GC now fires once upon hiding the window

  // Create Tray
  tray = new Tray(path.join(__dirname, '../assets/icon.png'));
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

ipcMain.on('install-update', () => {
  app.isQuiting = true;
  // quitAndInstall(isSilent, isForceRunAfter) -> true, true makes it seamless and reopens the app
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on('check-for-updates-manual', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('dismiss-update', (event, version) => {
  currentSettings.dismissedUpdateVersion = version;
  saveSettings(currentSettings);
});

ipcMain.on('set-overlay-active', (event, active) => {
  isOverlayActive = active;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.emit('resize');
  }
});

ipcMain.handle('get-settings', () => {
  return { ...currentSettings, appVersion: app.getVersion() };
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
    
    // Fallback bounds update to prevent Electron rendering glitches when resizing while open
    setTimeout(() => {
      if (!mainWindow) return;
      const bounds = mainWindow.getContentBounds();
      const viewBounds = { x: 0, y: TITLE_BAR_HEIGHT, width: bounds.width, height: bounds.height - TITLE_BAR_HEIGHT };
      if (geminiView) geminiView.setBounds(viewBounds);
      if (settingsView && isSettingsOpen) settingsView.setBounds(viewBounds);
    }, 50);
  }
  
  if (currentSettings.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setAlwaysOnTop(true, process.platform === 'win32' ? 'pop-up-menu' : 'floating');
  } else {
    mainWindow.setAlwaysOnTop(false);
  }
  
  mainWindow.setResizable(!currentSettings.lockSize);
  mainWindow.webContents.send('settings-update', { ...currentSettings, appVersion: app.getVersion() });
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
    if (currentSettings.alwaysOnTop) {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setAlwaysOnTop(true, process.platform === 'win32' ? 'pop-up-menu' : 'floating');
    } else {
      mainWindow.setAlwaysOnTop(false);
    }
    mainWindow.webContents.send('settings-update', { ...currentSettings, appVersion: app.getVersion() });
    if (settingsView) {
      settingsView.webContents.send('settings-update', { ...currentSettings, appVersion: app.getVersion() });
    }
  } else if (action === 'settings') {
    toggleSettings();
  } else if (action === 'close-settings') {
    if (isSettingsOpen) toggleSettings();
  } else if (action === 'refresh') {
    if (geminiView) geminiView.webContents.reload();
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
