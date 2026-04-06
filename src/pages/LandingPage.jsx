// src/pages/LandingPage.jsx
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Compass, Map, Users, FileText, Download, Sun, Moon, Navigation } from 'lucide-react'
import s from './LandingPage.module.css'

const Globe3D = lazy(() => import('../components/globe/Globe3D'))

const TRIP_TYPES = [
  { emoji:'🚗', it:'Auto',    en:'Car' },
  { emoji:'🏍️', it:'Moto',    en:'Motorcycle' },
  { emoji:'🚴', it:'Bici',    en:'Bicycle' },
  { emoji:'🥾', it:'A piedi', en:'On foot' },
  { emoji:'🚐', it:'Camper',  en:'Camper' },
  { emoji:'⛵', it:'Barca',   en:'Boat' },
]

const FEATURES = [
  { icon:<Navigation size={22}/>, it_t:'Percorsi stradali reali', en_t:'Real road routing',    it_d:'Ogni itinerario calcolato su strade reali via OpenRouteService. Niente linee rette.', en_d:'Every itinerary calculated on real roads via OpenRouteService. No straight lines.' },
  { icon:<Download size={22}/>,   it_t:'Export GPX',             en_t:'GPX Export',            it_d:'Scarica il percorso GPX per Garmin, Komoot, Wikiloc e qualsiasi app GPS.', en_d:'Download GPX for Garmin, Komoot, Wikiloc and any GPS app.' },
  { icon:<FileText size={22}/>,   it_t:'Documenti & Visti',      en_t:'Documents & Visas',     it_d:'Link diretti ai portali ufficiali degli stati per visti, assicurazioni e requisiti sanitari.', en_d:'Direct links to official government portals for visas, insurance and health requirements.' },
  { icon:<Users size={22}/>,      it_t:'Community reale',        en_t:'Real community',        it_d:'Percorsi condivisi da veri viaggiatori con consigli pratici e valutazioni autentiche.', en_d:'Routes shared by real travelers with practical tips and authentic ratings.' },
]

