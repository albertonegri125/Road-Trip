import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Sun, Moon, Search, ArrowRight, MapPin, FileText, Users, Download, Star, ChevronRight } from 'lucide-react'
import s from './LandingPage.module.css'

const Globe3D = lazy(() => import('../components/globe/Globe3D'))

const VEHICLES = [
  { id:'car',    e:'🚗', it:'Auto',    en:'Car' },
  { id:'moto',   e:'🏍️', it:'Moto',    en:'Moto' },
  { id:'bike',   e:'🚴', it:'Bici',    en:'Bike' },
  { id:'walk',   e:'🥾', it:'A piedi', en:'On foot' },
  { id:'camper', e:'🚐', it:'Camper',  en:'Camper' },
  { id:'boat',   e:'⛵', it:'Barca',   en:'Boat' },
]

const TRIPS = [
  { title:'Italia → Turchia', sub:'via Balcani', days:22, km:'4.200', rating:4.9, reviews:34, tag:'🏍️ Moto', color:'#E8F5E9' },
  { title:'Portogallo → Marocco', sub:'via Spagna', days:14, km:'2.800', rating:4.7, reviews:21, tag:'🚗 Auto', color:'#FFF3E0' },
  { title:'Balcani Loop', sub:'6 paesi', days:18, km:'3.800', rating:4.9, reviews:42, tag:'🏍️ Moto', color:'#E3F2FD' },
  { title:'Scandinavia', sub:'3 paesi nordici', days:30, km:'6.500', rating:4.6, reviews:18, tag:'🚐 Camper', color:'#F3E5F5' },
]

