import './RightSidebar.css'
import TrendingDestinations from '../Destinations/TrendingDestinations'
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

function RightSidebar({ nextTrip = null, onNavigate, onOpenDestination }) {
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


      {/* ---- Les 3 blocs suivants restent statiques pour l'instant ---- */}

      {/* Travel mates */}
      <div className="panel">
        <div className="rs-title">People going your way</div>
        <div className="rs-sub">Travel Mates matched to your plans</div>

        <div className="mate-row">
          <span className="mate-ph g2"></span>
          <div className="info">
            <b>Sarah</b>
            <div>🇫🇷 Tokyo · Oct 12–24</div>
          </div>
          <span className="pct">94%</span>
        </div>

        <div className="mate-row">
          <span className="mate-ph g4"></span>
          <div className="info">
            <b>Adam</b>
            <div>🇩🇪 Kyoto · Oct 15–27</div>
          </div>
          <span className="pct">89%</span>
        </div>
      </div>


      {/* Trending : destinations les plus publiées */}
      <TrendingDestinations onOpen={onOpenDestination} />


      {/* Communities */}
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