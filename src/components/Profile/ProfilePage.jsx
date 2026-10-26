import { useRef, useState } from 'react'
import { updateProfile } from '../../Api'
import './ProfilePage.css'

const FIELDS = ['full_name', 'bio', 'city', 'country', 'preferences', 'avatar_url',
  'service_type', 'service_description', 'service_location', 'phone', 'daily_rate']

const SERVICE_TYPES = [
  { value: 'guide', label: 'Guide' },
  { value: 'chauffeur', label: 'Chauffeur' },
]

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
  service_type: u.service_type ?? '',
  service_description: u.service_description ?? '',
  service_location: u.service_location ?? '',
  phone: u.phone ?? '',
  daily_rate: u.daily_rate ?? '',
  availabilities: u.availabilities ?? [],
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
  const isProvider = user.role === 'provider'
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

  const dirty = JSON.stringify(form) !== JSON.stringify(fromUser(user))

  const addPeriod = () => {
    setForm((f) => ({ ...f, availabilities: [...f.availabilities, { start: '', end: '' }] }))
    setSaved(false)
  }
  const editPeriod = (i, key) => (e) => {
    setForm((f) => ({
      ...f,
      availabilities: f.availabilities.map((p, j) => (j === i ? { ...p, [key]: e.target.value } : p)),
    }))
    setSaved(false)
  }
  const removePeriod = (i) => {
    setForm((f) => ({ ...f, availabilities: f.availabilities.filter((_, j) => j !== i) }))
    setSaved(false)
  }


  const submit = async (e) => {
    e.preventDefault()
    if (!form.full_name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    if (isProvider) {
      if (!form.service_type) { setError('Choisis ton type de service.'); return }
      if (!form.phone.trim()) { setError('Le téléphone est obligatoire.'); return }
    }
    const bad = form.availabilities.find((p) => p.start && p.end && p.end < p.start)
    if (bad) { setError('Une période se termine avant son début.'); return }
    setSaving(true)
    setError('')
    try {
      const updated = await updateProfile({
        ...form,
        full_name: form.full_name.trim(),
        daily_rate: Number(form.daily_rate) || 0,
        availabilities: form.availabilities.filter((p) => p.start && p.end),
      })
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

        {isProvider ? (
          <>
            <label>
              Type de service
              <select value={form.service_type} onChange={change('service_type')}>
                <option value="">Choisir…</option>
                {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>

            <label>
              Description du service
              <textarea value={form.service_description} onChange={change('service_description')}
                maxLength={1000} rows={4} placeholder="Décris ce que tu proposes, tes langues, ton expérience…" />
              <span className="profile-count">{form.service_description.length}/1000</span>
            </label>
                        <label>
              Tarif par jour (€)
              <input type="number" min="0" max="100000" value={form.daily_rate}
                onChange={change('daily_rate')} placeholder="Ex : 80" />
            </label>

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                Périodes de disponibilité
              </div>
              {form.availabilities.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input type="date" value={p.start} onChange={editPeriod(i, 'start')} />
                  <span>→</span>
                  <input type="date" value={p.end} min={p.start} onChange={editPeriod(i, 'end')} />
                  <button type="button" style={secondaryBtn} onClick={() => removePeriod(i)}>✕</button>
                </div>
              ))}
              <button type="button" style={secondaryBtn} onClick={addPeriod}>+ Ajouter une période</button>
            </div>

            <div className="profile-row">
              <label>
                Zone / localisation
                <input value={form.service_location} onChange={change('service_location')} maxLength={200}
                  placeholder="Ex : Tunis, Sousse, Djerba" />
              </label>
              <label>
                Téléphone
                <input type="tel" value={form.phone} onChange={change('phone')} maxLength={30}
                  placeholder="+216 …" />
              </label>
            </div>
          </>
        ) : (
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
        )}



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