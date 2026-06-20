const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    goBack: () => ipcRenderer.send('window-control', 'back'),
    togglePin: () => ipcRenderer.send('window-control', 'pin'),
    toggleSettings: () => ipcRenderer.send('window-control', 'settings'),
    hideWindow: () => ipcRenderer.send('window-control', 'hide'),
    closeApp: () => ipcRenderer.send('window-control', 'close'),
    onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', (event, settings) => callback(settings))
});
