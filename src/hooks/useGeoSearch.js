// src/hooks/useGeoSearch.js
import { useState, useCallback, useRef } from 'react'

export function useGeoSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const search = useCallback((query) => {
    clearTimeout(timer.current)
    if (!query || query.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'it,en', 'User-Agent': 'RoadTripApp/1.0' } }
        )
        const data = await res.json()
        setResults(data.map(d => ({
          id:      d.place_id,
          label:   d.display_name,
          short:   [d.address?.city || d.address?.town || d.address?.village || d.name, d.address?.country].filter(Boolean).join(', '),
          lat:     parseFloat(d.lat),
          lng:     parseFloat(d.lon),
          country: d.address?.country || '',
        })))
      } catch { setResults([]) }
      finally   { setLoading(false) }
    }, 380)
  }, [])

  return { results, loading, search, clear: () => setResults([]) }
}
