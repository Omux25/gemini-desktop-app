const { app, BrowserWindow, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

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
    alwaysOnTop: true,
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

function toggleWindow() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

// Memory optimizations
app.disableHardwareAcceleration(); // Prevents the app from stealing GPU resources while you are gaming
app.commandLine.appendSwitch('js-flags', '--expose_gc'); // Allows manual garbage collection

app.whenReady().then(() => {
  createWindow();

  // Force garbage collection every 30 seconds when idle
  setInterval(() => {
      if (!mainWindow.isVisible() && global.gc) {
          global.gc();
      }
  }, 30000);

  // Create Tray
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', click: toggleWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  
  tray.setToolTip('Gemini Desktop');
  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);

  // Register Global Shortcut
  const ret = globalShortcut.register('Alt+Space', toggleWindow);

  if (!ret) {
    console.log('Shortcut registration failed');
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
