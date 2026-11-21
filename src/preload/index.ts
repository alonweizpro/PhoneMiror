import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { LogEntry, MirraApi, ReceiverStatus } from '../shared/types'

function subscribe<T>(channel: string, cb: (v: T) => void) {
  const listener = (_e: IpcRendererEvent, v: T) => cb(v)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: MirraApi = {
  getStatus: () => ipcRenderer.invoke('receiver:getStatus'),
  start: (opts) => ipcRenderer.invoke('receiver:start', opts),
  stop: () => ipcRenderer.invoke('receiver:stop'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),
  checkDependencies: () => ipcRenderer.invoke('deps:check'),
  getLogs: () => ipcRenderer.invoke('receiver:getLogs'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
    close: () => ipcRenderer.send('window:close')
  },
  onStatus: (cb) => subscribe<ReceiverStatus>('receiver:status', cb),
  onLog: (cb) => subscribe<LogEntry>('receiver:log', cb)
}

contextBridge.exposeInMainWorld('mirra', api)
