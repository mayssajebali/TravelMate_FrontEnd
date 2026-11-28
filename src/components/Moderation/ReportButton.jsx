import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Flag } from 'lucide-react'
import { reportContent } from '../../Api'
import './Moderation.css'

const REASONS = [
  { value: 'spam', label: 'Spam ou publicité' },
  { value: 'harassment', label: 'Harcèlement ou insultes' },
  { value: 'hate', label: 'Propos haineux ou discriminatoires' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'scam', label: 'Arnaque ou faux profil' },
  { value: 'other', label: 'Autre' },
]

function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const submit = async (e) => {
    e.preventDefault()
    if (!reason) return
    setBusy(true)
    setError('')
    try {
      await reportContent({ target_type: targetType, target_id: targetId, reason, details: details.trim() })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="rp-overlay" onMouseDown={onClose}>
      <div className="rp-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3>Merci</h3>
            <p className="rp-muted">Ton signalement a été transmis à l'équipe de modération.</p>
            <button type="button" className="rp-primary" onClick={onClose}>Fermer</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h3>Signaler ce contenu</h3>
            <p className="rp-muted">Pourquoi le signales-tu ?</p>
            <div className="rp-reasons">
              {REASONS.map((r) => (
                <label key={r.value} className={`rp-reason${reason === r.value ? ' on' : ''}`}>
                  <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                    onChange={() => setReason(r.value)} />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)}
              placeholder="Précisions (facultatif)" />
            {error && <p className="rp-error">{error}</p>}
            <div className="rp-actions">
              <button type="button" className="rp-ghost" onClick={onClose}>Annuler</button>
              <button type="submit" className="rp-primary" disabled={!reason || busy}>
                {busy ? 'Envoi…' : 'Envoyer le signalement'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default function ReportButton({ targetType, targetId, label = 'Signaler', compact = false }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={`rp-btn${compact ? ' rp-btn--compact' : ''}`}
        title="Signaler" aria-label="Signaler" onClick={() => setOpen(true)}>
        <Flag size={compact ? 15 : 14} strokeWidth={1.8} />
        {!compact && <span>{label}</span>}
      </button>
      {open && <ReportModal targetType={targetType} targetId={targetId} onClose={() => setOpen(false)} />}
    </>
  )
}