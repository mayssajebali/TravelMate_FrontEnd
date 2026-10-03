import './Post.css'
const GRADIENTS = ['g1', 'g2', 'g3', 'g4', 'g5']

// même couleur d'avatar que dans le sidebar
function gradientFor(key = '') {
  let h = 0
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function Post() {
  return (
    <article className="post">

      <div className="post-head">

        <span className="ava g2 avatar-post"></span>

        <div className="who">

          <b>
            Sarah Johnson
            <span className="verified">
              ✔
            </span>
          </b>

          <div>
            Tokyo, Japan · 2h ago
          </div>

        </div>

        <span className="more">
          ⋯
        </span>

      </div>

      <div className="post-photo g3">

        <div className="floating-tag">

          <b>
            TOKYO
          </b>

          <small>
            Japan
          </small>

        </div>

      </div>

      <div className="post-body">

        <p>
          Tokyo at 6 AM feels completely different.
          Quiet streets, tiny cafés and the best ramen
          I've ever tried.
        </p>

      </div>

      <div className="interactions">

        <span>
          ❤ 1.8K
        </span>

        <span>
          💬 126
        </span>

        <span>
          ↗ 34
        </span>

      </div>

      <div className="action-row">

        <span>
          ❤ Like
        </span>

        <span>
          💬 Discuss
        </span>

        <span>
          📌 Save
        </span>

        <span className="hl">
          ✈ Add to Trip
        </span>

        <span className="hl">
          👥 Find Travel Mates
        </span>

      </div>

      <div className="itin-actions">

        <button>
          Save to: Japan 2026
        </button>

        <button>
          Weekend Trip
        </button>

        <button>
          Dream Destinations
        </button>

      </div>

    </article>
  )
}

export default Post