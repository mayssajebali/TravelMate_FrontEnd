import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, Check, Info, LogOut, MessageCircle, PanelLeftClose, PanelLeftOpen,
  Pencil, Plus, Send, UserMinus, UserPlus, Users,
} from 'lucide-react'
import {
  addGroupMembers, createGroup, getContacts, getConversations, getMessages,
  openConversation, removeGroupMember, renameGroup, sendMessage,
} from '../../Api'
import './Messages.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

const parse = (iso) => new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z')

const hhmm = (iso) =>
  iso ? parse(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''

function shortDate(iso) {
  if (!iso) return ''
  const d = parse(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return hhmm(iso)
  const days = Math.floor((now - d) / 86400000)
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const convTitle = (c) => (c.is_group ? c.name : c.user.full_name)
const place = (u) => [u?.city, u?.country].filter(Boolean).join(', ')

function Avatar({ user, size = 40 }) {
  const photo = user?.avatar_url
  const initial = (user?.full_name ?? '').trim().charAt(0).toUpperCase()
  return (
    <span
      className={`ava ${gradientFor(user?.id)} msg-ava`}
      style={{ width: size, height: size, ...(photo ? { backgroundImage: `url(${photo})` } : {}) }}
    >
      {photo ? '' : initial}
    </span>
  )
}

function ConvAvatar({ conv, size = 40 }) {
  if (!conv.is_group) return <Avatar user={conv.user} size={size} />
  return (
    <span className={`ava ${gradientFor(conv.id)} msg-ava`} style={{ width: size, height: size }}>
      <Users size={Math.round(size * 0.45)} strokeWidth={1.8} />
    </span>
  )
}

/* ---------- Infos du groupe ---------- */

function GroupInfo({ conv, onChanged, onLeft }) {
  const [name, setName] = useState(conv.name)
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [contacts, setContacts] = useState(null)
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const saveName = () => run(async () => {
    await renameGroup(conv.id, name.trim())
    setEditing(false)
    onChanged?.()
  })

  const openAdd = () => {
    setAdding(true)
    if (!contacts) getContacts().then(setContacts).catch((e) => setError(e.message))
  }

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const add = () => run(async () => {
    await addGroupMembers(conv.id, picked)
    setPicked([])
    setAdding(false)
    onChanged?.()
  })

  const kick = (u) => {
    if (!window.confirm(`Retirer ${u.full_name} du groupe ?`)) return
    run(async () => {
      await removeGroupMember(conv.id, u.id)
      onChanged?.()
    })
  }

  const leave = () => {
    if (!window.confirm('Quitter ce groupe ?')) return
    run(async () => {
      await removeGroupMember(conv.id, 'me')
      onLeft?.()
    })
  }

  const candidates = (contacts ?? []).filter((c) => !conv.members.some((m) => m.id === c.id))

  return (
    <div className="msg-info">
      <div className="msg-info-name">
        {editing ? (
          <>
            <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-label="Nom du groupe" autoFocus />
            <button type="button" className="msg-icon" onClick={saveName} disabled={!name.trim() || busy} aria-label="Enregistrer">
              <Check size={16} />
            </button>
          </>
        ) : (
          <>
            <b>{conv.name}</b>
            {conv.is_admin && (
              <button type="button" className="msg-icon" onClick={() => setEditing(true)} aria-label="Renommer">
                <Pencil size={15} />
              </button>
            )}
          </>
        )}
      </div>

      <div className="msg-info-title">
        <span>{conv.members.length} membres</span>
        {conv.is_admin && !adding && conv.members.length < 20 && (
          <button type="button" className="msg-link" onClick={openAdd}>
            <UserPlus size={15} /> Ajouter
          </button>
        )}
      </div>

      {adding && (
        <div className="msg-add">
          {contacts === null && <p className="msg-hint">Chargement…</p>}
          {contacts && candidates.length === 0 && <p className="msg-hint">Personne d'autre à ajouter.</p>}
          {candidates.map((u) => (
            <label key={u.id} className="msg-pick">
              <input type="checkbox" checked={picked.includes(u.id)} onChange={() => toggle(u.id)} />
              <Avatar user={u} size={32} />
              <span>{u.full_name}</span>
            </label>
          ))}
          <div className="msg-add-foot">
            <button type="button" className="msg-ghost" onClick={() => { setAdding(false); setPicked([]) }}>Annuler</button>
            <button type="button" className="msg-create" onClick={add} disabled={picked.length === 0 || busy}>
              Ajouter ({picked.length})
            </button>
          </div>
        </div>
      )}

      <ul className="msg-members">
        {conv.members.map((u) => (
          <li key={u.id}>
            <Avatar user={u} size={34} />
            <span className="msg-member-body">
              <b>{u.full_name}</b>
              <small>{place(u)}</small>
            </span>
            {conv.admin_id === u.id && <span className="msg-tag">Admin</span>}
            {conv.is_admin && conv.admin_id !== u.id && (
              <button type="button" className="msg-icon" onClick={() => kick(u)} aria-label={`Retirer ${u.full_name}`} title="Retirer">
                <UserMinus size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="msg-error">{error}</p>}

      <button type="button" className="msg-leave" onClick={leave} disabled={busy}>
        <LogOut size={16} /> Quitter le groupe
      </button>
    </div>
  )
}

/* ---------- Fil de discussion ---------- */

function Thread({ conv, onBack, onChanged, onLeft, listOpen, onToggleList }) {
  const isGroup = conv.is_group
  const [messages, setMessages] = useState([])
  const [seenId, setSeenId] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(false)

  const lastId = useRef(null)
  const box = useRef(null)
  const stick = useRef(true)

  useEffect(() => { lastId.current = messages.at(-1)?.id ?? null }, [messages])

  useEffect(() => {
    let alive = true
    let timer

    const tick = async (first) => {
      try {
        const r = await getMessages(conv.id, first ? null : lastId.current)
        if (!alive) return
        setSeenId(r.seen_id)
        if (r.messages.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id))
            const fresh = r.messages.filter((m) => !ids.has(m.id))
            return fresh.length ? [...prev, ...fresh] : prev
          })
          onChanged?.()
        }
        setError('')
      } catch (ex) {
        if (!alive) return
        if (ex.status === 404) onLeft?.() // groupe supprimé ou retiré du groupe
        else setError(ex.message)
      } finally {
        if (alive) {
          setLoading(false)
          timer = setTimeout(() => tick(false), document.hidden ? 8000 : 2500)
        }
      }
    }

    tick(true)
    return () => { alive = false; clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id])

  useEffect(() => {
    const el = box.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [messages, info])

  const onScroll = () => {
    const el = box.current
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    setError('')
    try {
      const m = await sendMessage(conv.id, t)
      stick.current = true
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))
      setText('')
      onChanged?.()
    } catch (ex) {
      setError(ex.message)
    } finally {
      setSending(false)
    }
  }

  const header = (
    <div className="msg-top">
      <button type="button" className="msg-icon msg-back" onClick={onBack} aria-label="Retour aux conversations">
        <ArrowLeft size={18} />
      </button>
      <button
        type="button"
        className="msg-icon msg-toggle"
        onClick={onToggleList}
        aria-label={listOpen ? 'Masquer la liste des conversations' : 'Afficher la liste des conversations'}
        title={listOpen ? 'Masquer la liste' : 'Afficher la liste'}
        >
        {listOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      <ConvAvatar conv={conv} size={36} />
      <div className="msg-top-info">
        <b>{convTitle(conv)}</b>
        <small>{isGroup ? `${conv.members.length} membres` : place(conv.user)}</small>
      </div>
      {isGroup && (
        <button
          type="button"
          className={`msg-icon${info ? ' on' : ''}`}
          onClick={() => setInfo((v) => !v)}
          aria-label="Infos du groupe"
          title="Infos du groupe"
        >
          <Info size={18} />
        </button>
      )}
    </div>
  )

  if (info) {
    return (
      <>
        {header}
        <GroupInfo conv={conv} onChanged={onChanged} onLeft={onLeft} />
      </>
    )
  }

  return (
    <>
      {header}

      <div className="msg-body" ref={box} onScroll={onScroll}>
        {loading && <p className="msg-hint">Chargement…</p>}
        {!loading && messages.length === 0 && (
          <p className="msg-hint">
            {isGroup ? 'Aucun message. Lance la discussion !' : `Aucun message. Dis bonjour à ${conv.user.full_name.split(' ')[0]} !`}
          </p>
        )}

        {messages.map((m, i) => {
          if (m.system) return <div key={m.id} className="msg-system">{m.text}</div>

          const prev = messages[i - 1]
          const showName = isGroup && !m.is_mine && (!prev || prev.system || prev.sender?.id !== m.sender?.id)

          return (
            <div key={m.id} className={`bubble-row${m.is_mine ? ' mine' : ''}`}>
              {showName && <span className="bubble-name">{m.sender?.full_name}</span>}
              <div className="bubble" title={hhmm(m.created_at)}>{m.text}</div>
              <span className="bubble-time">
                {hhmm(m.created_at)}{!isGroup && m.is_mine && m.id === seenId ? ' · Vu' : ''}
              </span>
            </div>
          )
        })}
      </div>

      {error && <p className="msg-error">{error}</p>}

      {conv.can_message === false ? (
        <p className="msg-locked">Tu ne peux plus écrire à ce voyageur (abonnement retiré).</p>
      ) : (
        <form className="msg-form" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message…"
            maxLength={2000}
            aria-label="Écrire un message"
            autoFocus
          />
          <button type="submit" className="msg-send" disabled={!text.trim() || sending} aria-label="Envoyer">
            <Send size={17} />
          </button>
        </form>
      )}
    </>
  )
}

/* ---------- Page ---------- */

function Messages({ startWith = null }) {
  const [convs, setConvs] = useState([])
  const [active, setActive] = useState(null)
  const [panel, setPanel] = useState(null) // null | 'contacts' | 'group'
  const [contacts, setContacts] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [picked, setPicked] = useState([])
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(
    () => getConversations().then(setConvs).catch((e) => setError(e.message)),
    [],
  )

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const t = setInterval(refresh, 4000)
    return () => clearInterval(t)
  }, [refresh])
    const [listOpen, setListOpen] = useState(() => {
    try { return localStorage.getItem('msg-list') !== '0' } catch { return true }
    })

    const toggleList = () =>
    setListOpen((v) => {
        try { localStorage.setItem('msg-list', v ? '0' : '1') } catch { /* ignoré */ }
        return !v
    })
  const start = async (userId) => {
    setError('')
    try {
      const conv = await openConversation(userId)
      setActive(conv)
      setPanel(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { if (startWith) start(startWith) }, [startWith])

  const openPicker = () => {
    setPanel('contacts')
    if (!contacts) getContacts().then(setContacts).catch((e) => setError(e.message))
  }

  const closePanel = () => {
    setPanel(null)
    setGroupName('')
    setPicked([])
  }

  const togglePick = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 19 ? [...p, id] : p))

  const makeGroup = async () => {
    setError('')
    setCreating(true)
    try {
      const conv = await createGroup(groupName.trim(), picked)
      await refresh()
      setActive(conv)
      closePanel()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const left = () => { setActive(null); refresh() }

  const current = active ? (convs.find((c) => c.id === active.id) ?? active) : null

  return (
    <section className={`msg${current ? ' has-active' : ''}${current && !listOpen ? ' list-hidden' : ''}`}>
      <aside className="msg-side">
        {panel === 'contacts' && (
          <>
            <div className="msg-side-head">
              <button type="button" className="msg-icon" onClick={closePanel} aria-label="Retour">
                <ArrowLeft size={18} />
              </button>
              <h2>Nouvelle conversation</h2>
            </div>

            <ul className="msg-list">
              <li>
                <button type="button" className="msg-item" onClick={() => setPanel('group')}>
                  <span className="msg-new-group"><Users size={18} /></span>
                  <span className="msg-item-body"><b>Nouveau groupe</b><small>Discuter à plusieurs</small></span>
                </button>
              </li>
              {contacts === null && <li className="msg-hint">Chargement…</li>}
              {contacts?.length === 0 && <li className="msg-hint">Suis des voyageurs pour pouvoir leur écrire.</li>}
              {contacts?.map((u) => (
                <li key={u.id}>
                  <button type="button" className="msg-item" onClick={() => start(u.id)}>
                    <Avatar user={u} />
                    <span className="msg-item-body"><b>{u.full_name}</b><small>{place(u)}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {panel === 'group' && (
          <>
            <div className="msg-side-head">
              <button type="button" className="msg-icon" onClick={() => setPanel('contacts')} aria-label="Retour">
                <ArrowLeft size={18} />
              </button>
              <h2>Nouveau groupe</h2>
            </div>

            <div className="msg-group-form">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={60}
                placeholder="Nom du groupe"
                aria-label="Nom du groupe"
                autoFocus
              />
              <small>{picked.length} sélectionné{picked.length > 1 ? 's' : ''} · 2 minimum</small>
            </div>

            <ul className="msg-list">
              {contacts === null && <li className="msg-hint">Chargement…</li>}
              {contacts?.length === 0 && <li className="msg-hint">Suis des voyageurs pour les ajouter.</li>}
              {contacts?.map((u) => (
                <li key={u.id}>
                  <label className="msg-item msg-pick">
                    <input type="checkbox" checked={picked.includes(u.id)} onChange={() => togglePick(u.id)} />
                    <Avatar user={u} size={34} />
                    <span className="msg-item-body"><b>{u.full_name}</b><small>{place(u)}</small></span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="msg-group-foot">
              <button
                type="button"
                className="msg-create"
                onClick={makeGroup}
                disabled={!groupName.trim() || picked.length < 2 || creating}
              >
                {creating ? 'Création…' : 'Créer le groupe'}
              </button>
            </div>
          </>
        )}

        {panel === null && (
          <>
            <div className="msg-side-head">
              <h2>Messages</h2>
              <button type="button" className="msg-icon" onClick={openPicker} aria-label="Nouvelle conversation" title="Nouvelle conversation">
                <Plus size={18} />
              </button>
            </div>

            <ul className="msg-list">
              {loading && <li className="msg-hint">Chargement…</li>}
              {!loading && convs.length === 0 && !current && (
                <li className="msg-hint">Aucune conversation. Clique sur + pour écrire à un voyageur.</li>
              )}

              {current && !convs.some((c) => c.id === current.id) && (
                <li>
                  <button type="button" className="msg-item on" onClick={() => setActive(current)}>
                    <ConvAvatar conv={current} />
                    <span className="msg-item-body">
                      <b>{convTitle(current)}</b>
                      <small>Nouvelle conversation</small>
                    </span>
                  </button>
                </li>
              )}

              {convs.map((c) => {
                const unread = current?.id === c.id ? 0 : c.unread
                const who = c.last_is_mine ? 'Toi : ' : c.is_group && c.last_sender_name ? `${c.last_sender_name} : ` : ''
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`msg-item${current?.id === c.id ? ' on' : ''}`}
                      onClick={() => setActive(c)}
                    >
                      <ConvAvatar conv={c} />
                      <span className="msg-item-body">
                        <b>{convTitle(c)}</b>
                        <small className={unread ? 'strong' : ''}>{who}{c.last_message}</small>
                      </span>
                      <span className="msg-item-meta">
                        <span>{shortDate(c.last_message_at)}</span>
                        {unread > 0 && <span className="msg-badge">{unread > 9 ? '9+' : unread}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {error && <p className="msg-error">{error}</p>}
      </aside>

      <div className="msg-main">
        {current ? (
        <Thread
        key={current.id}
        conv={current}
        onBack={() => setActive(null)}
        onChanged={refresh}
        onLeft={left}
        listOpen={listOpen}
        onToggleList={toggleList}
        />        ) : (
          <div className="msg-placeholder">
            <MessageCircle size={42} strokeWidth={1.4} />
            <b>Tes messages</b>
            <p>Choisis une conversation, ou démarre-en une avec un voyageur ou un groupe.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Messages