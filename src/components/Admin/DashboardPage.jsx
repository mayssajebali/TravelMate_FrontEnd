import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../../Api'
import './Dashboard.css'

const RANGES = [7, 30, 90]
const METRICS = [
  { key: 'users', label: 'Inscriptions' },
  { key: 'posts', label: 'Publications' },
  { key: 'bookings', label: 'Réservations' },
]
const ROLE = { traveler: 'Voyageurs', provider: 'Prestataires', admin: 'Administrateurs' }
const BOOKING = { pending: 'En attente', accepted: 'Acceptées', refused: 'Refusées', cancelled: 'Annulées' }
const REASON = {
  spam: 'Spam', harassment: 'Harcèlement', hate: 'Propos haineux',
  inappropriate: 'Contenu inapproprié', scam: 'Arnaque', other: 'Autre',
}
const PTYPE = { guide: 'Guides', chauffeur: 'Chauffeurs', autre: 'Autres' }

const num = (n) => (n === null || n === undefined ? '—' : n.toLocaleString('fr-FR'))
const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const fmtDate = (iso) =>
  iso ? new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z').toLocaleDateString('fr-FR') : ''

const toItems = (obj, labels) =>
  Object.entries(obj || {}).map(([k, v]) => ({ label: labels[k] || k, value: v }))

function Trend({ t, days }) {
  if (!t) return null
  const tone = t.change > 0 ? 'up' : t.change < 0 ? 'down' : ''
  const sign = t.current > 0 ? '+' : ''
  return (
    <small className={`db-trend ${tone}`}>
      {t.change === null
        ? `${sign}${t.current} sur ${days} j`
        : `${t.change > 0 ? '+' : ''}${t.change} % · ${sign}${t.current} sur ${days} j`}
    </small>
  )
}

function Kpi({ label, value, trend, days, note, tone }) {
  return (
    <div className={`db-kpi ${tone || ''}`}>
      <span>{label}</span>
      <b>{num(value)}</b>
      <Trend t={trend} days={days} />
      {note && <small className="db-note">{note}</small>}
    </div>
  )
}

function BarChart({ data }) {
  const W = 640, H = 180
  const max = Math.max(1, ...data.map((d) => d.count))
  const bw = W / data.length
  return (
    <>
      <svg className="db-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Évolution par jour">
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <line key={r} x1="0" x2={W} y1={H - H * r} y2={H - H * r} className="db-grid" />
        ))}
        {data.map((d, i) => {
          const h = (H - 6) * (d.count / max)
          return (
            <rect key={d.date} x={i * bw + bw * 0.15} y={H - h} width={bw * 0.7}
              height={d.count ? Math.max(h, 3) : 0} rx="3" className="db-bar">
              <title>{`${fmtDay(d.date)} : ${d.count}`}</title>
            </rect>
          )
        })}
      </svg>
      <div className="db-axis">
        <span>{fmtDay(data[0].date)}</span>
        <span>{fmtDay(data[Math.floor(data.length / 2)].date)}</span>
        <span>{fmtDay(data[data.length - 1].date)}</span>
      </div>
    </>
  )
}

function Bars({ items, empty = 'Aucune donnée.' }) {
  if (!items.some((i) => i.value)) return <p className="db-empty">{empty}</p>
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="db-bars">
      {items.map((i) => (
        <li key={i.label}>
          <span className="db-bar-label">{i.label}</span>
          <span className="db-bar-track"><i style={{ width: `${(i.value / max) * 100}%` }} /></span>
          <b>{i.value}</b>
        </li>
      ))}
    </ul>
  )
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`db-card ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export default function DashboardPage({ onOpenModeration }) {
  const [days, setDays] = useState(30)
  const [metric, setMetric] = useState('users')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    getAdminDashboard(days)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [days])

  if (error) return <p className="db-error">{error}</p>
  if (!data) return <p className="db-empty">Chargement…</p>

  const { totals: t, trends, breakdown: b, moderation: m } = data
  const series = data.series[metric]
  const sum = series.reduce((s, d) => s + d.count, 0)
  const pendingBookings = b.bookings_by_status?.pending ?? 0

  return (
    <div className="db">
      <div className="db-head">
        <div>
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble de l'activité de TravelMate.</p>
        </div>
        <div className="db-ranges">
          {RANGES.map((r) => (
            <button key={r} className={days === r ? 'active' : ''} onClick={() => setDays(r)}>{r} jours</button>
          ))}
        </div>
      </div>

      <div className="db-kpis">
        <Kpi label="Utilisateurs" value={t.users} trend={trends.users} days={days}
          note={`${b.roles.traveler} voyageurs · ${b.roles.provider} prestataires`} />
        <Kpi label="Publications" value={t.posts} trend={trends.posts} days={days} />
        <Kpi label="Voyages créés" value={t.trips} trend={trends.trips} days={days} />
        <Kpi label="Réservations" value={t.bookings} trend={trends.bookings} days={days}
          note={`${pendingBookings} en attente`} />
        <Kpi label="Communautés" value={t.communities} />
        <Kpi label="Avis" value={data.reviews?.count}
          note={data.reviews?.average ? `Note moyenne ${data.reviews.average} / 5` : ''} />
      </div>

      <Card title="Évolution par jour">
        <div className="db-tabs">
          {METRICS.map((x) => (
            <button key={x.key} className={metric === x.key ? 'active' : ''} onClick={() => setMetric(x.key)}>
              {x.label}
            </button>
          ))}
          <span className="db-sum">{sum} sur {days} jours</span>
        </div>
        <BarChart data={series} />
      </Card>

      <div className="db-grid2">
        <Card title="Répartition des comptes">
          <Bars items={toItems(b.roles, ROLE)} />
          <h4>Prestataires par type</h4>
          <Bars items={toItems(b.providers_by_type, PTYPE)} empty="Aucun prestataire." />
        </Card>

        <Card title="Réservations par statut">
          <Bars items={toItems(b.bookings_by_status, BOOKING)} empty="Aucune réservation." />
        </Card>

        <Card title="Destinations les plus publiées">
          <Bars items={data.top_destinations.map((d) => ({ label: d.name, value: d.count }))}
            empty="Aucune publication avec destination." />
        </Card>

        <Card title="Signalements par motif">
          <Bars items={toItems(b.reports_by_reason, REASON)} empty="Aucun signalement." />
        </Card>
      </div>

      <div className="db-grid2">
        <Card title="Modération" className={m.pending > 0 ? 'warn' : ''}>
          <ul className="db-mod">
            <li><b>{m.pending}</b><span>à traiter</span></li>
            <li><b>{m.handled}</b><span>traités</span></li>
            <li><b>{m.suspended}</b><span>suspendus</span></li>
            <li><b>{m.banned}</b><span>bannis</span></li>
          </ul>
          <button type="button" className="db-link" onClick={onOpenModeration}>Ouvrir la modération →</button>
        </Card>

        <Card title="Dernières inscriptions">
          <ul className="db-recent">
            {data.recent_users.map((u) => (
              <li key={u.id}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" />
                  : <span className="db-ava">{(u.full_name || '?').charAt(0).toUpperCase()}</span>}
                <div><b>{u.full_name}</b><small>{u.email}</small></div>
                <em>{ROLE[u.role] || u.role}</em>
                <small>{fmtDate(u.created_at)}</small>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}