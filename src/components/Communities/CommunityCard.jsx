import { useState } from 'react'
import './Communities.css'

export default function CommunityCard({ community, onToggle, onOpen }) {
  const [busy, setBusy] = useState(false)
  const c = community

  const toggle = async () => {
    setBusy(true)
    try {
      await onToggle(c)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="comm-card">
      <div
        className="comm-cover comm-clickable"
        style={c.cover_image ? { backgroundImage: `url(${c.cover_image})` } : undefined}
        onClick={() => onOpen(c.id)}
      >
        {c.cover_image ? '' : c.name.charAt(0).toUpperCase()}
      </div>

      <div className="comm-body">
        <div className="comm-head">
          <h3 className="comm-clickable" onClick={() => onOpen(c.id)}>
            {c.name}
          </h3>
          {c.match > 0 && (
            <span className="comm-match">
              {c.match} thème{c.match > 1 ? 's' : ''} en commun
            </span>
          )}
        </div>

        {c.description && <p className="comm-desc">{c.description}</p>}

        <div className="comm-topics">
          {c.topics.map((t) => (
            <span
              key={t}
              className={`comm-topic${c.common_topics.includes(t) ? ' common' : ''}`}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="comm-foot">
          <span className="comm-members">
            {c.members_count} membre{c.members_count > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            className={`comm-btn${c.is_member ? ' joined' : ''}`}
            onClick={toggle}
            disabled={busy}
          >
            {c.is_member ? 'Quitter' : 'Rejoindre'}
          </button>
        </div>
      </div>
    </div>
  )
}