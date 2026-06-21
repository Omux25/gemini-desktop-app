const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsAPI', {
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
    closeSettings: () => ipcRenderer.send('window-control', 'close-settings'),
    onUpdate: (callback) => ipcRenderer.on('settings-update', (event, settings) => callback(settings)),
    downloadUpdate: () => ipcRenderer.send('download-update'),
    checkForUpdates: () => ipcRenderer.send('check-for-updates-manual'),
    installUpdate: () => ipcRenderer.send('install-update'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, version) => callback(version)),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, percent) => callback(percent)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', () => callback()),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, err) => callback(err))
});
