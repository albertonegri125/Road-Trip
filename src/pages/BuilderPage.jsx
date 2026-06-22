import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateRoute, buildGPX, downloadGPX } from '../lib/routing'
import { generateTripWithAI, enrichStop, getVehicleDocuments, getHealthRequirements, getOfficialPortal } from '../lib/aiTrip'
import GeoInput from '../components/ui/GeoInput'
import {
  MapPin, Plus, Trash2, GripVertical, Download, Printer,
  Navigation, Loader, Clock, Route, AlertCircle, ExternalLink,
  Sparkles, Wand2, ChevronDown, ChevronUp, Eye, Map,
  Star, Coffee, Bed, Camera, CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import s from './BuilderPage.module.css'

const TRIP_TYPES = [
  { id:'car',    e:'🚗', it:'Auto',    en:'Car' },
  { id:'moto',   e:'🏍️', it:'Moto',    en:'Moto' },
  { id:'bike',   e:'🚴', it:'Bici',    en:'Bike' },
  { id:'walk',   e:'🥾', it:'A piedi', en:'On foot' },
  { id:'camper', e:'🚐', it:'Camper',  en:'Camper' },
  { id:'boat',   e:'⛵', it:'Barca',   en:'Boat' },
]

const SEASONS_IT = ['Primavera (Mar-Mag)', 'Estate (Giu-Ago)', 'Autunno (Set-Nov)', 'Inverno (Dic-Feb)']
const SEASONS_EN = ['Spring (Mar-May)', 'Summer (Jun-Aug)', 'Autumn (Sep-Nov)', 'Winter (Dec-Feb)']

const INTERESTS = {
  it: ['Natura & Trekking','Cucina locale','Storia & Cultura','Borghi nascosti','Fotografia','Off-road','Spiagge','Architettura','Mercati locali','Vita notturna'],
  en: ['Nature & Hiking','Local food','History & Culture','Hidden villages','Photography','Off-road','Beaches','Architecture','Local markets','Nightlife'],
}

// ── Tourist Slider ──
function TouristSlider({ value, onChange, lang }) {
  const labels = {
    it: [
      [0,  20, '🌿 Completamente fuori rotta'],
      [21, 40, '🗺️ Principalmente nascosto'],
      [41, 60, '⚖️ Mix equilibrato'],
      [61, 80, '🏛️ Principalmente turistico'],
      [81, 100,'📸 Full tourist trail'],
    ],
    en: [
      [0,  20, '🌿 Completely off-path'],
      [21, 40, '🗺️ Mostly hidden gems'],
      [41, 60, '⚖️ Balanced mix'],
      [61, 80, '🏛️ Mostly tourist highlights'],
      [81, 100,'📸 Full tourist trail'],
    ],
  }
  const label = (labels[lang] || labels.it).find(([a, b]) => value >= a && value <= b)?.[2] || ''
  return (
    <div className={s.sliderWrap}>
      <div className={s.sliderEnds}>
        <span>{lang==='it' ? 'Off the beaten path' : 'Off the beaten path'}</span>
        <span>{lang==='it' ? 'Tourist trail' : 'Tourist trail'}</span>
      </div>
      <input type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="tourist-slider" style={{ '--val': `${value}%` }}/>
      <div className={s.sliderLabel}>
        <span>{label}</span><span className={s.sliderPct}>{value}%</span>
      </div>
    </div>
  )
}

// ── Stop card (expert) ──
function StopCard({ stop, index, onRemove, onUpdate, onEnrich, enrichingId, lang }) {
  const [exp, setExp] = useState(false)

  return (
    <div className={[s.stopCard, stop.enriched ? s.stopEnriched : ''].join(' ')}>
      <div className={s.stopHead}>
        <div className={s.stopBadge}>{index + 1}</div>
        <div className={s.stopMain}>
          <div className={s.stopName}>{stop.name || (lang==='it' ? 'Tappa' : 'Stop')}</div>
          {stop.country && <div className={s.stopCountry}>{stop.country}</div>}
        </div>
        <div className={s.stopActions}>
          <input type="number" min={0} max={99} value={stop.nights || 1}
            onChange={e => onUpdate(stop.id, 'nights', parseInt(e.target.value) || 1)}
            className={s.nightsInput} title={lang==='it'?'Notti':'Nights'}/>
          <span className={s.nightsLabel}>{lang==='it'?'n':'n'}</span>
          {!stop.enriched && (
            <button className={s.enrichBtn} onClick={() => onEnrich(stop)} disabled={enrichingId === stop.id} title="Arricchisci">
              {enrichingId === stop.id ? <Loader size={12} style={{animation:'spin .7s linear infinite'}}/> : <Sparkles size={12}/>}
            </button>
          )}
          {stop.enriched && <CheckCircle size={13} style={{color:'var(--green)'}}/>}
          <button className={s.expandBtn} onClick={() => setExp(e => !e)}>
            {exp ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
          </button>
          <button className={s.removeBtn} onClick={() => onRemove(stop.id)}><Trash2 size={12}/></button>
        </div>
      </div>
      {exp && stop.enriched && (
        <div className={s.stopDetails}>
          {stop.description && <p className={s.stopDesc}>{stop.description}</p>}
          {stop.see?.length > 0  && <DetailRow icon={<Eye size={11}/>}    label={lang==='it'?'Da vedere':'See'}    items={stop.see}/>}
          {stop.eat?.length > 0  && <DetailRow icon={<Coffee size={11}/>} label={lang==='it'?'Mangiare':'Eat'}    items={stop.eat}/>}
          {stop.sleep?.length > 0 && <DetailRow icon={<Bed size={11}/>}   label={lang==='it'?'Dormire':'Sleep'}   items={stop.sleep}/>}
          {stop.local_tip  && <div className={s.tipRow}><span>💡</span><span>{stop.local_tip}</span></div>}
          {stop.hidden_gem && <div className={s.gemRow}><span>💎</span><span>{stop.hidden_gem}</span></div>}
          {stop.road_note  && <div className={s.tipRow}><span>🅿️</span><span>{stop.road_note}</span></div>}
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, items }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailLabel}>{icon} {label}</span>
      <div className={s.detailItems}>{items.map((it, i) => <span key={i} className={s.dItem}>{it}</span>)}</div>
    </div>
  )
}

// ── Leaflet map ──
function TripMap({ stops, route, onMapReady, onMapClick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeRef = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    import('leaflet').then(L => {
      const map = L.map(containerRef.current, { center:[46,14], zoom:5, zoomControl:false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'© OpenStreetMap', maxZoom:18,
      }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)

      map.on('click', async e => {
        const { lat, lng } = e.latlng
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=it,en`)
          const data = await res.json()
          const name = data.address?.city || data.address?.town || data.address?.village || data.name || `${lat.toFixed(3)},${lng.toFixed(3)}`
          onMapClick({ name, lat, lng, country: data.address?.country || '', nights:1, id:`s_${Date.now()}` })
        } catch {
          onMapClick({ name:`${lat.toFixed(3)},${lng.toFixed(3)}`, lat, lng, country:'', nights:1, id:`s_${Date.now()}` })
        }
      })
      mapRef.current = map
      onMapReady(map)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      markersRef.current.forEach(m => mapRef.current.removeLayer(m))
      markersRef.current = []
      stops.forEach((stop, i) => {
        if (!stop.lat || !stop.lng) return
        const color = i === 0 ? '#1B3A1F' : i === stops.length - 1 ? '#C8481A' : '#8B3A1A'
        const icon = L.divIcon({
          html:`<div style="width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);">${i+1}</div>`,
          className:'', iconSize:[26,26], iconAnchor:[13,13],
        })
        const m = L.marker([stop.lat, stop.lng], { icon })
          .bindPopup(`<div style="padding:8px 10px;min-width:120px;font-family:'DM Sans',sans-serif"><strong style="font-size:13px">${stop.name}</strong>${stop.country ? `<div style="font-size:11px;color:#888;margin-top:1px">${stop.country}</div>` : ''}</div>`)
          .addTo(mapRef.current)
        markersRef.current.push(m)
      })
    })
  }, [stops])

  useEffect(() => {
    if (!mapRef.current || !route?.geometry?.length) return
    import('leaflet').then(L => {
      if (routeRef.current) mapRef.current.removeLayer(routeRef.current)
      const ll = route.geometry.map(([lng, lat]) => [lat, lng])
      routeRef.current = L.polyline(ll, { color:'#C8481A', weight:4, opacity:.85 }).addTo(mapRef.current)
      if (ll.length) mapRef.current.fitBounds(routeRef.current.getBounds(), { padding:[40,40] })
    })
  }, [route])

  return <div ref={containerRef} className={s.mapEl}/>
}

// ── Generated result display ──
function GeneratedResult({ trip, lang }) {
  const [open, setOpen] = useState(null)
  const isIt = lang === 'it'

  return (
    <div className={s.genWrap}>
      <div className={s.genHeader}>
        <h2 className={s.genTitle}>{trip.title}</h2>
        <p className={s.genTagline}>{trip.tagline}</p>
        <p className={s.genOverview}>{trip.overview}</p>
        <div className={s.genStats}>
          {trip.total_km && <span>🗺️ {trip.total_km.toLocaleString()} km</span>}
          {trip.stops?.length && <span>📍 {trip.stops.length} {isIt?'tappe':'stops'}</span>}
          {trip.best_season && <span>🌤 {trip.best_season.slice(0,60)}</span>}
        </div>
        {trip.highlights?.length > 0 && (
          <div className={s.highlights}>
            {trip.highlights.map((h, i) => <span key={i} className={s.highlight}>✦ {h}</span>)}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className={s.timeline}>
        {trip.stops?.map((stop, i) => (
          <div key={i} className={[s.tlItem, open===i ? s.tlOpen : ''].join(' ')} onClick={() => setOpen(open===i ? null : i)}>
            <div className={s.tlLeft}>
              <div className={s.tlDot}>{i+1}</div>
              {i < trip.stops.length - 1 && <div className={s.tlLine}/>}
            </div>
            <div className={s.tlBody}>
              <div className={s.tlRow}>
                <div>
                  <div className={s.tlCity}>
                    {i === 0 
                      ? stop.city 
                      : `${trip.stops[i-1].city} → ${stop.city}`}
                  </div>
                  <div className={s.tlMeta}>{stop.country} · {stop.nights} {stop.nights>1?(isIt?'notti':'nights'):(isIt?'notte':'night')} {stop.vibe && <span className={s.vibeBadge}>{stop.vibe}</span>}</div>
                </div>
                <div className={s.tlRight}>
                  {stop.drive_from_prev_km > 0 && <span className={s.driveTag}>🚗 {stop.drive_from_prev_km}km</span>}
                  {open === i ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                </div>
              </div>
              {open === i && (
                <div className={s.tlDetails} onClick={e => e.stopPropagation()}>
                  <p className={s.tlDesc}>{stop.description}</p>
                  {stop.see?.length>0  && <TlSection icon="👁" title={isIt?'Da vedere':'See'}   items={stop.see}/>}
                  {stop.eat?.length>0  && <TlSection icon="🍽" title={isIt?'Mangiare':'Eat'}    items={stop.eat}/>}
                  {stop.sleep?.length>0 && <TlSection icon="🛏" title={isIt?'Dormire':'Sleep'}  items={stop.sleep}/>}
                  {stop.local_tip  && <div className={s.tipRow}><span>💡</span><span>{stop.local_tip}</span></div>}
                  {stop.hidden_gem && <div className={s.gemRow}><span>💎</span><span>{stop.hidden_gem}</span></div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Practical */}
      {trip.practical && (
        <div className={s.practicalBox}>
          <div className={s.practTitle}>🧭 {isIt ? 'Info pratiche' : 'Practical info'}</div>
          <div className={s.practGrid}>
            {trip.practical.currency_tips    && <PractRow icon="💶" label={isIt?'Valuta':'Currency'}   text={trip.practical.currency_tips}/>}
            {trip.practical.connectivity     && <PractRow icon="📶" label="SIM / WiFi"                 text={trip.practical.connectivity}/>}
            {trip.practical.road_conditions  && <PractRow icon="🛣" label={isIt?'Strade':'Roads'}      text={trip.practical.road_conditions}/>}
            {trip.practical.budget_estimate_per_day && <PractRow icon="💰" label={isIt?'Budget/giorno':'Budget/day'} text={trip.practical.budget_estimate_per_day}/>}
          </div>
          {trip.practical.border_crossings?.length > 0 && (
            <div className={s.borders}>
              <strong>🛂 {isIt?'Frontiere':'Borders'}</strong>
              {trip.practical.border_crossings.map((b, i) => <p key={i}>{b}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TlSection({ icon, title, items }) {
  return (
    <div className={s.tlSection}>
      <span className={s.tlSTitle}>{icon} {title}</span>
      <div className={s.tlItems}>{items.map((it, i) => <span key={i} className={s.tlItem2}>{it}</span>)}</div>
    </div>
  )
}
function PractRow({ icon, label, text }) {
  return (
    <div className={s.practRow}>
      <span>{icon}</span>
      <div><strong>{label}</strong><p>{text}</p></div>
    </div>
  )
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function BuilderPage() {
  const { user, profile, t, lang } = useApp()
  const navigate = useNavigate()
  const isIt = lang === 'it'

  const [mode,         setMode]         = useState('base')
  const [vehicle,      setVehicle]      = useState('car')
  const [touristLevel, setTouristLevel] = useState(40)
  const [interests,    setInterests]    = useState([])
  const [saving,       setSaving]       = useState(false)

  // Base
  const [from,       setFrom]       = useState('')
  const [to,         setTo]         = useState('')
  const [fromCoords, setFromCoords] = useState(null)
  const [toCoords,   setToCoords]   = useState(null)
  const [days,       setDays]       = useState('')
  const [season,     setSeason]     = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [generated,  setGenerated]  = useState(null)

  // Expert
  const [title,       setTitle]       = useState('')
  const [stops,       setStops]       = useState([])
  const [route,       setRoute]       = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [enrichingId, setEnrichingId] = useState(null)
  const [mapInst,     setMapInst]     = useState(null)
  const [docsOpen,    setDocsOpen]    = useState(false)

  const toggleInterest = i => setInterests(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i])

  // ── BASE: generate ──
  async function handleGenerate() {
    if (!from || !to) { toast.error(isIt ? 'Inserisci partenza e destinazione' : 'Enter departure and destination'); return }
    if (!days)        { toast.error(isIt ? 'Inserisci la durata' : 'Enter trip duration'); return }
    setAiLoading(true); setGenerated(null)
    try {
      const result = await generateTripWithAI({
        from, to, vehicle, days: parseInt(days),
        season: season || (isIt ? 'Primavera (Mar-Mag)' : 'Spring (Mar-May)'),
        touristLevel, interests: interests.length ? interests : (isIt ? ['Natura & Trekking'] : ['Nature & Hiking']),
        nationality: profile?.nationality || 'Italian', lang,
      })
      setGenerated(result)
      toast.success(isIt ? 'Itinerario generato! 🗺️' : 'Itinerary generated! 🗺️')
    } catch (err) {
      console.error(err)
      toast.error(isIt ? `Errore: ${err.message}` : `Error: ${err.message}`)
    } finally { setAiLoading(false) }
  }

  // ── EXPERT: map/stop actions ──
  function addStop(data) {
    setStops(prev => [...prev, { ...data, id: data.id || `s_${Date.now()}` }])
    setRoute(null)
    if (mapInst && data.lat && data.lng) mapInst.setView([data.lat, data.lng], Math.max(mapInst.getZoom(), 7))
  }
  function removeStop(id) { setStops(prev => prev.filter(s => s.id !== id)); setRoute(null) }
  function updateStop(id, k, v) { setStops(prev => prev.map(s => s.id===id ? {...s,[k]:v} : s)) }

  async function handleEnrich(stop) {
    setEnrichingId(stop.id)
    try {
      const data = await enrichStop(stop.name, stop.country, vehicle, touristLevel, lang)
      if (data) {
        setStops(prev => prev.map(s => s.id===stop.id ? {...s,...data,enriched:true} : s))
        toast.success(isIt ? `${stop.name} arricchita ✨` : `${stop.name} enriched ✨`)
      }
    } catch { toast.error('Enrichment failed') }
    finally { setEnrichingId(null) }
  }

  async function handleCalcRoute() {
    if (stops.length < 2) { toast.error(isIt ? 'Aggiungi almeno 2 tappe' : 'Add at least 2 stops'); return }
    setCalcLoading(true)
    try {
      const result = await calculateRoute(stops, vehicle)
      setRoute(result)
      toast.success(isIt ? 'Percorso calcolato!' : 'Route calculated!')
    } catch { toast.error(isIt ? 'Errore calcolo percorso' : 'Route calculation error') }
    finally { setCalcLoading(false) }
  }

  // ── GPX export ──
  function handleGPX() {
    if (!user) { toast.error(isIt ? 'Accedi per scaricare' : 'Sign in to download'); return }
    const allStops = mode==='base'
      ? (generated?.stops || []).map(s => ({ name:s.city, lat:s.lat, lng:s.lng, nights:s.nights }))
      : stops
    if (!allStops.length) { toast.error(isIt ? 'Nessuna tappa' : 'No stops'); return }
    const geo = route?.geometry || allStops.map(s => [s.lng||0, s.lat||0])
    // 7000 points by default — between 5000–10000 range
    const gpx = buildGPX(
      mode==='base' ? (generated?.title || `${from} → ${to}`) : (title || `${stops[0]?.name} → ${stops[stops.length-1]?.name}`),
      allStops, geo, 7000
    )
    downloadGPX(mode==='base' ? (generated?.title||'roadtrip') : (title||'roadtrip'), gpx)
    toast.success(isIt ? 'GPX scaricato! (~7000 punti) ✅' : 'GPX downloaded! (~7000 points) ✅')
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true)
    try {
      const isBase = mode === 'base'
      const tripTitle = isBase
        ? (generated?.title || `${from} → ${to}`)
        : (title || `${stops[0]?.name || from} → ${stops[stops.length-1]?.name || to}`)
      const data = {
        type: isBase ? 'base' : 'expert', tripType: vehicle,
        title: tripTitle, tagline: isBase ? generated?.tagline : '',
        overview: isBase ? generated?.overview : '',
        from: isBase ? from : (stops[0]?.name || ''),
        to:   isBase ? to   : (stops[stops.length-1]?.name || ''),
        total_km: isBase ? generated?.total_km : (route?.distance_km || 0),
        touristLevel, interests, season,
        stops: isBase
          ? (generated?.stops || []).map(({ id:_, ...rest }) => rest)
          : stops.map(({ id:_, ...rest }) => rest),
        practical: isBase ? generated?.practical : null,
        route: route ? { distance_km:route.distance_km, duration_min:route.duration_min } : null,
        highlights: isBase ? generated?.highlights : [],
        status:'planning', isPast:false, isPublic:false,
        userId: user.uid, createdAt: serverTimestamp(),
      }
      await addDoc(collection(db,'trips'), data)
      await updateDoc(doc(db,'users',user.uid), { tripsCreated: increment(1) })
      toast.success(isIt ? 'Viaggio salvato! 🗺️' : 'Trip saved! 🗺️')
      navigate('/my-trips')
    } catch (err) { console.error(err); toast.error('Save failed') }
    finally { setSaving(false) }
  }

  // Documents
  const vehicleDocs = getVehicleDocuments(vehicle, lang)
  const destCountries = mode==='base'
    ? (generated?.stops||[]).map(s=>s.country).filter(Boolean)
    : stops.map(s=>s.country).filter(Boolean)
  const uniqueCountries = [...new Set(destCountries)]
  const healthReqs = getHealthRequirements(uniqueCountries, lang)

  return (
    <div className={s.page}>
      {/* ── Page header ── */}
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>{t('build_title')}</h1>
          <p className={s.pageSub}>{t('build_sub')}</p>
        </div>
        <div className={s.modeTabs}>
          <button className={[s.modeTab, mode==='base'?s.modeActive:''].join(' ')} onClick={() => setMode('base')}>
            <Wand2 size={14}/> {t('build_base')}
          </button>
          <button className={[s.modeTab, mode==='expert'?s.modeActive:''].join(' ')} onClick={() => setMode('expert')}>
            <Map size={14}/> {t('build_expert')}
          </button>
        </div>
      </div>

      <div className={s.layout}>
        {/* ══ LEFT ══ */}
        <div className={s.leftCol}>

          {/* ── BASE MODE ── */}
          {mode === 'base' && (
            <>
              <div className={s.card}>
                <div className={s.cardTitle}>{isIt ? 'Dove vuoi andare?' : 'Where do you want to go?'}</div>
                <GeoInput value={from} onChange={setFrom} onSelect={r => setFromCoords({ lat:r.lat, lng:r.lng })}
                  label={t('build_from')} placeholder={isIt ? 'es. Milano, Italia' : 'e.g. Milan, Italy'}/>
                <div style={{height:10}}/>
                <GeoInput value={to} onChange={setTo} onSelect={r => setToCoords({ lat:r.lat, lng:r.lng })}
                  label={t('build_to')} placeholder={isIt ? 'es. Istanbul, Turchia' : 'e.g. Istanbul, Turkey'}/>
                <div className={s.row2} style={{marginTop:12}}>
                  <div>
                    <label className="field-label">{t('build_days')}</label>
                    <input className="field-input" type="number" min={1} max={365} value={days} onChange={e => setDays(e.target.value)} placeholder="14"/>
                  </div>
                  <div>
                    <label className="field-label">{t('build_season')}</label>
                    <select className="field-input" value={season} onChange={e => setSeason(e.target.value)}>
                      <option value="">{isIt ? 'Seleziona…' : 'Select…'}</option>
                      {(isIt ? SEASONS_IT : SEASONS_EN).map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardTitle}>{t('build_vehicle')}</div>
                <div className={s.typeGrid}>
                  {TRIP_TYPES.map(tp => (
                    <button key={tp.id} className={[s.typeBtn, vehicle===tp.id ? s.typeBtnActive : ''].join(' ')} onClick={() => setVehicle(tp.id)}>
                      <span>{tp.e}</span><span>{isIt ? tp.it : tp.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardTitle}>{t('build_tourist')}</div>
                <TouristSlider value={touristLevel} onChange={setTouristLevel} lang={lang}/>
              </div>

              <div className={s.card}>
                <div className={s.cardTitle}>{t('build_interests')}</div>
                <div className={s.tags}>
                  {INTERESTS[lang].map(i => (
                    <button key={i} className={[s.tag, interests.includes(i) ? s.tagActive : ''].join(' ')} onClick={() => toggleInterest(i)}>{i}</button>
                  ))}
                </div>
              </div>

              <button className={s.generateBtn} onClick={handleGenerate} disabled={aiLoading}>
                {aiLoading
                  ? <><Loader size={15} style={{animation:'spin .7s linear infinite'}}/> {isIt ? 'Generazione itinerario…' : 'Generating itinerary…'}</>
                  : <><Sparkles size={15}/> {t('build_generate')}</>
                }
              </button>

              {generated && <GeneratedResult trip={generated} lang={lang}/>}
            </>
          )}

          {/* ── EXPERT MODE ── */}
          {mode === 'expert' && (
            <>
              <div className={s.card}>
                <div className={s.cardTitle}>{isIt ? 'Il tuo viaggio' : 'Your trip'}</div>
                <label className="field-label">{isIt ? 'Titolo' : 'Title'}</label>
                <input className="field-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={isIt ? 'es. Giro dei Balcani 2025' : 'e.g. Balkans Loop 2025'}/>
                <div style={{marginTop:14}}>
                  <div className={s.cardTitle}>{t('build_vehicle')}</div>
                  <div className={s.typeGrid}>
                    {TRIP_TYPES.map(tp => (
                      <button key={tp.id} className={[s.typeBtn, vehicle===tp.id ? s.typeBtnActive : ''].join(' ')} onClick={() => setVehicle(tp.id)}>
                        <span>{tp.e}</span><span>{isIt ? tp.it : tp.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.card}>
                <div className={s.cardTitle}>{t('build_tourist')}</div>
                <TouristSlider value={touristLevel} onChange={setTouristLevel} lang={lang}/>
              </div>

              <div className={s.mapCard}>
                <div className={s.mapHead}>
                  <div className={s.cardTitle}>{isIt ? 'Clicca per aggiungere tappe' : 'Click to add stops'}</div>
                  {stops.length > 0 && <span className={s.stopsBadge}>{stops.length} {isIt?'tappe':'stops'}</span>}
                </div>
                <p className={s.mapHint}>{isIt ? 'Clicca sulla mappa per aggiungere una tappa, oppure cerca sotto.' : 'Click the map to add a stop, or search below.'}</p>
                <TripMap stops={stops} route={route} onMapReady={setMapInst} onMapClick={addStop}/>
                {route && (
                  <div className={s.routeStats}>
                    <span><Route size={13}/> {route.distance_km} km</span>
                    <span><Clock size={13}/> {fmtDur(route.duration_min, lang)}</span>
                  </div>
                )}
              </div>

              {/* Stop search */}
              <div className={s.card}>
                <div className={s.cardTitle}>{isIt ? 'Cerca e aggiungi tappa' : 'Search and add stop'}</div>
                <GeoInput
                  value="" onChange={() => {}}
                  onSelect={r => addStop({ name:r.name, lat:r.lat, lng:r.lng, country:r.country, nights:1, id:`s_${Date.now()}` })}
                  placeholder={isIt ? 'Cerca città…' : 'Search city…'}
                />
              </div>

              {/* Stops list */}
              {stops.length > 0 && (
                <div className={s.card}>
                  <div className={s.stopsHead}>
                    <div className={s.cardTitle}>{isIt ? 'Tappe del viaggio' : 'Trip stops'}</div>
                    <span className={s.aiHint}><Sparkles size={11}/> {isIt ? 'Clicca ✨ per dettagli' : 'Click ✨ for details'}</span>
                  </div>
                  {stops.map((stop, i) => (
                    <StopCard key={stop.id} stop={stop} index={i} lang={lang}
                      onRemove={removeStop} onUpdate={updateStop}
                      onEnrich={handleEnrich} enrichingId={enrichingId}/>
                  ))}
                </div>
              )}

              <button className={s.calcBtn} onClick={handleCalcRoute} disabled={calcLoading || stops.length < 2}>
                {calcLoading
                  ? <><Loader size={14} style={{animation:'spin .7s linear infinite'}}/> {isIt?'Calcolo…':'Calculating…'}</>
                  : <><Navigation size={14}/> {t('build_calc')}</>
                }
              </button>
            </>
          )}
        </div>

        {/* ══ RIGHT ══ */}
        <div className={s.rightCol}>
          {/* Docs panel */}
          <div className={s.docsCard}>
            <button className={s.docsToggle} onClick={() => setDocsOpen(o => !o)}>
              <div className={s.docsLeft}>
                <AlertCircle size={14} style={{color:'var(--amber)'}}/>
                <span>{isIt ? 'Documenti necessari' : 'Required documents'}</span>
              </div>
              {docsOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>

            {docsOpen && (
              <div className={s.docsContent}>
                <div className={s.docsSection}>
                  <div className={s.docsSTitle}>
                    {isIt ? `Per ${TRIP_TYPES.find(t=>t.id===vehicle)?.it}` : `For ${TRIP_TYPES.find(t=>t.id===vehicle)?.en}`}
                  </div>
                  <ul className={s.docsList}>
                    {vehicleDocs.map((d, i) => <li key={i}><span className={s.docDot}/>  {d}</li>)}
                  </ul>
                </div>

                {uniqueCountries.map(country => {
                  const portal = getOfficialPortal(country)
                  return (
                    <div key={country} className={s.docsSection}>
                      <div className={s.docsSTitle}>🌍 {country}</div>
                      {portal ? (
                        <div className={s.portalLinks}>
                          {portal.visa && <a href={portal.visa} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={11}/> {isIt?'Portale Visti':'Visa Portal'}</a>}
                          {portal.info && <a href={portal.info} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={11}/> {isIt?'Ambasciata':'Embassy'}</a>}
                        </div>
                      ) : (
                        <p className={s.docHint}>{isIt ? 'Verifica su farnesina.it o ambasciata locale.' : 'Check farnesina.it or local embassy.'}</p>
                      )}
                    </div>
                  )
                })}

                {healthReqs.length > 0 && (
                  <div className={s.docsSection}>
                    <div className={s.docsSTitle}>💉 {isIt ? 'Salute & Vaccini' : 'Health & Vaccines'}</div>
                    {healthReqs.map(h => (
                      <div key={h.country} className={s.healthRow}>
                        <strong>{h.country}:</strong>
                        <span>{(lang==='it' ? h.vaccines_it : h.vaccines_en).join(', ')}</span>
                        {h.malaria && <span className={s.malariaBadge}>⚠️ {isIt?'Rischio malaria':'Malaria risk'}</span>}
                        <p className={s.healthNote}>{lang==='it' ? h.note_it : h.note_en}</p>
                      </div>
                    ))}
                  </div>
                )}

                <p className={s.docsNote}>
                  <AlertCircle size={10}/> {isIt ? 'Informazioni indicative. Verifica sempre sui portali ufficiali prima della partenza.' : 'Indicative information. Always verify on official portals before departure.'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={s.actionsCard}>
            <button className={s.saveBtn} onClick={handleSave}
              disabled={saving || (mode==='base' && !generated) || (mode==='expert' && stops.length===0)}>
              {saving ? <><Spin white/> {isIt?'Salvataggio…':'Saving…'}</> : (isIt?'Salva viaggio':'Save trip')}
            </button>
            <div className={s.exportRow}>
              <button className={s.exportBtn} onClick={handleGPX}><Download size={13}/> GPX</button>
              <button className={s.exportBtn} onClick={() => { if (!user) { toast.error(isIt?'Accedi per stampare':'Sign in to print'); return } window.print() }}><Printer size={13}/> PDF</button>
            </div>
            {!user && <p className={s.loginNote}>{t('save_login')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Spin({ white }) {
  return <div style={{ width:13, height:13, border:`2px solid ${white?'rgba(255,255,255,.3)':'var(--border3)'}`, borderTopColor:white?'#fff':'var(--fire)', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
}
function fmtDur(min, lang) {
  const h = Math.floor(min/60), m = min%60
  return h > 0 ? `${h}h ${m}${lang==='it'?'min':'m'}` : `${m}${lang==='it'?'min':'m'}`
}
