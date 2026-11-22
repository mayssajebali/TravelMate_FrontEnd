import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Itineraries from './components/Itinerary/Itineraries'
import MyBookingsPage from './components/Bookings/MyBookingsPage'

import {
  me, logout as apiLogout, getToken, setUnauthorizedHandler,
  getFeed, getSaved, createPost, getTrips,
} from './Api'
import Auth from './components/Auth/Auth'
import TripsPage from './components/Trips/Tripspage'
import ProfilePage from './components/Profile/ProfilePage'
import DestinationsPage from './components/Destinations/DestinationsPage'
import ProvidersPage from './components/Providers/ProvidersPage' // NOUVEAU (US16)
import Navbar from './components/Navbar/Navbar'
import LeftSidebar from './components/LeftSidebar/LeftSidebar'
import Stories from './components/Stories/Stories'
import Composer from './components/Composer/Composer'
import AiCard from './components/AiCard/AiCard'
import Post from './components/Posts/Post'
import RightSidebar from './components/RightSidebar/RightSidebar'
import ReceivedBookingsPage from './components/Bookings/ReceivedBookingsPage'
import Messages from './components/Messages/Messages'
import { getUnreadCountMsg } from './Api'
import MatesPage from './components/Mates/MatesPage'

import ReceivedReviews from './components/Reviews/ReceivedReviews'
const dayOnly = (iso) => (iso || '').slice(0, 10)
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(!!getToken())
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState('feed') // 'feed' | 'trips' | 'itineraries' | 'profile' | 'explore' | 'providers' | 'saved' | 'bookings' | 'requests' | 'reviews'
  const [destSlug, setDestSlug] = useState(null)
  const [posts, setPosts] = useState([])
  const [saved, setSaved] = useState([])
  const [trips, setTrips] = useState([])
  const [unread, setUnread] = useState(0)
  const [chatWith, setChatWith] = useState(null) // personne à qui écrire

  const logout = useCallback((message = '') => {
    apiLogout()
    setUser(null)
    setPosts([])
    setSaved([])
    setTrips([])
    setSection('feed')
    setDestSlug(null)
    setNotice(message)
    setChatWith(null)
  }, [])

  // token expiré (401) => retour à l'écran de connexion avec un message
  useEffect(() => { setUnauthorizedHandler(logout) }, [logout])

  // session existante au chargement de la page
  useEffect(() => {
    if (!getToken()) return
    me().then(setUser).catch(() => apiLogout()).finally(() => setChecking(false))
  }, [])

  const refreshFeed = useCallback(() => getFeed().then(setPosts).catch(() => {}), [])
  const refreshSaved = useCallback(() => getSaved().then(setSaved).catch(() => {}), [])
  const refreshTrips = useCallback(() => getTrips().then(setTrips).catch(() => {}), [])

  useEffect(() => {
    if (user) { refreshFeed(); refreshTrips() }
  }, [user, refreshFeed, refreshTrips])

  // recharge « Enregistrés » à chaque ouverture de la section
  useEffect(() => {
    if (user && section === 'saved') refreshSaved()
  }, [user, section, refreshSaved])

  
  useEffect(() => {
  if (!user) return
  const load = () => getUnreadCountMsg().then((r) => setUnread(r.count)).catch(() => {})
  load()
  const t = setInterval(load, 8000)
  return () => clearInterval(t)
}, [user])

  // le Composer attrape l'erreur éventuelle (la fonction throw un ApiError)
  const publish = async (text, destination, image) => {
    await createPost({ text, destination, image })
    await refreshFeed()
  }

  // une publication supprimée disparaît du feed et des enregistrés
  const removePost = (id) => {
    setPosts((l) => l.filter((p) => p.id !== id))
    setSaved((l) => l.filter((p) => p.id !== id))
  }

  // « Explorer » repart toujours de la liste, pas du dernier détail ouvert
  const navigate = (s) => {
  if (s === 'explore') setDestSlug(null)
  setChatWith(null)          // évite de rouvrir l'ancienne conversation
  setSection(s)
}

    // depuis le bouton 💬 : ouvre la messagerie directement sur la personne
   const openChat = (userId) => {
      setChatWith(userId)
      setSection('messages')
    }


  // ouvrir directement une destination (depuis « Trending »)
  const openDestination = (slug) => {
    setDestSlug(slug)
    setSection('explore')
  }

  if (checking) return null
  if (!user) return <Auth notice={notice} onAuth={(u) => { setNotice(''); setUser(u) }} />

  // données du sidebar
  const upcoming = trips
    .filter((t) => dayOnly(t.start_date) >= todayStr())
    .sort((a, b) => dayOnly(a.start_date).localeCompare(dayOnly(b.start_date)))
  const stats = {
    trips: trips.length,
    upcoming: upcoming.length,
    destinations: new Set(trips.map((t) => t.destination?.trim().toLowerCase()).filter(Boolean)).size,
  }


  return (
    <>
      <Navbar user={user} onLogout={() => logout()} onNavigate={navigate} unread={unread}/>

      <div className="layout">
        <LeftSidebar user={user} stats={stats} section={section} onNavigate={navigate} />

        <main>
          {section === 'feed' && (
            <>
              <Stories />
              <Composer user={user} onPublish={publish} />
              <AiCard />
              {posts.length === 0
                ? <p>Aucune publication pour l'instant. Sois le premier à partager !</p>
                : posts.map((p) => <Post key={p.id} post={p} onDeleted={removePost} />)}
            </>
          )}

          {section === 'saved' && (
            <>
              <h2>Enregistrés</h2>
              {saved.length === 0
                ? <p>Rien d'enregistré pour l'instant.</p>
                : saved.map((p) => (
                    <Post
                      key={p.id}
                      post={p}
                      onDeleted={removePost}
                      onSaveToggle={(id, isSaved) => {
                        if (!isSaved) setSaved((l) => l.filter((x) => x.id !== id))
                      }}
                    />
                  ))}
            </>
          )}

          {section === 'trips' && <TripsPage trips={trips} onChange={refreshTrips} />}
          {section === 'profile' && <ProfilePage user={user} onUpdate={setUser} />}
          {section === 'explore' && (
            <DestinationsPage slug={destSlug} onSlugChange={setDestSlug} />
          )}
          {section === 'itineraries' && <Itineraries />}
          {section === 'providers' && user.role !== 'provider' && <ProvidersPage onNavigate={navigate} />}
          {section === 'bookings' && user.role !== 'provider' && <MyBookingsPage onNavigate={navigate} />}
          {section === 'requests' && user.role === 'provider' && <ReceivedBookingsPage />}
          {section === 'messages' && <Messages startWith={chatWith} />}
          {section === 'reviews' && user.role === 'provider' && <ReceivedReviews />}
          {section === 'mates' && user.role !== 'provider' && <MatesPage onNavigate={navigate} onMessage={openChat} />}
        </main>

        <RightSidebar
          nextTrip={upcoming[0] ?? null}
          onNavigate={navigate}
          onOpenDestination={openDestination}
          onMessage={openChat}
        />
      </div>

      <div className="note-left">
        This pass covers the premium feed experience.
      </div>
    </>
  )
}

export default App