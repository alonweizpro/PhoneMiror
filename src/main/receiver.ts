import { spawn, execFile, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import path from 'node:path'
import type { LogEntry, ReceiverStatus, Settings } from '../shared/types'
import { buildUxPlayArgs } from './uxplayArgs'
import { FRIENDLY_ERRORS, parseUxPlayLine, type UxPlayEvent } from './uxplayParser'
import { gstreamerBinDir } from './deps'

const MAX_LOGS = 1000

/**
 * AirPlay receiver for iPhone, backed by a UxPlay child process.
 *
 * Emits:
 *   'status' (ReceiverStatus)  whenever the state changes
 *   'log'    (LogEntry)        for every console line
 */
export class AirPlayReceiver extends EventEmitter {
  private proc: ChildProcess | null = null
  private demoTimers: NodeJS.Timeout[] = []
  private logs: LogEntry[] = []
  private stopping = false
  private status: ReceiverStatus = {
    state: 'stopped',
    platform: 'ios',
    receiverName: 'Mirra',
    demo: false
  }

  getStatus(): ReceiverStatus {
    return { ...this.status }
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  start(settings: Settings, exePath: string | null, demo = false): ReceiverStatus {
    if (this.proc || this.demoTimers.length) return this.getStatus()
    this.stopping = false
    this.setStatus({
      state: 'starting',
      receiverName: settings.receiverName,
      device: undefined,
      since: undefined,
      error: undefined,
      demo
    })

    if (demo) {
      this.runDemo(settings)
      return this.getStatus()
    }

    if (!exePath) {
      this.fail('UxPlay לא נמצא. הוסף את uxplay.exe לתיקייה resources/bin או הגדר נתיב בהגדרות.')
      return this.getStatus()
    }

    const args = buildUxPlayArgs(settings)
    this.log('info', `> ${path.basename(exePath)} ${args.join(' ')}`)

    const env = { ...process.env }
    const gstBin = gstreamerBinDir()
    if (gstBin) env.PATH = `${gstBin}${path.delimiter}${env.PATH ?? ''}`

    try {
      this.proc = spawn(exePath, args, {
        cwd: path.dirname(exePath),
        env,
        windowsHide: true
      })
    } catch (e) {
      this.fail(`הפעלת UxPlay נכשלה: ${(e as Error).message}`)
      return this.getStatus()
    }

    const onData = (chunk: Buffer) => {
      for (const line of chunk.toString('utf8').split(/\r?\n/)) {
        if (!line.trim()) continue
        const events = parseUxPlayLine(line)
        const err = events.find((e) => e.type === 'error')
        this.log(err ? (err.friendly ? 'error' : 'warn') : 'info', line)
        for (const ev of events) this.handle(ev)
      }
    }
    this.proc.stdout?.on('data', onData)
    this.proc.stderr?.on('data', onData)

    this.proc.on('error', (err) => this.fail(`שגיאת תהליך: ${err.message}`))
    this.proc.on('exit', (code) => {
      this.proc = null
      if (this.stopping) return
      if (code === 0) this.setStatus({ state: 'stopped', device: undefined })
      else this.fail(this.status.error ?? `UxPlay נסגר באופן לא צפוי (קוד ${code})`)
    })

    // UxPlay usually prints a "ready" line quickly; if not, assume it's advertising.
    setTimeout(() => {
      if (this.proc && this.status.state === 'starting') this.setStatus({ state: 'waiting' })
    }, 2500)

    return this.getStatus()
  }

  async stop(): Promise<ReceiverStatus> {
    this.stopping = true
    this.demoTimers.forEach(clearTimeout)
    this.demoTimers = []
    const p = this.proc
    this.proc = null
    if (p?.pid) {
      if (process.platform === 'win32') {
        await new Promise<void>((resolve) =>
          execFile('taskkill', ['/pid', String(p.pid), '/T', '/F'], () => resolve())
        )
      } else {
        p.kill('SIGTERM')
      }
    }
    this.setStatus({ state: 'stopped', device: undefined, since: undefined, error: undefined })
    this.log('info', 'המקלט נעצר')
    return this.getStatus()
  }

  private handle(ev: UxPlayEvent) {
    const s = this.status
    switch (ev.type) {
      case 'ready':
        if (s.state === 'starting') this.setStatus({ state: 'waiting' })
        break
      case 'connected':
        this.setStatus({
          state: s.state === 'mirroring' ? 'mirroring' : 'connected',
          device: {
            platform: 'ios',
            name: ev.name ?? s.device?.name ?? 'iPhone',
            model: ev.model ?? s.device?.model
          }
        })
        break
      case 'mirroring':
        this.setStatus({
          state: 'mirroring',
          since: s.since ?? Date.now(),
          device: s.device ?? { platform: 'ios', name: 'iPhone' }
        })
        break
      case 'disconnected':
        if (s.state === 'connected' || s.state === 'mirroring') {
          this.setStatus({ state: 'waiting', device: undefined, since: undefined })
        }
        break
      case 'pin':
        this.log('warn', `קוד PIN לחיבור: ${ev.pin}`)
        break
      case 'error':
        if (ev.friendly) this.setStatus({ error: FRIENDLY_ERRORS[ev.friendly] })
        break
      case 'openConnections':
        break
    }
  }

  /** Simulates a phone connecting so the UI can be developed without UxPlay. */
  private runDemo(settings: Settings) {
    const steps: [number, () => void][] = [
      [600, () => { this.log('info', `[demo] מפרסם את "${settings.receiverName}" ברשת`); this.setStatus({ state: 'waiting' }) }],
      [3200, () => { this.log('info', '[demo] connection request from iPhone של אלון (iPhone16,1)'); this.handle({ type: 'connected', name: 'iPhone של אלון', model: 'iPhone16,1' }) }],
      [4400, () => { this.log('info', '[demo] Begin streaming to GStreamer video pipeline'); this.handle({ type: 'mirroring' }) }]
    ]
    this.demoTimers = steps.map(([ms, fn]) => setTimeout(fn, ms))
  }

  private fail(error: string) {
    this.log('error', error)
    this.setStatus({ state: 'error', error, device: undefined, since: undefined })
  }

  private setStatus(patch: Partial<ReceiverStatus>) {
    this.status = { ...this.status, ...patch }
    this.emit('status', this.getStatus())
  }

  private log(level: LogEntry['level'], text: string) {
    const entry: LogEntry = { ts: Date.now(), level, text }
    this.logs.push(entry)
    if (this.logs.length > MAX_LOGS) this.logs.splice(0, this.logs.length - MAX_LOGS)
    this.emit('log', entry)
  }
}
