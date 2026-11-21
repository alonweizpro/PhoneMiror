import { useEffect, useState } from 'react'
import type { CheckId, DependencyCheck } from '@shared/types'
import { Icon } from '../components/Icon'
import { LINKS } from '../strings'

const api = window.mirra

const INFO: Record<CheckId, { title: string; why: string; link: string; cta: string }> = {
  uxplay: {
    title: 'UxPlay',
    why: 'מנוע הקוד-הפתוח שמקבל את שידור ה-AirPlay מהאייפון. שים את uxplay.exe בתיקייה resources/bin או הגדר נתיב בהגדרות.',
    link: LINKS.uxplayWindows,
    cta: 'הוראות ל-Windows'
  },
  bonjour: {
    title: 'Apple Bonjour',
    why: 'שירות הגילוי של Apple. בזכותו המחשב מופיע ברשימת "שיקוף מסך" באייפון.',
    link: LINKS.bonjour,
    cta: 'הורד Bonjour'
  },
  gstreamer: {
    title: 'GStreamer',
    why: 'מפענח ומציג את הווידאו. יש להתקין את גרסת MSVC 64-bit בהתקנה מלאה (Complete).',
    link: LINKS.gstreamer,
    cta: 'הורד GStreamer'
  }
}

export function SetupView() {
  const [checks, setChecks] = useState<DependencyCheck[] | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      setChecks(await api.checkDependencies())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void run()
  }, [])

  const allOk = checks?.every((c) => c.ok)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2>בדיקת מערכת</h2>
          <p className="muted">שיקוף אייפון ב-Windows דורש שלושה רכיבים. כך נוודא שהכול מוכן.</p>
        </div>
        <button className="btn btn-ghost sm" onClick={run} disabled={loading}>
          <Icon name="refresh" size={14} className={loading ? 'spin' : ''} /> בדוק שוב
        </button>
      </header>

      {checks && (
        <div className={`summary ${allOk ? 'ok' : 'bad'}`}>
          <Icon name={allOk ? 'check' : 'alert'} />
          {allOk ? 'הכול מוכן! אפשר להפעיל את המקלט.' : 'חסרים רכיבים. התקן אותם ולחץ "בדוק שוב".'}
        </div>
      )}

      <div className="checks">
        {(checks ?? (['uxplay', 'bonjour', 'gstreamer'] as CheckId[]).map((id) => ({ id, ok: false }))).map((c) => {
          const info = INFO[c.id]
          return (
            <div key={c.id} className={`card check ${checks ? (c.ok ? 'ok' : 'bad') : 'loading'}`}>
              <span className="check-icon">
                <Icon name={!checks ? 'refresh' : c.ok ? 'check' : 'x'} size={16} className={!checks ? 'spin' : ''} />
              </span>
              <div className="check-body">
                <div className="check-title">
                  <h3>{info.title}</h3>
                  {checks && c.detail && (
                    <span className="muted small mono" dir="ltr">
                      {c.detail}
                    </span>
                  )}
                </div>
                <p className="muted">{info.why}</p>
              </div>
              {checks && !c.ok && (
                <button className="btn btn-primary sm" onClick={() => api.openExternal(info.link)}>
                  <Icon name="download" size={14} /> {info.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="card tip">
        <Icon name="shield" />
        <p>
          בהפעלה הראשונה Windows עשוי לשאול אם לאפשר ל-UxPlay גישה לרשת. יש לאשר עבור <strong>רשתות פרטיות</strong>, אחרת
          האייפון לא יוכל להתחבר.
        </p>
      </div>
    </div>
  )
}
