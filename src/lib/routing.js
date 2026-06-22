// src/lib/routing.js
// Real road routing via OpenRouteService
// Real intermediate cities via Nominatim reverse geocoding
// High-density GPX via geometry densification

const ORS_BASE = 'https://api.openrouteservice.org/v2'
const NOM_BASE = 'https://nominatim.openstreetmap.org'

const ORS_PROFILE = {
  car:    'driving-car',
  moto:   'driving-car',
  camper: 'driving-hgv',
  bike:   'cycling-road',
  walk:   'foot-walking',
  boat:   'driving-car',
  mixed:  'driving-car',
}

// ── Geocode a city name → { lat, lng, country, display } ──
export async function geocodeCity(cityName) {
  try {
    const url = `${NOM_BASE}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'it,en' } })
    const data = await res.json()
    if (!data?.length) return null
    const r = data[0]
    return {
      lat:     parseFloat(r.lat),
      lng:     parseFloat(r.lon),
      country: r.address?.country || '',
      display: r.display_name?.split(',')[0] || cityName,
    }
  } catch { return null }
}

// ── Reverse geocode coordinates → city name ──
async function reverseGeocode(lat, lng) {
  try {
    const url = `${NOM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10&accept-language=it,en`
    const res  = await fetch(url)
    const data = await res.json()
    const a = data.address || {}
    const city    = a.city || a.town || a.village || a.municipality || a.county || data.name || ''
    const country = a.country || ''
    const countryCode = a.country_code?.toUpperCase() || ''
    return { city, country, countryCode }
  } catch { return { city: '', country: '', countryCode: '' } }
}

// ── Get real route from ORS ──
export async function calculateRoute(waypoints, tripType = 'car') {
  const apiKey = import.meta.env.VITE_ORS_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_ORS_KEY') {
    return straightLineRoute(waypoints)
  }

  const profile = ORS_PROFILE[tripType] || 'driving-car'
  const coords  = waypoints.filter(w => w.lat && w.lng).map(w => [w.lng, w.lat])
  if (coords.length < 2) return straightLineRoute(waypoints)

  try {
    const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
      method:  'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: coords }),
    })
    if (!res.ok) throw new Error(`ORS ${res.status}`)
    const data    = await res.json()
    const feature = data.features[0]
    const summary = feature.properties.summary
    return {
      distance_km:  Math.round(summary.distance / 1000),
      duration_min: Math.round(summary.duration / 60),
      geometry:     feature.geometry.coordinates,
      segments:     feature.properties.segments || [],
    }
  } catch (err) {
    console.warn('ORS failed, using straight line:', err.message)
    return straightLineRoute(waypoints)
  }
}

// ── Straight line fallback ──
function straightLineRoute(waypoints) {
  const valid = waypoints.filter(w => w.lat && w.lng)
  if (valid.length < 2) return { distance_km: 0, duration_min: 0, geometry: [] }
  const geometry = []
  for (let i = 0; i < valid.length - 1; i++) {
    const from = valid[i], to = valid[i + 1]
    for (let s = 0; s <= 30; s++) {
      const t = s / 30
      geometry.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t])
    }
  }
  const distance_km = Math.round(
    valid.reduce((acc, wp, i) => i === 0 ? 0 : acc + haversine(valid[i - 1], wp), 0)
  )
  return { distance_km, duration_min: Math.round(distance_km * 1.3), geometry }
}

// ── Extract real intermediate cities from ORS route ──
// Samples N evenly-spaced points along the geometry and reverse geocodes them
export async function extractRealCitiesFromRoute(geometry, numCities = 6) {
  if (!geometry || geometry.length < 2) return []

  // Sample points evenly spaced along route (skip first and last — those are from/to)
  const step = Math.floor(geometry.length / (numCities + 1))
  const sampleIndices = []
  for (let i = 1; i <= numCities; i++) {
    sampleIndices.push(Math.min(i * step, geometry.length - 1))
  }

  const results = []
  const seen = new Set()

  for (const idx of sampleIndices) {
    const [lng, lat] = geometry[idx]
    const geo = await reverseGeocode(lat, lng)
    if (geo.city && !seen.has(geo.city.toLowerCase())) {
      seen.add(geo.city.toLowerCase())
      results.push({ city: geo.city, country: geo.country, countryCode: geo.countryCode, lat, lng })
    }
    // Small delay to respect Nominatim rate limit (1 req/sec)
    await sleep(1100)
  }

  return results
}

// ── Generate real intermediate stops for a trip ──
// This is the main function called by aiTrip.js
export async function generateRealStops(fromCoords, toCoords, fromName, toName, numDays, vehicle, lang) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY

  // 1. Get real road route from ORS
  let route = null
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_ORS_KEY') {
    route = await calculateRoute(
      [{ lat: fromCoords.lat, lng: fromCoords.lng }, { lat: toCoords.lat, lng: toCoords.lng }],
      vehicle
    )
  }

  // 2. Calculate how many intermediate stops make sense
  const totalKm    = route?.distance_km || haversine(fromCoords, { lat: toCoords.lat, lng: toCoords.lng }) * 1.3
  const avgKmPerDay = vehicle === 'walk' ? 30 : vehicle === 'bike' ? 80 : 350
  const maxStops   = Math.max(2, Math.min(8, Math.floor(numDays * 0.6)))
  const numIntermediate = Math.max(0, maxStops - 2) // exclude from/to

  // 3. Extract real cities along the route
  let intermediateCities = []
  if (route?.geometry?.length > 10 && numIntermediate > 0) {
    try {
      intermediateCities = await extractRealCitiesFromRoute(route.geometry, numIntermediate)
    } catch (e) {
      console.warn('City extraction failed:', e)
    }
  }

  // 4. Build stops array with real city names
  const fromGeo = await reverseGeocode(fromCoords.lat, fromCoords.lng)
  const toGeo   = await reverseGeocode(toCoords.lat,   toCoords.lng)

  const allStops = [
    {
      city:    fromGeo.city || fromName,
      country: fromGeo.country || '',
      lat:     fromCoords.lat,
      lng:     fromCoords.lng,
      isStart: true,
    },
    ...intermediateCities,
    {
      city:    toGeo.city || toName,
      country: toGeo.country || '',
      lat:     toCoords.lat,
      lng:     toCoords.lng,
      isEnd: true,
    },
  ]

  // 5. Calculate km between consecutive stops
  for (let i = 1; i < allStops.length; i++) {
    const prev = allStops[i - 1]
    const curr = allStops[i]
    const km = Math.round(haversine(prev, curr) * 1.3)
    allStops[i].drive_from_prev_km = km
    allStops[i].drive_from_prev_h  = Math.round((km / (vehicle === 'bike' ? 15 : vehicle === 'walk' ? 5 : 80)) * 10) / 10
  }
  allStops[0].drive_from_prev_km = 0
  allStops[0].drive_from_prev_h  = 0

  // 6. Distribute nights across stops
  const totalNights = numDays - 1
  allStops.forEach((s, i) => {
    if (i === allStops.length - 1) {
      s.nights = Math.max(1, totalNights - allStops.slice(0, -1).reduce((a, st) => a + (st.nights || 1), 0))
    } else {
      s.nights = 1
    }
  })

  return {
    stops:       allStops,
    geometry:    route?.geometry || [],
    distance_km: route?.distance_km || Math.round(totalKm),
    duration_min: route?.duration_min || Math.round(totalKm * 1.3 / 80 * 60),
  }
}

function haversine(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── GPX builder — high density via geometry densification ──
function densifyGeometry(geometry, targetPoints = 7000) {
  if (!geometry || geometry.length === 0) return geometry
  if (geometry.length >= targetPoints) return geometry

  let totalDist = 0
  const segLengths = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = Math.hypot(geometry[i+1][0] - geometry[i][0], geometry[i+1][1] - geometry[i][1])
    segLengths.push(d)
    totalDist += d
  }
  if (totalDist === 0) return geometry

  const dense = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const from = geometry[i], to = geometry[i + 1]
    const segPoints = Math.max(2, Math.round((segLengths[i] / totalDist) * targetPoints))
    for (let s = 0; s < segPoints; s++) {
      const t = s / segPoints
      dense.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t])
    }
  }
  dense.push(geometry[geometry.length - 1])
  return dense
}

function escXML(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

export function buildGPX(tripTitle, waypoints, geometry, targetPoints = 7000) {
  const now   = new Date().toISOString()
  const dense = densifyGeometry(geometry, targetPoints)

  const wpts = waypoints.map(w =>
    `  <wpt lat="${(w.lat||0).toFixed(6)}" lon="${(w.lng||0).toFixed(6)}">
    <name>${escXML(w.name || w.city || '')}</name>
    <desc>${w.nights ? `${w.nights} nott${w.nights > 1 ? 'i' : 'e'}` : ''}</desc>
    <sym>Waypoint</sym>
  </wpt>`
  ).join('\n')

  const trkpts = dense.map(([lng, lat]) =>
    `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"></trkpt>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Road-Trip" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escXML(tripTitle)}</name>
    <time>${now}</time>
    <desc>${dense.length} track points — Garmin, Komoot, Wikiloc, OsmAnd compatible</desc>
  </metadata>
${wpts}
  <trk>
    <name>${escXML(tripTitle)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

export function downloadGPX(filename, gpxString) {
  const blob = new Blob([gpxString], { type: 'application/gpx+xml' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename.replace(/[^a-z0-9]/gi, '_') + '.gpx'
  a.click()
  URL.revokeObjectURL(url)
}
