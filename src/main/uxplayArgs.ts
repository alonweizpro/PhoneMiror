import type { Settings } from '../shared/types'

/**
 * Builds the UxPlay command line from the user's settings.
 * Reference: https://github.com/FDH2/UxPlay#usage
 */
export function buildUxPlayArgs(s: Settings): string[] {
  const args: string[] = []

  // -nh: don't append "@hostname" to the name shown on the iPhone
  args.push('-n', s.receiverName.trim() || 'Mirra', '-nh')

  args.push('-s', s.resolution)
  args.push('-fps', String(s.fps))

  if (s.videoSink.trim()) args.push('-vs', s.videoSink.trim())
  if (!s.audio) args.push('-a')
  if (s.fullscreen) args.push('-fs')

  if (s.requirePin) {
    // UxPlay accepts "-pin" (random PIN shown in its console) or "-pin nnnn" (fixed)
    if (/^\d{4}$/.test(s.pin)) args.push('-pin', s.pin)
    else args.push('-pin')
  }

  if (s.debugLog) args.push('-d')

  return args
}
