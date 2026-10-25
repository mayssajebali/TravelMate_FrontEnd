import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2, Copy } from 'lucide-react'
import ItineraryMap from './ItineraryMap'
import { CATEGORIES, STATUSES, CURRENCY, totalKm, dayDate } from './itineraryUtils'
import './Itinerary.css'

function Itinerary({ it, onBack, onEdit, onDelete, onCopy }) {
  const [day, setDay] = useState(0)
  const [active, setActive] = useState(null)

  const current = it.days[day] ?? { title: '', stops: [] }
  const date = dayDate(it.start_date, day)

  const changeDay = (i) => { setDay(i); setActive(null) }

  return (
    <section className="itn">
      <button type="button" className="itn-back" onClick={onBack}>
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="itn-head">
        <div>
          <h2>{it.title}</h2>
          <p className="itn-sub">
            {it.destination}
            {it.start_date && ` · ${new Date(`${it.start_date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            {!it.is_mine && ` · par ${it.author.full_name}`}
          </p>
        </div>

        <div className="itn-actions">
          {it.is_mine ? (
            <>
              <button type="button" className="itn-btn" onClick={() => onEdit(it)}>
                <Pencil size={15} /> Modifier
              </button>
              <button type="button" className="itn-btn danger" onClick={() => onDelete(it)}>
                <Trash2 size={15} /> Supprimer
              </button>
            </>
          ) : (
            <button type="button" className="itn-btn primary" onClick={() => onCopy(it)}>
              <Copy size={15} /> Copier dans mes itinéraires
            </button>
          )}
        </div>
      </div>

      {it.description && <p className="itn-desc">{it.description}</p>}

      <div className="itn-stats">
        <div><span>Jours</span><b>{it.days.length}</b></div>
        <div><span>Étapes</span><b>{it.stops_count}</b></div>
        <div>
        <span>Budget</span>
        <b>
            {Math.round(it.budget)}{it.trip ? ` / ${Math.round(it.trip.budget)}` : ''} {CURRENCY}
        </b>
        </div>
        <div><span>Distance</span><b>{totalKm(it.days)} km</b></div>
      </div>

      {it.days.length === 0 ? (
        <p className="itn-empty">Cet itinéraire n'a pas encore de jours.</p>
      ) : (
        <>
          <div className="itn-tabs" role="tablist">
            {it.days.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === day}
                className={`itn-tab${i === day ? ' on' : ''}`}
                onClick={() => changeDay(i)}
              >
                Jour {i + 1}
              </button>
            ))}
          </div>

          <ItineraryMap stops={current.stops} activeIndex={active} onSelect={setActive} />

          <h3 className="itn-day">
            {current.title || `Jour ${day + 1}`}
            {date && <small>{date}</small>}
          </h3>

          <ol className="itn-timeline">
            {current.stops.map((s, i) => {
              const { Icon, label } = CATEGORIES[s.category] ?? CATEGORIES.other
              return (
                <li key={s.id ?? i} className="itn-stop">
                  <div className="itn-rail">
                    <span className={`itn-ico cat-${s.category}`}><Icon size={17} strokeWidth={1.8} /></span>
                    {i < current.stops.length - 1 && <span className="itn-line" />}
                  </div>

                  <button
                    type="button"
                    className={`itn-card${active === i ? ' on' : ''}`}
                    onClick={() => setActive(i)}
                  >
                    <span className="itn-card-top">
                      <span>{s.time || '—'}{s.duration_min ? ` · ${s.duration_min} min` : ''}</span>
                      <span className={`itn-badge st-${s.status}`}>{STATUSES[s.status]}</span>
                    </span>
                    <b>{s.title}</b>
                    <small>
                      {label}
                      {s.cost > 0 && ` · ${s.cost} ${CURRENCY}`}
                    </small>
                    {s.notes && <p>{s.notes}</p>}
                  </button>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}

export default Itinerary