/**
 * PayAid Desktop Agent - Main Process
 * Electron-based desktop application for system-wide AI assistance
 */

import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
    transparent: true,
    alwaysOnTop: false,
  })

  // Load PayAid web app or local UI
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/desktop-agent')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    // Show/hide PayAid agent
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers
ipcMain.handle('get-system-context', async () => {
  // Get system-wide context (active window, clipboard, etc.)
  return {
    activeWindow: 'Chrome - PayAid Dashboard',
    clipboard: '',
    timestamp: new Date().toISOString(),
  }
})

ipcMain.handle('execute-action', async (event, action) => {
  // Execute AI-suggested action
  console.log('Executing action:', action)
  return { success: true }
})
