import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { DependencyCheck, Settings } from '../shared/types'

/**
 * Windows prerequisites for AirPlay mirroring:
 *  - uxplay.exe      the AirPlay receiver engine (https://github.com/FDH2/UxPlay)
 *  - Bonjour         Apple's mDNS service, so the iPhone can discover the PC
 *  - GStreamer       decodes and displays the H.264 video stream
 */

const isWin = process.platform === 'win32'
const exeName = isWin ? 'uxplay.exe' : 'uxplay'

function run(cmd: string, args: string[]): Promise<{ ok: boolean; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true, timeout: 5000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: `${stdout ?? ''}${stderr ?? ''}` })
    })
  })
}

/** Finds uxplay: custom path → bundled resources/bin → PATH. */
export async function findUxPlay(settings: Settings, binDirs: string[]): Promise<string | null> {
  if (settings.uxplayPath && existsSync(settings.uxplayPath)) return settings.uxplayPath
  for (const dir of binDirs) {
    const p = path.join(dir, exeName)
    if (existsSync(p)) return p
  }
  const r = await run(isWin ? 'where' : 'which', [exeName])
  if (r.ok) {
    const first = r.out.split(/\r?\n/).find((l) => l.trim())
    if (first && existsSync(first.trim())) return first.trim()
  }
  return null
}

export function gstreamerBinDir(): string | null {
  const roots = [
    process.env.GSTREAMER_1_0_ROOT_MSVC_X86_64,
    process.env.GSTREAMER_1_0_ROOT_X86_64,
    'C:\\Program Files\\gstreamer\\1.0\\msvc_x86_64',
    'C:\\gstreamer\\1.0\\msvc_x86_64'
  ].filter(Boolean) as string[]
  for (const root of roots) {
    const bin = path.join(root, 'bin')
    if (existsSync(path.join(bin, isWin ? 'gst-launch-1.0.exe' : 'gst-launch-1.0'))) return bin
  }
  return null
}

async function checkBonjour(): Promise<DependencyCheck> {
  if (!isWin) return { id: 'bonjour', ok: true, unknown: true, detail: 'נבדק רק ב-Windows' }
  const r = await run('sc', ['query', 'Bonjour Service'])
  if (/RUNNING/i.test(r.out)) return { id: 'bonjour', ok: true, detail: 'השירות פועל' }
  if (/STOPPED/i.test(r.out)) return { id: 'bonjour', ok: false, detail: 'מותקן אבל עצור' }
  return { id: 'bonjour', ok: false, detail: 'לא מותקן' }
}

async function checkGStreamer(): Promise<DependencyCheck> {
  const bin = gstreamerBinDir()
  if (bin) return { id: 'gstreamer', ok: true, detail: bin }
  const r = await run('gst-launch-1.0', ['--version'])
  if (r.ok) return { id: 'gstreamer', ok: true, detail: r.out.split(/\r?\n/)[0] }
  return { id: 'gstreamer', ok: false, detail: 'לא נמצא' }
}

export async function checkDependencies(settings: Settings, binDirs: string[]): Promise<DependencyCheck[]> {
  const [ux, bonjour, gst] = await Promise.all([
    findUxPlay(settings, binDirs),
    checkBonjour(),
    checkGStreamer()
  ])
  return [
    { id: 'uxplay', ok: !!ux, detail: ux ?? 'לא נמצא' },
    bonjour,
    gst
  ]
}
