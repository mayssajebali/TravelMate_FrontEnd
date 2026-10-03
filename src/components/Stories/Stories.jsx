import './Stories.css'
const stories = [
  {
    name: 'Sarah',
    place: 'Bali',
    gradient: 'g2'
  },
  {
    name: 'Yassine',
    place: 'Marrakech',
    gradient: 'g4'
  },
  {
    name: 'Emma',
    place: 'Tokyo',
    gradient: 'g3'
  },
  {
    name: 'Lucas',
    place: 'Iceland',
    gradient: 'g5'
  }
]

function Stories() {
  return (
    <div className="stories">

      <div className="story add">
        <span className="plus">
          ＋
        </span>

        <span>
          Share your journey
        </span>
      </div>

      {stories.map((story) => (
        <div
          className={`story ${story.gradient}`}
          key={story.name}
        >
          <div className="ring"></div>

          <span className="txt">
            {story.name} · {story.place}
          </span>
        </div>
      ))}

    </div>
  )
}

export default Stories