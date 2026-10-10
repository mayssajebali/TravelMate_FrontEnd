import { useEffect, useState } from 'react'
import { getDestination, getDestinationPosts } from '../../Api'
import { budgetText, coverStyle, gradientClass } from './utils'
import Post from '../Posts/Post'

const PAGE = 10

export default function DestinationDetail({ slug, onBack }) {
  const [dest, setDest] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setDest(null)
    setPosts([])
    Promise.all([getDestination(slug), getDestinationPosts(slug, { limit: PAGE })])
      .then(([d, list]) => {
        if (cancelled) return
        setDest(d)
        setPosts(list)
        setHasMore(list.length === PAGE)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [slug])

  const loadMore = async () => {
    if (!posts.length || loadingMore) return
    setLoadingMore(true)
    try {
      const list = await getDestinationPosts(slug, {
        before: posts[posts.length - 1].created_at,
        limit: PAGE,
      })
      setPosts((p) => [...p, ...list])
      setHasMore(list.length === PAGE)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  // une publication supprimée disparaît de la liste et du compteur
  const removePost = (id) => {
    setPosts((l) => l.filter((p) => p.id !== id))
    setDest((d) => (d ? { ...d, posts_count: Math.max(0, d.posts_count - 1) } : d))
  }

  if (loading) return <p className="dest-state">Chargement…</p>

  if (!dest) {
    return (
      <div className="dest-page">
        <button className="dest-back" onClick={onBack}>← Toutes les destinations</button>
        <p className="dest-state">{error || 'Destination introuvable.'}</p>
      </div>
    )
  }

  return (
    <div className="dest-page">
      <button className="dest-back" onClick={onBack}>← Toutes les destinations</button>

      <div
        className={`dest-hero ${dest.cover_url ? '' : gradientClass(dest.slug)}`}
        style={coverStyle(dest.cover_url)}
      >
        <div className="dest-hero-text">
          <h2>{dest.name}</h2>
          <p>{dest.country}</p>
        </div>
      </div>

      <section className="dest-box">
        <div className="dest-facts">
          <div className="dest-fact"><b>{dest.best_season || '—'}</b><span>Meilleure période</span></div>
          <div className="dest-fact"><b>{budgetText(dest.avg_budget)}</b><span>Budget / semaine (indicatif, hors vol)</span></div>
          <div className="dest-fact">
            <b>{dest.posts_count}</b>
            <span>{dest.posts_count > 1 ? 'publications' : 'publication'}</span>
          </div>
        </div>
        {dest.description && <p className="dest-desc">{dest.description}</p>}
        <div className="dest-tags">
          {dest.tags.map((t) => <span key={t} className="dest-tag">{t}</span>)}
        </div>
      </section>

      <h3 className="dest-section-title">Souvenirs de la communauté</h3>
      {posts.length === 0 && (
        <p className="dest-state">
          Personne n'a encore partagé de souvenirs de {dest.name}. Sois le premier : indique « {dest.name} »
          comme destination dans ta publication.
        </p>
      )}
      {posts.map((p) => <Post key={p.id} post={p} onDeleted={removePost} />)}

      {error && <p className="dest-error">{error}</p>}
      {hasMore && (
        <button className="dest-chip dest-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}