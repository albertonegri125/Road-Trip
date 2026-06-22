// src/lib/routing.js
// OpenRouteService — real road routing
// Dense GPX on actual road geometry — geometry_simplify: false
// Correct profiles per vehicle

const ORS_BASE = 'https://api.openrouteservice.org/v2'
const NOM_BASE = 'https://nominatim.openstreetmap.org'

const ORS_PROFILE = {
  car:    'driving-car',
  moto:   'driving-car',
  camper: 'driving-hgv',
  bike:   'cycling-road',
  walk:   'foot-hiking',
  boat:   'driving-car',
  mixed:  'driving-car',
}

const ORS_PREFERENCE = {
  car:    'recommended',
  moto:   'fastest',
  camper: 'recommended',
  bike:   'recommended',
  walk:   'recommended',
  boat:   'recommended',
  mixed:  'recommended',
}

export async function geocodeCity(cityName) {
  try {
    const res  = await fetch(`${NOM_BASE}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`, { headers: { 'Accept-Language': 'it,en' } })
    const data = await res.json()
    if (!data?.length) return null
    const r = data[0]
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), country: r.address?.country || '', display: r.display_name?.split(',')[0] || cityName }
  } catch { return null }
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(`${NOM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=10&accept-language=it,en`)
    const data = await res.json()
    const a = data.address || {}
    return { city: a.city || a.town || a.village || a.municipality || a.county || data.name || '', country: a.country || '', countryCode: a.country_code?.toUpperCase() || '' }
  } catch { return { city: '', country: '', countryCode: '' } }
}

export async function calculateRoute(waypoints, tripType = 'car') {
  const apiKey = import.meta.env.VITE_ORS_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_ORS_KEY') return straightLineRoute(waypoints)

  const profile    = ORS_PROFILE[tripType]    || 'driving-car'
  const preference = ORS_PREFERENCE[tripType] || 'recommended'
  const coords     = waypoints.filter(w => w.lat && w.lng).map(w => [w.lng, w.lat])
  if (coords.length < 2) return straightLineRoute(waypoints)

  try {
    const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
      method:  'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json, application/geo+json' },
      body: JSON.stringify({ coordinates: coords, preference, geometry_simplify: false, continue_straight: false }),
    })
    if (!res.ok) throw new Error(`ORS ${res.status}`)
    const data    = await res.json()
    const feature = data.features[0]
    const summary = feature.properties.summary
    const geometry = feature.geometry.coordinates
    console.log(`ORS: ${geometry.length} pts, ${Math.round(summary.distance/1000)} km, profile: ${profile}`)
    return { distance_km: Math.round(summary.distance / 1000), duration_min: Math.round(summary.duration / 60), geometry, segments: feature.properties.segments || [] }
  } catch (err) {
    console.warn('ORS failed:', err.message)
    return straightLineRoute(waypoints)
  }
}

async function routeSegment(from, to, tripType) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY
  if (!apiKey || apiKey.trim() === '') return null
  const profile    = ORS_PROFILE[tripType]    || 'driving-car'
  const preference = ORS_PREFERENCE[tripType] || 'recommended'
  try {
    const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
      method: 'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: [[from.lng, from.lat], [to.lng, to.lat]], preference, geometry_simplify: false }),
    })
    if (!res.ok) return null
    const data    = await res.json()
    const feature = data.features[0]
    return { geometry: feature.geometry.coordinates, distance_km: Math.round(feature.properties.summary.distance / 1000), duration_min: Math.round(feature.properties.summary.duration / 60) }
  } catch { return null }
}

function straightLineRoute(waypoints) {
  const valid = waypoints.filter(w => w.lat && w.lng)
  if (valid.length < 2) return { distance_km: 0, duration_min: 0, geometry: [] }
  const geometry = []
  for (let i = 0; i < valid.length - 1; i++) {
    const from = valid[i], to = valid[i + 1]
    for (let s = 0; s <= 100; s++) {
      const t = s / 100
      geometry.push([from.lng + (to.lng - from.lng) * t, from.lat + (to.lat - from.lat) * t])
    }
  }
  const distance_km = Math.round(valid.reduce((acc, wp, i) => i === 0 ? 0 : acc + haversine(valid[i-1], wp), 0))
  return { distance_km, duration_min: Math.round(distance_km / 70 * 60), geometry }
}

export async function extractRealCitiesFromRoute(geometry, numCities = 5) {
  if (!geometry || geometry.length < 10) return []
  const margin = Math.floor(geometry.length * 0.06)
  const usable = geometry.slice(margin, geometry.length - margin)
  if (usable.length < numCities) return []
  const step = Math.floor(usable.length / (numCities + 1))
  const results = []
  const seen    = new Set()
  for (let i = 1; i <= numCities; i++) {
    const idx  = Math.min(i * step, usable.length - 1)
    const [lng, lat] = usable[idx]
    const geo  = await reverseGeocode(lat, lng)
    if (geo.city && !seen.has(geo.city.toLowerCase())) {
      seen.add(geo.city.toLowerCase())
      results.push({ city: geo.city, country: geo.country, countryCode: geo.countryCode, lat, lng })
    }
    await sleep(1100)
  }
  return results
}

