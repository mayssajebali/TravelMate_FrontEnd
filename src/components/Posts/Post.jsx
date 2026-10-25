import { useState } from 'react'
import './Post.css'
import { toggleLike, toggleSave, addComment, deleteComment, updatePost, deletePost, sharePost, toggleFollow } from '../../Api'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function timeAgo(iso) {
  if (!iso) return ''
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z')
  const s = Math.max(1, Math.floor((Date.now() - date) / 1000))
  if (s < 60) return "à l'instant"
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  return `${Math.floor(s / 86400)} j`
}
function MiniAvatar({ user, size = 32 }) {
  const photo = user?.avatar_url
  const initial = (user?.full_name ?? '').trim().charAt(0).toUpperCase()
  return (
    <span
      className={`ava ${gradientFor(user?.id)} mini-ava`}
      style={{
        width: size,
        height: size,
        ...(photo ? { backgroundImage: `url(${photo})` } : {}),
      }}
    >
      {photo ? '' : initial}
    </span>
  )
}
function Post({ post, onDeleted, onSaveToggle }) {
  const [p, setP] = useState(post)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.text)
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')
  const [shareMsg, setShareMsg] = useState('')           // US11 : feedback copie lien
  const [isFollowing, setIsFollowing] = useState(!!post.is_following)

  const run = async (fn) => {
    setError('')
    try { await fn() } catch (e) { setError(e.message) }
  }

  // US09 — Like / Unlike
  const like = () => run(async () => {
    const r = await toggleLike(p.id)
    setP((x) => ({ ...x, liked_by_me: r.liked, likes_count: r.likes_count }))
  })

  const save = () => run(async () => {
    const r = await toggleSave(p.id)
    setP((x) => ({ ...x, saved_by_me: r.saved }))
    onSaveToggle?.(p.id, r.saved)
  })

  // US11 — Partager : incrémente le compteur back + copie le lien dans le presse-papier
  const share = () => run(async () => {
    const r = await sharePost(p.id)
    setP((x) => ({ ...x, shares_count: r.shares_count }))
    try {
      await navigator.clipboard.writeText(r.share_url)
      setShareMsg('✓ Lien copié !')
    } catch {
      setShareMsg('✓ Partagé !')
    }
    setTimeout(() => setShareMsg(''), 2500)
  })

  // US12 — Suivre / Ne plus suivre l'auteur du post
  const follow = () => run(async () => {
    const r = await toggleFollow(p.author.id)
    setIsFollowing(r.following)
  })

  // US10 — Commenter
  const sendComment = (e) => {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    run(async () => {
      const c = await addComment(p.id, text)
      setP((x) => ({ ...x, comments: [...x.comments, c], comments_count: x.comments_count + 1 }))
      setComment('')
    })
  }

  const removeComment = (cid) => run(async () => {
    await deleteComment(p.id, cid)
    setP((x) => ({
      ...x,
      comments: x.comments.filter((c) => c.id !== cid),
      comments_count: x.comments_count - 1,
    }))
  })

  const saveEdit = () => run(async () => {
    const updated = await updatePost(p.id, { text: draft })
    setP(updated)
    setEditing(false)
  })

  const remove = () => {
    if (!window.confirm('Supprimer cette publication ?')) return
    run(async () => {
      await deletePost(p.id)
      onDeleted?.(p.id)
    })
  }
const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const HeartIcon = ({ filled }) => (
  <svg {...iconProps} fill={filled ? 'currentColor' : 'none'} stroke="currentColor">
    <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8.1 2.9 4.5 6.4 4.5c2 0 3.7 1.1 4.6 2.7h2c.9-1.6 2.6-2.7 4.6-2.7 3.5 0 5.5 3.6 4 7.1C19.5 16.4 12 21 12 21z" />
  </svg>
)

const CommentIcon = () => (
  <svg {...iconProps} fill="none" stroke="currentColor">
    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
)

const ShareIcon = () => (
  <svg {...iconProps} fill="none" stroke="currentColor">
    <path d="M22 3 9.5 14.5" />
    <path d="M22 3l-7 18-3.5-6.5L5 11z" />
  </svg>
)

