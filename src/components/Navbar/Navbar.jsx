import './Navbar.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

// même couleur d'avatar que dans le sidebar
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

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

const PinIcon = () => (
  <svg {...svgProps} width={16} height={16}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

const SearchIcon = () => (
  <svg {...svgProps} width={18} height={18}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.800-3.800" />
  </svg>
)

const BellIcon = () => (
  <svg {...svgProps}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
)

const MailIcon = () => (
  <svg {...svgProps}>
    <rect x="3" y="5" width="18" height="14" rx="2.500" />
    <path d="m3.500 7 8.500 6.500L20.500 7" />
  </svg>
)

const LogoutIcon = () => (
  <svg {...svgProps} width={16} height={16}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 8l4 4-4 4" />
    <path d="M20 12H9" />
  </svg>
)

function Navbar({ user, onLogout }) {
  const name = user?.full_name ?? ''
  const photo = user?.avatar_url

  return (
    <header className="top">
      <div className="logo">
        <span className="mk g1"><PinIcon /></span>
        TravelMate
      </div>

      <label className="searchbox">
        <SearchIcon />
        <input
          type="search"
          placeholder="Où vas-tu ?"
          aria-label="Rechercher une destination"
        />
      </label>

      <div className="top-right">
        <span className="status">
          <i className="status-dot" aria-hidden="true" />
          Prêt pour l'aventure
        </span>

        <button type="button" className="top-icon" aria-label="Notifications" title="Notifications">
          <BellIcon />
        </button>

        <button type="button" className="top-icon" aria-label="Messages" title="Messages">
          <MailIcon />
        </button>

        <span
          className={`ava ${gradientFor(user?.id)} avatar-small`}
          title={name}
          style={photo ? {
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {photo ? '' : name.trim().charAt(0).toUpperCase()}
        </span>

        <button type="button" className="logout-btn" onClick={onLogout}>
          <LogoutIcon />
          Se déconnecter
        </button>
      </div>
    </header>
  )
}

export default Navbar