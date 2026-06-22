import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Map, Plus, Trash2, Download, Clock, Route as RouteIcon } from 'lucide-react'
import { buildGPX, downloadGPX } from '../lib/routing'
import toast from 'react-hot-toast'
import s from './MyTripsPage.module.css'

const VEHICLE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵' }

export default function MyTripsPage() {
  const { user, t, lang } = useApp()
  const isIt = lang === 'it'
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db,'trips'), where('userId','==',user.uid), orderBy('createdAt','desc')))
      .then(snap => setTrips(snap.docs.map(d => ({ id:d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [user])

  async function handleDelete(id) {
    if (!confirm(isIt ? 'Eliminare questo viaggio?' : 'Delete this trip?')) return
    await deleteDoc(doc(db,'trips',id))
    setTrips(prev => prev.filter(t => t.id !== id))
    toast.success(isIt ? 'Viaggio eliminato.' : 'Trip deleted.')
  }

  function handleGPX(trip) {
    if (!trip.stops?.length) { toast.error(isIt?'Nessuna tappa':'No stops'); return }
    const geo = trip.stops.map(s => [s.lng||0, s.lat||0])
    const gpx = buildGPX(trip.title, trip.stops.map(s=>({name:s.city||s.name, lat:s.lat, lng:s.lng, nights:s.nights})), geo, 7000)
    downloadGPX(trip.title || 'trip', gpx)
    toast.success(isIt ? 'GPX scaricato (~7000 punti)' : 'GPX downloaded (~7000 points)')
  }

  if (loading) return <div className={s.loader}><div className={s.spin}/></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t('nav_mytrips')}</h1>
        <Link to="/build" className={s.newBtn}><Plus size={14}/> {t('dash_newtrip')}</Link>
      </div>

      {trips.length === 0 ? (
        <div className={s.empty}>
          <Map size={36}/>
          <p>{isIt ? 'Nessun viaggio ancora.' : 'No trips yet.'}</p>
          <Link to="/build" className={s.emptyBtn}><Plus size={13}/> {t('dash_newtrip')}</Link>
        </div>
      ) : (
        <div className={s.list}>
          {trips.map(trip => (
            <div key={trip.id} className={s.row}>
              <Link to={`/my-trips/${trip.id}`} className={s.rowLink}>
                <div className={s.rowIcon}>{VEHICLE_EMOJI[trip.tripType] || '🗺️'}</div>
                <div className={s.rowInfo}>
                  <div className={s.rowTitle}>{trip.title}</div>
                  <div className={s.rowMeta}>
                    {trip.stops?.length || 0} {isIt?'tappe':'stops'}
                    {trip.total_km ? ` · ${trip.total_km.toLocaleString()} km` : ''}
                    {trip.createdAt && ` · ${formatDate(trip.createdAt, lang)}`}
                  </div>
                  {trip.tagline && <div className={s.rowTagline}>{trip.tagline}</div>}
                </div>
              </Link>
              <div className={s.rowActions}>
                <button className={s.actionBtn} onClick={() => handleGPX(trip)} title="Download GPX">
                  <Download size={14}/>
                </button>
                <button className={[s.actionBtn, s.deleteBtn].join(' ')} onClick={() => handleDelete(trip.id)} title="Delete">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(ts, lang) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(lang==='it'?'it-IT':'en-GB', { day:'2-digit', month:'short', year:'numeric' })
}
