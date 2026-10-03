import './AiCard.css'
function AiCard() {
  return (
    <div className="ai-card">

      <div>

        <div className="label">
          TravelMate AI
        </div>

        <p>
          Because you liked hiking posts,
          here are 3 mountain destinations for you.
        </p>

      </div>

      <div className="ai-thumbs">

        <span className="g3"></span>

        <span className="g4"></span>

        <span className="g5"></span>

      </div>

    </div>
  )
}

export default AiCard