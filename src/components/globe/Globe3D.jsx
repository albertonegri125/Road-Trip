// src/components/globe/Globe3D.jsx
import { useEffect, useRef } from 'react'

// Static trip hotspot data (will be replaced by Firestore data)
const HOTSPOTS = [
  { lat: 45.5,  lng: 9.2,   count: 142, label: 'Italy' },
  { lat: 48.8,  lng: 2.3,   count: 98,  label: 'France' },
  { lat: 40.4,  lng: -3.7,  count: 87,  label: 'Spain' },
  { lat: 52.5,  lng: 13.4,  count: 76,  label: 'Germany' },
  { lat: 35.7,  lng: 139.7, count: 65,  label: 'Japan' },
  { lat: 37.6,  lng: 126.9, count: 54,  label: 'Korea' },
  { lat: 34.0,  lng: -118,  count: 120, label: 'LA' },
  { lat: 40.7,  lng: -74,   count: 110, label: 'New York' },
  { lat: -33.9, lng: 151.2, count: 45,  label: 'Sydney' },
  { lat: 39.9,  lng: 116.4, count: 60,  label: 'Beijing' },
  { lat: 55.7,  lng: 37.6,  count: 55,  label: 'Moscow' },
  { lat: 51.5,  lng: -0.1,  count: 90,  label: 'London' },
  { lat: -22.9, lng: -43.2, count: 48,  label: 'Rio' },
  { lat: 19.4,  lng: -99.1, count: 52,  label: 'Mexico City' },
  { lat: 28.6,  lng: 77.2,  count: 43,  label: 'Delhi' },
  { lat: 41.0,  lng: 29.0,  count: 67,  label: 'Istanbul' },
  { lat: 36.2,  lng: 37.2,  count: 30,  label: 'Syria border' },
  { lat: 64.1,  lng: -21.9, count: 38,  label: 'Iceland' },
  { lat: -34.6, lng: -58.4, count: 41,  label: 'Buenos Aires' },
  { lat: 1.3,   lng: 103.8, count: 58,  label: 'Singapore' },
]

// Arc connections between popular pairs
const ARCS = [
  { startLat: 45.5, startLng: 9.2,  endLat: 41.0, endLng: 29.0 },
  { startLat: 48.8, startLng: 2.3,  endLat: 34.0, endLng: -5.0 },
  { startLat: 52.5, startLng: 13.4, endLat: 55.7, endLng: 37.6 },
  { startLat: 40.7, startLng: -74,  endLat: 51.5, endLng: -0.1 },
  { startLat: 35.7, startLng: 139.7,endLat: 1.3,  endLng: 103.8},
  { startLat: 45.5, startLng: 9.2,  endLat: 64.1, endLng: -21.9},
  { startLat: -33.9,startLng: 151.2,endLat: 1.3,  endLng: 103.8},
  { startLat: 40.4, startLng: -3.7, endLat: 19.4, endLng: -99.1},
]

export default function Globe3D({ darkMode }) {
  const containerRef = useRef(null)
  const globeRef     = useRef(null)

  useEffect(() => {
    let globe
    let destroyed = false

    async function init() {
      const GlobeGL = (await import('globe.gl')).default
      if (destroyed || !containerRef.current) return

      const w = containerRef.current.clientWidth  || 600
      const h = containerRef.current.clientHeight || 500

      globe = GlobeGL()(containerRef.current)
        .width(w).height(h)
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor(darkMode ? '#b06030' : '#e07030')
        .atmosphereAltitude(0.15)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
        // Hotspot dots
        .pointsData(HOTSPOTS)
        .pointLat('lat').pointLng('lng')
        .pointColor(() => darkMode ? '#f07030' : '#e05c1a')
        .pointAltitude(d => d.count / 1000)
        .pointRadius(d => 0.3 + d.count / 300)
        .pointLabel(d => `<div style="background:#1c1a17;color:#f0ece5;padding:6px 10px;border-radius:8px;font-family:Inter,sans-serif;font-size:13px;border:1px solid rgba(255,255,255,.1)">${d.label}: <strong>${d.count}</strong> trips</div>`)
        // Arcs
        .arcsData(ARCS)
        .arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng')
        .arcColor(() => [`rgba(224,92,26,0.8)`, `rgba(224,92,26,0.1)`])
        .arcDashLength(0.4).arcDashGap(0.15).arcDashAnimateTime(2000)
        .arcStroke(0.4)

      // Auto-rotate
      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.5
      globe.controls().enableZoom = false

      globeRef.current = globe
    }

    init()

    const ro = new ResizeObserver(() => {
      if (globeRef.current && containerRef.current) {
        globeRef.current.width(containerRef.current.clientWidth)
        globeRef.current.height(containerRef.current.clientHeight)
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)

    return () => {
      destroyed = true
      ro.disconnect()
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [darkMode])

  return (
    <div ref={containerRef} style={{ width:'100%', height:'100%', cursor:'grab' }} />
  )
}
