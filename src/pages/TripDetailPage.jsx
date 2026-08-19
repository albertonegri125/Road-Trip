import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { buildGPX, downloadGPX } from '../lib/routing'
import { getVehicleDocuments, getHealthRequirements, getOfficialPortal } from '../lib/aiTrip'
import { fmtDur } from '../lib/format'
import {
  ArrowLeft, Download, Printer, Share2, Globe, MapPin,
  Clock, Route, ChevronDown, ChevronUp, ExternalLink,
  AlertCircle, Eye, Coffee, Bed, CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import s from './TripDetailPage.module.css'

const VEHICLE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵' }

export default function TripDetailPage() {
  const { id } = useParams()
  const { user, t, lang } = useApp()
  const navigate = useNavigate()
  const isIt = lang === 'it'
  const [trip, setTrip]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState(null)
  const [docsOpen, setDocsOpen] = useState(false)

  useEffect(() => {
    getDoc(doc(db,'trips',id))
      .then(snap => { if (snap.exists()) setTrip({ id:snap.id, ...snap.data() }) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleGPX() {
    if (!trip?.stops?.length) { toast.error(isIt?'Nessuna tappa':'No stops'); return }
    const stops = trip.stops.map(s => ({ name: s.city||s.name||'Stop', lat:s.lat, lng:s.lng, nights:s.nights }))
    // Real ORS geometry lives in its own doc (trips/{id}/geometry/data), fetched only here,
    // on demand — never loaded just to render the trip page. Trips saved before this fix
    // have no such doc, so we fall back to straight chords between stops for those.
    let geo = stops.map(s => [s.lng||0, s.lat||0])
    try {
      const geoSnap = await getDoc(doc(db,'trips',id,'geometry','data'))
      if (geoSnap.exists() && geoSnap.data().points?.length) geo = geoSnap.data().points
    } catch (err) { if (import.meta.env.DEV) console.warn('Geometry fetch failed:', err.message) }
    const gpx = buildGPX(trip.title, stops, geo, 7000)
    downloadGPX(trip.title||'trip', gpx)
    toast.success(isIt ? 'GPX scaricato (~7000 punti) ✅' : 'GPX downloaded (~7000 points) ✅')
  }

  async function togglePublic() {
    if (!trip) return
    const next = !trip.isPublic
    await updateDoc(doc(db,'trips',id), { isPublic: next })
    setTrip(t => ({ ...t, isPublic: next }))
    toast.success(next ? (isIt?'Viaggio pubblico nella community!':'Trip shared to community!') : (isIt?'Viaggio privato.':'Trip set to private.'))
  }

  if (loading) return <div className={s.loader}><div className={s.spin}/></div>
  if (!trip)   return <div className={s.notFound}><p>{isIt?'Viaggio non trovato.':'Trip not found.'}</p><Link to="/my-trips">← {t('nav_mytrips')}</Link></div>

  const uniqueCountries = [...new Set((trip.stops||[]).map(s=>s.country).filter(Boolean))]
  const vehicleDocs = getVehicleDocuments(trip.tripType||'car', lang)
  const healthReqs  = getHealthRequirements(uniqueCountries, lang)

  return (
    <div className={s.page}>
      {/* Back */}
      <Link to="/my-trips" className={s.back}><ArrowLeft size={14}/> {t('nav_mytrips')}</Link>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.vehicleEmoji}>{VEHICLE_EMOJI[trip.tripType]||'🗺️'}</span>
          <div>
            <h1 className={s.title}>{trip.title}</h1>
            {trip.tagline && <p className={s.tagline}>{trip.tagline}</p>}
          </div>
        </div>
        <div className={s.headerActions}>
          <button className={s.actionBtn} onClick={handleGPX} title="Download GPX">
            <Download size={14}/> GPX
          </button>
          <button className={s.actionBtn} onClick={() => window.print()} title="Print PDF">
            <Printer size={14}/> PDF
          </button>
          <button className={[s.actionBtn, trip.isPublic ? s.publicActive : ''].join(' ')} onClick={togglePublic}>
            <Globe size={14}/> {trip.isPublic ? (isIt?'Pubblico':'Public') : (isIt?'Condividi':'Share')}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className={s.statsBar}>
        {trip.total_km   && <div className={s.statChip}><Route size={13}/> {trip.total_km.toLocaleString()} km</div>}
        {trip.stops?.length && <div className={s.statChip}><MapPin size={13}/> {trip.stops.length} {isIt?'tappe':'stops'}</div>}
        {trip.touristLevel != null && (
          <div className={s.statChip}>
            {trip.touristLevel < 40 ? '🌿' : trip.touristLevel > 70 ? '📸' : '⚖️'} {trip.touristLevel}% {isIt?'touristico':'touristy'}
          </div>
        )}
        {uniqueCountries.length > 0 && (
          <div className={s.statChip}><Globe size={13}/> {uniqueCountries.join(' · ')}</div>
        )}
      </div>

      {trip.overview && <p className={s.overview}>{trip.overview}</p>}

      {trip.highlights?.length > 0 && (
        <div className={s.highlights}>
          {trip.highlights.map((h,i) => <span key={i} className={s.highlight}>✦ {h}</span>)}
        </div>
      )}

      <div className={s.body}>
        {/* Timeline */}
        <div className={s.mainCol}>
          <h2 className={s.sectionTitle}>{isIt?'Tappe del viaggio':'Trip stops'}</h2>
          {/* One row per day of driving (stops[i] → stops[i+1]), not per stop. stops[0]
              is only ever a day's departure, never its own row; the last stop is only
              ever a day's arrival. Day number = segment index + 1, independent of
              position in the stops array. */}
          {(trip.stops||[]).length > 1 && trip.stops.slice(1).map((to, i) => {
            const from = trip.stops[i]
            const day  = i + 1
            const isLastDay = i === trip.stops.length - 2
            return (
            <div key={i} className={[s.tlItem, openIdx===i ? s.tlOpen : ''].join(' ')} onClick={() => setOpenIdx(openIdx===i?null:i)}>
              <div className={s.tlDotWrap}>
                <div className={s.tlDot} style={{ background: i===0 ? 'var(--forest)' : isLastDay ? 'var(--fire)' : 'var(--rust)' }}>
                  {day}
                </div>
                {!isLastDay && <div className={s.tlLine}/>}
              </div>
              <div className={s.tlContent}>
                <div className={s.tlHead}>
                  <div>
                    <div className={s.tlCity}>
                      {from.city||from.name} → {to.city||to.name}
                      {to.drive_from_prev_km > 0 &&
                        <span className={s.tlSegInfo}> · {to.drive_from_prev_km} km · {fmtDur(to.drive_from_prev_min || 0, lang)}</span>}
                    </div>
                    <div className={s.tlMeta}>
                      {to.country && <span>{to.country}</span>}
                      {to.vibe && <span className={s.vibeBadge}>{to.vibe}</span>}
                    </div>
                    {to.nights > 1 && (
                      <div className={s.staySosta}>🏨 {isIt ? `Sosta: ${to.nights} notti a ${to.city||to.name}` : `Stay: ${to.nights} nights in ${to.city||to.name}`}</div>
                    )}
                  </div>
                  <div className={s.tlRight}>
                    {openIdx===i ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </div>
                </div>

                {openIdx===i && (
                  <div className={s.tlDetails}>
                    {to.description && <p className={s.tlDesc}>{to.description}</p>}
                    {to.see?.length>0  && <TlRow icon="👁" label={isIt?'Da vedere':'See'}   items={to.see}/>}
                    {to.eat?.length>0  && <TlRow icon="🍽" label={isIt?'Mangiare':'Eat'}    items={to.eat}/>}
                    {to.sleep?.length>0 && <TlRow icon="🛏" label={isIt?'Dormire':'Sleep'}  items={to.sleep}/>}
                    {to.local_tip  && <div className={s.tip}><span>💡</span><span>{to.local_tip}</span></div>}
                    {to.hidden_gem && <div className={s.gem}><span>💎</span><span>{to.hidden_gem}</span></div>}
                  </div>
                )}
              </div>
            </div>
            )
          })}

          {/* Practical info */}
          {trip.practical && (
            <div className={s.practBox}>
              <h3 className={s.practTitle}>🧭 {isIt?'Info pratiche':'Practical info'}</h3>
              <div className={s.practGrid}>
                {trip.practical.currency_tips       && <PractRow icon="💶" label={isIt?'Valuta':'Currency'}   text={trip.practical.currency_tips}/>}
                {trip.practical.connectivity        && <PractRow icon="📶" label="SIM / WiFi"                 text={trip.practical.connectivity}/>}
                {trip.practical.road_conditions     && <PractRow icon="🛣" label={isIt?'Strade':'Roads'}      text={trip.practical.road_conditions}/>}
                {trip.practical.budget_estimate_per_day && <PractRow icon="💰" label={isIt?'Budget/gg':'Budget/day'} text={trip.practical.budget_estimate_per_day}/>}
              </div>
              {trip.practical.border_crossings?.length > 0 && (
                <div className={s.borders}>
                  <strong>🛂 {isIt?'Frontiere':'Borders'}</strong>
                  {trip.practical.border_crossings.map((b,i) => <p key={i}>{b}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — Documents */}
        <div className={s.sideCol}>
          <div className={s.docsCard}>
            <button className={s.docsToggle} onClick={() => setDocsOpen(o=>!o)}>
              <div className={s.docsToggleLeft}>
                <AlertCircle size={14} style={{color:'var(--amber)'}}/>
                <span>{isIt?'Documenti':'Documents'}</span>
              </div>
              {docsOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
            {docsOpen && (
              <div className={s.docsBody}>
                <div className={s.docsSection}>
                  <div className={s.docsSTitle}>{isIt?'Per il veicolo':'For the vehicle'}</div>
                  <ul className={s.docsList}>
                    {vehicleDocs.map((d,i) => <li key={i}><span className={s.dot}/>  {d}</li>)}
                  </ul>
                </div>
                {uniqueCountries.map(country => {
                  const portal = getOfficialPortal(country)
                  return (
                    <div key={country} className={s.docsSection}>
                      <div className={s.docsSTitle}>🌍 {country}</div>
                      {portal ? (
                        <div className={s.portals}>
                          {portal.visa && <a href={portal.visa} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={10}/> Visa</a>}
                          {portal.info && <a href={portal.info} target="_blank" rel="noopener noreferrer" className={s.portalLink}><ExternalLink size={10}/> Embassy</a>}
                        </div>
                      ) : (
                        <p className={s.noPortal}>{isIt?'Verifica su farnesina.it':'Check farnesina.it'}</p>
                      )}
                    </div>
                  )
                })}
                {healthReqs.length > 0 && (
                  <div className={s.docsSection}>
                    <div className={s.docsSTitle}>💉 {isIt?'Vaccini':'Vaccines'}</div>
                    {healthReqs.map(h => (
                      <div key={h.country} className={s.healthItem}>
                        <strong>{h.country}:</strong> {(lang==='it'?h.vaccines_it:h.vaccines_en).join(', ')}
                        {h.malaria && <span className={s.malaria}>⚠️ malaria</span>}
                      </div>
                    ))}
                  </div>
                )}
                <p className={s.docsNote}><AlertCircle size={10}/> {isIt?'Verifica sempre sui portali ufficiali.':'Always verify on official portals.'}</p>
              </div>
            )}
          </div>

          {/* GPX info */}
          <div className={s.gpxCard}>
            <div className={s.gpxTitle}>📍 GPX</div>
            <p className={s.gpxDesc}>{isIt?'~7000 punti GPS. Compatibile con Garmin, Komoot, Wikiloc, OsmAnd.':'~7,000 GPS points. Compatible with Garmin, Komoot, Wikiloc, OsmAnd.'}</p>
            <button className={s.gpxBtn} onClick={handleGPX}><Download size={13}/> {t('build_gpx')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


function TlRow({ icon, label, items }) {
  return (
    <div className={s.tlRow}>
      <span className={s.tlRowLabel}>{icon} {label}</span>
      <div className={s.tlRowItems}>{items.map((it,i) => <span key={i} className={s.tlChip}>{it}</span>)}</div>
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
