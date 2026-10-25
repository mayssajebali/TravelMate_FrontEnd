import { useEffect, useState } from 'react'
import { getProviders, getProvider, createBooking } from '../../Api'
import './Providers.css'

const PAGE = 12
const TYPES = [
  { value: '', label: 'Tous' },
  { value: 'guide', label: 'Guides' },
  { value: 'chauffeur', label: 'Chauffeurs' },
]
const EMPTY = {
  q: '', service_type: '', country: '', city: '',
  max_rate: '', available_from: '', available_to: '', ordering: 'newest',
}

const typeLabel = (t) => (t === 'guide' ? 'Guide' : t === 'chauffeur' ? 'Chauffeur' : '')
const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR') : '')
const place = (p) => [p.city, p.country].filter(Boolean).join(', ')
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1

function Avatar({ p, big }) {
  const cls = `prv-ava${big ? ' prv-ava--big' : ''}`
  return p.avatar_url
    ? <img className={cls} src={p.avatar_url} alt="" />
    : <span className={`${cls} prv-ava--initial`}>{(p.full_name || '?').charAt(0).toUpperCase()}</span>
}

function ProviderCard({ p, onOpen }) {
  return (
    <article className="prv-card" role="button" tabIndex={0}
      onClick={() => onOpen(p.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p.id) } }}>
      <div className="prv-card-head">
        <Avatar p={p} />
        <div>
          <h3>{p.full_name}</h3>
          <p className="prv-muted">{place(p) || '—'}</p>
        </div>
        <span className={`prv-badge prv-badge--${p.service_type}`}>{typeLabel(p.service_type)}</span>
      </div>
      <p className="prv-desc">{p.service_description || p.bio || 'Aucune description.'}</p>
      <div className="prv-meta">
        <span>📍 {p.service_location || '—'}</span>
        <b>{p.daily_rate > 0 ? `${p.daily_rate} € / jour` : 'Tarif sur demande'}</b>
      </div>
    </article>
  )
}

