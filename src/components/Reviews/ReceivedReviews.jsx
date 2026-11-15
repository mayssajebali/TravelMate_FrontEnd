
import { useEffect, useState } from 'react'
import { getToken } from '../../Api'
import './Reviews.css'

function Stars({ value }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0))

  return (
    <span className="rv-stars" aria-label={`${rating} sur 5`}>
      {'★'.repeat(Math.round(rating))}
      {'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

export default function ReceivedReviews() {
  const [data, setData] = useState({
    count: 0,
    average: 0,
    results: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/reviews/received/', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Impossible de charger les avis.')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Chargement…</p>
  if (error) return <p>{error}</p>

  return (
    <div>
      <h2>Avis reçus</h2>

      <div className="rv-summary">
        <Stars value={data.average} />
        <strong>{Number(data.average).toFixed(1)}</strong>
        <span>· {data.count} avis</span>
      </div>

      {data.results.length === 0 ? (
        <p className="rv-empty">Aucun avis pour le moment.</p>
      ) : (
        <div className="rv-list">
          {data.results.map((r) => (
            <article key={r.id} className="rv-item">
              <div className="rv-item-head">
                <div className="rv-author-info">
                  <strong className="rv-author">
                    {r.author_name ||
                      r.author?.username ||
                      r.author?.name ||
                      'Voyageur'}
                  </strong>

                  <small className="rv-date">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString('fr-FR')
                      : ''}
                  </small>
                </div>

                <Stars value={r.rating} />
              </div>

              <p className="rv-comment">
                {r.comment || 'Aucun commentaire.'}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
