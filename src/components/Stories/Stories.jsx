import './Stories.css'

// Remplace les URLs par tes propres photos (ou des fichiers dans /public/stories/)
const stories = [
  {
    name: 'Sarah',
    place: 'Bali',
    gradient: 'g2',
    photo: 'https://picsum.photos/seed/bali-story/400/600',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    name: 'Yassine',
    place: 'Marrakech',
    gradient: 'g4',
    photo: 'https://picsum.photos/seed/marrakech-story/400/600',
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    name: 'Emma',
    place: 'Tokyo',
    gradient: 'g3',
    photo: 'https://picsum.photos/seed/tokyo-story/400/600',
    avatar: 'https://i.pravatar.cc/80?img=45',
  },
  {
    name: 'Lucas',
    place: 'Islande',
    gradient: 'g5',
    photo: 'https://picsum.photos/seed/iceland-story/400/600',
    avatar: 'https://i.pravatar.cc/80?img=33',
  },
]

const PlusIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
)

// si une image ne charge pas, on la masque et le dégradé prend le relais
const hideBroken = (e) => {
  e.currentTarget.style.display = 'none'
}

function Stories() {
  return (
    <div className="stories">
      <button type="button" className="story add">
        <span className="plus"><PlusIcon /></span>
        <span>Partage ton voyage</span>
      </button>

      {stories.map((story) => (
        <button
          type="button"
          className={`story ${story.gradient}`}
          key={story.name}
          aria-label={`Story de ${story.name} à ${story.place}`}
        >
          <img
            className="story-photo"
            src={story.photo}
            alt=""
            loading="lazy"
            onError={hideBroken}
          />

          <span className="ring">
            <img src={story.avatar} alt="" onError={hideBroken} />
          </span>

          <span className="txt">
            {story.name} · {story.place}
          </span>
        </button>
      ))}
    </div>
  )
}

export default Stories