import type { ReceiverStatus } from '@shared/types'
import { Icon, type IconName } from './Icon'

export type View = 'home' | 'settings' | 'logs' | 'setup'

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: 'home', label: 'ראשי', icon: 'home' },
  { id: 'settings', label: 'הגדרות', icon: 'settings' },
  { id: 'setup', label: 'בדיקת מערכת', icon: 'shield' },
  { id: 'logs', label: 'יומן', icon: 'terminal' }
]

export function Sidebar({
  view,
  onChange,
  status
}: {
  view: View
  onChange: (v: View) => void
  status: ReceiverStatus
}) {
  return (
    <aside className="sidebar">
      <div className="section-label">מכשיר</div>
      <div className="platforms">
        <button className="platform active">
          <Icon name="phone" />
          <span>iPhone</span>
        </button>
        <button className="platform" disabled title="תמיכה באנדרואיד תגיע בגרסה הבאה">
          <Icon name="android" />
          <span>Android</span>
          <span className="soon">בקרוב</span>
        </button>
      </div>

      <div className="section-label">ניווט</div>
      <nav>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${view === n.id ? 'active' : ''}`}
            onClick={() => onChange(n.id)}
          >
            <Icon name={n.icon} />
            <span>{n.label}</span>
            {n.id === 'logs' && status.state === 'error' && <span className="badge-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span>גרסה 0.1.0</span>
        <span className="muted">AirPlay · UxPlay</span>
      </div>
    </aside>
  )
}
