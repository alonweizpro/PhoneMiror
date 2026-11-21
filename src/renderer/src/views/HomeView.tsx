import { useEffect, useState } from 'react'
import type { ReceiverStatus, Settings } from '@shared/types'
import { Icon, type IconName } from '../components/Icon'
import { PhoneVisual } from '../components/PhoneVisual'

const api = window.mirra

const HEADLINE: Record<ReceiverStatus['state'], { title: string; sub: string }> = {
  stopped: { title: 'שקף את האייפון שלך למחשב', sub: 'הפעל את המקלט, והמחשב יופיע ברשימת "שיקוף מסך" באייפון.' },
  starting: { title: 'מפעיל את המקלט…', sub: 'רק שנייה, מכינים את המחשב לקבלת חיבור AirPlay.' },
  waiting: { title: 'ממתין לאייפון', sub: 'פתח את מרכז הבקרה באייפון, הקש על "שיקוף מסך" ובחר את המחשב.' },
  connected: { title: 'האייפון מחובר', sub: 'החיבור אושר. השיקוף יתחיל בעוד רגע.' },
  mirroring: { title: 'המסך משוקף', sub: 'מסך האייפון מוצג בחלון השיקוף. לסיום, עצור את המקלט או נתק מהאייפון.' },
  error: { title: 'משהו השתבש', sub: 'אפשר לבדוק מה חסר בבדיקת המערכת, או לנסות שוב.' }
}

function useElapsed(since?: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!since) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [since])
  if (!since) return '00:00'
  const s = Math.max(0, Math.floor((now - since) / 1000))
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  const hh = Math.floor(s / 3600)
  return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
}

export function HomeView({ status, onOpenSetup }: { status: ReceiverStatus; onOpenSetup: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [busy, setBusy] = useState(false)
  const elapsed = useElapsed(status.since)
  const running = status.state !== 'stopped' && status.state !== 'error'
  const h = HEADLINE[status.state]

  useEffect(() => {
    api.getSettings().then(setSettings)
  }, [])

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="home">
      <section className="hero card">
        <PhoneVisual state={status.state} />

        <div className="hero-body">
          <span className="eyebrow">
            <Icon name="sparkles" size={14} /> AirPlay Screen Mirroring
          </span>
          <h1>{h.title}</h1>
          <p className="lead">{h.sub}</p>

          {status.state === 'error' && status.error && (
            <div className="alert">
              <Icon name="alert" />
              <div>
                <strong>שגיאה</strong>
                <p>{status.error}</p>
                <button className="link" onClick={onOpenSetup}>
                  פתח בדיקת מערכת ←
                </button>
              </div>
            </div>
          )}

          <div className="actions">
            {running ? (
              <button className="btn btn-danger" disabled={busy} onClick={() => act(api.stop)}>
                <Icon name="stop" size={16} /> עצור מקלט
              </button>
            ) : (
              <>
                <button className="btn btn-primary" disabled={busy} onClick={() => act(() => api.start())}>
                  <Icon name="play" size={16} /> הפעל מקלט
                </button>
                <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => api.start({ demo: true }))}>
                  מצב דמו
                </button>
              </>
            )}
          </div>

          <div className="receiver-chip">
            <Icon name="cast" size={15} />
            <span className="muted">שם במכשיר:</span>
            <strong>{status.receiverName || settings?.receiverName}</strong>
          </div>
        </div>
      </section>

      {(status.state === 'connected' || status.state === 'mirroring') && status.device ? (
        <section className="card session">
          <div className="session-device">
            <span className="device-icon">
              <Icon name="phone" size={22} />
            </span>
            <div>
              <div className="device-name">{status.device.name}</div>
              <div className="muted small">{status.device.model ?? 'iPhone'}</div>
            </div>
          </div>
          <div className="stats">
            <Stat icon="clock" label="משך" value={elapsed} mono />
            <Stat icon="square" label="רזולוציה" value={settings?.resolution ?? '—'} mono />
            <Stat icon="sparkles" label="קצב" value={settings ? `${settings.fps} FPS` : '—'} mono />
            <Stat icon="wifi" label="שמע" value={settings?.audio ? 'פעיל' : 'כבוי'} />
          </div>
        </section>
      ) : (
        <section className="steps">
          {(
            [
            { icon: 'wifi', title: 'אותה רשת', text: 'ודא שהאייפון והמחשב מחוברים לאותה רשת Wi‑Fi.' },
            { icon: 'phone', title: 'מרכז הבקרה', text: 'החלק מטה מהפינה הימנית העליונה של האייפון.' },
            { icon: 'cast', title: 'שיקוף מסך', text: 'הקש על "שיקוף מסך" ובחר את שם המחשב מהרשימה.' }
            ] as { icon: IconName; title: string; text: string }[]
          ).map((s, i) => (
            <div className="card step" key={s.title}>
              <span className="step-num">{i + 1}</span>
              <Icon name={s.icon} size={20} />
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function Stat({ icon, label, value, mono }: { icon: IconName; label: string; value: string; mono?: boolean }) {
  return (
    <div className="stat">
      <span className="muted small">
        <Icon name={icon} size={13} /> {label}
      </span>
      <bdi className={mono ? 'mono' : ''}>{value}</bdi>
    </div>
  )
}
