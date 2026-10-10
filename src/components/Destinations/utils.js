const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5'] // classes déjà présentes dans ton CSS global

export function gradientClass(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

// À garder identique aux tags de seed_destinations.py
export const TAGS = ['Ville', 'Culture', 'Gastronomie', 'Plage', 'Nature', 'Aventure', 'Photographie']

export const budgetText = (n) => (n ? `~${n.toLocaleString('fr-FR')} €` : '—')

export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export const coverStyle = (url) =>
  url
    ? { backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined