import { useCallback, useEffect, useState } from 'react'
import { getMyBookings, cancelBooking } from '../../Api'
import './Bookings.css'

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'accepted', label: 'Acceptées' },
  { value: 'refused', label: 'Refusées' },
  { value: 'cancelled', label: 'Annulées' },
]
const STATUS_LABEL = {
  pending: 'En attente', accepted: 'Acceptée', refused: 'Refusée', cancelled: 'Annulée',
}
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '')

function BookingCard({ b, onCancel, busy }) {
  const pr = b.provider
  return (
    <article className="bk-card">
      <div className="bk-head">
        {pr.avatar_url
          ? <img className="bk-ava" src={pr.avatar_url} alt="" />
          : <span className="bk-ava bk-ava--initial">{(pr.full_name || '?').charAt(0).toUpperCase()}</span>}
        <div>
          <h3>{pr.full_name}</h3>
          <p className="bk-muted">
            {pr.service_type === 'guide' ? 'Guide' : pr.service_type === 'chauffeur' ? 'Chauffeur' : ''}
            {pr.city ? ` · ${pr.city}` : ''}
          </p>
        </div>
        <span className={`bk-status bk-status--${b.status}`}>{STATUS_LABEL[b.status]}</span>
      </div>

      <div className="bk-facts">
        <div><b>{fmt(b.start_date)} → {fmt(b.end_date)}</b><span>{b.days} jour{b.days > 1 ? 's' : ''}</span></div>
        <div><b>{b.people}</b><span>personne{b.people > 1 ? 's' : ''}</span></div>
        <div><b>{b.daily_rate > 0 ? `${b.estimated_total} €` : 'Sur demande'}</b><span>estimation</span></div>
      </div>

      {b.message && <p className="bk-text"><b>Ton message :</b> {b.message}</p>}
      {b.response_message && <p className="bk-text"><b>Réponse :</b> {b.response_message}</p>}
      {b.status === 'accepted' && pr.phone && (
        <p className="bk-contact">📞 Contact du prestataire : <b>{pr.phone}</b></p>
      )}

      {(b.status === 'pending' || b.status === 'accepted') && (
        <button className="bk-cancel" onClick={() => onCancel(b.id)} disabled={busy}>
          Annuler la demande
        </button>
      )}
    </article>
  )
}

export default function MyBookingsPage({ onNavigate }) {
  const [status, setStatus] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    return getMyBookings({ status })
      .then((list) => { setItems(list); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    if (!window.confirm('Annuler cette demande ?')) return
    setBusyId(id)
    try {
      await cancelBooking(id)
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
        <h2>Mes demandes</h2>
        <p>Suis tes demandes de réservation auprès des guides et chauffeurs.</p>
      </div>

      <div className="bk-chips">
        {FILTERS.map((f) => (
          <button key={f.value} className={`bk-chip ${status === f.value ? 'active' : ''}`}
            onClick={() => setStatus(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="bk-error">{error}</p>}
      {loading && items.length === 0 && <p className="bk-state">Chargement…</p>}
      {!loading && !error && items.length === 0 && (
        <div className="bk-state">
          <p>Aucune demande pour l'instant.</p>
          <button className="bk-chip active" onClick={() => onNavigate?.('providers')}>Trouver un prestataire</button>
        </div>
      )}

      <div className="bk-list">
        {items.map((b) => <BookingCard key={b.id} b={b} onCancel={cancel} busy={busyId === b.id} />)}
      </div>
    </div>
  )
}