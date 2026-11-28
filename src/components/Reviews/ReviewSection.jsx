import { useCallback, useEffect, useState } from 'react'
import { createReview, deleteReview, getReviews, getToken, me } from '../../Api'
import StarRating from './StarRating'
import './Reviews.css'
import ReportButton from '../Moderation/ReportButton'

function Avatar({ name, url }) {
  return url ? (
    <img className="rv-ava" src={url} alt="" />
  ) : (
    <span className="rv-ava rv-ava--initial">{(name || '?').charAt(0).toUpperCase()}</span>
  )
}

export default function ReviewSection({ targetType, targetId }) {
  const [reviews, setReviews] = useState([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  const loadReviews = useCallback(async () => {
    try {
      const data = await getReviews(targetType, targetId)
      setReviews(data.results)
      setAverage(data.average)
      setCount(data.count)
    } catch (err) {
      setError(err.message)
    }
  }, [targetType, targetId])

  useEffect(() => { loadReviews() }, [loadReviews])

  useEffect(() => {
    if (!getToken()) return
    me().then((u) => setUserId(String(u.id ?? u._id))).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!getToken()) { setError('Connecte-toi pour donner ton avis.'); return }
    if (rating === 0) return

    setLoading(true)
    try {
      await createReview({ target_type: targetType, target_id: targetId, rating, comment })
      setRating(0)
      setComment('')
      await loadReviews()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ton avis ?')) return
    try {
      await deleteReview(id)
      await loadReviews()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="rv-box">
      <h3 className="rv-title">Avis et évaluations</h3>

      <div className="rv-summary">
        <span className="rv-avg">{Number(average || 0).toFixed(1)}</span>
        <StarRating value={average} size={20} />
        <span className="rv-count">{count} avis</span>
      </div>

      <form className="rv-form" onSubmit={handleSubmit}>
        <span className="rv-form-label">Ta note</span>
        <StarRating value={rating} onChange={setRating} size={28} />
        <textarea
          className="rv-textarea"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Partage ton avis..."
          maxLength={1000}
          rows={3}
        />
        {error && <p className="rv-error">{error}</p>}
        <button className="rv-btn" type="submit" disabled={loading || rating === 0}>
          {loading ? 'Envoi…' : 'Publier mon avis'}
        </button>
      </form>

      {reviews.length === 0 && <p className="rv-empty">Aucun avis pour le moment.</p>}

      <div className="rv-list">
        {reviews.map((r) => (
          <div className="rv-item" key={r.id}>
            <div className="rv-item-head">
              <Avatar name={r.author_name} url={r.author_avatar} />
              <div className="rv-author-info">
                <span className="rv-author">{r.author_name || 'Voyageur'}</span>
                <span className="rv-date">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <StarRating value={r.rating} size={16} />
            </div>
            {r.comment && <p className="rv-comment">{r.comment}</p>}
            {userId === r.author_id && (
              <button className="rv-delete" onClick={() => handleDelete(r.id)}>Supprimer</button>
            )}
            {userId !== r.author_id && <ReportButton targetType="review" targetId={r.id} />}
          </div>
        ))}
      </div>
    </section>
  )
}