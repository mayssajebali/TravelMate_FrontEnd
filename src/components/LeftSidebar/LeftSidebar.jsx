import './LeftSidebar.css'
import { Route } from 'lucide-react'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

// même couleur d'avatar à chaque fois pour un même utilisateur
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`
const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const Icons = {
  home: (
    <svg {...svgProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),
  plane: (
    <svg {...svgProps}>
      <path d="M10.2 13.8 3 11.5l1.4-1.4 8-.9L16.5 5a2 2 0 1 1 2.5 2.5l-4.2 4.2-.9 8-1.4 1.4-2.3-7.2z" />
      <path d="m10.2 13.8-3.4 3.4" />
    </svg>
  ),
  user: (
    <svg {...svgProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  compass: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5z" />
    </svg>
  ),
  users: (
    <svg {...svgProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6" />
      <path d="M18 14.3c2.2.6 3.5 2.6 3.5 5.7" />
    </svg>
  ),
  globe: (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  ),
  mail: (
    <svg {...svgProps}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </svg>
  ),
  bookmark: (
    <svg {...svgProps}>
      <path d="M6 3h12v18l-6-4.5L6 21z" />
    </svg>
  ),
}

// section = clé utilisée par App.jsx ; null = pas encore disponible
const NAV = [
  { icon: Icons.home, label: 'Accueil', section: 'feed' },
  { icon: Icons.plane, label: 'Mes voyages', section: 'trips' },
  { icon: <Route size={20} strokeWidth={1.8} />, label: 'Itinéraires', section: 'itineraries' },
  { icon: Icons.user, label: 'Mon profil', section: 'profile' },
  { icon: Icons.compass, label: 'Explorer', section: 'explore' },
  { icon: Icons.users, label: 'Travel Mates', section: null },
  { icon: Icons.globe, label: 'Communautés', section: null },
  { icon: Icons.mail, label: 'Messages', section: null },
  { icon: Icons.bookmark, label: 'Enregistrés', section: 'saved' },
]

function LeftSidebar({ user, stats = { trips: 0, upcoming: 0 }, section = 'feed', onNavigate }) {
  const name = user?.full_name ?? ''
  const photo = user?.avatar_url

  return (
    <aside className="lsidebar lsb">
      <div className="lsb-panel">

        <button type="button" className="lsb-profile" onClick={() => onNavigate?.('profile')}>
          <span
            className={`lsb-ava ${gradientFor(user?.id)}`}
            style={photo ? {
              backgroundImage: `url(${photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {photo ? '' : name.trim().charAt(0).toUpperCase()}
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