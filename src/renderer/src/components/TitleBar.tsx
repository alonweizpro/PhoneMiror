import type { ReceiverStatus } from '@shared/types'
import { Icon } from './Icon'
import { STATE_LABEL } from '../strings'
import logo from '../assets/logo.png'

export function TitleBar({ status }: { status: ReceiverStatus }) {
  const w = window.mirra.window
  return (
    <header className="titlebar">
      <div className="brand">
        <img className="logo" src={logo} alt="" />
        <span className="brand-name">Mirra</span>
        <span className={`pill pill-${status.state}`}>
          <span className="dot" />
          {STATE_LABEL[status.state]}
          {status.demo && status.state !== 'stopped' ? ' · דמו' : ''}
        </span>
      </div>
      <div className="win-controls">
        <button aria-label="מזער" onClick={w.minimize}>
          <Icon name="minus" size={14} />
        </button>
        <button aria-label="הגדל" onClick={w.toggleMaximize}>
          <Icon name="square" size={12} />
        </button>
        <button aria-label="סגור" className="close" onClick={w.close}>
          <Icon name="x" size={14} />
        </button>
      </div>
    </header>
  )
}
