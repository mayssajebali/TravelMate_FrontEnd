import { useState } from 'react'
import './Auth.css'
import { login, register } from '../../Api'

const COPY = {
  login: {
    hand: 'Wish you were here !',
    text: 'Partage tes itinéraires, rejoins des groupes et trouve la personne avec qui partir.',
    stamp: '🌴',
  },
  signup: {
    hand: 'Pack your bags !',
    text: 'Dis-nous comment tu voyages, on te présente tes futurs compagnons de route.',
    stamp: '🧳',
  },
}
const TRAVEL_STYLES = ['Rando', 'Plage', 'Culture', 'Road trip', 'Petit budget']
const CONFETTI = ['#FFB9C6', '#FFF1B8', '#C9EEE3', '#DDD3F8', '#FFD3C4', '#CDE5F7']
const isMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/* ---------- petits composants ---------- */

function Field({ id, label, type = 'text', value, onChange, error, ...rest }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <>
      <label className="tm-label" htmlFor={id}>{label}</label>
      <div className="tm-fld">
        <input
          id={id}
          className="tm-input"
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
          {...rest}
        />
        {isPass && (
          <button type="button" className="tm-eye" onClick={() => setShow((s) => !s)}>
            {show ? 'Masquer' : 'Afficher'}
          </button>
        )}
      </div>
      <div className="tm-err" id={`${id}-e`}>{error}</div>
    </>
  )
}

function Stickers() {
  const p = { viewBox: '0 0 100 100', 'aria-hidden': true }
  const s = { stroke: '#3B3A6B', strokeWidth: 3, strokeLinejoin: 'round' }
  return (
    <>
      <svg className="tm-stk s1" {...p}><g {...s}><circle cx="50" cy="50" r="22" fill="#FFF1B8" /><path d="M50 8v14M50 78v14M8 50h14M78 50h14M20 20l10 10M70 70l10 10M80 20L70 30M30 70L20 80" strokeLinecap="round" /></g></svg>
      <svg className="tm-stk s2" {...p}><path d="M8 52l84-34-24 68-22-22-14 16-4-22z" fill="#fff" {...s} /><path d="M46 64l22-34" {...s} strokeLinecap="round" /></svg>
      <svg className="tm-stk s3" {...p}><g {...s}><circle cx="50" cy="50" r="38" fill="#C9EEE3" /><path d="M26 34c10-8 20-2 22 8s-12 10-8 22M62 20c-6 10 8 14 14 20s-2 16-10 18" fill="#FFD3C4" /></g></svg>
      <svg className="tm-stk s4" {...p}><path d="M50 8l11 27 29 3-22 19 7 29-25-15-25 15 7-29L10 38l29-3z" fill="#FFB9C6" {...s} /></svg>
    </>
  )
}

/* ---------- formulaires ---------- */

function LoginForm({ onSuccess, goSignup }) {
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
      const user = await login(v.email, v.password)
      onSuccess({ title: 'Bon retour !', user })
    } catch (ex) {
      setServerErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="tm-title">Re-bonjour, voyageur !</h1>
      <p className="tm-sub">Ton sac est prêt ? Connecte-toi.</p>
      <form onSubmit={submit} noValidate>
        <Field id="l-email" label="E-mail" type="email" autoComplete="email" placeholder="toi@exemple.com" value={v.email} onChange={set('email')} error={e.email} />
        <Field id="l-pass" label="Mot de passe" type="password" autoComplete="current-password" value={v.password} onChange={set('password')} error={e.password} />
        <div className="tm-row">
          <label className="tm-chk"><input type="checkbox" /> Rester connecté</label>
          <a href="#">Mot de passe oublié ?</a>
        </div>
        {serverErr && <div className="tm-server-err" role="alert">{serverErr}</div>}
        <button className="tm-btn" type="submit" disabled={loading}>{loading ? 'Décollage…' : 'Décollage !'}</button>
      </form>
      <div className="tm-or">ou embarque avec</div>
      <div className="tm-soc"><button type="button">Google</button><button type="button">Apple</button></div>
      <p className="tm-alt">Nouveau ici ? <a href="#" onClick={(ev) => { ev.preventDefault(); goSignup() }}>Crée ton compte</a></p>
    </>
  )
}

