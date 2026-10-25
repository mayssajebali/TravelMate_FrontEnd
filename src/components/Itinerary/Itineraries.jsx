import { useEffect, useState } from 'react'
import { Plus, Globe2 } from 'lucide-react'
import Itinerary from './Itinerary'
import ItineraryEditor from './ItineraryEditor'
import './Itinerary.css'
import {
  getItineraries, getItineraryByTrip, createItinerary, updateItinerary,
  deleteItinerary, copyItinerary, uploadItineraryCover, deleteItineraryCover,
} from '../../Api'

function Itineraries({ trip = null, onClose }) {
  const [scope, setScope] = useState('public') // 'mine' | 'public'
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState({ mode: 'list' }) // list | show | edit | new

  const load = (sc = scope) => {
    setLoading(true)
    setError('')
    getItineraries({ scope: sc })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  // 1) la liste
  useEffect(() => { load(scope) }, [scope])

  // 2) l'ouverture depuis un voyage
    useEffect(() => {
    if (!trip) return
    getItineraryByTrip(trip.id)
        .then((it) => setView(it ? { mode: 'show', it } : { mode: 'new', trip }))
        .catch((e) => setError(e.message))
    }, [trip?.id])
const goBack = () => (trip ? onClose?.() : setView({ mode: 'list' }))
const save = async (payload, cover = {}) => {
  let saved = view.mode === 'edit'
    ? await updateItinerary(view.it.id, payload)
    : await createItinerary(payload)

  try {
    if (cover.file) saved = await uploadItineraryCover(saved.id, cover.file)
    else if (cover.remove && saved.cover) saved = await deleteItineraryCover(saved.id)
  } catch (e) {
    setError(`Itinéraire enregistré, mais la couverture a échoué : ${e.message}`)
  }

  setScope('mine')
  load('mine')
  setView({ mode: 'show', it: saved })
}

  const remove = async (it) => {
    if (!window.confirm('Supprimer cet itinéraire ?')) return
    try {
      await deleteItinerary(it.id)
      setList((l) => l.filter((x) => x.id !== it.id))
      setView({ mode: 'list' })
      goBack()
    } catch (e) { setError(e.message) }
  }

  const copy = async (it) => {
    try {
      const mine = await copyItinerary(it.id)
      setScope('mine')
      load('mine')
      setView({ mode: 'show', it: mine })
    } catch (e) { setError(e.message) }
  }

  if (view.mode === 'show') {
    return (
      <Itinerary
        key={view.it.id}
        it={view.it}
        onBack={goBack}
        onEdit={(it) => setView({ mode: 'edit', it })}
        onDelete={remove}
        onCopy={copy}
        trip={view.trip}
      />
    )
  }

  if (view.mode === 'edit' || view.mode === 'new') {
    return (
      <ItineraryEditor
        initial={view.mode === 'edit' ? view.it : null}
        trip={view.trip}
        onSave={save}
        onCancel={() => (view.mode === 'edit' ? setView({ mode: 'show', it: view.it }) : goBack())}      />
    )
  }
if (trip && view.mode === 'list' && !error) {
  return <section className="itn"><p className="itn-empty">Chargement…</p></section>
}
  return (
    <section className="itn">
      <div className="itn-head">
        <h2>Itinéraires</h2>
        <button type="button" className="itn-btn primary" onClick={() => setView({ mode: 'new' })}>
          <Plus size={15} /> Nouvel itinéraire
        </button>
      </div>

      <div className="itn-tabs">
        <button type="button" className={`itn-tab${scope === 'public' ? ' on' : ''}`} onClick={() => setScope('public')}>
          Découvrir
        </button>
        <button type="button" className={`itn-tab${scope === 'mine' ? ' on' : ''}`} onClick={() => setScope('mine')}>
          Mes itinéraires
        </button>
      </div>

      {error && <p className="itn-error">{error}</p>}

      {loading ? (
        <p className="itn-empty">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="itn-empty">
          {scope === 'mine'
            ? "Tu n'as pas encore d'itinéraire. Crée le premier !"
            : "Aucun itinéraire public pour l'instant."}
        </p>
      ) : (
        <div className="itn-list">
          {list.map((it) => (
            <button key={it.id} type="button" className="itn-item" onClick={() => setView({ mode: 'show', it })}>
            <div className={`itn-cover${it.cover ? '' : ' empty'}`}>
                {it.cover && <img src={it.cover} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
                <span className="itn-cover-tag">{it.destination}</span>
            </div>
            <div className="itn-item-body">
                <b>{it.title}</b>
                <small>
                {it.days.length} jour{it.days.length > 1 ? 's' : ''} · {it.stops_count} étape{it.stops_count > 1 ? 's' : ''}
                {!it.is_mine && ` · ${it.author.full_name}`}
                {it.is_mine && it.is_public && <> · <Globe2 size={12} style={{ verticalAlign: '-1px' }} /> public</>}
                </small>
            </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default Itineraries