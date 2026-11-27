import { useState } from 'react'
import { createCommunity } from '../../Api'
import './Communities.css'

// Mêmes catégories qu'Explorer, pour que le matching avec les préférences fonctionne.
const TOPICS = [
  'Aventure',
  'Petit budget',
  'Nature',
  'Photographie',
  'Gastronomie',
  'Ville',
  'Plage',
  'Culture',
]

export default function CreateCommunityForm({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [topics, setTopics] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const toggleTopic = (t) =>
    setTopics((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]))

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        cover_image: coverImage.trim(),
        topics,
      })
      onCreated(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="comm-form" onSubmit={submit}>
      <h3>Nouvelle communauté</h3>

      <label>
        Nom *
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Ex : Road trips en Europe"
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="De quoi parle cette communauté ?"
        />
      </label>

      <label>
        Image de couverture (URL, optionnel)
        <input
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          maxLength={500}
          placeholder="https://…"
        />
      </label>

      <div>
        <span className="comm-form-label">Thèmes</span>
        <div className="comm-topics">
          {TOPICS.map((t) => (
            <button
              type="button"
              key={t}
              className={`comm-topic comm-topic-btn${topics.includes(t) ? ' common' : ''}`}
              onClick={() => toggleTopic(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="comm-error">{error}</p>}

      <div className="comm-form-actions">
        <button type="button" className="comm-btn joined" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="comm-btn" disabled={busy}>
          {busy ? 'Création…' : 'Créer la communauté'}
        </button>
      </div>
    </form>
  )
}