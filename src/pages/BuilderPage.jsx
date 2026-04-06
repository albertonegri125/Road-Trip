// src/pages/BuilderPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateRoute, buildGPX, downloadGPX } from '../lib/routing'
import { generateTripWithAI, enrichStop, getVehicleDocuments, getHealthRequirements, getOfficialPortal } from '../lib/aiTrip'
import { useGeoSearch } from '../hooks/useGeoSearch'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  MapPin, Plus, Trash2, GripVertical, Download, Printer,
  Navigation, Loader, Clock, Route, AlertCircle, ExternalLink,
  Sparkles, Wand2, ChevronDown, ChevronUp, Eye, Map,
  Car, Bike, Footprints, Anchor, Star, Coffee, Bed, Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'
import s from './BuilderPage.module.css'

const TRIP_TYPES = [
  { id:'car',    emoji:'🚗', it:'Auto',    en:'Car' },
  { id:'moto',   emoji:'🏍️', it:'Moto',    en:'Moto' },
  { id:'bike',   emoji:'🚴', it:'Bici',    en:'Bike' },
  { id:'walk',   emoji:'🥾', it:'A piedi', en:'On foot' },
  { id:'camper', emoji:'🚐', it:'Camper',  en:'Camper' },
  { id:'boat',   emoji:'⛵', it:'Barca',   en:'Boat' },
]

const SEASONS = {
  it: ['Primavera (Mar-Mag)', 'Estate (Giu-Ago)', 'Autunno (Set-Nov)', 'Inverno (Dic-Feb)'],
  en: ['Spring (Mar-May)', 'Summer (Jun-Aug)', 'Autumn (Sep-Nov)', 'Winter (Dec-Feb)'],
}

const INTERESTS_LIST = {
  it: ['Natura & Trekking', 'Cucina locale', 'Storia & Cultura', 'Borghi nascosti', 'Fotografia', 'Off-road', 'Spiagge', 'Architettura', 'Mercati locali', 'Vita notturna'],
  en: ['Nature & Hiking', 'Local food', 'History & Culture', 'Hidden villages', 'Photography', 'Off-road', 'Beaches', 'Architecture', 'Local markets', 'Nightlife'],
}

// ── Tourist level slider ──
function TouristSlider({ value, onChange, lang }) {
  const label = value <= 20 ? (lang==='it'?'🌿 Completamente fuori rotta':'🌿 Completely off-path')
    : value <= 40 ? (lang==='it'?'🗺️ Principalmente nascosto':'🗺️ Mostly hidden')
    : value <= 60 ? (lang==='it'?'⚖️ Mix equilibrato':'⚖️ Balanced mix')
    : value <= 80 ? (lang==='it'?'🏛️ Principalmente turistico':'🏛️ Mostly tourist')
    : (lang==='it'?'📸 Full tourist trail':'📸 Full tourist trail')

  return (
    <div className={s.sliderWrap}>
      <div className={s.sliderLabels}>
        <span className={s.sliderLabelLeft}>{lang==='it'?'Off the beaten path':'Off the beaten path'}</span>
        <span className={s.sliderLabelRight}>{lang==='it'?'Tourist trail':'Tourist trail'}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="tourist-slider"
        style={{ '--val': `${value}%` }}
      />
      <div className={s.sliderValue}>{label} <span className={s.sliderPct}>{value}%</span></div>
    </div>
  )
}

