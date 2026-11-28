import { useState } from 'react'
import { Plane, ShieldCheck } from 'lucide-react'
import Auth from './Auth'
import AdminLogin from '../Admin/AdminLogin'
import PostcardShell from './PostcardShell'

export default function AccessGate({ notice = '', onAuth }) {
  const [mode, setMode] = useState(null) // null | 'traveler' | 'admin'

  if (mode === 'traveler') {
    return (
      <>
        <Auth notice={notice} onAuth={onAuth} />
        <button type="button" className="ag-float-back" onClick={() => setMode(null)}>
          ← Changer de profil
        </button>
      </>
    )
  }

  if (mode === 'admin') {
    return <AdminLogin notice={notice} onAuth={onAuth} onBack={() => setMode(null)} />
  }

  return (
    <PostcardShell hand="Welcome aboard !" stamp="✈️"
      text="Choisis ton profil pour entrer dans TravelMate.">
      <h2 className="tm-title">Bienvenue !</h2>
      <p className="tm-sub">Qui se connecte aujourd'hui ?</p>

      {notice && <div className="tm-server-err" role="alert">{notice}</div>}

      <button type="button" className="tm-choice tm-choice--rose" onClick={() => setMode('traveler')}>
        <span className="tm-choice-icon"><Plane size={26} strokeWidth={2} /></span>
        <span className="tm-choice-body">
          <b>Voyageur</b>
          <small>Voyageurs et prestataires (guides, chauffeurs)</small>
        </span>
      </button>

      <button type="button" className="tm-choice tm-choice--mint" onClick={() => setMode('admin')}>
        <span className="tm-choice-icon"><ShieldCheck size={26} strokeWidth={2} /></span>
        <span className="tm-choice-body">
          <b>Administrateur</b>
          <small>Modération et gestion de la plateforme</small>
        </span>
      </button>
    </PostcardShell>
  )
}