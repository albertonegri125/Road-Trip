import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Filter, Star, Heart, MessageSquare, Share2, MapPin, Clock, Route, ChevronDown, ChevronUp, Camera, ThumbsUp, X } from 'lucide-react'
import s from './CommunityPage.module.css'

const MOCK_TRIPS = [
  { id:1, title:'Italia → Turchia via Balcani', emoji:'🚗', type:'car', author:'Lorenzo B.', avatar:'LB', days:22, countries:['Italia','Slovenia','Croazia','Bosnia','Serbia','Bulgaria','Turchia'], km:4200, rating:4.9, reviews:34, likes:128, tag_it:'⭐ Più popolare', tag_en:'⭐ Most popular', tagColor:'#e05c1a',
    desc_it:'Un viaggio epico che attraversa il cuore dei Balcani. Strade di montagna mozzafiato, hospitality genuina e cibo incredibile. La frontiera bulgaro-turca a Kapıkule è velocissima.', desc_en:'An epic journey through the heart of the Balkans. Breathtaking mountain roads, genuine hospitality and incredible food.',
    tip_it:'Frontiera Kapıkule — mattina presto per evitare code.', tip_en:'Kapıkule border — early morning to avoid queues.',
    photos:['https://picsum.photos/seed/turkey1/400/250','https://picsum.photos/seed/balkan2/400/250','https://picsum.photos/seed/istanbul3/400/250'],
  },
  { id:2, title:'Portogallo → Marocco', emoji:'🏍️', type:'moto', author:'Sofia K.', avatar:'SK', days:14, countries:['Portogallo','Spagna','Marocco'], km:2800, rating:4.7, reviews:21, likes:89, tag_it:'🏍️ Moto epico', tag_en:'🏍️ Epic moto', tagColor:'#2d7d46',
    desc_it:'Da Lisbona attraverso il sud della Spagna fino al Marocco. Il traghetto da Tarifa a Tangeri vale tutto. Chefchaouen è un sogno.', desc_en:'From Lisbon through southern Spain to Morocco. The Tarifa-Tangier ferry is worth everything. Chefchaouen is a dream.',
    tip_it:'Traghetto FRS da Tarifa — prenota online, risparmi.', tip_en:'FRS ferry from Tarifa — book online, you save.',
    photos:['https://picsum.photos/seed/morocco1/400/250','https://picsum.photos/seed/chefchaouen2/400/250'],
  },
  { id:3, title:'Trans-Siberiana in auto', emoji:'🚗', type:'car', author:'Axel W.', avatar:'AW', days:45, countries:['Germania','Polonia','Bielorussia','Russia','Kazakhstan','Mongolia'], km:11000, rating:4.8, reviews:56, likes:312, tag_it:'🌟 Leggendario', tag_en:'🌟 Legendary', tagColor:'#1a6db5',
    desc_it:'L\'avventura di una vita. Da Berlino alla Mongolia attraversando la Russia intera. Strade buone in Russia, piste in Mongolia. Carnet obbligatorio.', desc_en:'The adventure of a lifetime. From Berlin to Mongolia crossing all of Russia.',
    tip_it:'Permesso Altai con 3 mesi d\'anticipo. Carnet obbligatorio.', tip_en:'Altai permit 3 months ahead. Carnet required.',
    photos:['https://picsum.photos/seed/mongolia1/400/250','https://picsum.photos/seed/russia2/400/250','https://picsum.photos/seed/siberia3/400/250'],
  },
  { id:4, title:'Scandinavia in Camper', emoji:'🚐', type:'camper', author:'Ingrid H.', avatar:'IH', days:30, countries:['Svezia','Norvegia','Finlandia'], km:6500, rating:4.6, reviews:18, likes:76, tag_it:'🌿 Natura pura', tag_en:'🌿 Pure nature', tagColor:'#2d7d46',
    desc_it:'Fjord, aurora boreale e sole di mezzanotte. Il camper è il mezzo perfetto per la Scandinavia. Campeggi wild gratuiti ovunque con l\'Allemansrätten.', desc_en:'Fjords, northern lights and midnight sun. The camper is perfect for Scandinavia.',
    tip_it:'Sole di mezzanotte: porta tende oscuranti e mascherina per dormire!', tip_en:'Midnight sun: bring blackout curtains and a sleep mask!',
    photos:['https://picsum.photos/seed/norway1/400/250','https://picsum.photos/seed/fjord2/400/250'],
  },
  { id:5, title:'Balcani in Moto', emoji:'🏍️', type:'moto', author:'Marco P.', avatar:'MP', days:18, countries:['Italia','Slovenia','Croazia','Montenegro','Albania','Grecia'], km:3800, rating:4.9, reviews:42, likes:201, tag_it:'💎 Gemme nascoste', tag_en:'💎 Hidden gems', tagColor:'#c49010',
    desc_it:'I Balcani sono il paradiso dei motociclisti. Strade vuote, paesaggi incredibili, gente fantastica. L\'Albania è la vera sorpresa. Cibo che non ti aspetti.', desc_en:'The Balkans are motorcyclists\' paradise. Empty roads, incredible landscapes, fantastic people.',
    tip_it:'Albania: strade di montagna dure ma spettacolari. Vale ogni km.', tip_en:'Albania: tough mountain roads but spectacular. Worth every km.',
    photos:['https://picsum.photos/seed/balkans1/400/250','https://picsum.photos/seed/albania2/400/250','https://picsum.photos/seed/greece3/400/250'],
  },
  { id:6, title:'Trans-Caucaso', emoji:'🚗', type:'car', author:'Elena V.', avatar:'EV', days:25, countries:['Turchia','Georgia','Armenia','Azerbaijan'], km:4600, rating:4.8, reviews:29, likes:156, tag_it:'🏛️ Cultura', tag_en:'🏛️ Culture', tagColor:'#e05c1a',
    desc_it:'Tre paesi, una storia millenaria. La Georgia ha cambiato la mia vita. Tbilisi è la città più interessante che abbia mai visitato. Armenia incredibile.', desc_en:'Three countries, a millennial history. Georgia changed my life. Tbilisi is the most interesting city I\'ve ever visited.',
    tip_it:'Georgia: pianifica almeno 1 settimana. Ne vale almeno 2.', tip_en:'Georgia: plan at least 1 week. It\'s worth at least 2.',
    photos:['https://picsum.photos/seed/georgia1/400/250','https://picsum.photos/seed/tbilisi2/400/250'],
  },
]

