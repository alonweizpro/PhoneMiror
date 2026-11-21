import type { ReceiverState } from '@shared/types'

export const STATE_LABEL: Record<ReceiverState, string> = {
  stopped: 'כבוי',
  starting: 'מתחיל…',
  waiting: 'ממתין לחיבור',
  connected: 'מחובר',
  mirroring: 'משקף',
  error: 'שגיאה'
}

export const LINKS = {
  uxplay: 'https://github.com/FDH2/UxPlay/releases',
  uxplayWindows: 'https://github.com/FDH2/UxPlay#building-uxplay-on-microsoft-windows-using-msys2-with-the-mingw-64-compiler',
  bonjour: 'https://support.apple.com/kb/DL999',
  gstreamer: 'https://gstreamer.freedesktop.org/download/#windows'
}