function BookingForm({ provider, onSent }) {
  const [form, setForm] = useState({ start_date: '', end_date: '', people: 1, message: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.start_date && form.end_date && form.end_date >= form.start_date
  const days = valid ? daysBetween(form.start_date, form.end_date) : 0
  const total = days * (provider.daily_rate || 0)

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) { setError('Choisis des dates valides.'); return }
    setBusy(true)
    setError('')
    try {
      await createBooking({
        provider_id: provider.id,
        start_date: form.start_date,
        end_date: form.end_date,
        people: Number(form.people) || 1,
        message: form.message.trim(),
      })
      onSent()
    } catch (err) {
      setError(err.message || 'Envoi impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="prv-booking" onSubmit={submit}>
      <h3 className="prv-title">Demander une réservation</h3>
      <div className="prv-booking-row">
        <label>Du
          <input type="date" min={todayIso()} value={form.start_date} onChange={set('start_date')} required />
        </label>
        <label>Au
          <input type="date" min={form.start_date || todayIso()} value={form.end_date} onChange={set('end_date')} required />
        </label>
        <label>Personnes
          <input type="number" min="1" max="50" value={form.people} onChange={set('people')} />
        </label>
      </div>
      <label>Message (facultatif)
        <textarea rows={3} maxLength={1000} value={form.message} onChange={set('message')}
          placeholder="Décris ce que tu souhaites faire, le lieu de rendez-vous…" />
      </label>

      {valid && (
        <p className="prv-estimate">
          {days} jour{days > 1 ? 's' : ''}
          {provider.daily_rate > 0 ? ` × ${provider.daily_rate} € = ` : ' · tarif sur demande'}
          {provider.daily_rate > 0 && <b>{total} € (estimation)</b>}
        </p>
      )}

      {error && <p className="prv-error">{error}</p>}
      <button className="prv-cta" type="submit" disabled={busy || !valid}>
        {busy ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  )
}

function ProviderDetail({ id, onBack, onNavigate }) {
  const [p, setP] = useState(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    let cancelled = false
    setP(null)
    setError('')
    setSent(false)
    getProvider(id)
      .then((d) => !cancelled && setP(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => { cancelled = true }
  }, [id])

  if (error) {
    return (
      <div className="prv-page">
        <button className="prv-back" onClick={onBack}>← Tous les prestataires</button>
        <p className="prv-error">{error}</p>
      </div>
    )
  }
  if (!p) return <p className="prv-state">Chargement…</p>

  const booked = p.booked ?? []

  return (
    <div className="prv-page">
      <button className="prv-back" onClick={onBack}>← Tous les prestataires</button>

      <section className="prv-box">
        <div className="prv-detail-head">
          <Avatar p={p} big />
          <div>
            <h2>{p.full_name}</h2>
            <p className="prv-muted">{place(p) || '—'}</p>
            <span className={`prv-badge prv-badge--${p.service_type}`}>{typeLabel(p.service_type)}</span>
          </div>
        </div>

        <div className="prv-facts">
          <div><b>{p.daily_rate > 0 ? `${p.daily_rate} €` : '—'}</b><span>Tarif / jour</span></div>
          <div><b>{p.service_location || '—'}</b><span>Zone d'intervention</span></div>
          <div><b>{p.availabilities.length}</b><span>{p.availabilities.length > 1 ? 'périodes disponibles' : 'période disponible'}</span></div>
        </div>

        {p.service_description && (<><h3 className="prv-title">Service proposé</h3><p className="prv-text">{p.service_description}</p></>)}
        {p.bio && (<><h3 className="prv-title">À propos</h3><p className="prv-text">{p.bio}</p></>)}

        <h3 className="prv-title">Disponibilités</h3>
        {p.availabilities.length === 0
          ? <p className="prv-muted">Aucune période renseignée.</p>
          : <ul className="prv-periods">{p.availabilities.map((a, i) => <li key={i}>Du {fmtDate(a.start)} au {fmtDate(a.end)}</li>)}</ul>}

        {booked.length > 0 && (
          <>
            <h3 className="prv-title">Déjà réservé</h3>
            <ul className="prv-periods prv-periods--booked">
              {booked.map((b, i) => <li key={i}>Du {fmtDate(b.start)} au {fmtDate(b.end)}</li>)}
            </ul>
          </>
        )}

        {sent ? (
          <div className="prv-success">
            <p>✓ Demande envoyée. Le prestataire va te répondre.</p>
            <button className="prv-cta" onClick={() => onNavigate?.('bookings')}>Voir mes demandes</button>
          </div>
        ) : (
          <BookingForm provider={p} onSent={() => setSent(true)} />
        )}
      </section>
    </div>
  )
}

export default function ProvidersPage({ onNavigate }) {
  const [filters, setFilters] = useState(EMPTY)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (openId) return
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      getProviders({ ...filters, limit: PAGE, skip: 0 })
        .then((list) => {
          if (cancelled) return
          setItems(list)
          setHasMore(list.length === PAGE)
          setError('')
        })
        .catch((e) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false))
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [filters, openId])

  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const list = await getProviders({ ...filters, limit: PAGE, skip: items.length })
      setItems((l) => [...l, ...list])
      setHasMore(list.length === PAGE)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMore(false)
    }
  }

  if (openId) return <ProviderDetail id={openId} onBack={() => setOpenId(null)} onNavigate={onNavigate} />

  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY)

  return (
    <div className="prv-page">
      <div className="prv-header">
        <h2>Prestataires</h2>
        <p>Trouve un guide ou un chauffeur adapté à ton voyage.</p>
      </div>

      <input className="prv-search" placeholder="Rechercher un nom, une ville, une langue…"
        value={filters.q} onChange={set('q')} />

      <div className="prv-chips">
        {TYPES.map((t) => (
          <button key={t.value} className={`prv-chip ${filters.service_type === t.value ? 'active' : ''}`}
            onClick={() => setFilters((f) => ({ ...f, service_type: t.value }))}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="prv-filters">
        <label>Pays<input value={filters.country} onChange={set('country')} placeholder="Ex : Tunisie" /></label>
        <label>Ville<input value={filters.city} onChange={set('city')} placeholder="Ex : Tunis" /></label>
        <label>Tarif max (€/jour)<input type="number" min="0" value={filters.max_rate} onChange={set('max_rate')} /></label>
        <label>Disponible du<input type="date" value={filters.available_from} onChange={set('available_from')} /></label>
        <label>au<input type="date" min={filters.available_from} value={filters.available_to} onChange={set('available_to')} /></label>
        <label>Trier par
          <select value={filters.ordering} onChange={set('ordering')}>
            <option value="newest">Plus récents</option>
            <option value="rate_asc">Prix croissant</option>
            <option value="rate_desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      {dirty && <button className="prv-reset" onClick={() => setFilters(EMPTY)}>Réinitialiser les filtres</button>}

      {error && <p className="prv-error">{error}</p>}
      {loading && items.length === 0 && <p className="prv-state">Chargement…</p>}
      {!loading && !error && items.length === 0 && <p className="prv-state">Aucun prestataire ne correspond à ta recherche.</p>}

      <div className="prv-grid">
        {items.map((p) => <ProviderCard key={p.id} p={p} onOpen={setOpenId} />)}
      </div>

      {hasMore && (
        <button className="prv-chip prv-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </div>
  )
}