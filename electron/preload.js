import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),
  loadFile: (filename) => ipcRenderer.invoke('load-file', filename),
  saveFileDialog: (data) => ipcRenderer.invoke('save-file-dialog', data),
  loadFileDialog: () => ipcRenderer.invoke('load-file-dialog'),
  exportImageDialog: (imageData) => ipcRenderer.invoke('export-image-dialog', imageData),
  readImageFile: (filePath) => ipcRenderer.invoke('read-image-file', filePath),
  showOpenImageDialog: () => ipcRenderer.invoke('show-open-image-dialog'),
});
