import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Search, Filter, MapPin, Route, Share2, X, Compass } from 'lucide-react'
import s from './CommunityPage.module.css'

const VEHICLE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵', mixed:'🧭' }
const TYPE_MAP = { 'Auto':'car','Moto':'moto','Bici':'bike','A piedi':'walk','Camper':'camper','Barca':'boat','Car':'car','Motorcycle':'moto','Bicycle':'bike','On foot':'walk','Boat':'boat' }

function initials(name) {
  const parts = name?.trim().split(/\s+/) || []
  const ini = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
  return ini || '?'
}

// Reshapes a raw `trips` doc (+ its author profile, when readable) into what the card
// needs. No rating/likes/photos here yet — that data doesn't exist in Firestore yet
// (comes in a later phase), so it's never faked.
function toCardData(trip, author, isIt) {
  const stops = trip.stops || []
  const countries = [...new Set(stops.map(st => st.country).filter(Boolean))]
  const days = Math.max(1, stops.reduce((a, st) => a + (st.nights || 0), 0) + 1)
  const name = author?.displayName?.trim()
  return {
    id: trip.id,
    title: trip.title || `${trip.from || '?'} → ${trip.to || '?'}`,
    emoji: VEHICLE_EMOJI[trip.tripType] || '🚗',
    type: trip.tripType || 'car',
    author: name || (isIt ? 'Viaggiatore' : 'Traveler'),
    avatar: initials(name),
    days,
    countries,
    km: trip.total_km || 0,
    desc: trip.overview || (isIt
      ? `Da ${trip.from || '?'} a ${trip.to || '?'} — ${trip.total_km || 0} km.`
      : `From ${trip.from || '?'} to ${trip.to || '?'} — ${trip.total_km || 0} km.`),
    stopNames: stops.map(st => st.city || st.name).filter(Boolean),
  }
}

export default function CommunityPage() {
  const { t, lang } = useApp()
  const isIt = lang === 'it'
  const [rawTrips, setRawTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [durFilter,  setDurFilter]  = useState('all')
  const [openTrip,   setOpenTrip]   = useState(null)
  const [showShare,  setShowShare]  = useState(null)

  // Fetched once — language toggles just relabel the already-fetched data, never re-hit Firestore.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(false)
      try {
        // Requires a composite index on trips (isPublic asc, createdAt desc) — Firestore's
        // error on first run includes a direct link to create it in console.
        const snap = await getDocs(query(
          collection(db, 'trips'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(20)
        ))
        const trips = snap.docs.map(d => ({ id: d.id, ...d.data() }))

        // Author display names live on users/{uid} — fetched once per unique traveler
        // (not once per trip), best-effort: a denied/failed read just falls back to a
        // generic label in toCardData, it never breaks the feed.
        const userIds = [...new Set(trips.map(tr => tr.userId).filter(Boolean))]
        const authors = {}
        await Promise.all(userIds.map(async uid => {
          try {
            const uSnap = await getDoc(doc(db, 'users', uid))
            if (uSnap.exists()) authors[uid] = uSnap.data()
          } catch (err) {
            if (import.meta.env.DEV) console.warn('Author profile read failed:', err.message)
          }
        }))

        if (!cancelled) setRawTrips(trips.map(tr => ({ trip: tr, author: authors[tr.userId] })))
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Community feed load failed:', err.message)
        if (!cancelled) { setRawTrips([]); setLoadError(true) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const cards = useMemo(
    () => rawTrips.map(({ trip, author }) => toCardData(trip, author, isIt)),
    [rawTrips, isIt]
  )

  const TYPES  = isIt ? ['Tutti','Auto','Moto','Bici','A piedi','Camper','Barca'] : ['All','Car','Motorcycle','Bicycle','On foot','Camper','Boat']
  const DURS   = isIt ? ['Tutti','< 2 sett.','2–4 sett.','1–2 mesi','2+ mesi'] : ['All','< 2 wks','2–4 wks','1–2 mo','2+ mo']
  const DUR_V  = ['all','<14','14-28','29-60','>60']

  const filtered = cards.filter(card => {
    const q = search.toLowerCase()
    const matchQ = !q || card.title.toLowerCase().includes(q) || card.countries.some(c => c.toLowerCase().includes(q)) || card.author.toLowerCase().includes(q)
    const matchT = typeFilter === 'all' || card.type === typeFilter
    const matchD = durFilter === 'all' ||
      (durFilter === '<14'   && card.days < 14) ||
      (durFilter === '14-28' && card.days >= 14 && card.days <= 28) ||
      (durFilter === '29-60' && card.days > 28  && card.days <= 60) ||
      (durFilter === '>60'   && card.days > 60)
    return matchQ && matchT && matchD
  })

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

      {!loading && rawTrips.length > 0 && <p className={s.count}>{filtered.length} {t('comm_found')}</p>}

      {loading && (
        <div className={s.loaderWrap}><div className={s.spin}/></div>
      )}

      {!loading && rawTrips.length === 0 && (
        <div className={s.empty}>
          <Compass size={28}/>
          <p className={s.emptyTitle}>{t('comm_empty_first_title')}</p>
          <p className={s.emptySub}>{loadError
            ? (isIt ? 'Impossibile caricare gli itinerari al momento — riprova più tardi.' : 'Could not load itineraries right now — try again later.')
            : t('comm_empty_first_sub')}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={s.grid}>
          {filtered.map(card => (
            <div key={card.id} className={s.card} onClick={() => setOpenTrip(openTrip===card.id ? null : card.id)}>
              <div className={s.cardBody}>
                {/* Author */}
                <div className={s.cardTop}>
                  <div className={s.authorRow}>
                    <div className={s.avatar}>{card.avatar}</div>
                    <div>
                      <div className={s.authorName}>{card.author}</div>
                      <div className={s.authorSub}>{card.days} {isIt?'giorni':'days'}</div>
                    </div>
                  </div>
                </div>

                <h3 className={s.cardTitle}>{card.emoji} {card.title}</h3>

                <div className={s.meta}>
                  <span><Route size={11}/> {card.km.toLocaleString()} km</span>
                  <span><MapPin size={11}/> {card.countries.length} {isIt?'paesi':'countries'}</span>
                </div>

                {/* Countries */}
                {card.countries.length > 0 && (
                  <div className={s.countryTags}>
                    {card.countries.slice(0,4).map(c => <span key={c} className={s.cTag}>{c}</span>)}
                    {card.countries.length > 4 && <span className={s.cTag}>+{card.countries.length-4}</span>}
                  </div>
                )}

                <p className={s.desc}>{card.desc}</p>

                {/* Stops preview (expandable) */}
                {openTrip === card.id && card.stopNames.length > 0 && (
                  <div className={s.stopsPreview} onClick={e => e.stopPropagation()}>
                    {card.stopNames.map((name, i) => <span key={i}>{name}</span>)}
                  </div>
                )}

                {/* Actions */}
                <div className={s.actions}>
                  <button className={s.actionBtn} onClick={e => { e.stopPropagation(); setShowShare(card.id) }}>
                    <Share2 size={13}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && rawTrips.length > 0 && filtered.length === 0 && (
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
              <input className="field-input" readOnly value={`${window.location.origin}/my-trips/${showShare}`}/>
              <button className={s.copyBtn} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/my-trips/${showShare}`); setShowShare(null) }}>
                {isIt ? 'Copia' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
