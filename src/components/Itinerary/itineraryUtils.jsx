import L from 'leaflet'
import { Utensils, Landmark, Trees, BedDouble, Car, MapPin } from 'lucide-react'

export const CURRENCY = 'TND'

export const CATEGORIES = {
  food: { label: 'Repas', Icon: Utensils },
  sight: { label: 'Visite', Icon: Landmark },
  nature: { label: 'Nature', Icon: Trees },
  stay: { label: 'Hébergement', Icon: BedDouble },
  transport: { label: 'Transport', Icon: Car },
  other: { label: 'Autre', Icon: MapPin },
}

export const STATUSES = { todo: 'À réserver', booked: 'Réservé', done: 'Fait' }

export const hasCoords = (s) => typeof s.lat === 'number' && typeof s.lng === 'number'

export const emptyStop = () => ({
  title: '', category: 'sight', time: '', duration_min: null,
  lat: null, lng: null, cost: 0, status: 'todo', notes: '',
})
export const emptyDay = () => ({ title: '', stops: [emptyStop()] })

function km(a, b) {
  const R = 6371
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// distance à vol d'oiseau entre étapes consécutives d'un même jour
export function totalKm(days) {
  let sum = 0
  for (const d of days) {
    const pts = d.stops.filter(hasCoords)
    for (let i = 1; i < pts.length; i++) sum += km(pts[i - 1], pts[i])
  }
  return Math.round(sum)
}

export function dayDate(start, i) {
  if (!start) return ''
  const d = new Date(`${start}T00:00:00`)
  d.setDate(d.getDate() + i)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const pinIcon = (n, active) =>
  L.divIcon({
    className: '',
    html: `<div class="it-pin${active ? ' on' : ''}">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })