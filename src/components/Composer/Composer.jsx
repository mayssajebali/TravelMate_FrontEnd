import { useRef, useState } from 'react'
import './Composer.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

const svgProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const ImageIcon = () => (
  <svg {...svgProps}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m21 16-5-5-8 8" />
  </svg>
)

const VideoIcon = () => (
  <svg {...svgProps}>
    <rect x="3" y="6" width="13" height="12" rx="3" />
    <path d="m16 10.5 5-3v9l-5-3z" />
  </svg>
)

const PinIcon = () => (
  <svg {...svgProps}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

const PlaneIcon = () => (
  <svg {...svgProps}>
    <path d="M10.2 13.8 3 11.5l1.4-1.4 8-.9L16.5 5a2 2 0 1 1 2.5 2.5l-4.2 4.2-.9 8-1.4 1.4-2.3-7.2z" />
    <path d="m10.2 13.8-3.4 3.4" />
  </svg>
)

const HelpIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
    <path d="M12 17h.01" />
  </svg>
)

const CloseIcon = () => (
  <svg {...svgProps} width={14} height={14} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

function Composer({ user, onPublish }) {
  const [text, setText] = useState('')
  const [destination, setDestination] = useState('')
  const [showPlace, setShowPlace] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const photo = user?.avatar_url
  const initial = (user?.full_name ?? '').trim().charAt(0).toUpperCase()

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    const clean = text.trim()
    if (!clean || busy) return
    setBusy(true)
    setError('')
    try {
      await onPublish(clean, destination.trim(), image)
      setText('')
      setDestination('')
      setShowPlace(false)
      removeImage()
    } catch (e) {
      setError(e.message || 'Publication impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="composer">
      <div className="row1">
        <span
          className={`ava ${gradientFor(user?.id)} avatar-composer`}
          style={photo ? {
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          {photo ? '' : initial}
        </span>
        <input
          type="text"
          placeholder="Partage un moment de ton voyage…"
          aria-label="Écrire une publication"
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      {showPlace && (
        <div className="row1 place-row">
          <span className="place-ico"><PinIcon /></span>
          <input
            type="text"
            placeholder="Destination (ex : Tokyo)"
            aria-label="Destination"
            value={destination}
            maxLength={100}
            onChange={(e) => setDestination(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {preview && (
        <div className="preview">
          <img src={preview} alt="Aperçu de la photo" />
          <button
            type="button"
            className="preview-remove"
            onClick={removeImage}
            aria-label="Retirer la photo"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />

      <div className="pills">
        <button
          type="button"
          className={`pill${image ? ' active' : ''}`}
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon /> Photo
        </button>

        <button
          type="button"
          className={`pill${showPlace || destination ? ' active' : ''}`}
          onClick={() => setShowPlace((s) => !s)}
          aria-pressed={showPlace}
        >
          <PinIcon /> Lieu
        </button>

        <button type="button" className="pill" disabled title="Bientôt disponible">
          <VideoIcon /> Vidéo
        </button>

        <button type="button" className="pill" disabled title="Bientôt disponible">
          <PlaneIcon /> Voyage
        </button>

        <button type="button" className="pill" disabled title="Bientôt disponible">
          <HelpIcon /> Poser une question
        </button>

        <button
          type="button"
          className="postbtn"
          onClick={submit}
          disabled={busy || !text.trim()}
        >
          {busy ? 'Publication…' : 'Publier'}
        </button>
      </div>

      {error && <p className="composer-error">{error}</p>}
    </div>
  )
}

export default Composer