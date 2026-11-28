import { useCallback, useEffect, useState } from 'react'
import {
  getModerationStats, getReports, resolveReport, getModUsers, setUserStatus, getModLog,
} from '../../Api'
import './Moderation.css'

const TABS = [
  { key: 'reports', label: 'Signalements' },
  { key: 'users', label: 'Utilisateurs' },
  { key: 'log', label: 'Journal' },
]
const TYPE_LABEL = { post: 'Publication', comment: 'Commentaire', review: 'Avis', user: 'Profil' }
const REASON_LABEL = {
  spam: 'Spam', harassment: 'Harcèlement', hate: 'Propos haineux',
  inappropriate: 'Contenu inapproprié', scam: 'Arnaque', other: 'Autre',
}
const STATUS_LABEL = { active: 'Actif', suspended: 'Suspendu', banned: 'Banni' }
const LOG_LABEL = {
  report_resolved: 'Signalement traité', report_dismissed: 'Signalement ignoré',
  user_suspended: 'Compte suspendu', user_banned: 'Compte banni', user_active: 'Compte réactivé',
}
const fmt = (iso) =>
  iso
    ? new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z')
        .toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

function Avatar({ u }) {
  return u?.avatar_url
    ? <img className="md-ava" src={u.avatar_url} alt="" />
    : <span className="md-ava md-ava--initial">{(u?.full_name || '?').charAt(0).toUpperCase()}</span>
}

function Stats({ stats }) {
  if (!stats) return null
  const items = [
    ['À traiter', stats.pending_reports, stats.pending_reports > 0 ? 'warn' : ''],
    ['Traités', stats.handled_reports, ''],
    ['Suspendus', stats.suspended_users, ''],
    ['Bannis', stats.banned_users, ''],
    ['Utilisateurs', stats.total_users, ''],
  ]
  return (
    <div className="md-stats">
      {items.map(([label, n, tone]) => (
        <div key={label} className={`md-stat ${tone}`}><b>{n}</b><span>{label}</span></div>
      ))}
    </div>
  )
}

/* ---------- Signalements ---------- */

function ReportCard({ r, onDone }) {
  const [del, setDel] = useState(false)
  const [sanction, setSanction] = useState('none')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = r.status === 'pending'
  const canSanction = r.owner && r.owner.role !== 'admin'

  const send = async (body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      await resolveReport(r.id, body)
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const apply = () => {
    const [kind, days] = sanction.split(':')
    send(
      { action: 'apply', delete_content: del, sanction: kind, days: Number(days) || 7, note: note.trim() },
      kind === 'ban' ? `Bannir définitivement ${r.owner?.full_name} ?` : null,
    )
  }

  return (
    <article className="md-card">
      <div className="md-head">
        <span className="md-type">{TYPE_LABEL[r.target_type]}</span>
        <span className="md-reason">{REASON_LABEL[r.reason]}</span>
        {pending && r.pending_on_target > 1 && <span className="md-count">{r.pending_on_target} signalements</span>}
        <span className={`md-badge md-badge--${r.status}`}>
          {r.status === 'pending' ? 'À traiter' : r.status === 'resolved' ? 'Traité' : 'Ignoré'}
        </span>
      </div>

      <blockquote className="md-quote">{r.snapshot || '—'}</blockquote>
      {!r.content_exists && r.target_type !== 'user' && <p className="md-muted">Ce contenu n'existe plus.</p>}
      {r.details && <p className="md-text"><b>Précisions :</b> {r.details}</p>}

      <div className="md-people">
        <div><small>Signalé par</small><span>{r.reporter?.full_name || 'Compte supprimé'}</span></div>
        <div>
          <small>Auteur</small>
          <span>
            {r.owner?.full_name || 'Compte supprimé'}
            {r.owner && <em className={`md-status md-status--${r.owner.status}`}>{STATUS_LABEL[r.owner.status]}</em>}
          </span>
        </div>
        <div><small>Date</small><span>{fmt(r.created_at)}</span></div>
      </div>

      {pending ? (
        <div className="md-form">
          {r.target_type !== 'user' && r.content_exists && (
            <label className="md-check">
              <input type="checkbox" checked={del} onChange={(e) => setDel(e.target.checked)} />
              Supprimer le contenu
            </label>
          )}
          {canSanction && (
            <label className="md-field">Sanction contre l'auteur
              <select value={sanction} onChange={(e) => setSanction(e.target.value)}>
                <option value="none">Aucune</option>
                <option value="suspend:3">Suspendre 3 jours</option>
                <option value="suspend:7">Suspendre 7 jours</option>
                <option value="suspend:30">Suspendre 30 jours</option>
                <option value="ban">Bannir</option>
              </select>
            </label>
          )}
          <input className="md-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)}
            placeholder="Note interne ou motif (facultatif)" />
          {error && <p className="md-error">{error}</p>}
          <div className="md-actions">
            <button type="button" className="md-ghost" disabled={busy} onClick={() => send({ action: 'dismiss', note: note.trim() })}>
              Ignorer (non fondé)
            </button>
            <button type="button" className="md-primary" disabled={busy} onClick={apply}>Appliquer</button>
          </div>
        </div>
      ) : (
        <p className="md-text"><b>Décision :</b> {r.resolution} {r.handled_by && <>· par {r.handled_by}</>} · {fmt(r.handled_at)}</p>
      )}
    </article>
  )
}

function ReportsTab({ onChanged }) {
  const [status, setStatus] = useState('pending')
  const [type, setType] = useState('')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getReports({ status, target_type: type })
      .then(setItems)
      .catch((e) => setError(e.message))
  }, [status, type])

  useEffect(() => { setItems(null); load() }, [load])

  const done = () => { load(); onChanged() }

  return (
    <>
      <div className="md-chips">
        {[['pending', 'À traiter'], ['resolved', 'Traités'], ['dismissed', 'Ignorés'], ['all', 'Tous']].map(([v, l]) => (
          <button key={v} className={`md-chip ${status === v ? 'active' : ''}`} onClick={() => setStatus(v)}>{l}</button>
        ))}
        <select className="md-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error && <p className="md-error">{error}</p>}
      {!items && !error && <p className="md-state">Chargement…</p>}
      {items && items.length === 0 && <p className="md-state">Aucun signalement dans cette catégorie.</p>}
      <div className="md-list">{items?.map((r) => <ReportCard key={r.id} r={r} onDone={done} />)}</div>
    </>
  )
}

