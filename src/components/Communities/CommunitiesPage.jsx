import { useEffect, useState } from 'react'
import {
  getCommunities,
  getMyCommunities,
  joinCommunity,
  leaveCommunity,
} from '../../Api'
import CommunityCard from './CommunityCard'
import './Communities.css'

export default function CommunitiesPage() {
  const [tab, setTab] = useState('discover') // 'discover' | 'mine'
  const [all, setAll] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getCommunities(), getMyCommunities()])
      .then(([a, m]) => {
        setAll(a)
        setMine(m)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // rejoindre / quitter : on met à jour les deux listes avec la réponse du serveur
  const toggle = async (c) => {
    setError('')
    try {
      const updated = c.is_member ? await leaveCommunity(c.id) : await joinCommunity(c.id)
      setAll((l) => l.map((x) => (x.id === updated.id ? updated : x)))
      setMine((l) => {
        if (!updated.is_member) return l.filter((x) => x.id !== updated.id)
        return l.some((x) => x.id === updated.id)
          ? l.map((x) => (x.id === updated.id ? updated : x))
          : [...l, updated]
      })
    } catch (e) {
      setError(e.message)
    }
  }

  const list = tab === 'discover' ? all : mine

  return (
    <div className="comm-page">
      <h2>Communautés</h2>
      <p className="comm-sub">Rejoins des communautés qui partagent tes centres d'intérêt.</p>

      <div className="comm-tabs">
        <button
          type="button"
          className={tab === 'discover' ? 'active' : ''}
          onClick={() => setTab('discover')}
        >
          Découvrir
        </button>
        <button
          type="button"
          className={tab === 'mine' ? 'active' : ''}
          onClick={() => setTab('mine')}
        >
          Mes communautés ({mine.length})
        </button>
      </div>

      {error && <p className="comm-error">{error}</p>}
      {loading && <p>Chargement…</p>}

      {!loading && list.length === 0 && (
        <p>
          {tab === 'discover'
            ? 'Aucune communauté pour le moment.'
            : "Tu n'as rejoint aucune communauté pour l'instant."}
        </p>
      )}

      <div className="comm-grid">
        {list.map((c) => (
          <CommunityCard key={c.id} community={c} onToggle={toggle} />
        ))}
      </div>
    </div>
  )
}