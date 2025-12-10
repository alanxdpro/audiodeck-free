const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const APP_DIR = path.join(app.getPath('appData'), 'AudioDeck')
const STATE_FILE = path.join(APP_DIR, 'state.json')

function ensureDir() { try { fs.mkdirSync(APP_DIR, { recursive: true }) } catch {} }

ipcMain.handle('read-state', async () => {
  try { ensureDir(); if (!fs.existsSync(STATE_FILE)) return null; const raw = await fs.promises.readFile(STATE_FILE, 'utf-8'); return JSON.parse(raw) } catch { return null }
})
ipcMain.handle('write-state', async (_e, state) => {
  try { ensureDir(); await fs.promises.writeFile(STATE_FILE, JSON.stringify(state), 'utf-8') } catch {}
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#1E1E1E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devUrl = 'http://localhost:5173/'
  win.loadURL(devUrl).catch(() => {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.audiodeck.free')
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