// ── Stop card in expert mode ──
function StopCard({ stop, index, onRemove, onUpdate, onEnrich, enriching, lang }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const [expanded, setExpanded] = useState(false)
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={[s.stopCard, stop.enriched ? s.stopEnriched : ''].join(' ')}>
      <div className={s.stopCardHeader}>
        <button className={s.dragHandle} {...attributes} {...listeners}><GripVertical size={15}/></button>
        <div className={s.stopBadge}>{index + 1}</div>
        <div className={s.stopCardMain}>
          <div className={s.stopCardName}>{stop.name || (lang==='it'?'Tappa':'Stop')}</div>
          {stop.country && <div className={s.stopCardCountry}>{stop.country} {stop.vibe && <span className={s.vibeTag}>{stop.vibe}</span>}</div>}
        </div>
        <div className={s.stopCardActions}>
          <input type="number" min={0} max={99} value={stop.nights||1}
            onChange={e=>onUpdate(stop.id,'nights',parseInt(e.target.value)||1)}
            className={s.nightsInput} title={lang==='it'?'Notti':'Nights'}/>
          <span className={s.nightsLbl}>{lang==='it'?'n':'n'}</span>
          <button className={s.enrichBtn} onClick={()=>onEnrich(stop)} disabled={enriching===stop.id} title="AI enrich">
            {enriching===stop.id ? <Loader size={13} style={{animation:'spin .7s linear infinite'}}/> : <Sparkles size={13}/>}
          </button>
          <button className={s.expandBtn} onClick={()=>setExpanded(e=>!e)}>
            {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          <button className={s.removeBtn} onClick={()=>onRemove(stop.id)}><Trash2 size={13}/></button>
        </div>
      </div>

      {expanded && stop.enriched && (
        <div className={s.stopDetails}>
          {stop.description && <p className={s.stopDesc}>{stop.description}</p>}
          {stop.see?.length>0 && <DetailRow icon={<Eye size={13}/>} items={stop.see} lang={lang} label={lang==='it'?'Da vedere':'See'}/>}
          {stop.eat?.length>0 && <DetailRow icon={<Coffee size={13}/>} items={stop.eat} lang={lang} label={lang==='it'?'Mangiare':'Eat'}/>}
          {stop.sleep?.length>0 && <DetailRow icon={<Bed size={13}/>} items={stop.sleep} lang={lang} label={lang==='it'?'Dormire':'Sleep'}/>}
          {stop.local_tip && <div className={s.tipRow}><span>💡</span><span>{stop.local_tip}</span></div>}
          {stop.hidden_gem && <div className={s.gemRow}><span>💎</span><span>{stop.hidden_gem}</span></div>}
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, items, label }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailLabel}>{icon} {label}</span>
      <div className={s.detailItems}>{items.map((it,i)=><span key={i} className={s.detailItem}>{it}</span>)}</div>
    </div>
  )
}

