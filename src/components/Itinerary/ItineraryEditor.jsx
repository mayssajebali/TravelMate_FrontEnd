import ItineraryMap from './ItineraryMap'
import { CATEGORIES, STATUSES, CURRENCY, emptyDay, emptyStop, hasCoords } from './itineraryUtils'
import './Itinerary.css'
import { useRef, useState } from 'react'
import { MapPin, Plus, Trash2, Check, ImagePlus } from 'lucide-react'

const blank = () => ({
  title: '', destination: '', description: '', start_date: '', is_public: false, days: [emptyDay()],
})

const fromApi = (it) => ({
  ...it,
  start_date: it.start_date ?? '',
  days: it.days.map((d) => ({ title: d.title, stops: d.stops.map((s) => ({ ...s })) })),
})
const nbDays = (t) => {
  const n = Math.round((new Date(t.end_date) - new Date(t.start_date)) / 86400000) + 1
  return Math.min(Math.max(n, 1), 30)
}

const fromTrip = (t) => ({
  title: t.title, destination: t.destination, description: '',
  start_date: t.start_date, is_public: false, trip: t.id,
  days: Array.from({ length: nbDays(t) }, emptyDay),
})
const cleanStop = (s) => ({
  title: s.title.trim(),
  category: s.category,
  time: s.time || '',
  duration_min: s.duration_min === '' || s.duration_min == null ? null : Number(s.duration_min),
  lat: hasCoords(s) ? s.lat : null,
  lng: hasCoords(s) ? s.lng : null,
  cost: Number(s.cost) || 0,
  status: s.status,
  notes: (s.notes || '').trim(),
})

function ItineraryEditor({ initial, trip, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ? { ...fromApi(initial), trip: initial.trip?.id ?? null }
            : trip ? fromTrip(trip) : { ...blank(), trip: null },
  )
  const [pick, setPick] = useState(null) // { d, i } : étape en cours de placement
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
const [coverFile, setCoverFile] = useState(null)
const [coverPreview, setCoverPreview] = useState(initial?.cover || '')
const [coverRemoved, setCoverRemoved] = useState(false)
const fileRef = useRef(null)

const pickCover = (e) => {
  const f = e.target.files?.[0]
  if (!f) return
  if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  setCoverFile(f)
  setCoverPreview(URL.createObjectURL(f))
  setCoverRemoved(false)
}

const clearCover = () => {
  if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
  setCoverFile(null)
  setCoverPreview('')
  setCoverRemoved(true)
  if (fileRef.current) fileRef.current.value = ''
}
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const patchDay = (d, patch) =>
    setForm((f) => ({ ...f, days: f.days.map((x, j) => (j === d ? { ...x, ...patch } : x)) }))

  const patchStop = (d, i, patch) =>
    setForm((f) => ({
      ...f,
      days: f.days.map((day, j) =>
        j !== d ? day : { ...day, stops: day.stops.map((s, k) => (k === i ? { ...s, ...patch } : s)) },
      ),
    }))

  const addStop = (d) => patchDay(d, { stops: [...form.days[d].stops, emptyStop()] })
  const removeStop = (d, i) => {
    patchDay(d, { stops: form.days[d].stops.filter((_, k) => k !== i) })
    setPick(null)
  }
  const addDay = () => setForm((f) => ({ ...f, days: [...f.days, emptyDay()] }))
  const removeDay = (d) => {
    setForm((f) => ({ ...f, days: f.days.filter((_, j) => j !== d) }))
    setPick(null)
  }

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await onSave({
        trip: form.trip,
        title: form.title.trim(),
        destination: form.destination.trim(),
        description: form.description.trim(),
        start_date: form.start_date || null,
        is_public: form.is_public,
        days: form.days.map((d) => ({
          title: d.title.trim(),
          stops: d.stops.filter((s) => s.title.trim()).map(cleanStop),
        })),
      },
      { file: coverFile, remove: coverRemoved },
    )
    } catch (e) {
      setError(e.message || 'Enregistrement impossible.')
      setBusy(false)
    }
  }

  const valid = form.title.trim() && form.destination.trim()

  return (
    <section className="itn">
      <h2>{initial ? "Modifier l'itinéraire" : 'Nouvel itinéraire'}</h2>
<div className="ed-cover">
  {coverPreview ? (
    <>
      <img src={coverPreview} alt="Aperçu de la couverture" />
      <div className="ed-cover-actions">
        <button type="button" className="itn-btn" onClick={() => fileRef.current?.click()}>Changer</button>
        <button type="button" className="itn-btn danger" onClick={clearCover}>Retirer</button>
      </div>
    </>
  ) : (
    <button type="button" className="ed-cover-empty" onClick={() => fileRef.current?.click()}>
      <ImagePlus size={22} strokeWidth={1.6} />
      Ajouter une photo de couverture
    </button>
  )}
  <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickCover} />
