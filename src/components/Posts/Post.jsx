import { useState } from 'react'
import './Post.css'
import { toggleLike, toggleSave, addComment, deleteComment, updatePost, deletePost } from '../../Api'

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

function Post({ post, onDeleted, onSaveToggle }) {
  const [p, setP] = useState(post)
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.text)
  const [menu, setMenu] = useState(false)
  const [error, setError] = useState('')

  const run = async (fn) => {
    setError('')
    try { await fn() } catch (e) { setError(e.message) }
  }

  const like = () => run(async () => {
    const r = await toggleLike(p.id)
    setP((x) => ({ ...x, liked_by_me: r.liked, likes_count: r.likes_count }))
  })

  const save = () => run(async () => {
    const r = await toggleSave(p.id)
    setP((x) => ({ ...x, saved_by_me: r.saved }))
    onSaveToggle?.(p.id, r.saved)
  })

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

  return (
    <article className="post">
      <div className="post-head">
        <span className={`ava ${gradientFor(p.author.id)} avatar-post`}></span>
        <div className="who">
          <b>{p.author.full_name}</b>
          <div>
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
          <>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={3} style={{ width: '100%' }} />
            <button onClick={saveEdit}>Enregistrer</button>
            <button onClick={() => { setEditing(false); setDraft(p.text) }}>Annuler</button>
          </>
        ) : (
          <p>{p.text}</p>
        )}
      </div>

      <div className="interactions">
        <span>❤ {p.likes_count}</span>
        <span>💬 {p.comments_count}</span>
      </div>

      <div className="action-row">
        <span onClick={like} style={{ cursor: 'pointer', fontWeight: p.liked_by_me ? 700 : 400 }}>
          {p.liked_by_me ? '❤️ Aimé' : '🤍 Like'}
        </span>
        <span onClick={() => setShowComments((s) => !s)} style={{ cursor: 'pointer' }}>💬 Discuss</span>
        <span onClick={save} style={{ cursor: 'pointer', fontWeight: p.saved_by_me ? 700 : 400 }}>
          📌 {p.saved_by_me ? 'Enregistré' : 'Save'}
        </span>
      </div>

      {showComments && (
        <div className="comments">
          {p.comments.map((c) => (
            <div key={c.id} className="comment">
              <b>{c.author.full_name}</b> {c.text} <small>{timeAgo(c.created_at)}</small>
              {(p.is_mine || c.author.id === post.__meId) && null}
              <span onClick={() => removeComment(c.id)} style={{ cursor: 'pointer', marginLeft: 6 }}>✕</span>
            </div>
          ))}
          <form onSubmit={sendComment}>
            <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Écrire un commentaire…" maxLength={500} />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      )}

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </article>
  )
}

export default Post