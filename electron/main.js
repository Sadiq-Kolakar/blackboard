import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For ES modules compatibility
const getPreloadPath = () => {
  if (isDev) {
    return join(__dirname, 'preload.js');
  }
  return join(process.resourcesPath, 'electron', 'preload.js');
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Get app data directory
const getAppDataPath = () => {
  const userDataPath = app.getPath('userData');
  const appDataPath = join(userDataPath, 'infinite-canvas');
  if (!existsSync(appDataPath)) {
    mkdirSync(appDataPath, { recursive: true });
  }
  return appDataPath;
};

// IPC handlers for file operations
ipcMain.handle('save-file', async (event, data, filename) => {
  try {
    const appDataPath = getAppDataPath();
    // Sanitise: strip any directory components to prevent path traversal.
    const safeFilename = basename(filename || 'canvas.json');
    const filePath = join(appDataPath, safeFilename);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-file', async (event, filename) => {
  try {
    const appDataPath = getAppDataPath();
    // Sanitise: strip any directory components to prevent path traversal.
    const safeFilename = basename(filename || 'canvas.json');
    const filePath = join(appDataPath, safeFilename);
    if (!existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    const data = await readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file-dialog', async (event, data) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Canvas',
      defaultPath: 'canvas.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    await writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Canvas',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    const data = await readFile(result.filePaths[0], 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-image-dialog', async (event, imageData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Canvas as PNG',
      defaultPath: 'canvas.png',
      filters: [{ name: 'PNG Images', extensions: ['png'] }],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(result.filePath, buffer);
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-image-file', async (event, filePath) => {
  try {
    const { readFile: readFileFn } = await import('fs/promises');
    const buffer = await readFileFn(filePath);
    const base64 = buffer.toString('base64');

    // Detect MIME type from file extension.
    const ext = extname(filePath).slice(1).toLowerCase();
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      bmp: 'image/bmp',
      webp: 'image/webp',
    };
    const mime = mimeMap[ext] || 'image/png';

    return { success: true, data: `data:${mime};base64,${base64}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-image-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Image',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp'] },
      ],
      properties: ['openFile'],
    });

    if (result.canceled) {
      return { success: false, canceled: true };
    }

    return { success: true, path: result.filePaths[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

