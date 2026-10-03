import { useState } from 'react'
import { createTrip, updateTrip, deleteTrip } from '../../Api'
import './Trips.css'

const EMPTY = { title: '', destination: '', start_date: '', end_date: '', budget: '', description: '', activities: '' }

const pad = (n) => String(n).padStart(2, '0')
const day = (iso) => (iso || '').slice(0, 10)
const fmt = (iso) =>
  new Date(`${day(iso)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const nights = (t) => Math.round((new Date(day(t.end_date)) - new Date(day(t.start_date))) / 86400000)
const statusOf = (t) => {
  const n = todayStr()
  if (day(t.end_date) < n) return 'past'
  if (day(t.start_date) <= n) return 'ongoing'
  return 'upcoming'
}
const STATUS_LABEL = { upcoming: 'Upcoming', ongoing: 'Happening now', past: 'Past' }

function TripCard({ trip, onEdit, onDelete }) {
  const st = statusOf(trip)
  const n = nights(trip)
  return (
    <article className="trip-card">
      <div className="trip-top">
        <div>
          <h3>{trip.title}</h3>
          <div className="trip-dest">📍 {trip.destination}</div>
        </div>
        <span className={`trip-status ${st}`}>{STATUS_LABEL[st]}</span>
      </div>

      <div className="trip-meta">
        <span>{fmt(trip.start_date)} → {fmt(trip.end_date)}</span>
        <span>{n} night{n !== 1 ? 's' : ''}</span>
        {trip.budget > 0 && <span>Budget {trip.budget.toLocaleString()}</span>}
      </div>

      {trip.description && <p className="trip-desc">{trip.description}</p>}

      {trip.activities?.length > 0 && (
        <div className="trip-tags">
          {trip.activities.map((a) => <span key={a}>{a}</span>)}
        </div>
      )}

      <div className="trip-actions">
        <button type="button" onClick={() => onEdit(trip)}>Edit</button>
        <button type="button" className="danger" onClick={() => onDelete(trip)}>Delete</button>
      </div>
    </article>
  )
}

export default function TripsPage({ trips, onChange }) {
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const reset = () => { setForm(EMPTY); setEditingId(null); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.destination.trim()) return setError('Title and destination are required.')
    if (!form.start_date || !form.end_date) return setError('Pick a start date and an end date.')
    if (form.end_date < form.start_date) return setError('The end date must be after the start date.')

    const body = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      budget: Number(form.budget || 0),
      description: form.description.trim(),
      activities: form.activities.split(',').map((s) => s.trim()).filter(Boolean),
    }
    setBusy(true)
    try {
      if (editingId) await updateTrip(editingId, body)
      else await createTrip(body)
      await onChange()
      reset()
    } catch (ex) {
      setError(ex.message)
    } finally {
      setBusy(false)
    }
  }

  const edit = (t) => {
    setEditingId(t.id)
    setError('')
    setForm({
      title: t.title,
      destination: t.destination,
      start_date: day(t.start_date),
      end_date: day(t.end_date),
      budget: t.budget || '',
      description: t.description || '',
      activities: (t.activities || []).join(', '),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return
    try {
      await deleteTrip(t.id)
      if (editingId === t.id) reset()
      await onChange()
    } catch (ex) {
      setError(ex.message)
    }
  }

  const byStart = (a, b) => day(a.start_date).localeCompare(day(b.start_date))
  const current = trips.filter((t) => statusOf(t) !== 'past').sort(byStart)
  const past = trips.filter((t) => statusOf(t) === 'past').sort((a, b) => byStart(b, a))

  return (
    <section className="trips-page">
      <form className="panel trips-form" onSubmit={submit} noValidate>
        <h2>{editingId ? 'Edit trip' : 'Plan a new trip'}</h2>
        {error && <div className="trips-error" role="alert">{error}</div>}

        <div className="trips-grid">
          <label>Title
            <input value={form.title} onChange={set('title')} maxLength={100} placeholder="Summer in Japan" />
          </label>
          <label>Destination
            <input value={form.destination} onChange={set('destination')} maxLength={100} placeholder="Tokyo" />
          </label>
          <label>Departure
            <input type="date" value={form.start_date} onChange={set('start_date')} />
          </label>
          <label>Return
            <input type="date" value={form.end_date} min={form.start_date || undefined} onChange={set('end_date')} />
          </label>
          <label>Budget
            <input type="number" min="0" value={form.budget} onChange={set('budget')} placeholder="0" />
          </label>
          <label>Activities <small>(comma separated)</small>
            <input value={form.activities} onChange={set('activities')} placeholder="Hiking, Street food, Temples" />
          </label>
        </div>

        <label>Description
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What do you have in mind?" />
        </label>

        <div className="trips-buttons">
          <button className="trips-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add trip'}
          </button>
          {editingId && <button type="button" className="trips-ghost" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <h2 className="trips-heading">Upcoming &amp; current</h2>
      {current.length === 0
        ? <div className="trips-empty">No upcoming trip yet. Plan your first adventure above.</div>
        : current.map((t) => <TripCard key={t.id} trip={t} onEdit={edit} onDelete={remove} />)}

      {past.length > 0 && (
        <>
          <h2 className="trips-heading">Past trips</h2>
          {past.map((t) => <TripCard key={t.id} trip={t} onEdit={edit} onDelete={remove} />)}
        </>
      )}
    </section>
  )
}