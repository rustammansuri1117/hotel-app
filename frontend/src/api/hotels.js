import fallbackImage from '../assets/hotel.png'

const rawBase = import.meta.env.VITE_API_URL || ''
const BASE = rawBase.replace(/\/+$/, '')

const WRONG_SERVER =
  'Unexpected response from the server. Make sure the hotel backend is running (npm run dev in backend/) and that nothing else is using port 5000.'

async function request(url, options) {
  let res
  try {
    res = await fetch(`${BASE}${url}`, options)
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.message || `Request failed (${res.status})`)
  // A 200 that is not a JSON object means we are not talking to the hotel backend
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error(WRONG_SERVER)
  return body
}

// The DB stores a path like "/uploads/abc.jpg"; turn it into something an <img> can load.
export const imageUrl = (path) => (path ? `${BASE}${path}` : fallbackImage)

export function toQueryString(params = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  })
  return qs.toString()
}

// GET /api/hotels?search=&location=&maxPrice=&page=&limit=
export async function fetchHotels(queryString) {
  const body = await request(`/api/hotels?${queryString}`)
  if (!Array.isArray(body.data) || !body.pagination) throw new Error(WRONG_SERVER)
  return body
}

// GET /api/hotels/locations
export const fetchLocations = () => request('/api/hotels/locations')

// GET /api/hotels/:id
export async function fetchHotel(id) {
  const body = await request(`/api/hotels/${id}`)
  if (!body.data || typeof body.data !== 'object') throw new Error(WRONG_SERVER)
  return body
}

// POST /api/hotels  (FormData: title, description, price, latitude, longitude, location, image)
export const createHotel = (formData) =>
  request('/api/hotels', { method: 'POST', body: formData })

// PUT /api/hotels/:id
export const updateHotel = (id, formData) =>
  request(`/api/hotels/${id}`, { method: 'PUT', body: formData })

// DELETE /api/hotels/:id
export const deleteHotel = (id) => request(`/api/hotels/${id}`, { method: 'DELETE' })

// POST /api/bookings  (JSON)
export const createBooking = (payload) =>
  request('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

// GET /api/bookings/:reference
export async function fetchBooking(reference) {
  const body = await request(`/api/bookings/${encodeURIComponent(reference)}`)
  if (!body.data || typeof body.data !== 'object') throw new Error(WRONG_SERVER)
  return body
}