</div>
      <div className="ed-grid">
        <label>
          Titre
          <input value={form.title} maxLength={120} placeholder="3 jours à Marrakech"
                 onChange={(e) => setField('title', e.target.value)} />
        </label>
        <label>
          Destination
          <input value={form.destination} disabled={!!form.trip} maxLength={100} placeholder="Marrakech, Maroc"
                 onChange={(e) => setField('destination', e.target.value)} />
        </label>
        <label>
          Date de départ
          <input type="date" value={form.start_date} disabled={!!form.trip}
                 onChange={(e) => setField('start_date', e.target.value)} />
        </label>
        <label className="ed-check">
          <input type="checkbox" checked={form.is_public}
                 onChange={(e) => setField('is_public', e.target.checked)} />
          Rendre public (les autres voyageurs pourront le copier)
        </label>
      </div>

      <label className="ed-block">
        Description
        <textarea rows={2} maxLength={1000} value={form.description}
                  placeholder="Un court résumé de ce voyage…"
                  onChange={(e) => setField('description', e.target.value)} />
      </label>

      {form.days.map((day, d) => (
        <div key={d} className="ed-day">
          <div className="ed-day-head">
            <b>Jour {d + 1}</b>
            <input value={day.title} maxLength={100} placeholder="Titre du jour (ex : Médina et souks)"
                   onChange={(e) => patchDay(d, { title: e.target.value })} />
            {form.days.length > 1 && (
              <button type="button" className="ed-icon danger" aria-label={`Supprimer le jour ${d + 1}`}
                      onClick={() => removeDay(d)}>
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {day.stops.map((s, i) => {
            const picking = pick && pick.d === d && pick.i === i
            return (
              <div key={i} className="ed-stop">
                <input type="time" value={s.time} aria-label="Heure"
                       onChange={(e) => patchStop(d, i, { time: e.target.value })} />
                <input className="grow" value={s.title} maxLength={120} placeholder="Nom de l'étape"
                       onChange={(e) => patchStop(d, i, { title: e.target.value })} />
                <select value={s.category} aria-label="Catégorie"
                        onChange={(e) => patchStop(d, i, { category: e.target.value })}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={s.status} aria-label="Statut"
                        onChange={(e) => patchStop(d, i, { status: e.target.value })}>
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className="num" type="number" min="0" value={s.cost} aria-label={`Coût en ${CURRENCY}`}
                       onChange={(e) => patchStop(d, i, { cost: e.target.value })} />
                <button type="button"
                        className={`ed-icon${picking ? ' on' : ''}${hasCoords(s) ? ' placed' : ''}`}
                        aria-label="Placer sur la carte" title="Placer sur la carte"
                        onClick={() => setPick(picking ? null : { d, i })}>
                  {hasCoords(s) && !picking ? <Check size={16} /> : <MapPin size={16} />}
                </button>
                <button type="button" className="ed-icon danger" aria-label="Supprimer l'étape"
                        onClick={() => removeStop(d, i)}>
                  <Trash2 size={16} />
                </button>
                <input className="full" value={s.notes} maxLength={500} placeholder="Notes (réservation, adresse…)"
                       onChange={(e) => patchStop(d, i, { notes: e.target.value })} />
              </div>
            )
          })}

          <button type="button" className="itn-btn" onClick={() => addStop(d)}>
            <Plus size={15} /> Ajouter une étape
          </button>

          {pick && pick.d === d && (
            <div className="ed-map">
              <p>Clique sur la carte pour placer « {day.stops[pick.i]?.title || `étape ${pick.i + 1}`} ».</p>
              <ItineraryMap
                stops={day.stops}
                activeIndex={pick.i}
                onPick={(lat, lng) => { patchStop(d, pick.i, { lat, lng }); setPick(null) }}
              />
            </div>
          )}
        </div>
      ))}

      <button type="button" className="itn-btn" onClick={addDay}>
        <Plus size={15} /> Ajouter un jour
      </button>

      {error && <p className="itn-error">{error}</p>}

      <div className="ed-foot">
        <button type="button" className="itn-btn" onClick={onCancel}>Annuler</button>
        <button type="button" className="itn-btn primary" onClick={submit} disabled={busy || !valid}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </section>
  )
}

export default ItineraryEditor