import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { getMateSuggestions, toggleFollow } from '../../Api'
import './MatesPanel.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

export default function MatesPanel({ onNavigate, onMessage }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [followed, setFollowed] = useState({})
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    getMateSuggestions({ limit: 3 })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [])

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
    <div className="panel">
      <div className="rs-title">People going your way</div>
      <div className="rs-sub">Travel Mates matched to your plans</div>

      {error && <p className="mate-empty">{error}</p>}
      {!data && !error && <p className="mate-empty">Analyse en cours…</p>}

      {results.map((m) => {
        const text = m.shared_trip?.overlap
          ? `✈ ${m.shared_trip.destination}`
          : m.common_interests.slice(0, 3).join(', ') || m.reasons[0]
        return (
          <div className="mate-row" key={m.id} title={m.reasons.join('\n')}>
            <span
              className={`mate-ph ${gradientFor(m.id)}`}
              style={m.avatar_url ? {
                backgroundImage: `url(${m.avatar_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {m.avatar_url ? '' : m.full_name.charAt(0).toUpperCase()}
            </span>
            <div className="info">
              <b>{m.full_name}</b>
              <div>{text}</div>
            </div>
            <span className="pct">{m.score}%</span>
            <button type="button" className={`mate-follow${followed[m.id] ? ' on' : ''}`}
              disabled={busyId === m.id} onClick={() => follow(m.id)}>
              {followed[m.id] ? 'Suivi ✓' : 'Suivre'}
            </button>
            <button type="button" className="mate-chat" disabled={busyId === m.id}
              title={followed[m.id] ? `Écrire à ${m.full_name}` : `Suivre et écrire à ${m.full_name}`}
              aria-label={`Écrire à ${m.full_name}`} onClick={() => chat(m.id)}>
              <MessageCircle size={16} strokeWidth={1.8} />
            </button>
          </div>
        )
      })}

      {data && results.length === 0 && (
        <div className="mate-empty">
          {needs.includes('preferences') && (
            <p>Coche tes préférences de voyage pour recevoir des suggestions.
              {' '}<button type="button" onClick={() => onNavigate?.('profile')}>Mon profil</button></p>
          )}
          {needs.includes('trip') && (
            <p>Ajoute un voyage à venir pour trouver des compagnons sur ta destination.
              {' '}<button type="button" onClick={() => onNavigate?.('trips')}>Mes voyages</button></p>
          )}
          {needs.length === 0 && <p>Aucun compagnon compatible pour l'instant.</p>}
        </div>
      )}

      {results.length > 0 && (
        <button type="button" className="mini-btn discover" onClick={() => onNavigate?.('mates')}>
          Voir tous mes compagnons
        </button>
      )}
    </div>
  )
}