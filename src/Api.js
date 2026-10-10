// src/api.js — client de l'API TravelMate (même contrat que ta page de test Django)
const API = import.meta.env.VITE_API_URL ?? '/api' // '/api' + proxy Vite (voir vite.config.js)
const TOKEN_KEY = 'access' // même clé que la page de test Django

export const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// {error} | {detail} | {champ: [messages]}  ->  texte lisible
function errorText(data, status) {
  if (!data) return `Erreur serveur (${status}).`
  if (data.error) return data.error
  if (data.detail) return data.detail
  const parts = Object.entries(data).map(([f, v]) => {
    const msg = Array.isArray(v) ? v.join(' ') : v
    return f === 'non_field_errors' ? msg : `${f} : ${msg}`
  })
  return parts.join(' | ') || `Erreur (${status}).`
}

// Appelé quand le token expire (401 hors /auth/) : App.jsx y branche la déconnexion
let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

async function request(method, path, body) {
  const isForm = body instanceof FormData
  const headers = isForm ? {} : { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new ApiError('Impossible de joindre le serveur.', 0)
  }
  
  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (res.status === 401 && token && !path.startsWith('/auth/')) {
    clearToken()
    onUnauthorized?.('Session expirée, reconnecte-toi.')
  }
  if (!res.ok) throw new ApiError(errorText(data, res.status), res.status)
  return data
}

/* ----- Auth : la réponse est { tokens: { access }, user } ----- */
async function authenticate(path, body) {
  const data = await request('POST', path, body)
  setToken(data.tokens.access)
  return data.user
}
export const login = (email, password) => authenticate('/auth/login/', { email, password })
export const register = ({ email, full_name, password }) => authenticate('/auth/register/', { email, full_name, password })
export const me = () => request('GET', '/auth/me/')
export const logout = clearToken

/* ----- Publications ----- */
export const getFeed = ({ limit = 20, skip = 0, author, destination } = {}) => {
  const qs = new URLSearchParams({ limit, skip })
  if (author) qs.set('author', author)
  if (destination) qs.set('destination', destination)
  return request('GET', `/posts/?${qs}`)
}
export const getSaved = () => request('GET', '/posts/saved/')

export const createPost = ({ text, destination, image }) => {
  if (image) {
    const fd = new FormData()
    fd.append('text', text)
    fd.append('destination', destination || '')
    fd.append('image', image)
    return request('POST', '/posts/', fd)
  }
  return request('POST', '/posts/', { text, destination })
}
export const updatePost = (id, body) => request('PATCH', `/posts/${id}/`, body)
export const deletePost = (id) => request('DELETE', `/posts/${id}/`)
export const toggleLike = (id) => request('POST', `/posts/${id}/like/`)
export const toggleSave = (id) => request('POST', `/posts/${id}/save/`)
export const addComment = (id, text) => request('POST', `/posts/${id}/comments/`, { text })
export const deleteComment = (id, cid) => request('DELETE', `/posts/${id}/comments/${cid}/`)
/* ----- Voyages (backend à confirmer, contrat tiré de ta page de test) ----- */
export const getTrips = () => request('GET', '/trips/')
export const createTrip = (trip) => request('POST', '/trips/', trip) // {title,destination,start_date,end_date,budget}
export const updateTrip = (id, body) => request('PUT', `/trips/${id}/`, body)
export const deleteTrip = (id) => request('DELETE', `/trips/${id}/`)

/* ----- Profil ----- */
export const getProfile = () => request('GET', '/auth/me/')
export const updateProfile = (body) => request('PATCH', '/auth/me/', body) // {full_name,bio,city,country,avatar_url}


/* ----- Destinations ----- */
export const getDestinations = ({ q, tag, ordering, limit } = {}) => {
  const qs = new URLSearchParams()
  if (q) qs.set('q', q)
  if (tag) qs.set('tag', tag)
  if (ordering) qs.set('ordering', ordering)
  if (limit) qs.set('limit', limit)
  const s = qs.toString()
  return request('GET', `/destinations/${s ? `?${s}` : ''}`)
}
export const getDestination = (slug) => request('GET', `/destinations/${slug}/`)
export const getDestinationPosts = (slug, { before, limit = 10 } = {}) => {
  const qs = new URLSearchParams({ limit })
  if (before) qs.set('before', before)
  return request('GET', `/destinations/${slug}/posts/?${qs}`)
}