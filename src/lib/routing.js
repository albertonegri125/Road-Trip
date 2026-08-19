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
    // extratags=1 rides the same request already being made — no extra HTTP call,
    // no extra 1.1s Nominatim wait — and surfaces population/importance for free.
    const res  = await fetch(`${NOM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&extratags=1&zoom=10&accept-language=it,en`)
    const data = await res.json()
    const a  = data.address || {}
    const et = data.extratags || {}
    // city/town/municipality only — a.village and a.county are deliberately never used
    // as a fallback: a village is too small to be a real stop, and a county is a
    // province, not a city. An empty city here means "no real city at this point",
    // handled by extractRealCitiesFromRoute skipping the candidate entirely.
    return {
      city: a.city || a.town || a.municipality || data.name || '',
      country: a.country || '',
      countryCode: a.country_code?.toUpperCase() || '',
      placeType: a.city ? 'city' : a.town ? 'town' : a.municipality ? 'municipality' : '',
      population: et.population ? (parseInt(et.population, 10) || null) : null,
      // Nominatim's own 0..1 relevance/notability score — a rough "how well-known is this place" proxy
      importance: typeof data.importance === 'number' ? data.importance : null,
    }
  } catch { return { city: '', country: '', countryCode: '', placeType: '', population: null, importance: null } }
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
    if (import.meta.env.DEV) console.log(`ORS: ${geometry.length} pts, ${Math.round(summary.distance/1000)} km, profile: ${profile}`)
    return { distance_km: Math.round(summary.distance / 1000), duration_min: Math.round(summary.duration / 60), geometry, segments: feature.properties.segments || [] }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('ORS failed:', err.message)
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
    await sleep(1100)
    // city empty = this point only resolved to a village/hamlet/county (see
    // reverseGeocode), not a real city/town — skip it rather than let a tiny place
    // through as a "stop". Fewer, real intermediate cities beat more fake ones.
    if (!geo.city) continue
    if (seen.has(geo.city.toLowerCase())) continue
    seen.add(geo.city.toLowerCase())
    results.push({
      city: geo.city, country: geo.country, countryCode: geo.countryCode, lat, lng,
      placeType: geo.placeType, population: geo.population, importance: geo.importance,
    })
  }
  return results
}

// ── Interest-aware stop selection ──
// Nominatim gives us place type + population + "importance" (its own 0..1 notability
// score) for each candidate, but nothing about topic (storia/natura/mare/...) — that
// signal doesn't exist at the city-boundary level. So the deterministic step below only
// narrows candidates by how well their "touristiness" matches the declared touristLevel;
// actual interest-topic matching is left entirely to the AI ranking step, which has real
// world knowledge of what a given city is known for.
function touristFitScore(candidate, touristLevel) {
  const importance = candidate.importance ?? 0.3 // neutral default when Nominatim has none
  const popScore    = candidate.population ? Math.min(1, Math.log10(candidate.population) / 6) : importance
  const touristiness = importance * 0.6 + popScore * 0.4 // ~0..1
  const target = touristLevel / 100
  return Math.abs(touristiness - target)
}

