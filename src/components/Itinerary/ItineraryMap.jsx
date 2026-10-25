import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { hasCoords, pinIcon } from './itineraryUtils'

function Fit({ points, focus }) {
  const map = useMap()
  const key = JSON.stringify(points)

  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14)
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (focus) map.flyTo(focus, Math.max(map.getZoom(), 14), { duration: 0.6 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.[0], focus?.[1]])

  return null
}

function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// onPick : si fourni, un clic sur la carte renvoie (lat, lng) — utilisé par l'éditeur
function ItineraryMap({ stops, activeIndex = null, onSelect, onPick, height = 280 }) {
  const placed = stops.map((s, i) => ({ s, i })).filter(({ s }) => hasCoords(s))
  const points = placed.map(({ s }) => [s.lat, s.lng])
  const active = activeIndex != null ? stops[activeIndex] : null
  const focus = active && hasCoords(active) ? [active.lat, active.lng] : null

  return (
    <MapContainer
      center={points[0] ?? [25, 10]}
      zoom={points.length ? 13 : 2}
      scrollWheelZoom={false}
      style={{ height }}
      className="it-map"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
        maxZoom={19}
      />
      <Fit points={points} focus={focus} />
      {onPick && <Picker onPick={onPick} />}
      {points.length > 1 && (
        <Polyline positions={points} pathOptions={{ color: '#185FA5', weight: 3, dashArray: '6 6' }} />
      )}
      {placed.map(({ s, i }) => (
        <Marker
          key={i}
          position={[s.lat, s.lng]}
          icon={pinIcon(i + 1, i === activeIndex)}
          eventHandlers={{ click: () => onSelect?.(i) }}
        >
          <Tooltip>{s.title || `Étape ${i + 1}`}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default ItineraryMap