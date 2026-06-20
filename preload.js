const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    togglePin: () => ipcRenderer.send('window-control', 'pin'),
    hideWindow: () => ipcRenderer.send('window-control', 'hide'),
    closeApp: () => ipcRenderer.send('window-control', 'close'),
    onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', (event, settings) => callback(settings))
});