function SignupForm({ onSuccess, goLogin }) {
  const [v, setV] = useState({ first: '', user: '', email: '', password: '', cgu: false, styles: [] })
  const [e, setE] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }))
  const toggleStyle = (s) =>
    setV((o) => ({ ...o, styles: o.styles.includes(s) ? o.styles.filter((x) => x !== s) : [...o.styles, s] }))

  const submit = async (ev) => {
    ev.preventDefault()
    const err = {}
    if (!v.first.trim()) err.first = 'Indique ton prénom.'
    if (!/^@?\w{3,20}$/.test(v.user.trim())) err.user = '3 à 20 caractères, sans espace.'
    if (!isMail(v.email)) err.email = 'Entre une adresse e-mail valide.'
    if (v.password.length < 8) err.password = '8 caractères minimum.'
    if (!v.cgu) err.cgu = 'Accepte les conditions pour continuer.'
    setE(err)
    setServerErr('')
    if (Object.keys(err).length) return
    setLoading(true)
    try {
      // Le modèle Django n'a pour l'instant que email / full_name / password
      const user = await register({ email: v.email, full_name: v.first.trim(), password: v.password })
      onSuccess({ title: `Bienvenue, ${v.first.trim()} !`, user })
    } catch (ex) {
      setServerErr(ex.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="tm-title">Prépare ton sac !</h1>
      <p className="tm-sub">Ton profil en 1 minute chrono.</p>
      <form onSubmit={submit} noValidate>
        <div className="tm-two">
          <div><Field id="s-first" label="Prénom" autoComplete="given-name" value={v.first} onChange={set('first')} error={e.first} /></div>
          <div><Field id="s-user" label="Pseudo" autoComplete="username" placeholder="@globetrotter" value={v.user} onChange={set('user')} error={e.user} /></div>
        </div>
        <Field id="s-email" label="E-mail" type="email" autoComplete="email" placeholder="toi@exemple.com" value={v.email} onChange={set('email')} error={e.email} />
        <Field id="s-pass" label="Mot de passe" type="password" autoComplete="new-password" placeholder="8 caractères minimum" value={v.password} onChange={set('password')} error={e.password} />
        <span className="tm-label" style={{ display: 'block' }}>Ton style de voyage</span>
        <div className="tm-chips">
          {TRAVEL_STYLES.map((s) => (
            <label className="tm-chip" key={s}>
              <input type="checkbox" checked={v.styles.includes(s)} onChange={() => toggleStyle(s)} />
              <span>{s}</span>
            </label>
          ))}
        </div>
        <label className="tm-chk" style={{ margin: '16px 0 4px' }}>
          <input type="checkbox" checked={v.cgu} onChange={(ev) => set('cgu')(ev.target.checked)} /> J'accepte les conditions d'utilisation
        </label>
        <div className="tm-err">{e.cgu}</div>
        {serverErr && <div className="tm-server-err" role="alert">{serverErr}</div>}
        <button className="tm-btn" type="submit" disabled={loading}>{loading ? 'Création…' : "C'est parti !"}</button>
      </form>
      <p className="tm-alt">Déjà un compte ? <a href="#" onClick={(ev) => { ev.preventDefault(); goLogin() }}>Connecte-toi</a></p>
    </>
  )
}

/* ---------- page principale ---------- */

export default function Auth({ onAuth, notice }) {
  const [mode, setMode] = useState('login')
  const [done, setDone] = useState(null)
  const [confetti, setConfetti] = useState([])
  const c = COPY[mode]

  const success = (result) => {
    setDone(result)
    setConfetti(Array.from({ length: 40 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 0.6, color: CONFETTI[i % 6], round: i % 3 === 0,
    })))
    setTimeout(() => setConfetti([]), 3400)
  }
  const switchTo = (m) => { setDone(null); setMode(m) }

  return (
    <div className="tm-scene" data-mode={mode}>
      <div className="tm-blob b1" /><div className="tm-blob b2" /><div className="tm-blob b3" />
      <Stickers />

      <main className="tm-card">
        <div className="tm-inner">
          <section className="tm-msg">
            <p className="tm-logo">travel<span>Mate</span></p>
            <div className="tm-stamp" aria-hidden="true">{c.stamp}</div>
            <div className="tm-postmark" aria-hidden="true">TRAVELMATE<br />★ AIR MAIL ★<br />2026</div>
            <div className="tm-hand">{c.hand}</div>
            <p className="tm-text">{c.text}</p>
            <div className="tm-lines" aria-hidden="true"><i /><i /><i /></div>
          </section>

          {/* key => relance l'animation de retournement à chaque changement */}
          <section className="tm-form tm-flip" key={done ? 'ok' : mode}>
            {done ? (
              <div className="tm-ok" role="status">
                <div className="tm-big">{done.title}</div>
                <p className="tm-sub">Ton compte est prêt, direction le feed.</p>
                <button className="tm-btn" type="button" onClick={() => onAuth?.(done.user)}>Découvrir le feed</button>
              </div>
            ) : (
              <>
                {notice && <div className="tm-server-err" role="status">{notice}</div>}
                <div className="tm-tabs" role="tablist">
                  <button className="tm-tab" role="tab" aria-selected={mode === 'login'} onClick={() => switchTo('login')}>Se connecter</button>
                  <button className="tm-tab" role="tab" aria-selected={mode === 'signup'} onClick={() => switchTo('signup')}>Créer un compte</button>
                </div>
                {mode === 'login'
                  ? <LoginForm onSuccess={success} goSignup={() => switchTo('signup')} />
                  : <SignupForm onSuccess={success} goLogin={() => switchTo('login')} />}
              </>
            )}
          </section>
        </div>
      </main>

      {confetti.map((p) => (
        <i key={p.id} className="tm-conf" style={{ left: `${p.left}vw`, background: p.color, animationDelay: `${p.delay}s`, borderRadius: p.round ? '50%' : '3px' }} />
      ))}
    </div>
  )
}