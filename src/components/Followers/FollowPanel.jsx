import { useEffect, useState } from 'react'
import './FollowPanel.css'
import { getFollowing, getSuggestions, toggleFollow } from '../../Api'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function Row({ u, isFollowing, busy, onToggle }) {
  const initial = (u.full_name ?? '').trim().charAt(0).toUpperCase()
  const place = [u.city, u.country].filter(Boolean).join(', ')

  return (
    <li className="fp-row">
      <span
        className={`fp-ava ${gradientFor(u.id)}`}
        style={u.avatar_url ? { backgroundImage: `url(${u.avatar_url})` } : undefined}
      >
        {u.avatar_url ? '' : initial}
      </span>

      <div className="fp-info">
        <b>{u.full_name}</b>
        {place && <small>{place}</small>}
      </div>

      <button
        type="button"
        className={`fp-btn${isFollowing ? ' following' : ''}`}
        onClick={() => onToggle(u, isFollowing)}
        disabled={busy}
      >
        {isFollowing ? 'Suivi' : 'Suivre'}
      </button>
    </li>
  )
}

function FollowPanel() {
  const [tab, setTab] = useState('suggestions')
  const [following, setFollowing] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    Promise.all([getFollowing(), getSuggestions()])
      .then(([f, s]) => {
        if (!alive) return
        setFollowing(f)
        setSuggestions(s)
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const toggle = async (u) => {
    setBusyId(u.id)
    setError('')
    try {
      const r = await toggleFollow(u.id)
      if (r.following) {
        setFollowing((l) => [u, ...l.filter((x) => x.id !== u.id)])
        setSuggestions((l) => l.filter((x) => x.id !== u.id))
      } else {
        setSuggestions((l) => [u, ...l.filter((x) => x.id !== u.id)])
        setFollowing((l) => l.filter((x) => x.id !== u.id))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  const list = tab === 'following' ? following : suggestions

  return (
    <div className="panel">
      <div className="rs-title">Voyageurs</div>

      <div className="fp-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'suggestions'}
          className={`fp-tab${tab === 'suggestions' ? ' active' : ''}`}
          onClick={() => setTab('suggestions')}
        >
          À suivre
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'following'}
          className={`fp-tab${tab === 'following' ? ' active' : ''}`}
          onClick={() => setTab('following')}
        >
          Abonnements <span className="fp-count">{following.length}</span>
        </button>
      </div>

      {loading ? (
        <p className="rs-sub">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="rs-sub fp-empty">
          {tab === 'following'
            ? "Tu ne suis personne pour l'instant."
            : 'Plus de suggestions pour le moment.'}
        </p>
      ) : (
        <ul className="fp-list">
          {list.map((u) => (
            <Row
              key={u.id}
              u={u}
              isFollowing={tab === 'following'}
              busy={busyId === u.id}
              onToggle={toggle}
            />
          ))}
        </ul>
      )}

      {error && <p className="fp-error">{error}</p>}
    </div>
  )
}

export default FollowPanel