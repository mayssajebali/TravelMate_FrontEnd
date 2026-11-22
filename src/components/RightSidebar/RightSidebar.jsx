import './RightSidebar.css'
import FollowPanel from '../Followers/FollowPanel'
import TrendingDestinations from '../Destinations/TrendingDestinations'
import MatesPanel from '../Mates/MatesPanel'

const dayOnly = (iso) => (iso || '').slice(0, 10)
const shortDate = (iso) =>
  new Date(`${dayOnly(iso)}T00:00:00`)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toUpperCase()

function daysUntil(iso) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(`${dayOnly(iso)}T00:00:00`) - today) / 86400000)
}

function RightSidebar({ nextTrip = null, onNavigate, onOpenDestination, onMessage })  {
  const days = nextTrip ? daysUntil(nextTrip.start_date) : null

  return (
    <aside className="rsidebar">

      {/* Next adventure : données réelles */}
      <div className="panel">
        <div className="rs-title">Your next adventure</div>

        {nextTrip ? (
          <>
            <div className="adv-card g3">
              <div className="eb">
                {shortDate(nextTrip.start_date)} — {shortDate(nextTrip.end_date)}
              </div>
              <h3>{nextTrip.destination}</h3>
              <div className="rt">
                {nextTrip.title} · {days === 0 ? 'starts today' : `${days} days to go`}
              </div>
            </div>
            <button className="mini-btn" onClick={() => onNavigate?.('trips')}>Open trip</button>
          </>
        ) : (
          <>
            <p className="rs-sub">No upcoming trip yet.</p>
            <button className="mini-btn" onClick={() => onNavigate?.('trips')}>Plan a trip</button>
          </>
        )}
      </div>

      <FollowPanel />

      {/* Travel mates : suggestions calculées (US25) */}
      <MatesPanel onNavigate={onNavigate} onMessage={onMessage} />

      {/* Trending : destinations les plus publiées */}
      <TrendingDestinations onOpen={onOpenDestination} />

      <MatesPanel onNavigate={onNavigate} onMessage={onMessage} />

      {/* Communities (statique pour l'instant) */}
      <div className="panel">
        <div className="rs-title">Your communities</div>

        <div className="comm-row">
          <span className="comm-ph g5"></span>
          <div>Solo Travelers<small>28K members</small></div>
        </div>
        <div className="comm-row">
          <span className="comm-ph g3"></span>
          <div>Asia Backpackers<small>18K members</small></div>
        </div>
        <div className="comm-row">
          <span className="comm-ph g4"></span>
          <div>Travel Photography<small>14K members</small></div>
        </div>

        <button className="mini-btn discover">Discover more</button>
      </div>

    </aside>
  )
}

export default RightSidebar