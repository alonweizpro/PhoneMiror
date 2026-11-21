import { useEffect, useRef } from 'react'
import type { LogEntry } from '@shared/types'
import { Icon } from '../components/Icon'

export function LogsView({ logs, onClear }: { logs: LogEntry[]; onClear: () => void }) {
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [logs.length])

  const copy = () => {
    const text = logs.map((l) => `[${new Date(l.ts).toLocaleTimeString()}] ${l.text}`).join('\n')
    void navigator.clipboard.writeText(text)
  }

  return (
    <div className="page page-fill">
      <header className="page-head">
        <div>
          <h2>יומן</h2>
          <p className="muted">הפלט של מנוע ה-AirPlay. שימושי לאבחון בעיות חיבור.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost sm" onClick={copy} disabled={!logs.length}>
            <Icon name="copy" size={14} /> העתק
          </button>
          <button className="btn btn-ghost sm" onClick={onClear} disabled={!logs.length}>
            נקה
          </button>
        </div>
      </header>

      <div className="terminal" dir="ltr">
        {logs.length === 0 ? (
          <div className="terminal-empty">אין עדיין הודעות. הפעל את המקלט כדי לראות פלט.</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={`log log-${l.level}`}>
              <span className="log-ts">{new Date(l.ts).toLocaleTimeString('en-GB')}</span>
              <span className="log-text">{l.text}</span>
            </div>
          ))
        )}
        <div ref={end} />
      </div>
    </div>
  )
}
