import { useState } from 'react'
import { adminLogin } from '../../Api'
import PostcardShell from '../Auth/PostcardShell'
import { Field } from '../Auth/Auth'

const isMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function AdminLogin({ notice = '', onAuth, onBack }) {
  const [v, setV] = useState({ email: '', password: '' })
  const [e, setE] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }))

  const submit = async (ev) => {
    ev.preventDefault()
    const err = {}
    if (!isMail(v.email)) err.email = 'Entre une adresse e-mail valide.'
    if (!v.password) err.password = 'Entre ton mot de passe.'
    setE(err)
    setServerErr('')
    if (Object.keys(err).length) return
    setLoading(true)
    try {
      onAuth(await adminLogin(v.email.trim(), v.password))
    } catch (ex) {
      setServerErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PostcardShell
      mode="signup"
      hand="Back to the control room !"
      stamp="🛡️"
      text="Espace réservé à l'équipe de modération de TravelMate."
    >
      <h1 className="tm-title">Espace administrateur</h1>
      <p className="tm-sub">Identifie-toi pour accéder à la modération.</p>

      <form onSubmit={submit} noValidate>
        <Field id="a-email" label="E-mail" type="email" autoComplete="username"
          placeholder="admin@exemple.com" value={v.email} onChange={set('email')} error={e.email} />
        <Field id="a-pass" label="Mot de passe" type="password" autoComplete="current-password"
          value={v.password} onChange={set('password')} error={e.password} />

        {notice && <div className="tm-server-err" role="status">{notice}</div>}
        {serverErr && <div className="tm-server-err" role="alert">{serverErr}</div>}

        <div style={{ marginTop: 18 }}>
          <button className="tm-btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Entrer'}
          </button>
        </div>
      </form>

      <button type="button" className="tm-linkbtn" onClick={onBack}>← Changer de profil</button>
    </PostcardShell>
  )
}