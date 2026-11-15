import { useState } from 'react'

const GOLD = '#FFD700'
const GOLD_BORDER = '#DAA520'
const EMPTY = '#E0E0E0'

export default function StarRating({ value = 0, onChange, size = 24 }) {
  const [hover, setHover] = useState(0)
  const readOnly = !onChange
  const active = hover || Math.round(value)

  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !readOnly && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            fontSize: size,
            lineHeight: 1,
            cursor: readOnly ? 'default' : 'pointer',
            color: star <= active ? GOLD : EMPTY,
            textShadow: star <= active ? `0 0 1px ${GOLD_BORDER}` : 'none',
            transition: 'color 0.15s',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}