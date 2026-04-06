// src/pages/CommunityPage.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Filter, Clock, Globe, Map, Star } from 'lucide-react'
import s from './CommunityPage.module.css'

const MOCK = [
  { id:1, title:'Italia → Turchia', emoji:'🚗', type:'car', author:'Lorenzo B.', days:22, countries:['Italia','Slovenia','Croazia','Bosnia','Serbia','Turchia'], km:4200, rating:4.9, reviews:34, tag_it:'Più popolare', tag_en:'Most popular', color:'#e05c1a', tip_it:'Frontiera Kapıkule — veloce e organizzata.', tip_en:'Kapıkule border — fast and organised.' },
  { id:2, title:'Portogallo → Marocco', emoji:'🏍️', type:'moto', author:'Sofia K.', days:14, countries:['Portogallo','Spagna','Marocco'], km:2800, rating:4.7, reviews:21, tag_it:'Panoramico', tag_en:'Scenic', color:'#2d7d46', tip_it:'Traghetto da Tarifa a Tangeri. Prenota!', tip_en:'Ferry Tarifa to Tangier. Book ahead!' },
  { id:3, title:'Germania → Mongolia', emoji:'🚗', type:'car', author:'Axel W.', days:45, countries:['Germania','Polonia','Bielorussia','Russia','Kazakhstan','Mongolia'], km:11000, rating:4.8, reviews:56, tag_it:'Epico', tag_en:'Epic', color:'#1a6db5', tip_it:'Carnet obbligatorio. Permesso Altai in anticipo.', tip_en:'Carnet required. Altai permit early.' },
  { id:4, title:'Scandinavia Loop', emoji:'🚐', type:'camper', author:'Ingrid H.', days:30, countries:['Svezia','Norvegia','Finlandia'], km:6500, rating:4.6, reviews:18, tag_it:'Natura', tag_en:'Nature', color:'#2d7d46', tip_it:'Sole di mezzanotte — porta tende oscuranti!', tip_en:'Midnight sun — bring blackout curtains!' },
  { id:5, title:'Balcani Adventure', emoji:'🏍️', type:'moto', author:'Marco P.', days:18, countries:['Italia','Slovenia','Croazia','Montenegro','Albania','Grecia'], km:3800, rating:4.9, reviews:42, tag_it:'Gemme nascoste', tag_en:'Hidden gems', color:'#d4960a', tip_it:'Strade albanesi di montagna: dure ma spettacolari.', tip_en:'Albanian mountain roads: rough but stunning.' },
  { id:6, title:'Trans-Caucasus', emoji:'🚗', type:'car', author:'Elena V.', days:25, countries:['Turchia','Georgia','Armenia','Azerbaijan'], km:4600, rating:4.8, reviews:29, tag_it:'Cultura', tag_en:'Culture', color:'#e05c1a', tip_it:'Georgia incredibile — almeno 1 settimana!', tip_en:'Georgia is incredible — at least 1 week!' },
]

const TYPES_IT = ['Tutti','Auto','Moto','Bici','A piedi','Camper','Barca']
const TYPES_EN = ['All','Car','Motorcycle','Bicycle','On foot','Camper','Boat']
const TYPE_MAP  = { 'Auto':'car','Moto':'moto','Bici':'bike','A piedi':'walk','Camper':'camper','Barca':'boat','Car':'car','Motorcycle':'moto','Bicycle':'bike','On foot':'walk','Boat':'boat' }

export default function CommunityPage() {
  const { t, lang } = useApp()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')

  const TYPES = lang==='it'?TYPES_IT:TYPES_EN
  const DUR = lang==='it'
    ? ['Tutti','< 2 sett.','2–4 sett.','1–2 mesi','2+ mesi']
    : ['All','< 2 weeks','2–4 weeks','1–2 months','2+ months']

  const filtered = MOCK.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.countries.some(c=>c.toLowerCase().includes(q))
    const matchType = typeFilter==='all' || t.type===typeFilter
    const matchDur = durationFilter==='all' ||
      (durationFilter==='<14'&&t.days<14) || (durationFilter==='14-28'&&t.days>=14&&t.days<=28) ||
      (durationFilter==='29-60'&&t.days>28&&t.days<=60) || (durationFilter==='>60'&&t.days>60)
    return matchSearch && matchType && matchDur
  })

  const DUR_VALS = ['all','<14','14-28','29-60','>60']

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t('comm_title')}</h1>
        <p className={s.subtitle}>{t('comm_subtitle')}</p>
      </div>

      <div className={s.searchWrap}>
        <Search size={16} className={s.searchIcon}/>
        <input className={s.searchInput} value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('comm_search')} />
      </div>

      <div className={s.filterRow}>
        <Filter size={14} style={{color:'var(--text3)',flexShrink:0}}/>
        <div className={s.pills}>
          {TYPES.map((tp,i)=>(
            <button key={tp} className={[s.pill, (i===0?'all':TYPE_MAP[tp])===typeFilter?s.pillActive:''].join(' ')}
              onClick={()=>setTypeFilter(i===0?'all':TYPE_MAP[tp])}>{tp}</button>
          ))}
        </div>
        <div className={s.pills}>
          {DUR.map((d,i)=>(
            <button key={d} className={[s.pill, DUR_VALS[i]===durationFilter?s.pillActive:''].join(' ')}
              onClick={()=>setDurationFilter(DUR_VALS[i])}>{d}</button>
          ))}
        </div>
      </div>

      <p className={s.count}>{filtered.length} {t('comm_found')}</p>

      <div className={s.grid}>
        {filtered.map(trip=>(
          <div key={trip.id} className={s.card}>
            <div className={s.cardHead}>
              <div className={s.cardLeft}>
                <span className={s.cardEmoji}>{trip.emoji}</span>
                <span className={s.tag} style={{background:`${trip.color}14`,color:trip.color}}>{lang==='it'?trip.tag_it:trip.tag_en}</span>
              </div>
              <div className={s.rating}><Star size={12} fill="var(--yellow)"/> {trip.rating} <span>({trip.reviews})</span></div>
            </div>
            <h2 className={s.cardTitle}>{trip.title}</h2>
            <div className={s.cardAuthor}>by {trip.author}</div>
            <div className={s.meta}>
              <span><Clock size={11}/> {trip.days} {t('days')}</span>
              <span><Globe size={11}/> {trip.countries.length} {t('countries')}</span>
              <span><Map size={11}/> {trip.km.toLocaleString()} {t('km')}</span>
            </div>
            <div className={s.countriesRow}>{trip.countries.map((c,i)=><span key={c}>{c}{i<trip.countries.length-1&&<span className={s.sep}>→</span>}</span>)}</div>
            <div className={s.tipBox}><strong>{t('comm_tip')}</strong><span>{lang==='it'?trip.tip_it:trip.tip_en}</span></div>
            <button className={s.useBtn}>{t('comm_use')}</button>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div className={s.empty}><Search size={32}/><p>{lang==='it'?'Nessun percorso trovato. Prova altri filtri.':'No routes found. Try different filters.'}</p></div>
      )}
    </div>
  )
}
