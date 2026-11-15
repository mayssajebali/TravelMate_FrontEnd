import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  getNotifications, getUnreadCount, markNotificationRead,
  markAllNotificationsRead, deleteNotification,
} from '../../Api'
import './NotificationBell.css'

const ICONS = {
  like: '❤️', comment: '💬', follow: '👤',
  booking_request: '📩', booking_accepted: '✅', booking_refused: '❌', booking_cancelled: '🚫',
  message: '✉️', group: '👥',
}

function timeAgo(iso) {
  if (!iso) return ''
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z')
  const s = Math.max(1, Math.floor((Date.now() - date) / 1000))
  if (s < 60) return "à l'instant"
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} h`
  return `${Math.floor(s / 86400)} j`
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)

  const refreshCount = useCallback(() => {
    if (document.hidden) return
    getUnreadCount().then((r) => setCount(r.count)).catch(() => {})
  }, [])

  const refreshList = useCallback(() => {
    setLoading(true)
    getNotifications({ limit: 20 })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // sondage toutes les 30 s
  useEffect(() => {
    refreshCount()
    const t = setInterval(() => {
      refreshCount()
      if (open && !document.hidden) refreshList()
    }, 30000)
    return () => clearInterval(t)
  }, [refreshCount, refreshList, open])

  // fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) refreshList()
  }

  const openItem = async (n) => {
    if (!n.read) {
      setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setCount((c) => Math.max(0, c - 1))
      markNotificationRead(n.id).catch(() => {})
    }
    if (n.target?.section) {
      setOpen(false)
      onNavigate?.(n.target.section)
    }
  }

  const readAll = async () => {
    setItems((l) => l.map((x) => ({ ...x, read: true })))
    setCount(0)
    markAllNotificationsRead().catch(() => {})
  }

  const remove = (e, n) => {
    e.stopPropagation()
    setItems((l) => l.filter((x) => x.id !== n.id))
    if (!n.read) setCount((c) => Math.max(0, c - 1))
    deleteNotification(n.id).catch(() => {})
  }

  return (
    <div className="nb-wrap" ref={boxRef}>
      <button type="button" className="top-icon nb-btn" onClick={toggle} aria-label="Notifications">
        <Bell size={20} strokeWidth={1.8} />
        {count > 0 && <span className="nb-badge">{count > 99 ? '99+' : count}</span>}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-head">
            <b>Notifications</b>
            {count > 0 && <button type="button" onClick={readAll}>Tout marquer comme lu</button>}
          </div>

          {loading && items.length === 0 && <p className="nb-empty">Chargement…</p>}
          {!loading && items.length === 0 && <p className="nb-empty">Aucune notification.</p>}

          <ul className="nb-list">
            {items.map((n) => (
              <li key={n.id} className={`nb-item${n.read ? '' : ' unread'}`} onClick={() => openItem(n)}>
                <span className="nb-icon">{ICONS[n.type] ?? '🔔'}</span>
                <div className="nb-body">
                  <p>{n.text}</p>
                  <small>{timeAgo(n.created_at)}</small>
                </div>
                <button type="button" className="nb-del" aria-label="Supprimer" onClick={(e) => remove(e, n)}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}