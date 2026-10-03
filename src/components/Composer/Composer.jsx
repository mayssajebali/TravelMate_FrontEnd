import './Composer.css'
function Composer() {
  return (
    <div className="composer">

      <div className="row1">

        <span className="ava g2 avatar-composer"></span>

        <input
          type="text"
          placeholder="Share something from your journey..."
        />

      </div>

      <div className="pills">

        <span>📷 Photos</span>

        <span>🎬 Video</span>

        <span>📍 Place</span>

        <span>✈ Trip</span>

        <span>❓ Ask travelers</span>

        <button className="postbtn">
          Post
        </button>

      </div>

    </div>
  )
}

export default Composer