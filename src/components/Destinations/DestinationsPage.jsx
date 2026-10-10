import { useEffect, useState } from 'react'
import { getDestinations } from '../../Api'
import DestinationCard from './DestinationCard'
import DestinationDetail from './DestinationDetail'
import { TAGS } from './utils'
import './Destinations.css'

export default function DestinationsPage({ slug, onSlugChange }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('')
  const [ordering, setOrdering] = useState('name')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (slug) return // on est sur le détail
    let cancelled = false
    setLoading(true)
    // anti-rebond : on attend 300 ms après la dernière frappe
    const timer = setTimeout(() => {
      getDestinations({ q: query.trim(), tag, ordering })
        .then((list) => {
          if (cancelled) return
          setItems(list)
          setError('')
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false))
    }, query ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [slug, query, tag, ordering])

  if (slug) return <DestinationDetail slug={slug} onBack={() => onSlugChange(null)} />

  return (
    <div className="dest-page">
      <div className="dest-header">
        <h2>Explorer</h2>
        <p>Découvre les destinations préférées de la communauté.</p>
      </div>

      <input
        className="dest-search"
        placeholder="Rechercher une destination ou un pays…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="dest-filters">
        <button className={`dest-chip ${tag === '' ? 'active' : ''}`} onClick={() => setTag('')}>Toutes</button>
        {TAGS.map((t) => (
          <button key={t} className={`dest-chip ${tag === t ? 'active' : ''}`} onClick={() => setTag(tag === t ? '' : t)}>
            {t}
          </button>
        ))}
        <div className="dest-sort">
          <button className={`dest-chip ${ordering === 'name' ? 'active' : ''}`} onClick={() => setOrdering('name')}>A–Z</button>
          <button className={`dest-chip ${ordering === 'popular' ? 'active' : ''}`} onClick={() => setOrdering('popular')}>Populaires</button>
        </div>
      </div>

      {error && <p className="dest-error">{error}</p>}
      {loading && items.length === 0 && <p className="dest-state">Chargement…</p>}
      {!loading && !error && items.length === 0 && (
        <p className="dest-state">Aucune destination ne correspond à ta recherche.</p>
      )}

      <div className="dest-grid">
        {items.map((d) => <DestinationCard key={d.slug} destination={d} onOpen={onSlugChange} />)}
      </div>
    </div>
  )
}
