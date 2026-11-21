import type { ReceiverState } from '@shared/types'
import { Icon } from './Icon'

/** Stylised iPhone that reflects the receiver state (rings while waiting, glow while mirroring). */
export function PhoneVisual({ state }: { state: ReceiverState }) {
  return (
    <div className={`phone-stage state-${state}`}>
      <div className="rings" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="phone">
        <div className="island" />
        <div className="screen">
          {state === 'mirroring' ? (
            <div className="screen-live">
              <div className="wallpaper" />
              <div className="app-grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 40}ms` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="screen-idle">
              <Icon name={state === 'error' ? 'alert' : state === 'stopped' ? 'cast' : 'wifi'} size={34} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
