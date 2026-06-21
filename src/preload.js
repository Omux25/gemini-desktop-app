const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    platform: process.platform,
    goBack: () => ipcRenderer.send('window-control', 'back'),
    togglePin: () => ipcRenderer.send('window-control', 'pin'),
    refresh: () => ipcRenderer.send('window-control', 'refresh'),
    toggleSettings: () => ipcRenderer.send('window-control', 'settings'),
    hideWindow: () => ipcRenderer.send('window-control', 'hide'),
    closeApp: () => ipcRenderer.send('window-control', 'close'),
    retryConnection: () => ipcRenderer.send('retry-connection'),
    onSettingsUpdate: (callback) => ipcRenderer.on('settings-update', (event, settings) => callback(settings)),
    onWindowShown: (callback) => ipcRenderer.on('window-shown', callback),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, version) => callback(version)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    installUpdate: () => ipcRenderer.send('install-update'),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    dismissUpdate: (version) => ipcRenderer.send('dismiss-update', version)
});