export default function LandingPage() {
  const { lang, changeLang, theme, toggleTheme, t } = useApp()
  const navigate = useNavigate()
  const isIt = lang === 'it'
  const [searchFrom, setSearchFrom] = useState('')
  const [searchTo,   setSearchTo]   = useState('')
  const [vehicle,    setVehicle]    = useState('car')

  function handleSearch(e) {
    e.preventDefault()
    navigate('/auth')
  }

  return (
    <div className={s.page}>

      {/* ── NAV ── */}
      <nav className={s.nav}>
        <div className={s.logo}>
          <span className={s.logoIcon}>●</span>
          <span className={s.logoText}>Road-Trip</span>
        </div>
        <div className={s.navCenter}>
          <Link to="/auth" className={s.navLink}>{isIt ? 'Scopri' : 'Explore'}</Link>
          <Link to="/auth" className={s.navLink}>{isIt ? 'Community' : 'Community'}</Link>
          <Link to="/auth" className={s.navLink}>{isIt ? 'Forum' : 'Forum'}</Link>
        </div>
        <div className={s.navRight}>
          <div className={s.langPill}>
            <button className={[s.langBtn, lang==='it' ? s.langActive : ''].join(' ')} onClick={() => changeLang('it')}>IT</button>
            <button className={[s.langBtn, lang==='en' ? s.langActive : ''].join(' ')} onClick={() => changeLang('en')}>EN</button>
          </div>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
          </button>
          <Link to="/auth" className={s.loginBtn}>{isIt ? 'Accedi' : 'Sign in'}</Link>
          <Link to="/auth" className={s.ctaBtn}>{isIt ? 'Inizia gratis' : 'Start free'} →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <div className={s.heroBadge}>
            <span className={s.heroBadgeDot}/>
            {isIt ? '14.200+ percorsi creati dalla community' : '14,200+ routes created by the community'}
          </div>
          <h1 className={s.heroH1}>
            {isIt ? <>Pianifica il tuo<br/><span>road trip.</span><br/>Tutto in un posto.</> : <>Plan your<br/><span>road trip.</span><br/>All in one place.</>}
          </h1>
          <p className={s.heroDesc}>
            {isIt
              ? 'Percorso reale su strade, GPX per il tuo GPS, documenti e visti per ogni paese, consigli da chi l\'ha già fatto. Finalmente tutto insieme.'
              : 'Real road routing, GPX for your GPS, documents and visas for every country, tips from people who\'ve done it. Finally all together.'}
          </p>
        </div>

        {/* Globe */}
        <div className={s.globeWrap}>
          <Suspense fallback={<div className={s.globeFallback}><div className={s.globeSpin}/></div>}>
            <Globe3D darkMode={theme === 'dark'}/>
          </Suspense>
          <div className={s.globeCounter}>
            <span className={s.globeCounterDot}/>
            <div>
              <strong>1.240</strong>
              <span>{isIt ? 'viaggi attivi ora' : 'active trips now'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ── */}
      <section className={s.searchSection}>
        <form className={s.searchBox} onSubmit={handleSearch}>
          <div className={s.searchField}>
            <label className={s.searchLabel}><MapPin size={12}/> {isIt ? 'Partenza' : 'From'}</label>
            <input
              className={s.searchInput}
              value={searchFrom}
              onChange={e => setSearchFrom(e.target.value)}
              placeholder={isIt ? 'es. Milano, Italia' : 'e.g. Milan, Italy'}
            />
          </div>
          <div className={s.searchDivider}/>
          <div className={s.searchField}>
            <label className={s.searchLabel}><MapPin size={12}/> {isIt ? 'Destinazione' : 'To'}</label>
            <input
              className={s.searchInput}
              value={searchTo}
              onChange={e => setSearchTo(e.target.value)}
              placeholder={isIt ? 'es. Istanbul, Turchia' : 'e.g. Istanbul, Turkey'}
            />
          </div>
          <div className={s.searchDivider}/>
          <div className={s.searchField}>
            <label className={s.searchLabel}>{isIt ? 'Mezzo' : 'Vehicle'}</label>
            <div className={s.vehicleMini}>
              {VEHICLES.map(v => (
                <button key={v.id} type="button"
                  className={[s.vBtn, vehicle===v.id ? s.vBtnActive : ''].join(' ')}
                  onClick={() => setVehicle(v.id)}
                  title={isIt ? v.it : v.en}>
                  {v.e}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className={s.searchBtn}>
            <Search size={16}/>
            {isIt ? 'Cerca' : 'Search'}
          </button>
        </form>
      </section>

      {/* ── STATS ── */}
      <section className={s.statsSection}>
        {[
          { n:'14.200+', l: isIt ? 'Itinerari creati' : 'Itineraries created' },
          { n:'50+',     l: isIt ? 'Paesi coperti' : 'Countries covered' },
          { n:'7.000',   l: isIt ? 'Punti GPX per file' : 'GPX points per file' },
          { n:'100%',    l: isIt ? 'Info da fonti ufficiali' : 'Info from official sources' },
        ].map((st, i) => (
          <div key={i} className={s.statItem}>
            <div className={s.statN}>{st.n}</div>
            <div className={s.statL}>{st.l}</div>
          </div>
        ))}
      </section>

      {/* ── WHAT IT DOES ── */}
      <section className={s.featSection}>
        <div className={s.featInner}>
          <div className={s.sectionLabel}>{isIt ? 'Perché Road-Trip' : 'Why Road-Trip'}</div>
          <h2 className={s.sectionTitle}>
            {isIt ? 'Smetti di girare 10 siti diversi.' : 'Stop using 10 different sites.'}
          </h2>
          <p className={s.sectionDesc}>
            {isIt
              ? 'Visti, documenti, assicurazioni, percorso, GPX, consigli di chi l\'ha già fatto. Tutto automatico, tutto nel tuo viaggio.'
              : 'Visas, documents, insurance, routing, GPX, tips from people who\'ve done it. All automatic, all in your trip.'}
          </p>
          <div className={s.featGrid}>
            {[
              { icon:<MapPin size={20}/>, color:'#E8F5E9', iconColor:'#2E7D32',
                it:'Percorso reale', en:'Real road routing',
                dit:'Calcolo su strade reali via OpenRouteService. Nessuna linea retta.', den:'Calculated on real roads via OpenRouteService. No straight lines.' },
              { icon:<FileText size={20}/>, color:'#FFF3E0', iconColor:'#E65100',
                it:'Documenti automatici', en:'Automatic documents',
                dit:'Visti, carta verde, carnet, vaccini — in base al tuo veicolo e ai paesi attraversati.', den:'Visas, green card, carnet, vaccines — based on your vehicle and countries.' },
              { icon:<Download size={20}/>, color:'#E3F2FD', iconColor:'#1565C0',
                it:'GPX alta precisione', en:'High-precision GPX',
                dit:'7.000 punti GPS per un tracciato perfetto su Garmin, Komoot, Wikiloc.', den:'7,000 GPS points for a perfect track on Garmin, Komoot, Wikiloc.' },
              { icon:<Users size={20}/>, color:'#F3E5F5', iconColor:'#6A1B9A',
                it:'Community reale', en:'Real community',
                dit:'Itinerari condivisi da veri viaggiatori. Prendi quello che ti serve, modificalo per te.', den:'Itineraries shared by real travelers. Take what you need, customize for yourself.' },
            ].map((f, i) => (
              <div key={i} className={s.featCard}>
                <div className={s.featIcon} style={{ background: f.color }}>
                  <span style={{ color: f.iconColor }}>{f.icon}</span>
                </div>
                <h3 className={s.featTitle}>{isIt ? f.it : f.en}</h3>
                <p className={s.featDesc}>{isIt ? f.dit : f.den}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR TRIPS ── */}
      <section className={s.tripsSection}>
        <div className={s.featInner}>
          <div className={s.sectionLabel}>{isIt ? 'Dalla community' : 'From the community'}</div>
          <div className={s.tripsSectionHead}>
            <h2 className={s.sectionTitle} style={{margin:0}}>{isIt ? 'Itinerari più popolari' : 'Most popular itineraries'}</h2>
            <Link to="/auth" className={s.seeAll}>{isIt ? 'Vedi tutti' : 'See all'} <ChevronRight size={14}/></Link>
          </div>
          <div className={s.tripsGrid}>
            {TRIPS.map((trip, i) => (
              <Link to="/auth" key={i} className={s.tripCard}>
                <div className={s.tripCardImg} style={{ background: trip.color }}>
                  <span className={s.tripCardEmoji}>{trip.tag.split(' ')[0]}</span>
                  <span className={s.tripCardTag}>{trip.tag}</span>
                </div>
                <div className={s.tripCardBody}>
                  <div className={s.tripCardTitle}>{trip.title}</div>
                  <div className={s.tripCardSub}>{trip.sub}</div>
                  <div className={s.tripCardMeta}>
                    <span>{trip.days} {isIt ? 'giorni' : 'days'} · {trip.km} km</span>
                    <span className={s.tripCardRating}>
                      <Star size={11} fill="currentColor"/> {trip.rating} ({trip.reviews})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={s.ctaSection}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaTitle}>{isIt ? 'Pronto a partire?' : 'Ready to hit the road?'}</h2>
          <p className={s.ctaDesc}>{isIt ? 'Gratis. Nessuna carta di credito.' : 'Free. No credit card required.'}</p>
          <Link to="/auth" className={s.ctaBtn2}>
            {isIt ? 'Crea il tuo account' : 'Create your account'} <ArrowRight size={15}/>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={s.footer}>
        <span className={s.footerLogo}>● Road-Trip</span>
        <span className={s.footerMade}>{isIt ? 'Fatto con ❤️ per i viaggiatori' : 'Made with ❤️ for road travelers'}</span>
        <div className={s.footerLang}>
          <button className={[s.langBtn, lang==='it' ? s.langActive : ''].join(' ')} onClick={() => changeLang('it')}>IT</button>
          <button className={[s.langBtn, lang==='en' ? s.langActive : ''].join(' ')} onClick={() => changeLang('en')}>EN</button>
        </div>
      </footer>

    </div>
  )
}
