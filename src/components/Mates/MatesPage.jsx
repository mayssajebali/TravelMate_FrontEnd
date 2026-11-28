import { useEffect, useState } from 'react'
import { getMateSuggestions, toggleFollow } from '../../Api'
import './MatesPage.css'
import { MessageCircle } from 'lucide-react'
import ReportButton from '../Moderation/ReportButton'

const LEVELS = [
  { value: 20, label: 'Compatibles (20 %+)' },
  { value: 50, label: 'Très compatibles (50 %+)' },
  { value: 0, label: 'Tous' },
]
const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}
const levelOf = (s) =>
  s >= 70 ? 'Excellente affinité'
  : s >= 40 ? 'Bonne affinité'
  : s >= 20 ? 'Affinité possible'
  : 'Peu de points communs'
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '')

function MateCard({ m, followed, busy, onFollow, onMessage }) {
  const place = [m.city, m.country].filter(Boolean).join(', ')
  return (
    <article className="mt-card">
      <div className="mt-head">
        <span
          className={`mt-ava ${gradientFor(m.id)}`}
          style={m.avatar_url ? { backgroundImage: `url(${m.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {m.avatar_url ? '' : m.full_name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h3>{m.full_name}</h3>
          <p className="mt-muted">{place || '—'}</p>
        </div>
        <div className="mt-score"><b>{m.score}%</b><span>{levelOf(m.score)}</span></div>
      </div>


      {m.shared_trip && (m.shared_trip.overlap ? (
        <p className="mt-trip">
          ✈ Voyage aussi à <b>{m.shared_trip.destination}</b> du {fmt(m.shared_trip.start)} au {fmt(m.shared_trip.end)}
        </p>
      ) : (
        <p className="mt-trip mt-trip--other">
          📅 Même destination (<b>{m.shared_trip.destination}</b>), mais à d'autres dates :
          du {fmt(m.shared_trip.start)} au {fmt(m.shared_trip.end)}
        </p>
      ))}



      {m.common_interests.length > 0 && (
        <div className="mt-tags">
          {m.common_interests.map((t) => <span key={t} className="mt-tag">{t}</span>)}
        </div>
      )}
      {m.icebreaker && (
        <p className="mt-ice">
          💬 {m.icebreaker}
          {m.icebreaker_source === 'ai' && <span className="mt-ai">✨ IA</span>}
        </p>
      )}

      <ul className="mt-reasons">
        {m.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>

      <div className="mt-actions">
        <button type="button" className={`mt-follow${followed ? ' on' : ''}`} disabled={busy} onClick={() => onFollow(m.id)}>
          {followed ? 'Suivi ✓' : 'Suivre'}
        </button>
        <button type="button" className="mt-chat" disabled={busy}
          title={followed ? `Écrire à ${m.full_name}` : `Suivre et écrire à ${m.full_name}`}
          aria-label={`Écrire à ${m.full_name}`} onClick={() => onMessage?.(m.id)}>
          <MessageCircle size={18} strokeWidth={1.8} />
        </button>

        <ReportButton targetType="user" targetId={m.id} compact />
      </div>
    </article>
  )
}

export default function MatesPage({ onNavigate, onMessage }) {
  const [minScore, setMinScore] = useState(20)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [followed, setFollowed] = useState({})
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError('')
    getMateSuggestions({ limit: 20, minScore })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [minScore])

  const follow = async (id) => {
    if (busyId) return
    setBusyId(id)
    try {
      const r = await toggleFollow(id)
      setFollowed((f) => ({ ...f, [id]: r.following }))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }
    // le back exige un abonnement pour écrire : on suit d'abord si besoin
  const chat = async (id) => {
    if (busyId) return
    if (!followed[id]) {
      setBusyId(id)
      try {
        const r = await toggleFollow(id)
        setFollowed((f) => ({ ...f, [id]: r.following }))
        if (!r.following) return
      } catch (e) {
        setError(e.message)
        return
      } finally {
        setBusyId(null)
      }
    }
    onMessage?.(id)
  }

  const results = data?.results ?? []
  const needs = data?.needs ?? []

  return (
    <div className="mt-page">
      <div className="mt-header">
        <h2>Travel Mates</h2>
        <p>Des voyageurs compatibles avec tes intérêts, tes destinations et tes dates.</p>
      </div>

      <div className="mt-chips">
        {LEVELS.map((l) => (
          <button key={l.value} className={`mt-chip ${minScore === l.value ? 'active' : ''}`} onClick={() => setMinScore(l.value)}>
            {l.label}
          </button>
        ))}
      </div>

      {needs.length > 0 && (
        <div className="mt-hint">
          <b>Pour de meilleures suggestions :</b>
          {needs.includes('preferences') && <> coche tes préférences dans <button onClick={() => onNavigate?.('profile')}>Mon profil</button>.</>}
          {needs.includes('trip') && <> Ajoute un voyage à venir dans <button onClick={() => onNavigate?.('trips')}>Mes voyages</button>.</>}
        </div>
      )}

      {error && <p className="mt-error">{error}</p>}
      {!data && !error && <p className="mt-state">Analyse des profils en cours…</p>}
      {data && results.length === 0 && <p className="mt-state">Aucun compagnon à ce niveau de compatibilité.</p>}

      <div className="mt-grid">
        {results.map((m) => (
          <MateCard key={m.id} m={m} followed={!!followed[m.id]} busy={busyId === m.id} onFollow={follow} onMessage={chat} />
        ))}
      </div>
    </div>
  )
}