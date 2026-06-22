import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Plus, Map, Users, MessageSquare, ArrowRight, Route, Globe, Clock } from 'lucide-react'
import s from './DashboardPage.module.css'

export default function DashboardPage() {
  const { user, profile, t, lang } = useApp()
  const [recentTrips, setRecentTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const isIt = lang === 'it'

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db,'trips'), where('userId','==',user.uid), orderBy('createdAt','desc'), limit(3)))
      .then(snap => setRecentTrips(snap.docs.map(d => ({ id:d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const name = profile?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || ''

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.hello}>{isIt ? `Ciao, ${name} 👋` : `Hey, ${name} 👋`}</h1>
          <p className={s.sub}>{isIt ? 'Dove ti porta la strada oggi?' : 'Where does the road take you today?'}</p>
        </div>
        <Link to="/build" className={s.newBtn}>
          <Plus size={15}/> {t('dash_newtrip')}
        </Link>
      </div>

      {/* Stats */}
      <div className={s.statsRow}>
        {[
          { icon:<Route size={16}/>, val: profile?.tripsCreated || 0,         label: t('dash_stats_trips') },
          { icon:<Globe size={16}/>, val: (profile?.totalKm||0).toLocaleString() + ' km', label: t('dash_stats_km') },
          { icon:<Map size={16}/>,   val: (profile?.countriesVisited||[]).length, label: t('dash_stats_countries') },
        ].map((s2, i) => (
          <div key={i} className={s.statCard}>
            <div className={s.statIcon}>{s2.icon}</div>
            <div className={s.statVal}>{s2.val}</div>
            <div className={s.statLbl}>{s2.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className={s.quickGrid}>
        <Link to="/build" className={[s.qCard, s.qPrimary].join(' ')}>
          <Plus size={22}/>
          <div>
            <div className={s.qTitle}>{t('dash_newtrip')}</div>
            <div className={s.qSub}>{isIt ? 'Base (AI) o Expert (Mappa)' : 'Base (AI) or Expert (Map)'}</div>
          </div>
          <ArrowRight size={16} className={s.qArrow}/>
        </Link>
        <Link to="/my-trips" className={s.qCard}>
          <Map size={22}/>
          <div>
            <div className={s.qTitle}>{t('dash_mytrips')}</div>
            <div className={s.qSub}>{isIt ? 'Visualizza e scarica GPX' : 'View and download GPX'}</div>
          </div>
          <ArrowRight size={16} className={s.qArrow}/>
        </Link>
        <Link to="/community" className={s.qCard}>
          <Users size={22}/>
          <div>
            <div className={s.qTitle}>{t('dash_community')}</div>
            <div className={s.qSub}>{isIt ? 'Itinerari della community' : 'Community itineraries'}</div>
          </div>
          <ArrowRight size={16} className={s.qArrow}/>
        </Link>
        <Link to="/forum" className={s.qCard}>
          <MessageSquare size={22}/>
          <div>
            <div className={s.qTitle}>{t('nav_forum')}</div>
            <div className={s.qSub}>{isIt ? 'Domande e consigli' : 'Questions and tips'}</div>
          </div>
          <ArrowRight size={16} className={s.qArrow}/>
        </Link>
      </div>

      {/* Recent trips */}
      <div className={s.section}>
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle}>{isIt ? 'Ultimi viaggi' : 'Recent trips'}</h2>
          <Link to="/my-trips" className={s.seeAll}>{isIt ? 'Vedi tutti →' : 'See all →'}</Link>
        </div>
        {loading ? (
          <div className={s.loadRow}><div className={s.spin}/></div>
        ) : recentTrips.length === 0 ? (
          <div className={s.empty}>
            <Map size={32}/>
            <p>{isIt ? 'Nessun viaggio ancora. Creane uno!' : 'No trips yet. Create one!'}</p>
            <Link to="/build" className={s.emptyBtn}><Plus size={14}/> {t('dash_newtrip')}</Link>
          </div>
        ) : (
          <div className={s.tripList}>
            {recentTrips.map(trip => (
              <Link key={trip.id} to={`/my-trips/${trip.id}`} className={s.tripRow}>
                <div className={s.tripIcon}>{VEHICLE_EMOJI[trip.tripType] || '🗺️'}</div>
                <div className={s.tripInfo}>
                  <div className={s.tripTitle}>{trip.title}</div>
                  <div className={s.tripMeta}>
                    {trip.stops?.length || 0} {isIt?'tappe':'stops'} ·{' '}
                    {trip.total_km ? `${trip.total_km} km ·` : ''}{' '}
                    <Clock size={10}/> {formatDate(trip.createdAt, lang)}
                  </div>
                </div>
                <ArrowRight size={14} className={s.tripArrow}/>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const VEHICLE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵' }

function formatDate(ts, lang) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day:'2-digit', month:'short', year:'numeric' })
}
