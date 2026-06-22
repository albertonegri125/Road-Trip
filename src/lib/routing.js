// src/lib/routing.js
// OpenRouteService — free tier: 2000 req/day
// High-density GPX: 5000–10000 points via dense interpolation

const ORS_BASE = 'https://api.openrouteservice.org/v2'

const ORS_PROFILE = {
  car:    'driving-car',
  moto:   'driving-car',
  camper: 'driving-hgv',
  bike:   'cycling-road',
  walk:   'foot-walking',
  boat:   'driving-car',
  mixed:  'driving-car',
}

/**
 * Calculate a real road route between multiple waypoints.
 * Returns { distance_km, duration_min, geometry: [[lng,lat],...] }
 */
export async function calculateRoute(waypoints, tripType = 'car') {
  const apiKey = import.meta.env.VITE_ORS_API_KEY
  if (!apiKey || apiKey === 'YOUR_ORS_KEY' || apiKey.trim() === '') {
    return fallbackRoute(waypoints)
  }

  const profile = ORS_PROFILE[tripType] || 'driving-car'
  const coords  = waypoints.filter(w => w.lat && w.lng).map(w => [w.lng, w.lat])

  if (coords.length < 2) return fallbackRoute(waypoints)

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
      geometry:     feature.geometry.coordinates, // [[lng,lat],...]
      segments:     feature.properties.segments || [],
    }
  } catch (err) {
    console.warn('ORS routing failed, using fallback:', err.message)
    return fallbackRoute(waypoints)
  }
}

/** Straight-line fallback */
function fallbackRoute(waypoints) {
  const valid = waypoints.filter(w => w.lat && w.lng)
  if (valid.length < 2) return { distance_km: 0, duration_min: 0, geometry: [] }

  const geometry = []
  for (let i = 0; i < valid.length - 1; i++) {
    const from = valid[i], to = valid[i + 1]
    for (let s = 0; s <= 20; s++) {
      geometry.push([
        from.lng + (to.lng - from.lng) * (s / 20),
        from.lat + (to.lat - from.lat) * (s / 20),
      ])
    }
  }
  const distance_km = Math.round(
    valid.reduce((acc, wp, i) => i === 0 ? 0 : acc + haversine(valid[i - 1], wp), 0)
  )
  return { distance_km, duration_min: Math.round(distance_km * 1.2), geometry }
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

/**
 * Interpolate a geometry to reach targetPoints total points.
 * Used to generate high-density GPX (5000–10000 points).
 */
function densifyGeometry(geometry, targetPoints = 7000) {
  if (!geometry || geometry.length === 0) return geometry
  if (geometry.length >= targetPoints) return geometry

  // Calculate total polyline length in degrees (approx)
  let totalDist = 0
  const segLengths = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = Math.hypot(
      geometry[i + 1][0] - geometry[i][0],
      geometry[i + 1][1] - geometry[i][1]
    )
    segLengths.push(d)
    totalDist += d
  }
  if (totalDist === 0) return geometry

  const dense = []
  for (let i = 0; i < geometry.length - 1; i++) {
    const from = geometry[i]
    const to   = geometry[i + 1]
    // How many sub-points for this segment proportional to its length
    const segPoints = Math.max(2, Math.round((segLengths[i] / totalDist) * targetPoints))
    for (let s = 0; s < segPoints; s++) {
      const t = s / segPoints
      dense.push([
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
      ])
    }
  }
  dense.push(geometry[geometry.length - 1]) // add final point
  return dense
}

function escXML(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

/**
 * Build GPX string.
 * targetPoints controls density (default 7000 — range 5000–10000).
 * High density = smooth route on Garmin, Komoot, Wikiloc.
 */
export function buildGPX(tripTitle, waypoints, geometry, targetPoints = 7000) {
  const now  = new Date().toISOString()
  const dense = densifyGeometry(geometry, targetPoints)

  const wpts = waypoints.map(w =>
    `  <wpt lat="${w.lat}" lon="${w.lng}">
    <name>${escXML(w.name || w.city || '')}</name>
    <desc>${w.nights ? `${w.nights} night${w.nights > 1 ? 's' : ''}` : ''}</desc>
    <sym>Waypoint</sym>
  </wpt>`
  ).join('\n')

  const trkpts = dense.map(([lng, lat]) =>
    `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"></trkpt>`
  ).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Road-Trip v5" xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escXML(tripTitle)}</name>
    <time>${now}</time>
    <desc>Generated by Road-Trip — ${dense.length} track points. Compatible with Garmin, Komoot, Wikiloc, OsmAnd.</desc>
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
