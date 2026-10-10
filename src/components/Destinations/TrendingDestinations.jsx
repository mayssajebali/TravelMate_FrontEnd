import { useEffect, useState } from 'react'
import { getDestinations } from '../../Api'
import { coverStyle, gradientClass, plural } from './utils'

export default function TrendingDestinations({ onOpen }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false
    getDestinations({ ordering: 'popular', limit: 4 })
      .then((list) => !cancelled && setItems(list))
      .catch(() => {}) // widget secondaire : pas d'erreur bloquante
    return () => { cancelled = true }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="panel">
      <div className="rs-title">Trending with travelers</div>

      {items.map((d) => (
        <div
          key={d.slug}
          className="trend-row trend-link"
          role="button"
          tabIndex={0}
          onClick={() => onOpen?.(d.slug)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen?.(d.slug)
            }
          }}
        >
          <span
            className={`trend-ph ${d.cover_url ? '' : gradientClass(d.slug)}`}
            style={coverStyle(d.cover_url)}
          ></span>
          <div>
            {d.name}
            <small>
              {d.posts_count === 0 ? 'Aucune publication' : plural(d.posts_count, 'publication', 'publications')}
            </small>
          </div>
        </div>
      ))}
    </div>
  )
}