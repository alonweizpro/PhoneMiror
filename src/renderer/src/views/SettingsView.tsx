import { useEffect, useState, type ReactNode } from 'react'
import type { Resolution, Settings } from '@shared/types'
import { Icon } from '../components/Icon'

const api = window.phonemiror

export function SettingsView({ running }: { running: boolean }) {
  const [s, setS] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then(setS)
  }, [])

  if (!s) return null

  const update = async (patch: Partial<Settings>) => {
    setS({ ...s, ...patch })
    await api.saveSettings(patch)
    setSaved(true)
    setTimeout(() => setSaved(false), 1400)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h2>הגדרות</h2>
          <p className="muted">השינויים נשמרים אוטומטית{running ? ' ויחולו בהפעלה הבאה של המקלט' : ''}.</p>
        </div>
        <span className={`saved ${saved ? 'show' : ''}`}>
          <Icon name="check" size={14} /> נשמר
        </span>
      </header>

      <div className="card group">
        <h3 className="group-title">כללי</h3>
        <Row label="שם המקלט" hint='השם שיופיע באייפון ברשימת "שיקוף מסך"'>
          <input
            className="input"
            value={s.receiverName}
            maxLength={40}
            onChange={(e) => setS({ ...s, receiverName: e.target.value })}
            onBlur={(e) => update({ receiverName: e.target.value.trim() || 'PhoneMiror' })}
          />
        </Row>
        <Row label="מסך מלא" hint="פתח את חלון השיקוף במסך מלא">
          <Toggle on={s.fullscreen} onChange={(v) => update({ fullscreen: v })} />
        </Row>
        <Row label="העבר שמע" hint="השמע מהאייפון יתנגן ברמקולים של המחשב">
          <Toggle on={s.audio} onChange={(v) => update({ audio: v })} />
        </Row>
      </div>

      <div className="card group">
        <h3 className="group-title">איכות תמונה</h3>
        <Row label="רזולוציה מקסימלית">
          <Segmented
            value={s.resolution}
            options={[
              ['1280x720', '720p'],
              ['1920x1080', '1080p'],
              ['2560x1440', '1440p']
            ]}
            onChange={(v) => update({ resolution: v as Resolution })}
          />
        </Row>
        <Row label="קצב פריימים">
          <Segmented
            value={String(s.fps)}
            options={[
              ['30', '30 FPS'],
              ['60', '60 FPS']
            ]}
            onChange={(v) => update({ fps: Number(v) as 30 | 60 })}
          />
        </Row>
      </div>

      <div className="card group">
        <h3 className="group-title">
          <Icon name="lock" size={15} /> אבטחה
        </h3>
        <Row label="דרוש קוד PIN" hint="מונע מאנשים אחרים ברשת להתחבר למחשב שלך">
          <Toggle on={s.requirePin} onChange={(v) => update({ requirePin: v })} />
        </Row>
        {s.requirePin && (
          <Row label="קוד קבוע" hint="4 ספרות. השאר ריק לקוד אקראי בכל חיבור">
            <input
              className="input mono short"
              inputMode="numeric"
              placeholder="••••"
              value={s.pin}
              maxLength={4}
              onChange={(e) => setS({ ...s, pin: e.target.value.replace(/\D/g, '') })}
              onBlur={(e) => update({ pin: e.target.value })}
            />
          </Row>
        )}
      </div>

      <div className="card group">
        <h3 className="group-title">מתקדם</h3>
        <Row label="נתיב ל-uxplay.exe" hint="השאר ריק לחיפוש אוטומטי">
          <input
            className="input mono"
            dir="ltr"
            placeholder="C:\\Tools\\uxplay\\uxplay.exe"
            value={s.uxplayPath}
            onChange={(e) => setS({ ...s, uxplayPath: e.target.value })}
            onBlur={(e) => update({ uxplayPath: e.target.value.trim() })}
          />
        </Row>
        <Row label="Video sink" hint="d3d11videosink מומלץ ב-Windows">
          <input
            className="input mono"
            dir="ltr"
            value={s.videoSink}
            onChange={(e) => setS({ ...s, videoSink: e.target.value })}
            onBlur={(e) => update({ videoSink: e.target.value.trim() })}
          />
        </Row>
        <Row label="יומן מפורט" hint="מוסיף פרטי דיבאג ליומן">
          <Toggle on={s.debugLog} onChange={(v) => update({ debugLog: v })} />
        </Row>
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="row">
      <div className="row-text">
        <span>{label}</span>
        {hint && <span className="muted small">{hint}</span>}
      </div>
      <div className="row-control">{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  )
}

function Segmented({
  value,
  options,
  onChange
}: {
  value: string
  options: [string, string][]
  onChange: (v: string) => void
}) {
  return (
    <div className="segmented">
      {options.map(([v, label]) => (
        <button key={v} className={v === value ? 'active' : ''} onClick={() => onChange(v)}>
          <bdi>{label}</bdi>
        </button>
      ))}
    </div>
  )
}