export default function LandingPage() {
  const { lang, changeLang, theme, toggleTheme, t } = useApp()

  return (
    <div className={s.page}>
      {/* Nav */}
      <nav className={s.nav}>
        <div className={s.logo}><Compass size={20} className={s.logoIcon}/><span>Road-Trip</span></div>
        <div className={s.navRight}>
          <button className={s.themeBtn} onClick={toggleTheme}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</button>
          <Link to="/auth" className={s.loginLink}>{t('nav_login')}</Link>
          <Link to="/auth" className={s.ctaBtn}>{t('nav_start')} →</Link>
        </div>
      </nav>

      {/* Hero — centered, globe below text */}
      <section className={s.hero}>
        <div className={s.heroContent}>
          <div className={s.badge}><span className={s.liveDot}/>{lang==='it'?'12.400+ percorsi creati':'12,400+ routes created'}</div>
          <h1 className={s.heroTitle}>
            {lang==='it'?<><em>Dove ti porta</em><br/>la strada?</>:<><em>Where does</em><br/>the road take you?</>}
          </h1>
          <p className={s.heroDesc}>
            {lang==='it'
              ?'Percorsi stradali reali, file GPX per il tuo GPS, checklist visti e documenti. Per auto, moto, bici o a piedi.'
              :'Real road routes, GPX files for your GPS, visa and document checklists. For car, motorcycle, bicycle or on foot.'
            }
          </p>
          <div className={s.heroCtas}>
            <Link to="/auth" className={s.heroBtn}><Compass size={16}/>{lang==='it'?'Inizia gratis':'Start for free'}</Link>
            <a href="#features" className={s.heroSecond}>{lang==='it'?'Come funziona':'How it works'} ↓</a>
          </div>
          <div className={s.typeChips}>
            {TRIP_TYPES.map(tp=>(
              <span key={tp.emoji} className={s.chip}>{tp.emoji} {lang==='it'?tp.it:tp.en}</span>
            ))}
          </div>
        </div>

        {/* Globe — full width, centered */}
        <div className={s.globeWrap}>
          <Suspense fallback={<div className={s.globeLoader}><div className={s.spin}/></div>}>
            <Globe3D darkMode={theme==='dark'}/>
          </Suspense>
          <div className={s.globeTag}>{lang==='it'?'🌍 Road trip attivi nel mondo':'🌍 Active road trips worldwide'}</div>
        </div>
      </section>

      {/* How it works */}
      <section className={s.section} id="features">
        <div className={s.inner}>
          <div className={s.sectionLabel}>{lang==='it'?'Come funziona':'How it works'}</div>
          <h2 className={s.sectionTitle}>{lang==='it'?'Due modi di pianificare.':'Two ways to plan.'}</h2>
          <div className={s.modesGrid}>
            <ModeCard emoji="🤖"
              title={lang==='it'?'Modalità Base':'Base Mode'}
              badge={lang==='it'?'Consigliato':'Recommended'}
              desc={lang==='it'?'Rispondi a poche domande. L\'AI genera l\'itinerario completo con tappe, notti e checklist documenti.':'Answer a few questions. The AI generates the full itinerary with stops, nights and document checklist.'}
              items={lang==='it'
                ?['Itinerario generato automaticamente','Checklist visti e documenti','Consigli pratici per ogni tappa','Stima distanza e budget']
                :['Auto-generated itinerary','Visa and document checklist','Practical tips per stop','Distance and budget estimate']}
            />
            <ModeCard emoji="🗺️" accent
              title={lang==='it'?'Modalità Expert':'Expert Mode'}
              badge={lang==='it'?'Controllo totale':'Full control'}
              desc={lang==='it'?'Clicca sulla mappa per aggiungere tappe. Trascina per riordinare. Calcola il percorso reale e scarica il GPX.':'Click the map to add stops. Drag to reorder. Calculate the real road route and download the GPX.'}
              items={lang==='it'
                ?['Mappa interattiva Komoot-style','Routing stradale reale (ORS)','Drag & drop per riordinare','Export GPX + stampa PDF']
                :['Komoot-style interactive map','Real road routing (ORS)','Drag & drop to reorder','GPX export + PDF print']}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={s.featSection}>
        <div className={s.inner}>
          <div className={s.featGrid}>
            {FEATURES.map((f,i)=>(
              <div key={i} className={s.featCard}>
                <div className={s.featIcon}>{f.icon}</div>
                <h3>{lang==='it'?f.it_t:f.en_t}</h3>
                <p>{lang==='it'?f.it_d:f.en_d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaSection}>
        <h2>{lang==='it'?'Pronto a partire?':'Ready to hit the road?'}</h2>
        <p>{lang==='it'?'Gratuito, nessuna carta di credito.':'Free, no credit card required.'}</p>
        <Link to="/auth" className={s.heroBtn} style={{display:'inline-flex'}}><Compass size={16}/>{lang==='it'?'Crea il tuo account':'Create your account'}</Link>
      </section>

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footLogo}><Compass size={15}/> Road-Trip</span>
        <span className={s.footMade}>{lang==='it'?'Fatto con ❤️ per i viaggiatori':'Made with ❤️ for adventurers'}</span>
        <span className={s.footHint}>{lang==='it'?'Lingua nelle impostazioni →':'Language in settings →'}</span>
      </footer>
    </div>
  )
}

function ModeCard({ emoji, title, badge, desc, items, accent }) {
  return (
    <div className={[s.modeCard, accent?s.modeAccent:''].join(' ')}>
      <div className={s.modeTop}>
        <span className={s.modeEmoji}>{emoji}</span>
        <span className={[s.modeBadge, accent?s.modeBadgeAccent:''].join(' ')}>{badge}</span>
      </div>
      <h3 className={s.modeTitle}>{title}</h3>
      <p className={s.modeDesc}>{desc}</p>
      <ul className={s.modeList}>{items.map((it,i)=><li key={i}><span className={s.check}>✓</span>{it}</li>)}</ul>
    </div>
  )
}
