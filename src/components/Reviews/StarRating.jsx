import { useState } from 'react'
import './Reviews.css'

export default function StarRating({ value = 0, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'
  const shown = interactive && hover ? hover : Math.round(Number(value) || 0)

  return (
    <span
      className={`rv-stars${interactive ? ' rv-stars--input' : ''}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Ta note' : `${shown} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) =>
        interactive ? (
          <button
            key={n}
            type="button"
            className={`rv-star${n <= shown ? ' on' : ''}`}
            style={{ fontSize: size }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={`rv-star${n <= shown ? ' on' : ''}`} style={{ fontSize: size }}>★</span>
        ),
      )}
    </span>
  )
}