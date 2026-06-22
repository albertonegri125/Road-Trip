import { useEffect, useRef } from 'react'

const ARCS = [
  { startLat:41.9,  startLng:12.5,  endLat:41.0,  endLng:28.9 },
  { startLat:48.9,  startLng:2.3,   endLat:31.6,  endLng:-8.0 },
  { startLat:51.5,  startLng:-0.1,  endLat:35.7,  endLng:139.7 },
  { startLat:40.4,  startLng:-3.7,  endLat:35.2,  endLng:-5.3 },
  { startLat:45.5,  startLng:9.2,   endLat:48.2,  endLng:16.4 },
  { startLat:52.5,  startLng:13.4,  endLat:42.7,  endLng:23.3 },
  { startLat:37.6,  startLng:55.8,  endLat:47.9,  endLng:106.9 },
  { startLat:43.9,  startLng:12.5,  endLat:51.1,  endLng:17.0 },
  { startLat:45.8,  startLng:15.9,  endLat:43.8,  endLng:18.4 },
  { startLat:48.1,  startLng:11.6,  endLat:55.6,  endLng:13.0 },
  { startLat:59.3,  startLng:18.1,  endLat:60.2,  endLng:25.0 },
  { startLat:50.1,  startLng:8.7,   endLat:47.4,  endLng:8.5  },
]

export default function Globe3D({ darkMode }) {
  const ref = useRef(null)
  const globeRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    let alive = true

    import('globe.gl').then(mod => {
      if (!alive || !ref.current) return
      const Globe = mod.default

      const globe = Globe()(ref.current)
      globeRef.current = globe

      globe
        .width(ref.current.offsetWidth || 400)
        .height(ref.current.offsetHeight || 400)
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(true)
        .atmosphereColor(darkMode ? '#2B5232' : '#8FBF94')
        .atmosphereAltitude(0.18)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .arcColor(() => darkMode ? '#E05A28' : '#C8481A')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2000)
        .arcStroke(0.6)
        .arcAltitude(0.25)
        .arcsData(ARCS)

      globe.controls().autoRotate = true
      globe.controls().autoRotateSpeed = 0.4
      globe.controls().enableZoom = false

      globe.pointOfView({ lat: 46, lng: 14, altitude: 2.2 })
    })

    return () => {
      alive = false
      if (globeRef.current) {
        try { globeRef.current._destructor?.() } catch {}
        globeRef.current = null
      }
    }
  }, [darkMode])

  return (
    <div ref={ref} style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden' }}/>
  )
}