/* ---------- Utilisateurs ---------- */

function UserRow({ u, onDone }) {
  const [action, setAction] = useState('suspended:7')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isAdmin = u.role === 'admin'

  const run = async (status, days = 7) => {
    const reason = status === 'active' ? '' : window.prompt('Motif (facultatif) :')
    if (reason === null) return
    setBusy(true)
    setError('')
    try {
      await setUserStatus(u.id, { status, days, reason: reason || '' })
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const apply = () => {
    const [status, days] = action.split(':')
    if (status === 'banned' && !window.confirm(`Bannir définitivement ${u.full_name} ?`)) return
    run(status, Number(days) || 7)
  }

  return (
    <article className="md-card md-user">
      <div className="md-head">
        <Avatar u={u} />
        <div className="md-user-info">
          <b>{u.full_name}</b>
          <small>{u.email} · {u.role}</small>
        </div>
        <span className={`md-status md-status--${u.status}`}>{STATUS_LABEL[u.status]}</span>
      </div>
      {u.status === 'suspended' && u.suspended_until && <p className="md-muted">Jusqu'au {fmt(u.suspended_until)}</p>}
      {u.status !== 'active' && u.status_reason && <p className="md-muted">Motif : {u.status_reason}</p>}
      {u.pending_reports > 0 && <p className="md-muted">{u.pending_reports} signalement(s) en attente sur ses contenus</p>}
      {error && <p className="md-error">{error}</p>}
      {!isAdmin && (
        <div className="md-actions md-actions--row">
          <select className="md-select" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="suspended:3">Suspendre 3 jours</option>
            <option value="suspended:7">Suspendre 7 jours</option>
            <option value="suspended:30">Suspendre 30 jours</option>
            <option value="banned:1">Bannir</option>
          </select>
          <button type="button" className="md-primary" disabled={busy} onClick={apply}>Appliquer</button>
          {u.status !== 'active' && (
            <button type="button" className="md-ghost" disabled={busy} onClick={() => run('active')}>Réactiver</button>
          )}
        </div>
      )}
    </article>
  )
}

function UsersTab({ onChanged }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setError('')
    return getModUsers({ q: q.trim(), status }).then(setItems).catch((e) => setError(e.message))
  }, [q, status])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const done = () => { load(); onChanged() }

  return (
    <>
      <input className="md-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom ou un e-mail…" />
      <div className="md-chips">
        {[['', 'Tous'], ['active', 'Actifs'], ['suspended', 'Suspendus'], ['banned', 'Bannis']].map(([v, l]) => (
          <button key={v} className={`md-chip ${status === v ? 'active' : ''}`} onClick={() => setStatus(v)}>{l}</button>
        ))}
      </div>
      {error && <p className="md-error">{error}</p>}
      {!items && !error && <p className="md-state">Chargement…</p>}
      {items && items.length === 0 && <p className="md-state">Aucun utilisateur.</p>}
      <div className="md-list">{items?.map((u) => <UserRow key={u.id} u={u} onDone={done} />)}</div>
    </>
  )
}

/* ---------- Journal ---------- */

function LogTab() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getModLog().then(setItems).catch((e) => setError(e.message)) }, [])
  return (
    <>
      {error && <p className="md-error">{error}</p>}
      {!items && !error && <p className="md-state">Chargement…</p>}
      {items && items.length === 0 && <p className="md-state">Aucune action pour l'instant.</p>}
      <ul className="md-log">
        {items?.map((i) => (
          <li key={i.id}>
            <b>{LOG_LABEL[i.action] || i.action}</b>
            <span>{i.target_user || i.target_label}{i.target_user && i.target_label ? ` — ${i.target_label}` : ''}</span>
            {i.note && <em>{i.note}</em>}
            <small>par {i.admin || '—'} · {fmt(i.created_at)}</small>
          </li>
        ))}
      </ul>
    </>
  )
}

/* ---------- Page ---------- */

export default function ModerationPage() {
  const [tab, setTab] = useState('reports')
  const [stats, setStats] = useState(null)

  const loadStats = useCallback(() => {
    getModerationStats().then(setStats).catch(() => {})
  }, [])
  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div className="md-page">
      <div className="md-header">
        <h2>Modération</h2>
        <p>Traite les contenus signalés et gère les comptes des utilisateurs.</p>
      </div>

      <Stats stats={stats} />

      <div className="md-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`md-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}{t.key === 'reports' && stats?.pending_reports > 0 ? ` (${stats.pending_reports})` : ''}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsTab onChanged={loadStats} />}
      {tab === 'users' && <UsersTab onChanged={loadStats} />}
      {tab === 'log' && <LogTab />}
    </div>
  )
}