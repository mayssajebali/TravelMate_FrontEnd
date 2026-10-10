import { budgetText, coverStyle, gradientClass, plural } from './utils'

export default function DestinationCard({ destination: d, onOpen }) {
  const open = () => onOpen(d.slug)

  return (
    <article
      className="dest-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
    >
      <div
        className={`dest-cover ${d.cover_url ? '' : gradientClass(d.slug)}`}
        style={coverStyle(d.cover_url)}
      >
        {!d.cover_url && <span className="dest-initial">{d.name[0]}</span>}
      </div>

      <div className="dest-info">
        <h3>{d.name}</h3>
        <p className="dest-country">{d.country}</p>

        <div className="dest-meta">
          <span>🗓 {d.best_season || '—'}</span>
          <span>💶 {budgetText(d.avg_budget)} / semaine</span>
        </div>

        <div className="dest-tags">
          {d.tags.slice(0, 3).map((t) => <span key={t} className="dest-tag">{t}</span>)}
        </div>

        <p className="dest-count">
          {d.posts_count === 0 ? 'Aucune publication' : plural(d.posts_count, 'publication', 'publications')}
        </p>
      </div>
    </article>
  )
}