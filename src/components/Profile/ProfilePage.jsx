import { useRef, useState } from 'react'
import { updateProfile } from '../../Api'
import './ProfilePage.css'

const FIELDS = ['full_name', 'bio', 'city', 'country', 'preferences', 'avatar_url']

const PREFERENCE_OPTIONS = [
  'Randonnée',
  'Plage',
  'Culture',
  'Gastronomie',
  'Aventure',
  'Villes',
  'Nature',
  'Détente',
  'Road trip',
  'Petit budget',
  'Confort',
  'Voyage en groupe',
  'Voyage en solo',
  'Vie nocturne',
]

const fromUser = (u) => ({
  full_name: u.full_name ?? '',
  bio: u.bio ?? '',
  city: u.city ?? '',
  country: u.country ?? '',
  preferences: u.preferences ?? '',
  avatar_url: u.avatar_url ?? '',
})

// "Plage, Culture" -> ['Plage', 'Culture']
const parsePrefs = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

// recadre l'image en carré et la réduit pour qu'elle reste légère
const resizeImage = (file, size = 256) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide.'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        canvas
          .getContext('2d')
          .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })

const secondaryBtn = {
  background: '#fff',
  color: '#1f2937',
  border: '1px solid #d9d5cc',
  padding: '8px 18px',
  fontWeight: 600,
}

const checkLabel = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  fontWeight: 400,
  cursor: 'pointer',
}

const checkInput = {
  width: 18,
  height: 18,
  padding: 0,
  margin: 0,
  accentColor: '#20a690',
  cursor: 'pointer',
}

export default function ProfilePage({ user, onUpdate }) {
  const [form, setForm] = useState(() => fromUser(user))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  const selected = parsePrefs(form.preferences)

  const change = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setSaved(false)
  }

  const togglePref = (option) => {
    const current = parsePrefs(form.preferences)
    const next = current.includes(option)
      ? current.filter((p) => p !== option)
      : [...current, option]
    setForm((f) => ({ ...f, preferences: next.join(', ') }))
    setSaved(false)
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choisis un fichier image (jpg, png…).')
      return
    }
    try {
      const dataUrl = await resizeImage(file)
      setForm((f) => ({ ...f, avatar_url: dataUrl }))
      setError('')
      setSaved(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const removePhoto = () => {
    setForm((f) => ({ ...f, avatar_url: '' }))
    setSaved(false)
  }

  const dirty = FIELDS.some((f) => form[f] !== fromUser(user)[f])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateProfile({ ...form, full_name: form.full_name.trim() })
      onUpdate(updated)
      setForm(fromUser(updated))
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Impossible d’enregistrer le profil.')
    } finally {
      setSaving(false)
    }
  }

  const initial = (form.full_name || user.email || '?').charAt(0).toUpperCase()
  const place = [user.city, user.country].filter(Boolean).join(', ')

  return (
    <section className="profile-page">
      <div className="profile-header">
        {form.avatar_url
          ? <img className="profile-avatar" src={form.avatar_url} alt="" />
          : <div className="profile-avatar profile-avatar--initial">{initial}</div>}
        <div>
          <h2>{user.full_name}</h2>
          <p className="profile-muted">{user.email}</p>
          {place && <p className="profile-muted">📍 {place}</p>}
        </div>
      </div>

      <form className="profile-form" onSubmit={submit}>
        <label>
          Nom complet
          <input value={form.full_name} onChange={change('full_name')} maxLength={100} />
        </label>

        <label>
          E-mail
          <input value={user.email} disabled />
        </label>

        <label>
          Bio
          <textarea value={form.bio} onChange={change('bio')} maxLength={500} rows={4}
            placeholder="Parle un peu de toi et de ta façon de voyager…" />
          <span className="profile-count">{form.bio.length}/500</span>
        </label>

        <div className="profile-row">
          <label>
            Ville
            <input value={form.city} onChange={change('city')} maxLength={100} />
          </label>
          <label>
            Pays
            <input value={form.country} onChange={change('country')} maxLength={100} />
          </label>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 10 }}>
            Préférences de voyage
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: 10,
          }}>
            {PREFERENCE_OPTIONS.map((option) => (
              <label key={option} style={checkLabel}>
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => togglePref(option)}
                  style={checkInput}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>Photo de profil</div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" style={secondaryBtn} onClick={() => fileRef.current?.click()}>
              Choisir une photo
            </button>
            {form.avatar_url && (
              <button type="button" style={secondaryBtn} onClick={removePhoto}>
                Retirer la photo
              </button>
            )}
          </div>
        </div>

        {error && <p className="profile-error">{error}</p>}
        {saved && !error && <p className="profile-ok">Profil enregistré ✓</p>}

        <button type="submit" disabled={saving || !dirty}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </section>
  )
}