const BookmarkIcon = ({ filled }) => (
  <svg {...iconProps} fill={filled ? 'currentColor' : 'none'} stroke="currentColor">
    <path d="M6 3h12v18l-6-4.5L6 21z" />
  </svg>
)
  const authorPhoto = p.author.avatar_url
  const authorInitial = (p.author.full_name ?? '').trim().charAt(0).toUpperCase()

  return (
    <article className="post">
      <div className="post-head">
        <span
          className={`ava ${gradientFor(p.author.id)} avatar-post`}
          style={{
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 700,
            ...(authorPhoto ? {
              backgroundImage: `url(${authorPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}),
          }}
        >
          {authorPhoto ? '' : authorInitial}
        </span>

        <div className="who">
          <div className="who-top">
            <b>{p.author.full_name}</b>
            {/* US12 — bouton Suivre visible seulement si ce n'est pas mon post */}
            {!p.is_mine && (
              <button
                className={`follow-btn${isFollowing ? ' following' : ''}`}
                onClick={follow}
                title={isFollowing ? 'Ne plus suivre' : 'Suivre ce voyageur'}
              >
                {isFollowing ? '✓ Suivi' : '+ Suivre'}
              </button>
            )}
          </div>
          <div className="who-meta">
            {p.destination && `${p.destination} · `}
            {timeAgo(p.created_at)}
            {p.updated_at && ' · modifié'}
          </div>
        </div>

        {p.is_mine && (
          <span className="more" onClick={() => setMenu((m) => !m)} style={{ cursor: 'pointer' }}>⋯</span>
        )}
      </div>

      {menu && p.is_mine && (
        <div className="post-menu">
          <button onClick={() => { setEditing(true); setMenu(false) }}>Modifier</button>
          <button onClick={remove}>Supprimer</button>
        </div>
      )}

      {p.image && (
        <div className="post-photo">
          <img src={p.image} alt="" className="post-img" />
          {p.destination && (
            <div className="floating-tag"><b>{p.destination.toUpperCase()}</b></div>
          )}
        </div>
      )}

      <div className="post-body">
{editing ? (
  <div className="edit-box">
    <textarea
      className="edit-area"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      maxLength={1000}
      rows={4}
      autoFocus
    />
    <div className="edit-foot">
      <small className="char-count">{draft.length}/1000</small>
      <div className="edit-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => { setEditing(false); setDraft(p.text) }}
        >
          Annuler
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={saveEdit}
          disabled={!draft.trim()}
        >
          Enregistrer
        </button>
      </div>
    </div>
  </div>
) : (
  <p>{p.text}</p>
)}
      </div>

{/* Barre d'actions style Instagram */}
<div className="action-bar">
  <div className="action-left">
    {/* US09 */}
    <button
      type="button"
      className={`icon-btn like-btn${p.liked_by_me ? ' active' : ''}`}
      onClick={like}
      aria-label={p.liked_by_me ? "Je n'aime plus" : "J'aime"}
      aria-pressed={!!p.liked_by_me}
    >
      <HeartIcon filled={p.liked_by_me} />
    </button>

    {/* US10 */}
    <button
      type="button"
      className="icon-btn"
      onClick={() => setShowComments((s) => !s)}
      aria-label="Commenter"
    >
      <CommentIcon />
    </button>

    {/* US11 */}
    <button
      type="button"
      className="icon-btn"
      onClick={share}
      aria-label="Partager"
      title="Partager et copier le lien"
    >
      <ShareIcon />
    </button>

    {shareMsg && <span className="share-msg">{shareMsg}</span>}
  </div>

  <button
    type="button"
    className={`icon-btn${p.saved_by_me ? ' active-save' : ''}`}
    onClick={save}
    aria-label={p.saved_by_me ? 'Retirer des enregistrements' : 'Enregistrer'}
    aria-pressed={!!p.saved_by_me}
  >
    <BookmarkIcon filled={p.saved_by_me} />
  </button>
</div>

  {/* Compteurs */}
  <div className="post-stats">
    <b>
      {p.likes_count} {p.likes_count > 1 ? "J'aime" : "J'aime"}
    </b>
    {(p.shares_count ?? 0) > 0 && (
      <span> · {p.shares_count} partage{p.shares_count > 1 ? 's' : ''}</span>
    )}
    {p.comments_count > 0 && !showComments && (
      <button type="button" className="view-comments" onClick={() => setShowComments(true)}>
        Voir les {p.comments_count} commentaire{p.comments_count > 1 ? 's' : ''}
      </button>
    )}
  </div>
      {/* US10 — Section commentaires */}
{showComments && (
  <div className="comments">
    {p.comments.length === 0 && (
      <p className="no-comments">Aucun commentaire pour l'instant. Sois le premier !</p>
    )}

    <ul className="comment-list">
      {p.comments.map((c) => (
        <li key={c.id} className="comment">
          <MiniAvatar user={c.author} />
          <div className="comment-main">
            <p className="comment-text">
              <b>{c.author.full_name}</b> {c.text}
            </p>
            <div className="comment-meta">
              <span>{timeAgo(c.created_at)}</span>
              <button
                type="button"
                className="comment-del"
                onClick={() => removeComment(c.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>

    <form className="comment-form" onSubmit={sendComment}>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ajouter un commentaire…"
        maxLength={500}
        aria-label="Ajouter un commentaire"
      />
      <button type="submit" className="comment-send" disabled={!comment.trim()}>
        Publier
      </button>
    </form>
  </div>
)}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </article>
  )
}

export default Post