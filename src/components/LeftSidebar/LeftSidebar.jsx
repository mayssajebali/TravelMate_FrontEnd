import './LeftSidebar.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

// même couleur d'avatar à chaque fois pour un même utilisateur
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`

// section = clé utilisée par App.jsx ; null = pas encore disponible
const NAV = [
  { icon: '🏠', label: 'Accueil', section: 'feed' },
  { icon: '✈️', label: 'Mes voyages', section: 'trips' },
  { icon: '👤', label: 'Mon profil', section: 'profile' },
  { icon: '🧭', label: 'Explorer', section: null },
  { icon: '👥', label: 'Travel Mates', section: null },
  { icon: '🌍', label: 'Communautés', section: null },
  { icon: '✉️', label: 'Messages', section: null },
  { icon: '📌', label: 'Enregistrés', section: null },
]

function LeftSidebar({ user, stats = { trips: 0, upcoming: 0 }, section = 'feed', onNavigate }) {
  const name = user?.full_name ?? ''

  return (
    // la classe "lsidebar" garde la règle responsive de App.css (masqué < 1080px)
    <aside className="lsidebar lsb">
      <div className="lsb-panel">

        <button type="button" className="lsb-profile" onClick={() => onNavigate?.('profile')}>
          <span className={`lsb-ava ${gradientFor(user?.id)}`}>
            {name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="lsb-name">{name}</span>
          <span className="lsb-mail">{user?.email}</span>
        </button>

        <nav className="lsb-nav">
          {NAV.map(({ icon, label, section: key }) =>
            key ? (
              <button
                key={label}
                type="button"
                className={`lsb-link${section === key ? ' active' : ''}`}
                onClick={() => onNavigate?.(key)}
              >
                <span aria-hidden="true">{icon}</span>{label}
              </button>
            ) : (
              <button key={label} type="button" className="lsb-link soon" aria-disabled="true" title="Bientôt disponible">
                <span aria-hidden="true">{icon}</span>{label}
              </button>
            ),
          )}
        </nav>

        <div className="lsb-title">Ton monde</div>
        <div className="lsb-stats">
          <div>{plural(stats.trips, 'voyage')}</div>
          <div>{plural(stats.upcoming, 'voyage')} à venir</div>
        </div>

      </div>
    </aside>
  )
}

export default LeftSidebar