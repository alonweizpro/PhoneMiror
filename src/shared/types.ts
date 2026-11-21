/**
 * Types shared between the main process, the preload bridge and the UI.
 *
 * The app is built around the idea of a "receiver": a backend that makes the
 * PC visible to a phone and shows its screen. Today there is one receiver
 * (AirPlay via UxPlay, for iPhone). Android (scrcpy) will be a second one
 * implementing the same contract, so the UI does not need to change.
 */

export type Platform = 'ios' | 'android'

export type ReceiverState =
  | 'stopped' // receiver not running
  | 'starting' // process launching
  | 'waiting' // advertising on the network, waiting for a phone
  | 'connected' // a phone connected (handshake done)
  | 'mirroring' // video is streaming
  | 'error'

export interface DeviceInfo {
  name: string
  model?: string
  platform: Platform
}

export interface ReceiverStatus {
  state: ReceiverState
  platform: Platform
  /** Name the PC is advertised as on the phone's Screen Mirroring list */
  receiverName: string
  device?: DeviceInfo
  /** Epoch ms when mirroring started */
  since?: number
  error?: string
  demo: boolean
}

export interface LogEntry {
  ts: number
  level: 'info' | 'warn' | 'error'
  text: string
}

export type Resolution = '1280x720' | '1920x1080' | '2560x1440'

export interface Settings {
  receiverName: string
  resolution: Resolution
  fps: 30 | 60
  audio: boolean
  fullscreen: boolean
  /** Require a 4-digit PIN shown on the PC before a phone can connect */
  requirePin: boolean
  pin: string
  /** GStreamer video sink; d3d11videosink is the recommended one on Windows */
  videoSink: string
  /** Optional custom path to uxplay.exe */
  uxplayPath: string
  debugLog: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  receiverName: 'PhoneMiror',
  resolution: '1920x1080',
  fps: 60,
  audio: true,
  fullscreen: false,
  requirePin: false,
  pin: '',
  videoSink: 'd3d11videosink',
  uxplayPath: '',
  debugLog: false
}

export type CheckId = 'uxplay' | 'bonjour' | 'gstreamer'

export interface DependencyCheck {
  id: CheckId
  ok: boolean
  /** true when the check could not be determined (e.g. not on Windows) */
  unknown?: boolean
  detail?: string
}

export interface PhoneMirorApi {
  getStatus(): Promise<ReceiverStatus>
  start(opts?: { demo?: boolean }): Promise<ReceiverStatus>
  stop(): Promise<ReceiverStatus>
  getSettings(): Promise<Settings>
  saveSettings(s: Partial<Settings>): Promise<Settings>
  checkDependencies(): Promise<DependencyCheck[]>
  getLogs(): Promise<LogEntry[]>
  openExternal(url: string): Promise<void>
  window: {
    minimize(): void
    toggleMaximize(): void
    close(): void
  }
  onStatus(cb: (s: ReceiverStatus) => void): () => void
  onLog(cb: (l: LogEntry) => void): () => void
}
