// src/pages/DashboardPage.jsx
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'
import { Map, Upload, Users, Plus, TrendingUp, Globe, Clock, Star } from 'lucide-react'
import s from './DashboardPage.module.css'

const FEATURED = [
  { id:1, title:'Italia → Turchia',       emoji:'🚗', author:'Lorenzo B.', days:22, countries:6, km:4200, rating:4.9, tag_it:'Più popolare', tag_en:'Most popular', color:'#C4501A' },
  { id:2, title:'Portogallo → Marocco',   emoji:'🏍️', author:'Sofia K.',   days:14, countries:3, km:2800, rating:4.7, tag_it:'Panoramico',   tag_en:'Scenic',       color:'#2D5016' },
  { id:3, title:'Germania → Mongolia',    emoji:'🚗', author:'Axel W.',    days:45, countries:12,km:11000,rating:4.8, tag_it:'Epico',        tag_en:'Epic',         color:'#1A6DB5' },
]

export default function DashboardPage() {
  const { profile, user, t, lang } = useApp()
  const h = new Date().getHours()
  const greet = h < 12 ? t('good_morning') : h < 18 ? t('good_afternoon') : t('good_evening')
  const firstName = (profile?.displayName || user?.email || '').split(' ')[0]

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.greeting}>{greet}{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className={s.sub}>{t('dash_sub')}</p>
        </div>
        <Link to="/build" className={s.newBtn}><Plus size={15}/> {t('nav_build')}</Link>
      </div>

      {/* Stats */}
      <div className={s.stats}>
        <StatCard icon={<Map size={19}/>}        val={profile?.tripsCreated||0}                      label={t('trips_planned')} />
        <StatCard icon={<Globe size={19}/>}       val={profile?.countriesVisited?.length||0}          label={t('countries_vis')} />
        <StatCard icon={<TrendingUp size={19}/>}  val={(profile?.totalKm||0).toLocaleString()}        label={t('total_km')} />
        <StatCard icon={<Star size={19}/>}        val={profile?.tripsCompleted||0}                    label={t('completed')} accent />
      </div>

      {/* Quick actions */}
      <div className={s.section}>
        <h2 className={s.sTitle}>{t('quick_actions')}</h2>
        <div className={s.quickGrid}>
          <QuickCard to="/build"     emoji="🗺️" title={t('nav_build')}     desc={lang==='it'?'Base o Expert':'Base or Expert'} accent />
          <QuickCard to="/import"    emoji="📦" title={t('nav_import')}    desc={lang==='it'?'Aggiungi viaggi già fatti':'Add past trips'} />
          <QuickCard to="/community" emoji="👥" title={t('nav_community')} desc={lang==='it'?'Trova ispirazione':'Find inspiration'} />
        </div>
      </div>

      {/* Trending */}
      <div className={s.section}>
        <div className={s.sRow}>
          <h2 className={s.sTitle}>{t('trending')}</h2>
          <Link to="/community" className={s.seeAll}>{t('see_all')}</Link>
        </div>
        <div className={s.tripsGrid}>
          {FEATURED.map(trip => (
            <div key={trip.id} className={s.tripCard}>
              <div className={s.tripHead}>
                <span className={s.tripEmoji}>{trip.emoji}</span>
                <span className={s.tripTag} style={{background:`${trip.color}15`,color:trip.color}}>
                  {lang==='it'?trip.tag_it:trip.tag_en}
                </span>
              </div>
              <h3 className={s.tripTitle}>{trip.title}</h3>
              <p className={s.tripBy}>{t('by')} {trip.author}</p>
              <div className={s.tripMeta}>
                <span><Clock size={11}/> {trip.days} {t('days')}</span>
                <span><Globe size={11}/> {trip.countries} {t('countries')}</span>
                <span><Map size={11}/> {trip.km.toLocaleString()} {t('km')}</span>
              </div>
              <div className={s.tripFoot}>
                <span className={s.tripRating}>★ {trip.rating}</span>
                <Link to="/community" className={s.useBtn}>{lang==='it'?'Usa →':'Use →'}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!profile?.tripsCreated && (
        <div className={s.onboard}>
          <span style={{fontSize:36}}>🗺️</span>
          <div>
            <h3>{t('no_trips_title')}</h3>
            <p>{t('no_trips_desc')}</p>
          </div>
          <Link to="/build" className={s.newBtn}>{lang==='it'?'Pianifica il mio primo viaggio →':'Plan my first trip →'}</Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, val, label, accent }) {
  return (
    <div className={s.statCard}>
      <div className={s.statIcon} style={accent?{color:'var(--accent)',background:'var(--accent-bg)'}:{}}>{icon}</div>
      <div>
        <div className={s.statVal} style={accent?{color:'var(--accent)'}:{}}>{val}</div>
        <div className={s.statLbl}>{label}</div>
      </div>
    </div>
  )
}

function QuickCard({ to, emoji, title, desc, accent }) {
  return (
    <Link to={to} className={[s.quickCard, accent?s.quickAccent:''].join(' ')}>
      <span className={s.quickEmoji}>{emoji}</span>
      <div>
        <div className={s.quickTitle}>{title}</div>
        <div className={s.quickDesc}>{desc}</div>
      </div>
      <span className={s.arrow}>→</span>
    </Link>
  )
}