async function selectStopsByInterest(candidates, numFinal, interests, touristLevel, vehicle, lang) {
  // 1. Deterministic prefilter — keep the candidates whose touristiness best matches
  // touristLevel, trimmed to a shortlist small enough to keep the AI prompt cheap.
  const shortlistSize = Math.min(candidates.length, Math.max(numFinal * 2, 6))
  const shortlist = [...candidates]
    .sort((a, b) => touristFitScore(a, touristLevel) - touristFitScore(b, touristLevel))
    .slice(0, shortlistSize)

  const routeOrder = candidates.map(c => c.city)
  const byRouteOrder = list => [...list].sort((a, b) => routeOrder.indexOf(a.city) - routeOrder.indexOf(b.city))
  // Normalized match: models occasionally return "City (Country)" instead of the bare
  // name (observed from claude-sonnet-5 in testing) — an exact === match would silently
  // drop that stop and under-deliver numFinal. Strip parentheticals + case before comparing.
  const normalize = s => s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim()
  const findCandidate = name => {
    const norm = normalize(name)
    return shortlist.find(c => normalize(c.city) === norm)
        || shortlist.find(c => norm.includes(normalize(c.city)) || normalize(c.city).includes(norm))
  }

  // 2. AI ranking on the shortlist only — this is where interests (storia/natura/...)
  // actually get applied. Never let this block trip generation: any failure falls back
  // to the deterministic shortlist, trimmed and restored to route order.
  try {
    const picked = await rankStopsByAI(shortlist, numFinal, interests, touristLevel, vehicle, lang)
    if (picked?.length) {
      const matched = picked.map(findCandidate).filter(Boolean)
      if (matched.length) return byRouteOrder(matched).slice(0, numFinal)
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('AI stop ranking failed, using deterministic shortlist:', err.message)
  }
  return byRouteOrder(shortlist.slice(0, numFinal))
}

async function rankStopsByAI(shortlist, numFinal, interests, touristLevel, vehicle, lang) {
  const isIt = lang !== 'en'
  const list = shortlist
    .map((c, i) => `${i + 1}. ${c.city} (${c.country || '?'}) — popolazione: ${c.population || 'n/d'}, notorietà: ${c.importance != null ? Math.round(c.importance * 100) : 'n/d'}`)
    .join('\n')
  const prompt = isIt
    ? `Sei un esperto di viaggi on-the-road. Data questa lista di città reali lungo un percorso stradale (in ordine geografico), scegli esattamente ${numFinal} città come tappe intermedie, privilegiando quelle più in linea con gli interessi dichiarati del viaggiatore.\n\nInteressi: ${interests?.length ? interests.join(', ') : 'nessuno specificato'}\nLivello turistico desiderato (0=fuori dai sentieri battuti, 100=mete iconiche): ${touristLevel}\nVeicolo: ${vehicle}\n\nCittà candidate:\n${list}\n\nScegli esattamente ${numFinal} città da questo elenco.`
    : `You are a road-trip expert. Given this list of real cities along a road route (in geographic order), choose exactly ${numFinal} cities as intermediate stops, favoring the ones best matching the traveler's stated interests.\n\nInterests: ${interests?.length ? interests.join(', ') : 'none specified'}\nDesired touristiness (0=off the beaten path, 100=iconic destinations): ${touristLevel}\nVehicle: ${vehicle}\n\nCandidate cities:\n${list}\n\nChoose exactly ${numFinal} cities from this list.`

  const output_schema = {
    type: 'object',
    properties: { selected: { type: 'array', items: { type: 'string' } } },
    required: ['selected'],
    additionalProperties: false,
  }

  // claude-haiku-4-5 chosen after an A/B/C test against claude-sonnet-5 and claude-opus-5
  // on 4 realistic route/interest scenarios: identical city selections across all three
  // models every time, at ~1/6 the per-call cost of Opus 5. No `effort` param — haiku-4-5
  // is pre-4.6 and 400s if it's sent.
  const res = await fetch('/api/ai-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_tokens: 1024, output_schema, model: 'claude-haiku-4-5' }),
  })
  if (!res.ok) return null
  const data  = await res.json()
  const block = data?.content?.find(b => b.type === 'text')
  if (!block?.text) return null
  const parsed = JSON.parse(block.text)
  return Array.isArray(parsed.selected) ? parsed.selected : null
}

