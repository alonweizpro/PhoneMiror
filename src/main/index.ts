import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { AirPlayReceiver } from './receiver'
import { SettingsStore } from './settings'
import { checkDependencies, findUxPlay } from './deps'
import type { Settings } from '../shared/types'

let win: BrowserWindow | null = null
const receiver = new AirPlayReceiver()
let settings: SettingsStore

/** Where uxplay.exe may be bundled: packaged app → resources/bin, dev → ./resources/bin */
function binDirs(): string[] {
  return [path.join(process.resourcesPath, 'bin'), path.join(app.getAppPath(), 'resources', 'bin')]
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 880,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0b10',
    title: 'PhoneMiror',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win?.show())

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc() {
  receiver.on('status', (s) => win?.webContents.send('receiver:status', s))
  receiver.on('log', (l) => win?.webContents.send('receiver:log', l))

  ipcMain.handle('receiver:getStatus', () => receiver.getStatus())
  ipcMain.handle('receiver:getLogs', () => receiver.getLogs())
  ipcMain.handle('receiver:start', async (_e, opts?: { demo?: boolean }) => {
    const s = settings.get()
    const exe = opts?.demo ? null : await findUxPlay(s, binDirs())
    return receiver.start(s, exe, !!opts?.demo)
  })
  ipcMain.handle('receiver:stop', () => receiver.stop())

  ipcMain.handle('settings:get', () => settings.get())
  ipcMain.handle('settings:save', (_e, patch: Partial<Settings>) => settings.set(patch))
  ipcMain.handle('deps:check', () => checkDependencies(settings.get(), binDirs()))

  ipcMain.handle('shell:openExternal', (_e, url: string) => {
    if (/^https:\/\//.test(url)) return shell.openExternal(url)
  })

  ipcMain.on('window:minimize', () => win?.minimize())
  ipcMain.on('window:toggleMaximize', () => (win?.isMaximized() ? win.unmaximize() : win?.maximize()))
  ipcMain.on('window:close', () => win?.close())
}

app.whenReady().then(() => {
  settings = new SettingsStore(app.getPath('userData'))
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  void receiver.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