const TYPE_MAP = { 'Auto':'car','Moto':'moto','Bici':'bike','A piedi':'walk','Camper':'camper','Barca':'boat','Car':'car','Motorcycle':'moto','Bicycle':'bike','On foot':'walk','Boat':'boat' }

export default function CommunityPage() {
  const { t, lang, user } = useApp()
  const isIt = lang === 'it'
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [durFilter,  setDurFilter]  = useState('all')
  const [openTrip,   setOpenTrip]   = useState(null)
  const [likedTrips, setLikedTrips] = useState(new Set())
  const [showShare,  setShowShare]  = useState(null)

  const TYPES  = isIt ? ['Tutti','Auto','Moto','Bici','A piedi','Camper','Barca'] : ['All','Car','Motorcycle','Bicycle','On foot','Camper','Boat']
  const DURS   = isIt ? ['Tutti','< 2 sett.','2–4 sett.','1–2 mesi','2+ mesi'] : ['All','< 2 wks','2–4 wks','1–2 mo','2+ mo']
  const DUR_V  = ['all','<14','14-28','29-60','>60']

  const filtered = MOCK_TRIPS.filter(trip => {
    const q = search.toLowerCase()
    const matchQ = !q || trip.title.toLowerCase().includes(q) || trip.countries.some(c => c.toLowerCase().includes(q)) || trip.author.toLowerCase().includes(q)
    const matchT = typeFilter === 'all' || trip.type === typeFilter
    const matchD = durFilter === 'all' ||
      (durFilter === '<14'   && trip.days < 14) ||
      (durFilter === '14-28' && trip.days >= 14 && trip.days <= 28) ||
      (durFilter === '29-60' && trip.days > 28  && trip.days <= 60) ||
      (durFilter === '>60'   && trip.days > 60)
    return matchQ && matchT && matchD
  })

  function toggleLike(id) {
    setLikedTrips(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('comm_title')}</h1>
          <p className={s.sub}>{t('comm_subtitle')}</p>
        </div>
      </div>

      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={15} className={s.searchIcon}/>
        <input className={s.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('comm_search')}/>
      </div>

      {/* Filters */}
      <div className={s.filters}>
        <Filter size={13} style={{color:'var(--tx3)',flexShrink:0}}/>
        <div className={s.pills}>
          {TYPES.map((tp, i) => (
            <button key={tp} className={[s.pill, (i===0?'all':TYPE_MAP[tp])===typeFilter ? s.pillActive : ''].join(' ')}
              onClick={() => setTypeFilter(i===0 ? 'all' : TYPE_MAP[tp])}>{tp}</button>
          ))}
        </div>
        <div className={s.pills}>
          {DURS.map((d, i) => (
            <button key={d} className={[s.pill, DUR_V[i]===durFilter ? s.pillActive : ''].join(' ')}
              onClick={() => setDurFilter(DUR_V[i])}>{d}</button>
          ))}
        </div>
      </div>

      <p className={s.count}>{filtered.length} {t('comm_found')}</p>

      {/* Grid */}
      <div className={s.grid}>
        {filtered.map(trip => (
          <div key={trip.id} className={s.card}>
            {/* Photo */}
            {trip.photos?.length > 0 && (
              <div className={s.photoWrap}>
                <img src={trip.photos[0]} alt="" className={s.photo}/>
                {trip.photos.length > 1 && (
                  <div className={s.photoCount}><Camera size={11}/> +{trip.photos.length - 1}</div>
                )}
                <span className={s.tripTag} style={{background:`${trip.tagColor}18`,color:trip.tagColor}}>{isIt?trip.tag_it:trip.tag_en}</span>
              </div>
            )}

            <div className={s.cardBody}>
              {/* Author + rating */}
              <div className={s.cardTop}>
                <div className={s.authorRow}>
                  <div className={s.avatar}>{trip.avatar}</div>
                  <div>
                    <div className={s.authorName}>{trip.author}</div>
                    <div className={s.authorSub}>{trip.days} {isIt?'giorni':'days'}</div>
                  </div>
                </div>
                <div className={s.rating}><Star size={12} fill="currentColor"/> {trip.rating}</div>
              </div>

              <h3 className={s.cardTitle}>{trip.emoji} {trip.title}</h3>

              <div className={s.meta}>
                <span><Route size={11}/> {trip.km.toLocaleString()} km</span>
                <span><MapPin size={11}/> {trip.countries.length} {isIt?'paesi':'countries'}</span>
              </div>

              {/* Countries */}
              <div className={s.countryTags}>
                {trip.countries.slice(0,4).map(c => <span key={c} className={s.cTag}>{c}</span>)}
                {trip.countries.length > 4 && <span className={s.cTag}>+{trip.countries.length-4}</span>}
              </div>

              {/* Description (expandable) */}
              <p className={s.desc}>{isIt ? trip.desc_it : trip.desc_en}</p>

              {/* Tip */}
              <div className={s.tip}>
                <span>💡</span><span>{isIt ? trip.tip_it : trip.tip_en}</span>
              </div>

              {/* Photos grid */}
              {openTrip === trip.id && trip.photos?.length > 1 && (
                <div className={s.photoGrid}>
                  {trip.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className={s.photoThumb}/>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className={s.actions}>
                <button className={[s.actionBtn, likedTrips.has(trip.id) ? s.liked : ''].join(' ')} onClick={() => toggleLike(trip.id)}>
                  <Heart size={13} fill={likedTrips.has(trip.id) ? 'currentColor' : 'none'}/>
                  {trip.likes + (likedTrips.has(trip.id) ? 1 : 0)}
                </button>
                <button className={s.actionBtn} onClick={() => setOpenTrip(openTrip===trip.id ? null : trip.id)}>
                  <Camera size={13}/>
                  {trip.photos?.length || 0} {t('comm_photos')}
                </button>
                <button className={s.actionBtn}>
                  <MessageSquare size={13}/>
                  {trip.reviews} {t('comm_reviews')}
                </button>
                <button className={s.actionBtn} onClick={() => setShowShare(trip.id)}>
                  <Share2 size={13}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={s.empty}>
          <Search size={28}/>
          <p>{isIt ? 'Nessun itinerario trovato.' : 'No itineraries found.'}</p>
        </div>
      )}

      {/* Share modal */}
      {showShare && (
        <div className={s.modalBg} onClick={() => setShowShare(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <button className={s.modalClose} onClick={() => setShowShare(null)}><X size={16}/></button>
            <h3>{isIt ? 'Condividi questo itinerario' : 'Share this itinerary'}</h3>
            <p>{isIt ? 'Copia il link e condividilo.' : 'Copy the link and share it.'}</p>
            <div className={s.shareRow}>
              <input className="field-input" readOnly value={`https://road-trip.app/community/${showShare}`}/>
              <button className={s.copyBtn} onClick={() => { navigator.clipboard.writeText(`https://road-trip.app/community/${showShare}`); setShowShare(null) }}>
                {isIt ? 'Copia' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
