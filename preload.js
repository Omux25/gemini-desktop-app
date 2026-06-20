const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    goBack: () => ipcRenderer.send('window-control', 'back'),
    togglePin: () => ipcRenderer.send('window-control', 'pin'),
    refresh: () => ipcRenderer.send('window-control', 'refresh'),
    toggleSettings: () => ipcRenderer.send('window-control', 'settings'),
    hideWindow: () => ipcRenderer.send('window-control', 'hide'),
    closeApp: () => ipcRenderer.send('window-control', 'close'),
    retryConnection: () => ipcRenderer.send('retry-connection'),
    onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', (event, settings) => callback(settings))
});
