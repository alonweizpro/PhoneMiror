import { useEffect, useState } from 'react'
import type { LogEntry, ReceiverStatus } from '@shared/types'
import { TitleBar } from './components/TitleBar'
import { Sidebar, type View } from './components/Sidebar'
import { HomeView } from './views/HomeView'
import { SettingsView } from './views/SettingsView'
import { LogsView } from './views/LogsView'
import { SetupView } from './views/SetupView'

const api = window.phonemiror

export default function App() {
  const [view, setView] = useState<View>('home')
  const [status, setStatus] = useState<ReceiverStatus | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    api.getStatus().then(setStatus)
    api.getLogs().then(setLogs)
    const offS = api.onStatus(setStatus)
    const offL = api.onLog((l) => setLogs((prev) => [...prev.slice(-999), l]))
    return () => {
      offS()
      offL()
    }
  }, [])

  if (!status) return <div className="app" />

  return (
    <div className="app">
      <TitleBar status={status} />
      <div className="shell">
        <Sidebar view={view} onChange={setView} status={status} />
        <main className="content" key={view}>
          {view === 'home' && <HomeView status={status} onOpenSetup={() => setView('setup')} />}
          {view === 'settings' && <SettingsView running={status.state !== 'stopped' && status.state !== 'error'} />}
          {view === 'logs' && <LogsView logs={logs} onClear={() => setLogs([])} />}
          {view === 'setup' && <SetupView />}
        </main>
      </div>
    </div>
  )
}
