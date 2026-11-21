/**
 * Turns UxPlay's console output into app events.
 *
 * UxPlay does not have a machine-readable API, so we read its log lines.
 * The patterns are deliberately tolerant (case-insensitive, loose spacing)
 * because wording changes slightly between UxPlay versions. If a new UxPlay
 * release changes a message, this is the only file that needs updating, and
 * tests/uxplayParser.test.ts shows the expected lines.
 */

export type UxPlayEvent =
  | { type: 'ready' }
  | { type: 'connected'; name?: string; model?: string }
  | { type: 'mirroring' }
  | { type: 'openConnections'; count: number }
  | { type: 'disconnected' }
  | { type: 'pin'; pin: string }
  | { type: 'error'; message: string; friendly?: FriendlyError }

export type FriendlyError = 'bonjour' | 'gstreamer' | 'port'

const RE = {
  ready: /initialized server socket|uxplay .*is now running|waiting for client/i,
  // e.g.  connection request from Alon's iPhone (iPhone15,2) with deviceID = 11:22:...
  request: /connection request from\s+"?(.+?)"?\s*\(([^)]*)\)/i,
  accepted: /accepted ipv[46] client/i,
  clientName: /client (?:name|device name)\s*[:=]\s*"?([^"]+?)"?\s*$/i,
  mirroring: /begin streaming to gstreamer video pipeline|raop_rtp_mirror.*(?:started|starting)|mirror(?:ing)? (?:session )?started/i,
  openConnections: /open connections:\s*(\d+)/i,
  disconnected: /connection closed|client disconnected|teardown|stopped mirror|raop_rtp_mirror.*stopped/i,
  pin: /pin\s*(?:=|is|:)\s*"?(\d{4})"?/i,
  bonjour: /dns-?sd|dnsservice|bonjour|mdns/i,
  gstreamer: /gstreamer|no element|gst_/i,
  port: /address already in use|bind\(\) failed|could not bind/i,
  error: /\b(error|failed|fatal|cannot|could not|unable)\b/i
}

export function parseUxPlayLine(raw: string): UxPlayEvent[] {
  const line = raw.trim()
  if (!line) return []
  const events: UxPlayEvent[] = []

  let m: RegExpMatchArray | null

  if (RE.ready.test(line)) events.push({ type: 'ready' })

  if ((m = line.match(RE.request))) {
    events.push({ type: 'connected', name: m[1].trim(), model: m[2].trim() || undefined })
  } else if (RE.accepted.test(line)) {
    events.push({ type: 'connected' })
  } else if ((m = line.match(RE.clientName))) {
    events.push({ type: 'connected', name: m[1].trim() })
  }

  if (RE.mirroring.test(line)) events.push({ type: 'mirroring' })

  if ((m = line.match(RE.openConnections))) {
    const count = Number(m[1])
    events.push({ type: 'openConnections', count })
    if (count === 0) events.push({ type: 'disconnected' })
  } else if (RE.disconnected.test(line)) {
    events.push({ type: 'disconnected' })
  }

  if (/pin/i.test(line) && (m = line.match(RE.pin))) events.push({ type: 'pin', pin: m[1] })

  if (RE.error.test(line) && !RE.request.test(line)) {
    let friendly: FriendlyError | undefined
    if (RE.bonjour.test(line)) friendly = 'bonjour'
    else if (RE.port.test(line)) friendly = 'port'
    else if (RE.gstreamer.test(line)) friendly = 'gstreamer'
    events.push({ type: 'error', message: line, friendly })
  }

  return events
}

/** Human-readable (Hebrew) explanation for errors the user can fix. */
export const FRIENDLY_ERRORS: Record<FriendlyError, string> = {
  bonjour:
    'שירות Bonjour של Apple לא פועל. בלעדיו האייפון לא יכול למצוא את המחשב. התקן את Bonjour והפעל מחדש.',
  gstreamer: 'GStreamer חסר או לא מותקן במלואו. התקן את GStreamer (MSVC 64-bit, התקנה מלאה).',
  port: 'פורט הרשת תפוס. ייתכן ש-UxPlay או תוכנת AirPlay אחרת כבר רצה ברקע.'
}
