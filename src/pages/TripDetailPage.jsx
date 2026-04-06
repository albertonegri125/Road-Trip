// src/pages/TripDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useApp } from '../context/AppContext'
import { ArrowLeft, Trash2, Download, Star, Map, Clock, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import s from './TripDetailPage.module.css'

const TYPE_EMOJI = { car:'🚗', moto:'🏍️', bike:'🚴', walk:'🥾', camper:'🚐', boat:'⛵', mixed:'🔀' }

export default function TripDetailPage() {
  const { id } = useParams()
  const { user, t, lang } = useApp()
  const navigate = useNavigate()
  const [trip, setTrip]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db,'trips',id)).then(s => {
      if (s.exists()) setTrip({id:s.id,...s.data()})
      setLoading(false)
    })
  }, [id])

  async function handleDelete() {
    if (!confirm(lang==='it'?'Eliminare questo viaggio?':'Delete this trip?')) return
    await deleteDoc(doc(db,'trips',id))
    toast.success(lang==='it'?'Viaggio eliminato':'Trip deleted')
    navigate('/my-trips')
  }

  function exportGPX() {
    if (!user) { toast.error(t('export_login')); return }
    const stops = trip?.stops || []
    if (!stops.length) return
    const wpts = stops.map((s,i)=>`  <wpt lat="${s.lat||0}" lon="${s.lng||0}"><name>${s.city||s.name||'Stop '+(i+1)}</name></wpt>`).join('\n')
    const gpx = `<?xml version="1.0"?>\n<gpx version="1.1" creator="Road-Trip">\n${wpts}\n</gpx>`
    const blob = new Blob([gpx],{type:'application/gpx+xml'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='roadtrip.gpx'; a.click()
    toast.success('GPX exported!')
  }

  if (loading) return <div className={s.loading}><div className={s.spinner}/></div>
  if (!trip)   return <div className={s.empty}><p>{lang==='it'?'Viaggio non trovato':'Trip not found'}</p><Link to="/my-trips">{t('back')}</Link></div>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <Link to="/my-trips" className={s.back}><ArrowLeft size={16}/> {t('nav_mytrips')}</Link>
        <div className={s.hActions}>
          {user && <button className={s.gpxBtn} onClick={exportGPX}><Download size={14}/> {t('export_gpx')}</button>}
          <button className={s.delBtn} onClick={handleDelete}><Trash2 size={14}/> {t('delete')}</button>
        </div>
      </div>

      <div className={s.hero}>
        <div className={s.heroTop}>
          <span className={s.heroEmoji}>{TYPE_EMOJI[trip.tripType]||'🗺️'}</span>
          <span className={s.heroBadge}>{trip.isPast?(lang==='it'?'📚 Viaggio passato':'📚 Past trip'):'🗺️ Planning'}</span>
        </div>
        <h1 className={s.heroTitle}>{trip.title||`${trip.from} → ${trip.to}`}</h1>
        <div className={s.heroMeta}>
          {trip.days && <span><Clock size={13}/> {trip.days} {t('days')}</span>}
          {trip.totalKm && <span><Map size={13}/> {Number(trip.totalKm).toLocaleString()} {t('km')}</span>}
          {trip.year && <span>📅 {trip.year}</span>}
        </div>
      </div>

      {trip.stops?.length > 0 && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>{lang==='it'?'Tappe':'Stops'}</h2>
          <div className={s.timeline}>
            {trip.stops.map((stop,i)=>(
              <div key={i} className={s.tlItem}>
                <div className={s.tlDot}>{i+1}</div>
                <div className={s.tlContent}>
                  <div className={s.tlCity}>{stop.city||stop.name}{stop.country?`, ${stop.country}`:''}</div>
                  {stop.nights&&<div className={s.tlNights}>{stop.nights} {stop.nights>1?t('nights'):t('night')}</div>}
                  {(stop.notes||stop.highlights)&&<div className={s.tlNote}>{stop.notes||stop.highlights}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trip.generatedItinerary && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>💡 {lang==='it'?'Consigli del viaggio':'Travel tips'}</h2>
          <ul className={s.tipList}>{trip.generatedItinerary.tips?.map((tip,i)=><li key={i}>{tip}</li>)}</ul>
        </div>
      )}

      {(trip.highlights||trip.tips) && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>{lang==='it'?'Note viaggio':'Trip notes'}</h2>
          {trip.rating&&<div className={s.ratingRow}>{[1,2,3,4,5].map(n=><Star key={n} size={17} fill={trip.rating>=n?'var(--yellow)':'none'} color={trip.rating>=n?'var(--yellow)':'var(--text3)'}/>) }<span>{trip.rating}/5</span></div>}
          {trip.highlights&&<div className={s.noteSection}><strong>{lang==='it'?'Punti salienti':'Highlights'}</strong><p>{trip.highlights}</p></div>}
          {trip.tips&&<div className={s.noteSection}><strong>{lang==='it'?'Consigli':'Tips'}</strong><p>{trip.tips}</p></div>}
          {trip.wouldRepeat!==undefined&&<div className={s.repeat}>{trip.wouldRepeat?'✅':'❌'} {lang==='it'?'Rifarei questo viaggio':'Would do again'}</div>}
        </div>
      )}
    </div>
  )
}
