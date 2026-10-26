import { useCallback, useEffect, useState } from 'react'
import { getReceivedBookings, respondBooking } from '../../Api'
import './Bookings.css'

const FILTERS = [
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'refused', label: 'Refusées' },
  { value: 'cancelled', label: 'Annulées' },
  { value: '', label: 'Toutes' },
]
const STATUS_LABEL = {
  pending: 'En attente', accepted: 'Acceptée', refused: 'Refusée', cancelled: 'Annulée',
}
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '')

function RequestCard({ b, onRespond, busy }) {
  const t = b.traveler
  const [reply, setReply] = useState('')

  return (
    <article className="bk-card">
      <div className="bk-head">
        {t.avatar_url
          ? <img className="bk-ava" src={t.avatar_url} alt="" />
          : <span className="bk-ava bk-ava--initial">{(t.full_name || '?').charAt(0).toUpperCase()}</span>}
        <div>
          <h3>{t.full_name}</h3>
          <p className="bk-muted">{[t.city, t.country].filter(Boolean).join(', ') || 'Voyageur'}</p>
        </div>
        <span className={`bk-status bk-status--${b.status}`}>{STATUS_LABEL[b.status]}</span>
      </div>

      <div className="bk-facts">
        <div><b>{fmt(b.start_date)} → {fmt(b.end_date)}</b><span>{b.days} jour{b.days > 1 ? 's' : ''}</span></div>
        <div><b>{b.people}</b><span>personne{b.people > 1 ? 's' : ''}</span></div>
        <div><b>{b.daily_rate > 0 ? `${b.estimated_total} €` : 'Sur demande'}</b><span>estimation</span></div>
      </div>

      {b.message && <p className="bk-text"><b>Message du voyageur :</b> {b.message}</p>}
      {b.response_message && <p className="bk-text"><b>Ta réponse :</b> {b.response_message}</p>}

      {b.status === 'pending' && (
        <div className="bk-reply">
          <textarea rows={2} maxLength={500} value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder="Message pour le voyageur (facultatif) : lieu de rendez-vous, précisions…" />
          <div className="bk-actions">
            <button className="bk-accept" disabled={busy} onClick={() => onRespond(b.id, 'accept', reply)}>Accepter</button>
            <button className="bk-refuse" disabled={busy} onClick={() => onRespond(b.id, 'refuse', reply)}>Refuser</button>
          </div>
        </div>
      )}
    </article>
  )
}

export default function ReceivedBookingsPage() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    return getReceivedBookings({ status })
      .then((list) => { setItems(list); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const respond = async (id, action, message) => {
    if (action === 'refuse' && !window.confirm('Refuser cette demande ?')) return
    setBusyId(id)
    setError('')
    try {
      await respondBooking(id, action, message.trim())
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bk-page">
      <div className="bk-header">
        <h2>Demandes reçues</h2>
        <p>Accepte ou refuse les demandes de réservation des voyageurs.</p>
      </div>

      <div className="bk-chips">
        {FILTERS.map((f) => (
          <button key={f.label} className={`bk-chip ${status === f.value ? 'active' : ''}`}
            onClick={() => setStatus(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="bk-error">{error}</p>}
      {loading && items.length === 0 && <p className="bk-state">Chargement…</p>}
      {!loading && !error && items.length === 0 && <p className="bk-state">Aucune demande dans cette catégorie.</p>}

      <div className="bk-list">
        {items.map((b) => <RequestCard key={b.id} b={b} onRespond={respond} busy={busyId === b.id} />)}
      </div>
    </div>
  )
}