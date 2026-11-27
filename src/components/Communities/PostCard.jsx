import { useState } from 'react'
import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityComments,
  likeCommunityPost,
} from '../../Api'
import './Communities.css'

const formatDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// mêmes icônes « contour » que les posts de l'accueil
const HeartIcon = ({ filled }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)

const CommentIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
  </svg>
)

export default function PostCard({ post, communityId, canInteract, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState(null) // null = pas encore chargés
  const [count, setCount] = useState(post.comments_count)
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes_count)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // like optimiste : l'UI réagit tout de suite, le serveur a le dernier mot
  const toggleLike = async () => {
    if (!canInteract) return
    const prev = { liked, likes }
    setLiked(!liked)
    setLikes((n) => n + (liked ? -1 : 1))
    setError('')
    try {
      const updated = await likeCommunityPost(communityId, post.id)
      setLiked(updated.liked)
      setLikes(updated.likes_count)
    } catch (err) {
      setLiked(prev.liked)
      setLikes(prev.likes)
      setError(err.message)
    }
  }

  const toggleComments = async () => {
    const next = !open
    setOpen(next)
    if (next && comments === null) {
      try {
        setComments(await getCommunityComments(communityId, post.id))
      } catch (e) {
        setError(e.message)
      }
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError('')
    try {
      const created = await createCommunityComment(communityId, post.id, text.trim())
      setComments((l) => [...(l || []), created])
      setCount((n) => n + 1)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const removeComment = async (commentId) => {
    setError('')
    try {
      await deleteCommunityComment(communityId, post.id, commentId)
      setComments((l) => l.filter((c) => c.id !== commentId))
      setCount((n) => Math.max(n - 1, 0))
    } catch (err) {
      setError(err.message)
    }
  }

  const removePost = async () => {
    if (!window.confirm('Supprimer cette publication ?')) return
    try {
      await deleteCommunityPost(communityId, post.id)
      onDeleted(post.id)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <article className="comm-post">
      <div className="comm-post-head">
        <div className="comm-avatar">{post.author.name.charAt(0).toUpperCase()}</div>
        <div>
          <strong>{post.author.name}</strong>
          <div className="comm-date">{formatDate(post.created_at)}</div>
        </div>
        {post.is_author && (
          <button type="button" className="comm-link-btn danger" onClick={removePost}>
            Supprimer
          </button>
        )}
      </div>

      <p className="comm-post-content">{post.content}</p>
      {post.image && <img className="comm-post-image" src={post.image} alt="" />}

      {/* barre d'actions, comme sur les posts de l'accueil */}
      <div className="action-bar">
        <div className="action-left">
          <button
            type="button"
            className={`icon-btn like-btn${liked ? ' active' : ''}`}
            onClick={toggleLike}
            disabled={!canInteract}
            title={canInteract ? undefined : 'Rejoins la communauté pour aimer'}
            aria-label={liked ? "Je n'aime plus" : "J'aime"}
            aria-pressed={liked}
          >
            <HeartIcon filled={liked} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={toggleComments}
            aria-label="Commentaires"
            aria-expanded={open}
          >
            <CommentIcon />
          </button>
        </div>
      </div>

      <div className="post-stats">
        <b>{likes}</b> <span>j'aime{likes > 1 ? '' : ''}</span>
        {count > 0 && !open && (
          <button type="button" className="view-comments" onClick={toggleComments}>
            Voir {count > 1 ? `les ${count} commentaires` : 'le commentaire'}
          </button>
        )}
      </div>

      {open && (
        <div className="comm-comments">
          {comments === null && !error && <p className="comm-date">Chargement…</p>}

          {(comments || []).map((c) => (
            <div key={c.id} className="comm-comment">
              <div className="comm-avatar small">{c.author.name.charAt(0).toUpperCase()}</div>
              <div className="comm-comment-body">
                <div>
                  <strong>{c.author.name}</strong>{' '}
                  <span className="comm-date">{formatDate(c.created_at)}</span>
                </div>
                <p>{c.content}</p>
              </div>
              {c.is_author && (
                <button
                  type="button"
                  className="comm-link-btn danger"
                  onClick={() => removeComment(c.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {canInteract ? (
            <form className="comm-comment-form" onSubmit={addComment}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={1000}
                placeholder="Écrire un commentaire…"
              />
              <button type="submit" className="comm-btn" disabled={busy || !text.trim()}>
                Envoyer
              </button>
            </form>
          ) : (
            <p className="comm-date">Rejoins la communauté pour commenter.</p>
          )}
        </div>
      )}

      {error && <p className="comm-error">{error}</p>}
    </article>
  )
}