// ── Stop search box ──
function StopSearch({ onAdd, lang }) {
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const { results, loading, search, clear } = useGeoSearch()
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function select(r) {
    onAdd({ name: r.short, lat: r.lat, lng: r.lng, country: r.country, nights: 1, id: `s_${Date.now()}` })
    setQuery(''); clear(); setOpen(false)
  }

  return (
    <div className={s.searchWrap} ref={ref}>
      <div className={s.searchRow}>
        <MapPin size={14} className={s.searchIcon}/>
        <input className={s.searchInput} value={query}
          onChange={e=>{ setQuery(e.target.value); search(e.target.value); setOpen(true) }}
          onFocus={()=>results.length&&setOpen(true)}
          placeholder={lang==='it'?'Cerca città o clicca sulla mappa…':'Search city or click the map…'}
        />
        {loading && <Loader size={12} className={s.searchSpin}/>}
      </div>
      {open && results.length>0 && (
        <ul className={s.dropdown}>
          {results.map(r=>(
            <li key={r.id} className={s.dropOpt} onMouseDown={()=>select(r)}>
              <MapPin size={11} style={{color:'var(--fire)',flexShrink:0}}/>
              <div><div className={s.optShort}>{r.short}</div><div className={s.optFull}>{r.label.slice(0,55)}…</div></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Leaflet map ──
function TripMap({ stops, route, onMapReady, onMapClick }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markersRef   = useRef([])
  const routeRef     = useRef(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    import('leaflet').then(L => {
      const map = L.map(containerRef.current, { center:[46,14], zoom:5 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'© OpenStreetMap', maxZoom:18,
      }).addTo(map)
      L.control.zoom({ position:'bottomright' }).addTo(map)

      map.on('click', async e => {
        const { lat, lng } = e.latlng
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers:{'Accept-Language':'it,en'} })
          const data = await res.json()
          const name = data.address?.city || data.address?.town || data.address?.village || data.name || `${lat.toFixed(3)},${lng.toFixed(3)}`
          onMapClick({ name, lat, lng, country: data.address?.country||'', nights:1, id:`s_${Date.now()}` })
        } catch { onMapClick({ name:`${lat.toFixed(3)},${lng.toFixed(3)}`, lat, lng, country:'', nights:1, id:`s_${Date.now()}` }) }
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
      stops.forEach((stop,i) => {
        if (!stop.lat||!stop.lng) return
        const color = i===0?'#1B3A1F':i===stops.length-1?'#D4521A':'#8B3A1A'
        const icon = L.divIcon({
          html:`<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.3);">${i+1}</div>`,
          className:'',iconSize:[28,28],iconAnchor:[14,14],
        })
        const m = L.marker([stop.lat,stop.lng],{icon})
          .bindPopup(`<div style="padding:10px 12px;min-width:130px;font-family:Inter,sans-serif"><strong style="font-size:13px">${stop.name}</strong>${stop.country?`<div style="font-size:11px;color:#888;margin-top:2px">${stop.country}</div>`:''}</div>`)
          .addTo(mapRef.current)
        markersRef.current.push(m)
      })
    })
  }, [stops])

  useEffect(() => {
    if (!mapRef.current||!route?.geometry) return
    import('leaflet').then(L => {
      if (routeRef.current) mapRef.current.removeLayer(routeRef.current)
      const ll = route.geometry.map(([lng,lat])=>[lat,lng])
      routeRef.current = L.polyline(ll,{ color:'#D4521A', weight:4, opacity:.85 }).addTo(mapRef.current)
      mapRef.current.fitBounds(routeRef.current.getBounds(),{padding:[40,40]})
    })
  }, [route])

  return <div ref={containerRef} className={s.mapContainer}/>
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export default function BuilderPage() {
  const { user, profile, t, lang } = useApp()
  const navigate = useNavigate()

  const [mode,         setMode]         = useState('base')
  const [vehicle,      setVehicle]      = useState('car')
  const [touristLevel, setTouristLevel] = useState(40)
  const [interests,    setInterests]    = useState([])
  const [saving,       setSaving]       = useState(false)

  // Base mode state
  const [from,         setFrom]         = useState('')
  const [to,           setTo]           = useState('')
  const [fromCoords,   setFromCoords]   = useState(null)
  const [toCoords,     setToCoords]     = useState(null)
  const [days,         setDays]         = useState('')
  const [season,       setSeason]       = useState('')
  const [aiLoading,    setAiLoading]    = useState(false)
  const [generated,    setGenerated]    = useState(null) // full AI result

  // Expert mode state
  const [title,        setTitle]        = useState('')
  const [stops,        setStops]        = useState([])
  const [route,        setRoute]        = useState(null)
  const [calcLoading,  setCalcLoading]  = useState(false)
  const [enrichingId,  setEnrichingId]  = useState(null)
  const [mapRef,       setMapRef]       = useState(null)
  const [expandedDocs, setExpandedDocs] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:6 } }))

  // Toggle interest
  const toggleInterest = i => setInterests(prev =>
    prev.includes(i) ? prev.filter(x=>x!==i) : [...prev,i]
  )

  // ── BASE: Generate with AI ──
  async function handleGenerate() {
    if (!from||!to) { toast.error(lang==='it'?'Inserisci partenza e destinazione':'Enter departure and destination'); return }
    if (!days)      { toast.error(lang==='it'?'Inserisci la durata':'Enter trip duration'); return }
    setAiLoading(true)
    setGenerated(null)
    try {
      const result = await generateTripWithAI({
        from, to, vehicle, days: parseInt(days),
        season: season || (lang==='it'?'Primavera':'Spring'),
        touristLevel,
        interests: interests.length ? interests : (lang==='it'?['Natura','Cucina locale']:['Nature','Local food']),
        nationality: profile?.nationality || 'Italian',
        lang,
      })
      setGenerated(result)
      toast.success(lang==='it'?'Itinerario generato! 🗺️':'Itinerary generated! 🗺️')
    } catch(err) {
      console.error(err)
      toast.error(lang==='it'?`Errore AI: ${err.message}`:`AI error: ${err.message}`)
    } finally { setAiLoading(false) }
  }

  // ── EXPERT: drag & drop ──
  function handleDragEnd({ active, over }) {
    if (active.id !== over?.id) {
      setStops(prev => arrayMove(prev, prev.findIndex(s=>s.id===active.id), prev.findIndex(s=>s.id===over.id)))
      setRoute(null)
    }
  }

  function addStop(data) {
    setStops(prev => [...prev, data])
    setRoute(null)
    if (mapRef&&data.lat&&data.lng) mapRef.setView([data.lat,data.lng], Math.max(mapRef.getZoom(),7))
  }

  function removeStop(id) { setStops(prev=>prev.filter(s=>s.id!==id)); setRoute(null) }
  function updateStop(id,k,v) { setStops(prev=>prev.map(s=>s.id===id?{...s,[k]:v}:s)) }

  // ── EXPERT: AI enrich single stop ──
  async function handleEnrich(stop) {
    setEnrichingId(stop.id)
    try {
      const data = await enrichStop(stop.name, stop.country, vehicle, touristLevel, lang)
      if (data) {
        setStops(prev=>prev.map(s=>s.id===stop.id?{...s,...data,enriched:true}:s))
        toast.success(lang==='it'?`${stop.name} arricchita dall'AI ✨`:`${stop.name} enriched by AI ✨`)
      }
    } catch { toast.error('AI enrichment failed') }
    finally { setEnrichingId(null) }
  }

  // ── EXPERT: Calculate route ──
  async function handleCalcRoute() {
    if (stops.length<2) { toast.error(lang==='it'?'Aggiungi almeno 2 tappe':'Add at least 2 stops'); return }
    setCalcLoading(true)
    try {
      const result = await calculateRoute(stops, vehicle)
      setRoute(result)
      toast.success(lang==='it'?'Percorso calcolato!':'Route calculated!')
    } catch { toast.error(lang==='it'?'Errore calcolo percorso':'Route calculation error') }
    finally { setCalcLoading(false) }
  }

  // ── GPX Export ──
  function handleGPX() {
    if (!user) { toast.error(lang==='it'?'Accedi per scaricare':'Sign in to download'); return }
    const allStops = mode==='base'
      ? (generated?.stops||[]).map(s=>({name:s.city,lat:s.lat,lng:s.lng,nights:s.nights}))
      : stops
    if (!allStops.length) { toast.error(lang==='it'?'Nessuna tappa':'No stops'); return }
    const geo = route?.geometry || allStops.map(s=>[s.lng||0,s.lat||0])
    const gpx = buildGPX(
      mode==='base' ? (generated?.title||`${from} → ${to}`) : (title||`${stops[0]?.name} → ${stops[stops.length-1]?.name}`),
      allStops, geo
    )
    downloadGPX(mode==='base'?(generated?.title||'roadtrip'):(title||'roadtrip'), gpx)
    toast.success('GPX scaricato! Compatibile con Garmin, Komoot, Wikiloc 🗺️')
  }

  // ── Save trip ──
  async function handleSave() {
    setSaving(true)
    try {
      const isBase = mode==='base'
      const tripStops = isBase
        ? (generated?.stops||[]).map(s=>({ city:s.city, country:s.country, lat:s.lat, lng:s.lng, nights:s.nights, description:s.description, see:s.see, eat:s.eat, sleep:s.sleep, local_tip:s.local_tip, hidden_gem:s.hidden_gem, tourist_score:s.tourist_score }))
        : stops.map(({id,...rest})=>rest)

      const data = {
        type: isBase?'base':'expert',
        tripType: vehicle,
        title: isBase?(generated?.title||`${from} → ${to}`):(title||`${stops[0]?.name||from} → ${stops[stops.length-1]?.name||to}`),
        tagline: isBase?generated?.tagline:'',
        overview: isBase?generated?.overview:'',
        from: isBase?from:(stops[0]?.name||''),
        to:   isBase?to:(stops[stops.length-1]?.name||''),
        total_km: isBase?generated?.total_km:(route?.distance_km||0),
        touristLevel, interests, season,
        stops: tripStops,
        practical: isBase?generated?.practical:null,
        route: route?{distance_km:route.distance_km,duration_min:route.duration_min}:null,
        highlights: isBase?generated?.highlights:[],
        status:'planning', isPast:false, isPublic:false,
        userId: user.uid, createdAt: serverTimestamp(),
      }
      await addDoc(collection(db,'trips'), data)
      await updateDoc(doc(db,'users',user.uid),{tripsCreated:increment(1)})
      toast.success(lang==='it'?'Viaggio salvato! 🗺️':'Trip saved! 🗺️')
      navigate('/my-trips')
    } catch(err) { console.error(err); toast.error('Save failed') }
    finally { setSaving(false) }
  }

  // ── Document requirements ──
  const vehicleDocs = getVehicleDocuments(vehicle, lang)
  const destCountries = mode==='base'
    ? (generated?.stops||[]).map(s=>s.country).filter(Boolean)
    : stops.map(s=>s.country).filter(Boolean)
  const uniqueCountries = [...new Set(destCountries)]
  const healthReqs = getHealthRequirements(uniqueCountries, lang)

  // geo search for base mode from/to
  const fromSearch = useGeoSearch()
  const toSearch   = useGeoSearch()
  const fromRef    = useRef(null)
  const toRef      = useRef(null)
  const [fromOpen, setFromOpen] = useState(false)
  const [toOpen,   setToOpen]   = useState(false)

  useEffect(() => {
    const h = e => {
      if (fromRef.current&&!fromRef.current.contains(e.target)) setFromOpen(false)
      if (toRef.current&&!toRef.current.contains(e.target)) setToOpen(false)
    }
    document.addEventListener('mousedown',h)
    return ()=>document.removeEventListener('mousedown',h)
  },[])

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>{lang==='it'?'Pianifica il tuo viaggio':'Plan your trip'}</h1>
          <p className={s.pageSub}>{lang==='it'?'La strada è il viaggio.':'The road is the journey.'}</p>
        </div>
        <div className={s.modeTabs}>
          <button className={[s.modeTab,mode==='base'?s.modeActive:''].join(' ')} onClick={()=>setMode('base')}>
            <Wand2 size={15}/> {lang==='it'?'Base (AI)':'Base (AI)'}
          </button>
          <button className={[s.modeTab,mode==='expert'?s.modeActive:''].join(' ')} onClick={()=>setMode('expert')}>
            <Map size={15}/> {lang==='it'?'Expert (Mappa)':'Expert (Map)'}
          </button>
        </div>
      </div>

      <div className={s.layout}>
        {/* ══ LEFT COLUMN ══ */}
        <div className={s.leftCol}>

          {/* ── BASE MODE ── */}
          {mode==='base' && (
            <>
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Dove vuoi andare?':'Where do you want to go?'}</div>

                {/* From */}
                <div ref={fromRef} style={{position:'relative'}}>
                  <label className="field-label">{lang==='it'?'Partenza':'Departure'}</label>
                  <div className={s.geoRow}>
                    <MapPin size={14} className={s.geoIcon}/>
                    <input className="field-input" style={{paddingLeft:32}} value={from}
                      onChange={e=>{setFrom(e.target.value);fromSearch.search(e.target.value);setFromOpen(true)}}
                      onFocus={()=>fromSearch.results.length&&setFromOpen(true)}
                      placeholder={lang==='it'?'es. Milano, Italia':'e.g. Milan, Italy'}/>
                    {fromSearch.loading&&<Loader size={12} className={s.geoSpin}/>}
                  </div>
                  {fromOpen&&fromSearch.results.length>0&&(
                    <ul className={s.dropdown}>
                      {fromSearch.results.map(r=>(
                        <li key={r.id} className={s.dropOpt} onMouseDown={()=>{setFrom(r.short);setFromCoords({lat:r.lat,lng:r.lng});fromSearch.clear();setFromOpen(false)}}>
                          <MapPin size={11} style={{color:'var(--forest)',flexShrink:0}}/>
                          <div><div className={s.optShort}>{r.short}</div><div className={s.optFull}>{r.label.slice(0,55)}</div></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* To */}
                <div ref={toRef} style={{position:'relative'}}>
                  <label className="field-label">{lang==='it'?'Destinazione':'Destination'}</label>
                  <div className={s.geoRow}>
                    <MapPin size={14} className={s.geoIcon}/>
                    <input className="field-input" style={{paddingLeft:32}} value={to}
                      onChange={e=>{setTo(e.target.value);toSearch.search(e.target.value);setToOpen(true)}}
                      onFocus={()=>toSearch.results.length&&setToOpen(true)}
                      placeholder={lang==='it'?'es. Istanbul, Turchia':'e.g. Istanbul, Turkey'}/>
                    {toSearch.loading&&<Loader size={12} className={s.geoSpin}/>}
                  </div>
                  {toOpen&&toSearch.results.length>0&&(
                    <ul className={s.dropdown}>
                      {toSearch.results.map(r=>(
                        <li key={r.id} className={s.dropOpt} onMouseDown={()=>{setTo(r.short);setToCoords({lat:r.lat,lng:r.lng});toSearch.clear();setToOpen(false)}}>
                          <MapPin size={11} style={{color:'var(--fire)',flexShrink:0}}/>
                          <div><div className={s.optShort}>{r.short}</div><div className={s.optFull}>{r.label.slice(0,55)}</div></div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Days + Season */}
                <div className={s.row2}>
                  <div>
                    <label className="field-label">{lang==='it'?'Giorni disponibili':'Available days'}</label>
                    <input className="field-input" type="number" min={1} max={365} value={days} onChange={e=>setDays(e.target.value)} placeholder="14"/>
                  </div>
                  <div>
                    <label className="field-label">{lang==='it'?'Stagione':'Season'}</label>
                    <select className="field-input" value={season} onChange={e=>setSeason(e.target.value)}>
                      <option value="">{lang==='it'?'Seleziona…':'Select…'}</option>
                      {SEASONS[lang].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle */}
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Mezzo di trasporto':'Vehicle'}</div>
                <div className={s.typeGrid}>
                  {TRIP_TYPES.map(tp=>(
                    <button key={tp.id} className={[s.typeBtn,vehicle===tp.id?s.typeBtnActive:''].join(' ')} onClick={()=>setVehicle(tp.id)}>
                      <span>{tp.emoji}</span><span>{lang==='it'?tp.it:tp.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tourist slider */}
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Quanto turistico?':'How touristy?'}</div>
                <TouristSlider value={touristLevel} onChange={setTouristLevel} lang={lang}/>
              </div>

              {/* Interests */}
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Interessi':'Interests'}</div>
                <div className={s.tags}>
                  {INTERESTS_LIST[lang].map(i=>(
                    <button key={i} className={[s.tag,interests.includes(i)?s.tagActive:''].join(' ')} onClick={()=>toggleInterest(i)}>{i}</button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button className={s.generateBtn} onClick={handleGenerate} disabled={aiLoading}>
                {aiLoading
                  ? <><Loader size={16} style={{animation:'spin .7s linear infinite'}}/> {lang==='it'?'L\'AI sta creando il tuo itinerario…':'AI is building your itinerary…'}</>
                  : <><Sparkles size={16}/> {lang==='it'?'Genera itinerario con AI':'Generate itinerary with AI'}</>
                }
              </button>

              {/* Generated result */}
              {generated && <GeneratedResult trip={generated} lang={lang}/>}
            </>
          )}

          {/* ── EXPERT MODE ── */}
          {mode==='expert' && (
            <>
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Il tuo viaggio':'Your trip'}</div>
                <label className="field-label">{lang==='it'?'Titolo':'Title'}</label>
                <input className="field-input" value={title} onChange={e=>setTitle(e.target.value)}
                  placeholder={lang==='it'?'es. Giro dei Balcani 2025':'e.g. Balkans Loop 2025'}/>

                <div style={{marginTop:14}}>
                  <div className={s.cardTitle}>{lang==='it'?'Mezzo':'Vehicle'}</div>
                  <div className={s.typeGrid}>
                    {TRIP_TYPES.map(tp=>(
                      <button key={tp.id} className={[s.typeBtn,vehicle===tp.id?s.typeBtnActive:''].join(' ')} onClick={()=>setVehicle(tp.id)}>
                        <span>{tp.emoji}</span><span>{lang==='it'?tp.it:tp.en}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tourist slider */}
              <div className={s.card}>
                <div className={s.cardTitle}>{lang==='it'?'Quanto turistico?':'How touristy?'}</div>
                <TouristSlider value={touristLevel} onChange={setTouristLevel} lang={lang}/>
              </div>

              {/* Map */}
              <div className={s.mapCard}>
                <div className={s.mapCardHead}>
                  <div className={s.cardTitle}>{lang==='it'?'Aggiungi tappe':'Add stops'}</div>
                  {stops.length>0&&<span className={s.stopsBadge}>{stops.length} {lang==='it'?'tappe':'stops'}</span>}
                </div>
                <p className={s.mapHint}>{lang==='it'?'Clicca sulla mappa per aggiungere una tappa':'Click the map to add a stop'}</p>
                <TripMap stops={stops} route={route} onMapReady={setMapRef} onMapClick={addStop}/>
                {route&&(
                  <div className={s.routeStats}>
                    <RouteChip icon={<Route size={13}/>} label={lang==='it'?'Distanza':'Distance'} value={`${route.distance_km} km`}/>
                    <RouteChip icon={<Clock size={13}/>} label={lang==='it'?'Tempo':'Time'} value={fmtDur(route.duration_min,lang)}/>
                  </div>
                )}
              </div>

              {/* Stops list */}
              {stops.length>0&&(
                <div className={s.card}>
                  <div className={s.stopsHead}>
                    <div className={s.cardTitle}>{lang==='it'?'Tappe':'Stops'}</div>
                    <span className={s.aiHint}><Sparkles size={11}/> {lang==='it'?'Clicca ✨ per arricchire con AI':'Click ✨ to AI-enrich'}</span>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={stops.map(s=>s.id)} strategy={verticalListSortingStrategy}>
                      {stops.map((stop,i)=>(
                        <StopCard key={stop.id} stop={stop} index={i} lang={lang}
                          onRemove={removeStop} onUpdate={updateStop}
                          onEnrich={handleEnrich} enriching={enrichingId}/>
                      ))}
                    </SortableContext>
                  </DndContext>
                  <StopSearch onAdd={addStop} lang={lang}/>
                </div>
              )}
              {stops.length===0&&(
                <div className={s.card}>
                  <div className={s.emptyStops}>
                    <MapPin size={28} style={{color:'var(--text3)'}}/>
                    <p>{lang==='it'?'Clicca sulla mappa per aggiungere tappe':'Click the map to add stops'}</p>
                    <StopSearch onAdd={addStop} lang={lang}/>
                  </div>
                </div>
              )}

              {/* Calculate route */}
              <button className={s.calcBtn} onClick={handleCalcRoute} disabled={calcLoading||stops.length<2}>
                {calcLoading
                  ? <><Loader size={15} style={{animation:'spin .7s linear infinite'}}/> {lang==='it'?'Calcolo…':'Calculating…'}</>
                  : <><Navigation size={15}/> {lang==='it'?'Calcola percorso reale':'Calculate real route'}</>
                }
              </button>
            </>
          )}
        </div>

        {/* ══ RIGHT COLUMN — Docs + Actions ══ */}
        <div className={s.rightCol}>
          {/* Documents panel */}
          <div className={s.docsCard}>
            <button className={s.docsToggle} onClick={()=>setExpandedDocs(e=>!e)}>
              <div className={s.docsToggleLeft}>
                <AlertCircle size={15} style={{color:'var(--sand-dark)'}}/>
                <span>{lang==='it'?'Documenti necessari':'Required documents'}</span>
              </div>
              {expandedDocs?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
            </button>

            {expandedDocs&&(
              <div className={s.docsContent}>
                {/* Vehicle docs */}
                <div className={s.docsSection}>
                  <div className={s.docsSectionTitle}>{lang==='it'?`Documenti per ${TRIP_TYPES.find(t=>t.id===vehicle)?.[lang==='it'?'it':'en']}`:`${TRIP_TYPES.find(t=>t.id===vehicle)?.en} documents`}</div>
                  <ul className={s.docsList}>
                    {vehicleDocs.map((d,i)=>(
                      <li key={i} className={s.docItem}><span className={s.docDot}/>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Country-specific */}
                {uniqueCountries.map(country=>{
                  const portal = getOfficialPortal(country)
                  return (
                    <div key={country} className={s.docsSection}>
                      <div className={s.docsSectionTitle}>🌍 {country}</div>
                      {portal?(
                        <div className={s.portalLinks}>
                          {portal.visa&&<a href={portal.visa} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={11}/> {lang==='it'?'Portale Visti':'Visa Portal'}</a>}
                          {portal.info&&<a href={portal.info} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={11}/> {lang==='it'?'Ambasciata':'Embassy'}</a>}
                        </div>
                      ):(
                        <p className={s.docHint}>{lang==='it'?'Verifica sul sito dell\'ambasciata italiana':'Check on the Italian embassy website'}</p>
                      )}
                    </div>
                  )
                })}

                {/* Health */}
                {healthReqs.length>0&&(
                  <div className={s.docsSection}>
                    <div className={s.docsSectionTitle}>💉 {lang==='it'?'Salute & Vaccini':'Health & Vaccines'}</div>
                    {healthReqs.map(h=>(
                      <div key={h.country} className={s.healthRow}>
                        <strong>{h.country}:</strong>
                        <span>{(lang==='it'?h.vaccines_it:h.vaccines_en).join(', ')}</span>
                        {h.malaria&&<span className={s.malariaBadge}>{lang==='it'?'⚠️ Rischio malaria':'⚠️ Malaria risk'}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <p className={s.docsNote}><AlertCircle size={11}/> {lang==='it'?'Informazioni indicative. Verifica sempre sui portali ufficiali prima della partenza.':'Indicative information. Always verify on official portals before departure.'}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={s.actionsCard}>
            <button className={s.saveBtn} onClick={handleSave} disabled={saving||(mode==='base'&&!generated)||(mode==='expert'&&!stops.length)}>
              {saving?<><Spin white/>{lang==='it'?'Salvataggio…':'Saving…'}</>:(lang==='it'?'Salva viaggio':'Save trip')}
            </button>
            <div className={s.exportRow}>
              <button className={s.exportBtn} onClick={handleGPX}><Download size={14}/> GPX</button>
              <button className={s.exportBtn} onClick={()=>{if(!user){toast.error(lang==='it'?'Accedi per stampare':'Sign in to print');return}window.print()}}><Printer size={14}/> PDF</button>
            </div>
            {!user&&<p className={s.loginNote}>{lang==='it'?'Accedi per salvare ed esportare':'Sign in to save and export'}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Generated result display ──
function GeneratedResult({ trip, lang }) {
  const [openStop, setOpenStop] = useState(null)

  return (
    <div className={s.generatedWrap}>
      {/* Header */}
      <div className={s.genHeader}>
        <h2 className={s.genTitle}>{trip.title}</h2>
        <p className={s.genTagline}>{trip.tagline}</p>
        <p className={s.genOverview}>{trip.overview}</p>
        <div className={s.genStats}>
          <span>🗺️ {trip.total_km?.toLocaleString()} km</span>
          <span>📅 {trip.stops?.length} {lang==='it'?'tappe':'stops'}</span>
          {trip.best_season&&<span>🌤 {trip.best_season}</span>}
        </div>
        {trip.highlights&&(
          <div className={s.highlights}>
            {trip.highlights.map((h,i)=><span key={i} className={s.highlight}>✦ {h}</span>)}
          </div>
        )}
      </div>

      {/* Cinematic timeline */}
      <div className={s.timeline}>
        {trip.stops?.map((stop,i)=>(
          <div key={i} className={[s.timelineStop, openStop===i?s.timelineOpen:''].join(' ')} onClick={()=>setOpenStop(openStop===i?null:i)}>
            <div className={s.tlLeft}>
              <div className={s.tlDot}>{i+1}</div>
              {i<trip.stops.length-1&&<div className={s.tlLine}/>}
            </div>
            <div className={s.tlBody}>
              <div className={s.tlHead}>
                <div>
                  <div className={s.tlCity}>{stop.city}</div>
                  <div className={s.tlMeta}>{stop.country} · {stop.nights} {stop.nights>1?(lang==='it'?'notti':'nights'):(lang==='it'?'notte':'night')} {stop.vibe&&<span className={s.vibeTag}>{stop.vibe}</span>}</div>
                </div>
                <div className={s.tlRight}>
                  {stop.drive_from_prev_km>0&&<span className={s.driveChip}>🚗 {stop.drive_from_prev_km}km · {stop.drive_from_prev_h}h</span>}
                  <span className={s.touristBar} title={`${stop.tourist_score}% touristy`} style={{'--ts':`${stop.tourist_score||50}%`}}/>
                </div>
              </div>

              {openStop===i&&(
                <div className={s.tlDetails} onClick={e=>e.stopPropagation()}>
                  <p className={s.tlDesc}>{stop.description}</p>
                  {stop.see?.length>0&&<TlSection icon="👁" title={lang==='it'?'Da vedere':'See'} items={stop.see}/>}
                  {stop.eat?.length>0&&<TlSection icon="🍽" title={lang==='it'?'Mangiare':'Eat'} items={stop.eat}/>}
                  {stop.sleep?.length>0&&<TlSection icon="🛏" title={lang==='it'?'Dormire':'Sleep'} items={stop.sleep}/>}
                  {stop.local_tip&&<div className={s.tipRow}><span>💡</span><span>{stop.local_tip}</span></div>}
                  {stop.hidden_gem&&<div className={s.gemRow}><span>💎</span><span>{stop.hidden_gem}</span></div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Practical info */}
      {trip.practical&&(
        <div className={s.practicalBox}>
          <div className={s.practicalTitle}>🧭 {lang==='it'?'Info pratiche':'Practical info'}</div>
          <div className={s.practicalGrid}>
            {trip.practical.currency_tips&&<PractInfo icon="💶" label={lang==='it'?'Valuta':'Currency'} text={trip.practical.currency_tips}/>}
            {trip.practical.connectivity&&<PractInfo icon="📶" label="SIM / WiFi" text={trip.practical.connectivity}/>}
            {trip.practical.road_conditions&&<PractInfo icon="🛣" label={lang==='it'?'Strade':'Roads'} text={trip.practical.road_conditions}/>}
            {trip.practical.budget_estimate_per_day&&<PractInfo icon="💰" label={lang==='it'?'Budget/giorno':'Budget/day'} text={trip.practical.budget_estimate_per_day}/>}
          </div>
          {trip.practical.border_crossings?.length>0&&(
            <div className={s.borderCrossings}>
              <strong>🛂 {lang==='it'?'Frontiere':'Borders'}</strong>
              {trip.practical.border_crossings.map((b,i)=><p key={i}>{b}</p>)}
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
      <span className={s.tlSectionTitle}>{icon} {title}</span>
      <div className={s.tlItems}>{items.map((it,i)=><span key={i} className={s.tlItem}>{it}</span>)}</div>
    </div>
  )
}

function PractInfo({ icon, label, text }) {
  return (
    <div className={s.practInfo}>
      <span className={s.practIcon}>{icon}</span>
      <div><strong>{label}</strong><p>{text}</p></div>
    </div>
  )
}

function RouteChip({ icon, label, value }) {
  return (
    <div className={s.routeChip}>
      {icon}
      <div><div className={s.routeChipLabel}>{label}</div><div className={s.routeChipVal}>{value}</div></div>
    </div>
  )
}

function Spin({ white }) {
  return <div style={{width:14,height:14,border:`2px solid ${white?'rgba(255,255,255,.3)':'var(--border2)'}`,borderTopColor:white?'#fff':'var(--fire)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function fmtDur(min, lang) {
  const h = Math.floor(min/60), m = min%60
  return h>0 ? `${h}h ${m}${lang==='it'?'min':'m'}` : `${m}${lang==='it'?'min':'m'}`
}