export async function generateRealStops(fromCoords, toCoords, fromName, toName, numDays, vehicle) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY

  // 1. Get full route geometry
  let fullRoute = null
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_ORS_KEY') {
    fullRoute = await calculateRoute([{ lat: fromCoords.lat, lng: fromCoords.lng }, { lat: toCoords.lat, lng: toCoords.lng }], vehicle)
  }
  const totalKm = fullRoute?.distance_km || Math.round(haversine(fromCoords, { lat: toCoords.lat, lng: toCoords.lng }) * 1.3)

  // 2. Intermediate stops count based on days and distance
  const numIntermediate = Math.max(0, Math.min(6, Math.floor(numDays * 0.5) - 1))

  // 3. Extract real cities along route
  let intermediateCities = []
  if (fullRoute?.geometry?.length > 20 && numIntermediate > 0) {
    intermediateCities = await extractRealCitiesFromRoute(fullRoute.geometry, numIntermediate)
  }

  // 4. Build stops — fromName/toName always used as typed by user
  const toGeo = toCoords ? await reverseGeocode(toCoords.lat, toCoords.lng) : { country: '' }
  const allStops = [
    { city: fromName, country: '', lat: fromCoords.lat, lng: fromCoords.lng, drive_from_prev_km: 0, drive_from_prev_h: 0, isStart: true },
    ...intermediateCities,
    { city: toName, country: toGeo.country || '', lat: toCoords.lat, lng: toCoords.lng, isEnd: true },
  ]

  // 5. Calculate per-segment routes for accurate km + build continuous geometry
  const allGeometry = []
  let totalSegKm = 0, totalSegMin = 0

  for (let i = 0; i < allStops.length - 1; i++) {
    const from = allStops[i]
    const to   = allStops[i + 1]
    const seg  = await routeSegment(from, to, vehicle)
    if (seg) {
      allStops[i + 1].drive_from_prev_km = seg.distance_km
      allStops[i + 1].drive_from_prev_h  = Math.round(seg.duration_min / 60 * 10) / 10
      totalSegKm  += seg.distance_km
      totalSegMin += seg.duration_min
      if (allGeometry.length === 0) allGeometry.push(...seg.geometry)
      else allGeometry.push(...seg.geometry.slice(1))
    } else {
      // Fallback: straight line for this segment
      const km = Math.round(haversine(from, to) * 1.3)
      allStops[i + 1].drive_from_prev_km = km
      allStops[i + 1].drive_from_prev_h  = Math.round(km / 70 * 10) / 10
    }
    if (i < allStops.length - 2) await sleep(300)
  }

  // 6. Distribute nights proportionally
  const totalNights = Math.max(numDays - 1, allStops.length - 1)
  allStops.forEach((s, i) => {
    if (i === allStops.length - 1) {
      const used = allStops.slice(0, -1).reduce((a, st) => a + (st.nights || 1), 0)
      s.nights = Math.max(1, totalNights - used)
    } else { s.nights = 1 }
  })

  const finalGeometry = allGeometry.length > 0 ? allGeometry : fullRoute?.geometry || []
  const finalKm = totalSegKm > 0 ? totalSegKm : totalKm

  console.log(`Trip: ${allStops.length} stops, ${finalKm} km, ${finalGeometry.length} geometry points`)

  return { stops: allStops, geometry: finalGeometry, distance_km: finalKm, duration_min: totalSegMin || fullRoute?.duration_min || Math.round(finalKm / 70 * 60) }
}

function haversine(a, b) {
  const R    = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x    = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function densifyGeometry(geometry, targetPoints = 7000) {
  if (!geometry || geometry.length === 0) return geometry
  if (geometry.length >= targetPoints) { console.log(`GPX: ${geometry.length} ORS pts (no densify needed)`); return geometry }
  console.log(`GPX: densifying ${geometry.length} → ${targetPoints} pts`)
  let totalDist = 0
  const segLengths = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = Math.hypot(geometry[i+1][0]-geometry[i][0], geometry[i+1][1]-geometry[i][1])
    segLengths.push(d); totalDist += d
  }
  if (totalDist === 0) return geometry
  const dense = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const from = geometry[i], to = geometry[i+1]
    const segPoints = Math.max(2, Math.round((segLengths[i] / totalDist) * targetPoints))
    for (let s = 0; s < segPoints; s++) {
      const t = s / segPoints
      dense.push([from[0]+(to[0]-from[0])*t, from[1]+(to[1]-from[1])*t])
    }
  }
  dense.push(geometry[geometry.length - 1])
  return dense
}

function escXML(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

export function buildGPX(tripTitle, waypoints, geometry, targetPoints = 7000) {
  const now   = new Date().toISOString()
  const dense = densifyGeometry(geometry, targetPoints)
  const wpts  = waypoints.filter(w=>w.lat&&w.lng).map(w =>
    `  <wpt lat="${w.lat.toFixed(6)}" lon="${w.lng.toFixed(6)}">\n    <name>${escXML(w.name||w.city||'')}</name>\n    <desc>${w.nights?`${w.nights} nott${w.nights>1?'i':'e'}`:''}${w.drive_from_prev_km?` · ${w.drive_from_prev_km}km`:''}</desc>\n    <sym>Waypoint</sym>\n  </wpt>`
  ).join('\n')
  const trkpts = dense.map(([lng,lat]) => `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"></trkpt>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Road-Trip" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata>\n    <name>${escXML(tripTitle)}</name>\n    <time>${now}</time>\n    <desc>${dense.length} track points on real roads. Garmin, Komoot, Wikiloc, OsmAnd compatible.</desc>\n  </metadata>\n${wpts}\n  <trk>\n    <name>${escXML(tripTitle)}</name>\n    <trkseg>\n${trkpts}\n    </trkseg>\n  </trk>\n</gpx>`
}

export function downloadGPX(filename, gpxString) {
  const blob = new Blob([gpxString], { type: 'application/gpx+xml' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename.replace(/[^a-z0-9]/gi,'_')+'.gpx'; a.click()
  URL.revokeObjectURL(url)
}
