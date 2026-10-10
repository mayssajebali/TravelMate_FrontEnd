import { useRef, useState } from 'react'
import './Composer.css'

const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function Composer({ user, onPublish }) {
  const [text, setText] = useState('')
  const [destination, setDestination] = useState('')
  const [showPlace, setShowPlace] = useState(false)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

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
        <span className={`ava ${gradientFor(user?.id)} avatar-composer`}></span>
        <input
          type="text"
          placeholder="Share something from your journey..."
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      {showPlace && (
        <div className="row1" style={{ marginTop: 8 }}>
          <input
            type="text"
            placeholder="Destination (ex : Tokyo)"
            value={destination}
            maxLength={100}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      )}

      {preview && (
        <div style={{ position: 'relative', marginTop: 8 }}>
          <img src={preview} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 12 }} />
          <button
            type="button"
            onClick={removeImage}
            style={{ position: 'absolute', top: 8, right: 8 }}
          >
            ✕
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />

      <div className="pills">
        <span onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer' }}>📷 Photos</span>
        <span>🎬 Video</span>
        <span onClick={() => setShowPlace((s) => !s)} style={{ cursor: 'pointer' }}>📍 Place</span>
        <span>✈ Trip</span>
        <span>❓ Ask travelers</span>

        <button className="postbtn" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? '…' : 'Post'}
        </button>
      </div>

      {error && <p style={{ color: 'crimson', margin: '8px 0 0' }}>{error}</p>}
    </div>
  )
}

export default Composer