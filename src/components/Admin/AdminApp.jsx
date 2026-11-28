import { useState } from 'react'
import { LayoutDashboard, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react'
import DashboardPage from './DashboardPage'
import ModerationPage from '../Moderation/ModerationPage'
import './AdminApp.css'

const VIEWS = [
  { key: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
  { key: 'moderation', label: 'Modération', Icon: ShieldAlert },
]

export default function AdminApp({ user, onLogout }) {
  const [view, setView] = useState('dashboard')

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-brand">
          <span className="adm-mark"><ShieldCheck size={18} strokeWidth={2} /></span>
          TravelMate <em>Administration</em>
        </div>

        <nav className="adm-nav">
          {VIEWS.map(({ key, label, Icon }) => (
            <button key={key} type="button" className={view === key ? 'active' : ''} onClick={() => setView(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="adm-right">
          <span className="adm-who">{user.full_name}</span>
          <button type="button" className="adm-logout" onClick={onLogout}>
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </header>

      <main className="adm-main">
        {view === 'dashboard' && <DashboardPage onOpenModeration={() => setView('moderation')} />}
        {view === 'moderation' && <ModerationPage />}
      </main>
    </div>
  )
}