export async function generateRealStops(fromCoords, toCoords, fromName, toName, numDays, vehicle, interests = [], touristLevel = 50, lang = 'it') {
  const apiKey = import.meta.env.VITE_ORS_API_KEY

  // 1. Get full route geometry
  let fullRoute = null
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_ORS_KEY') {
    fullRoute = await calculateRoute([{ lat: fromCoords.lat, lng: fromCoords.lng }, { lat: toCoords.lat, lng: toCoords.lng }], vehicle)
  }
  const totalKm = fullRoute?.distance_km || Math.round(haversine(fromCoords, { lat: toCoords.lat, lng: toCoords.lng }) * 1.3)

  // 2. Intermediate stops count based on days and distance
  const numIntermediate = Math.max(0, Math.min(6, Math.floor(numDays * 0.5) - 1))

  // 3. Extract real cities along route — oversample so there's an actual pool to choose
  // from (today's exact-count extraction leaves nothing to filter/rank against).
  let intermediateCities = []
  if (fullRoute?.geometry?.length > 20 && numIntermediate > 0) {
    const oversample = Math.min(numIntermediate * 2 + 2, 14) // bounds extra Nominatim calls/latency
    const candidates = await extractRealCitiesFromRoute(fullRoute.geometry, oversample)
    intermediateCities = candidates.length > numIntermediate
      ? await selectStopsByInterest(candidates, numIntermediate, interests, touristLevel, vehicle, lang)
      : candidates
  }

  // 4. Build stops — fromName/toName always used as typed by user
  // Reuse country from the initial geocode when available, skip a redundant Nominatim call
  const toCountry = toCoords.country || (await reverseGeocode(toCoords.lat, toCoords.lng)).country || ''
  const allStops = [
    { city: fromName, country: fromCoords.country || '', lat: fromCoords.lat, lng: fromCoords.lng, drive_from_prev_km: 0, drive_from_prev_min: 0, isStart: true },
    ...intermediateCities,
    { city: toName, country: toCountry, lat: toCoords.lat, lng: toCoords.lng, isEnd: true },
  ]

  // 5. Calculate per-segment routes for accurate km + build continuous geometry
  const allGeometry = []
  let totalSegKm = 0, totalSegMin = 0

  for (let i = 0; i < allStops.length - 1; i++) {
    const from = allStops[i]
    const to   = allStops[i + 1]
    const seg  = await routeSegment(from, to, vehicle)
    if (seg) {
      allStops[i + 1].drive_from_prev_km  = seg.distance_km
      allStops[i + 1].drive_from_prev_min = seg.duration_min
      totalSegKm  += seg.distance_km
      totalSegMin += seg.duration_min
      if (allGeometry.length === 0) allGeometry.push(...seg.geometry)
      else allGeometry.push(...seg.geometry.slice(1))
    } else {
      // Fallback: straight line for this segment
      const km = Math.round(haversine(from, to) * 1.3)
      allStops[i + 1].drive_from_prev_km  = km
      allStops[i + 1].drive_from_prev_min = Math.round(km / 70 * 60)
    }
    if (i < allStops.length - 2) await sleep(300)
  }

  // 6. Distribute nights proportionally — the starting point isn't slept in before
  // departing (day 1 is the first real day of driving, not a night "at home"), so it
  // gets 0 nights and the whole budget is split among the stops that follow it.
  const totalNights = Math.max(numDays - 1, allStops.length - 1)
  allStops.forEach((s, i) => {
    if (i === 0) {
      s.nights = 0
    } else if (i === allStops.length - 1) {
      const used = allStops.slice(1, -1).reduce((a, st) => a + (st.nights || 1), 0)
      s.nights = Math.max(1, totalNights - used)
    } else { s.nights = 1 }
  })

  const finalGeometry = allGeometry.length > 0 ? allGeometry : fullRoute?.geometry || []
  const finalKm = totalSegKm > 0 ? totalSegKm : totalKm

  if (import.meta.env.DEV) console.log(`Trip: ${allStops.length} stops, ${finalKm} km, ${finalGeometry.length} geometry points`)

  return { stops: allStops, geometry: finalGeometry, distance_km: finalKm, duration_min: totalSegMin || fullRoute?.duration_min || Math.round(finalKm / 70 * 60) }
}

// ORS returns one segment per leg between consecutive coordinates in request order,
// so segments[i-1] is always the drive from waypoints[i-1] to waypoints[i].
export function attachSegmentDistances(waypoints, route) {
  if (!route?.segments?.length) return waypoints
  return waypoints.map((wp, i) => {
    if (i === 0) return wp
    const seg = route.segments[i - 1]
    if (!seg) return wp
    return { ...wp, drive_from_prev_km: Math.round(seg.distance / 1000), drive_from_prev_min: Math.round(seg.duration / 60) }
  })
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
  if (geometry.length >= targetPoints) {
    if (import.meta.env.DEV) console.log(`GPX: ${geometry.length} ORS pts (no densify needed)`)
    return geometry
  }
  if (import.meta.env.DEV) console.log(`GPX: densifying ${geometry.length} → ${targetPoints} pts`)
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
