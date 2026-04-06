// src/pages/MyTripsPage.jsx
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Plus, Map, Clock, Globe, Upload } from 'lucide-react'
import s from './MyTripsPage.module.css'

const TYPE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵', mixed:'🔀' }

export default function MyTripsPage() {
  const { user, t, lang } = useApp()
  const [trips, setTrips]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db,'trips'), where('userId','==',user.uid), orderBy('createdAt','desc'))
    getDocs(q).then(s => { setTrips(s.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) }).catch(()=>setLoading(false))
  }, [user])

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('nav_mytrips')}</h1>
          <p className={s.sub}>{trips.length} {lang==='it'?'viaggio/i salvato/i':'trip(s) saved'}</p>
        </div>
        <div className={s.hActions}>
          <Link to="/import" className={s.secBtn}><Upload size={14}/> {t('nav_import')}</Link>
          <Link to="/build"  className={s.primBtn}><Plus size={14}/> {lang==='it'?'Nuovo':'New'}</Link>
        </div>
      </div>

      {loading ? (
        <div className={s.grid}>{[1,2,3].map(i=><div key={i} className={`${s.card} skeleton`} style={{height:180}}/>)}</div>
      ) : trips.length === 0 ? (
        <div className={s.empty}>
          <span style={{fontSize:48}}>🗺️</span>
          <h2>{lang==='it'?'Nessun viaggio ancora':'No trips yet'}</h2>
          <p>{lang==='it'?'Inizia a pianificare o importa un viaggio passato.':'Start planning or import a past trip.'}</p>
          <div className={s.hActions}>
            <Link to="/build"  className={s.primBtn}><Plus size={14}/> {lang==='it'?'Pianifica':'Plan'}</Link>
            <Link to="/import" className={s.secBtn}><Upload size={14}/> {lang==='it'?'Importa':'Import'}</Link>
          </div>
        </div>
      ) : (
        <div className={s.grid}>
          {trips.map(trip => (
            <Link to={`/my-trips/${trip.id}`} key={trip.id} className={s.card}>
              <div className={s.cardTop}>
                <span className={s.tripEmoji}>{TYPE_EMOJI[trip.tripType]||'🗺️'}</span>
                <div className={s.badges}>
                  <span className={s.typeBadge}>{trip.isPast?(lang==='it'?'Passato':'Past'):(lang==='it'?'In piano':'Planning')}</span>
                  <span className={s.typeBadge} style={{background:'var(--accent-bg)',color:'var(--accent)'}}>{trip.type==='expert'?'Expert':'Base'}</span>
                </div>
              </div>
              <h2 className={s.cardTitle}>{trip.title || `${trip.from} → ${trip.to}`}</h2>
              <div className={s.cardMeta}>
                {trip.days && <span><Clock size={11}/> {trip.days} {t('days')}</span>}
                {trip.stops?.length>0 && <span><Map size={11}/> {trip.stops.length} {t('stops')}</span>}
              </div>
              <div className={s.cardFooter}>
                <span className={s.status} data-status={trip.status}>{trip.status}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
