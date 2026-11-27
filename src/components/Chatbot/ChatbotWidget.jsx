import { useEffect, useRef, useState } from 'react'
import { chatWithAssistant } from '../../Api'
import './Chatbot.css'

const SUGGESTIONS = [
  'Où partir en été avec un petit budget ?',
  'Idée de week-end nature pas trop loin',
  'Aide-moi à choisir entre deux destinations',
  'Quelle destination pour un premier voyage en solo ?',
]

// icônes SVG (héritent la couleur du bouton)
const RobotIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 8V4.5" />
    <circle cx="12" cy="3.2" r="1.3" />
    <rect x="4" y="8" width="16" height="12" rx="3.5" />
    <path d="M2 12.5v4M22 12.5v4" />
    <circle cx="9" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    <path d="M9.5 17h5" />
  </svg>
)

const CloseIcon = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

// **gras** uniquement : le reste est affiché tel quel (retours à la ligne conservés)
const renderText = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )

export default function ChatbotWidget({ user }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // [{ role, content }]
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [teaser, setTeaser] = useState(false) // bulle d'accueil à côté du bouton
  const endRef = useRef(null)

  const firstName = (user?.full_name || '').trim().split(' ')[0]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  // message d'accueil affiché à l'ouverture de l'app, puis masqué au bout de 15 s
  useEffect(() => {
    const show = setTimeout(() => setTeaser(true), 800)
    const hide = setTimeout(() => setTeaser(false), 15800)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])

  const openChat = () => {
    setTeaser(false)
    setOpen(true)
  }

  // envoie l'historique complet au backend (il est sans état)
  const ask = async (history) => {
    setError('')
    setLoading(true)
    try {
      const { reply } = await chatWithAssistant(history)
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch (e) {
      setError(e.message || "L'assistant est indisponible.")
    } finally {
      setLoading(false)
    }
  }

  const send = (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setInput('')
    ask(history)
  }

  const retry = () => {
    if (!loading && messages.length) ask(messages)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const reset = () => {
    setMessages([])
    setError('')
    setInput('')
  }

  return (
    <>
      {open && (
        <section className="bot-panel" aria-label="Assistant voyage">
          <header className="bot-head">
            <div className="bot-title">
              <span className="bot-logo">
                <RobotIcon size={22} />
              </span>
              <div>
                <b>Assistant voyage</b>
                <small>Je t'aide à choisir ta prochaine destination</small>
              </div>
            </div>
            <div className="bot-head-actions">
              {messages.length > 0 && (
                <button type="button" onClick={reset} title="Nouvelle conversation">
                  ↺
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                ✕
              </button>
            </div>
          </header>

          <div className="bot-messages">
            <div className="bot-msg assistant">
              Salut{firstName ? ` ${firstName}` : ''} ! 👋 Dis-moi ce que tu cherches (budget,
              saison, ambiance…) et je te propose des destinations.
            </div>

            {messages.length === 0 && (
              <div className="bot-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`bot-msg ${m.role}`}>
                {renderText(m.content)}
              </div>
            ))}

            {loading && (
              <div className="bot-msg assistant bot-typing" aria-label="L'assistant écrit">
                <i />
                <i />
                <i />
              </div>
            )}

            {error && (
              <div className="bot-error">
                {error}{' '}
                <button type="button" onClick={retry}>
                  Réessayer
                </button>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div className="bot-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              placeholder="Écris ta question…"
            />
            <button type="button" onClick={() => send()} disabled={loading || !input.trim()}>
              Envoyer
            </button>
          </div>
        </section>
      )}

      {!open && teaser && (
        <div className="bot-teaser" role="status">
          <button type="button" className="bot-teaser-text" onClick={openChat}>
            Salut{firstName ? ` ${firstName}` : ''} ! Je peux t'aider à choisir ta prochaine
            destination.
          </button>
          <button
            type="button"
            className="bot-teaser-close"
            onClick={() => setTeaser(false)}
            aria-label="Masquer le message"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        className="bot-fab"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant voyage"}
      >
        {open ? <CloseIcon /> : <RobotIcon size={30} />}
        {!open && teaser && <span className="bot-fab-dot" />}
      </button>
    </>
  )
}