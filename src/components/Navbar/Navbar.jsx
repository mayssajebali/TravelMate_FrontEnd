import './Navbar.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

// même couleur d'avatar que dans le sidebar
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function Navbar({ user, onLogout }) {
  const name = user?.full_name ?? ''
  const photo = user?.avatar_url

  return (
    <header className="top">

      <div className="logo">
        <span className="mk g1">
          📍
        </span>

        TravelMate
      </div>

      <div className="searchbox">
        Where are you going?
      </div>

      <div className="top-right">

        <span className="status">
          Ready for adventure ✦
        </span>

        <span>🔔</span>
        <span>✉</span>

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
          Se déconnecter
        </button>

      </div>

    </header>
  )
}

export default Navbar