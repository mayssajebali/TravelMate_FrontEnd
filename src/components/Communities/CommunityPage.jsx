import { useCallback, useEffect, useState } from 'react'
import {
  createCommunityPost,
  getCommunity,
  getCommunityPosts,
  joinCommunity,
  leaveCommunity,
} from '../../Api'
import PostCard from './PostCard'
import { compressImage } from './imageUtils'
import './Communities.css'

const LIMIT = 20

export default function CommunityPage({ communityId: id, onBack }) {
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // formulaire de publication
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([getCommunity(id), getCommunityPosts(id, 1, LIMIT)])
      .then(([c, p]) => {
        setCommunity(c)
        setPosts(p.results)
        setTotal(p.count)
        setPage(1)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const toggleMembership = async () => {
    setError('')
    try {
      setCommunity(community.is_member ? await leaveCommunity(id) : await joinCommunity(id))
    } catch (e) {
      setError(e.message)
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const p = await getCommunityPosts(id, next, LIMIT)
      setPosts((l) => [...l, ...p.results])
      setTotal(p.count)
      setPage(next)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  // image choisie sur l'ordinateur -> compressée en data URL
  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-choisir le même fichier
    if (!file) return
    setFormError('')
    try {
      setImage(await compressImage(file))
    } catch (err) {
      setFormError(err.message)
    }
  }

  const publish = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setFormError('Écris quelque chose avant de publier.')
      return
    }
    setPublishing(true)
    setFormError('')
    try {
      const post = await createCommunityPost(id, { content: content.trim(), image: image.trim() })
      setPosts((l) => [post, ...l])
      setTotal((t) => t + 1)
      setContent('')
      setImage('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const handlePostDeleted = useCallback((postId) => {
    setPosts((l) => l.filter((p) => p.id !== postId))
    setTotal((t) => Math.max(t - 1, 0))
  }, [])

  if (loading) return <p>Chargement…</p>
  if (!community)
    return (
      <div className="comm-page">
        <button type="button" className="comm-back" onClick={onBack}>
          ← Toutes les communautés
        </button>
        <p className="comm-error">{error || 'Communauté introuvable.'}</p>
      </div>
    )

  const c = community

  return (
    <div className="comm-page comm-detail">
      <button type="button" className="comm-back" onClick={onBack}>
        ← Toutes les communautés
      </button>

      <header className="comm-hero">
        <div
          className="comm-hero-cover"
          style={c.cover_image ? { backgroundImage: `url(${c.cover_image})` } : undefined}
        >
          {c.cover_image ? '' : c.name.charAt(0).toUpperCase()}
        </div>
        <div className="comm-hero-body">
          <div className="comm-head">
            <h2>{c.name}</h2>
            <button
              type="button"
              className={`comm-btn${c.is_member ? ' joined' : ''}`}
              onClick={toggleMembership}
            >
              {c.is_member ? 'Quitter' : 'Rejoindre'}
            </button>
          </div>
          {c.description && <p className="comm-desc">{c.description}</p>}
          <div className="comm-topics">
            {c.topics.map((t) => (
              <span key={t} className="comm-topic">
                {t}
              </span>
            ))}
          </div>
          <span className="comm-members">
            {c.members_count} membre{c.members_count > 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {error && <p className="comm-error">{error}</p>}

      {c.is_member ? (
        <form className="comm-form comm-composer" onSubmit={publish}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Partage un conseil, une photo, une question…"
          />
          <div className="comm-image-pick">
            <label className="comm-btn joined comm-file-btn">
              📷 {image ? "Changer l'image" : 'Ajouter une image'}
              <input type="file" accept="image/*" onChange={pickImage} hidden />
            </label>
            {image && (
              <button type="button" className="comm-link-btn danger" onClick={() => setImage('')}>
                Retirer
              </button>
            )}
          </div>
          {image && <img className="comm-post-image" src={image} alt="Aperçu" />}
          {formError && <p className="comm-error">{formError}</p>}
          <div className="comm-form-actions">
            <span className="comm-members">{content.length}/2000</span>
            <button type="submit" className="comm-btn" disabled={publishing}>
              {publishing ? 'Publication…' : 'Publier'}
            </button>
          </div>
        </form>
      ) : (
        <p className="comm-notice">Rejoins la communauté pour publier et commenter.</p>
      )}

      <h3 className="comm-feed-title">
        Publications ({total})
      </h3>

      {posts.length === 0 && <p>Aucune publication pour le moment. Sois le premier !</p>}

      <div className="comm-feed">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            communityId={id}
            canInteract={c.is_member}
            onDeleted={handlePostDeleted}
          />
        ))}
      </div>

      {posts.length < total && (
        <button
          type="button"
          className="comm-btn joined comm-more"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}