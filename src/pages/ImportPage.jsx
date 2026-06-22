import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Upload, Plus, Trash2, MapPin, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import s from './ImportPage.module.css'

const VEHICLE_TYPES = [
  { id:'car', e:'🚗', it:'Auto', en:'Car' },
  { id:'moto', e:'🏍️', it:'Moto', en:'Moto' },
  { id:'bike', e:'🚴', it:'Bici', en:'Bike' },
  { id:'walk', e:'🥾', it:'A piedi', en:'On foot' },
  { id:'camper', e:'🚐', it:'Camper', en:'Camper' },
  { id:'boat', e:'⛵', it:'Barca', en:'Boat' },
]

export default function ImportPage() {
  const { user, t, lang } = useApp()
  const navigate = useNavigate()
  const isIt = lang === 'it'

  const [form, setForm] = useState({
    title: '', vehicle: 'car', year: new Date().getFullYear(),
    from: '', to: '', days: '', km: '', rating: 5,
    notes: '', tips: '', highlights: '',
  })
  const [stops, setStops] = useState([{ city:'', country:'', nights:1, id:'s0' }])
  const [saving, setSaving] = useState(false)

  function addStop() {
    setStops(prev => [...prev, { city:'', country:'', nights:1, id:`s${Date.now()}` }])
  }
  function removeStop(id) { setStops(prev => prev.filter(s => s.id !== id)) }
  function updateStop(id, k, v) { setStops(prev => prev.map(s => s.id===id ? {...s,[k]:v} : s)) }

  async function handleSave() {
    if (!form.title || stops.length === 0) {
      toast.error(isIt ? 'Titolo e almeno una tappa richiesti.' : 'Title and at least one stop required.')
      return
    }
    setSaving(true)
    try {
      const data = {
        type: 'imported', tripType: form.vehicle,
        title: form.title,
        from: form.from || stops[0]?.city || '',
        to:   form.to   || stops[stops.length-1]?.city || '',
        total_km: parseInt(form.km) || 0,
        days: parseInt(form.days) || 0,
        year: parseInt(form.year),
        rating: form.rating,
        notes: form.notes,
        tips: form.tips,
        highlights: form.highlights.split(',').map(h => h.trim()).filter(Boolean),
        stops: stops.map(({ id:_, ...rest }) => rest),
        status: 'completed', isPast: true, isPublic: false,
        userId: user.uid, createdAt: serverTimestamp(),
      }
      await addDoc(collection(db,'trips'), data)
      await updateDoc(doc(db,'users',user.uid), {
        tripsCreated: increment(1),
        tripsCompleted: increment(1),
        totalKm: increment(parseInt(form.km)||0),
      })
      toast.success(isIt ? 'Viaggio importato! ✅' : 'Trip imported! ✅')
      navigate('/my-trips')
    } catch (err) { console.error(err); toast.error('Import failed') }
    finally { setSaving(false) }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{t('nav_import')}</h1>
          <p className={s.sub}>{isIt ? 'Aggiungi un viaggio già fatto per arricchire il tuo profilo e aiutare la community.' : 'Add a past trip to enrich your profile and help the community.'}</p>
        </div>
      </div>

      <div className={s.grid}>
        {/* Main form */}
        <div className={s.formCard}>
          <h2 className={s.cardTitle}>{isIt ? 'Dettagli del viaggio' : 'Trip details'}</h2>

          <div className={s.field}>
            <label className="field-label">{isIt ? 'Titolo del viaggio' : 'Trip title'} *</label>
            <input className="field-input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder={isIt?'es. Italia → Marocco 2023':'e.g. Italy → Morocco 2023'}/>
          </div>

          <div className={s.row3}>
            <div className={s.field}>
              <label className="field-label">{isIt?'Partenza':'Departure'}</label>
              <input className="field-input" value={form.from} onChange={e => setForm(f=>({...f,from:e.target.value}))} placeholder="Milano"/>
            </div>
            <div className={s.field}>
              <label className="field-label">{isIt?'Destinazione':'Destination'}</label>
              <input className="field-input" value={form.to} onChange={e => setForm(f=>({...f,to:e.target.value}))} placeholder="Marrakech"/>
            </div>
            <div className={s.field}>
              <label className="field-label">{isIt?'Anno':'Year'}</label>
              <input className="field-input" type="number" min={1990} max={2030} value={form.year} onChange={e => setForm(f=>({...f,year:e.target.value}))}/>
            </div>
          </div>

          <div className={s.row2}>
            <div className={s.field}>
              <label className="field-label">{isIt?'Giorni totali':'Total days'}</label>
              <input className="field-input" type="number" min={1} value={form.days} onChange={e => setForm(f=>({...f,days:e.target.value}))} placeholder="14"/>
            </div>
            <div className={s.field}>
              <label className="field-label">{isIt?'Km totali':'Total km'}</label>
              <input className="field-input" type="number" min={0} value={form.km} onChange={e => setForm(f=>({...f,km:e.target.value}))} placeholder="3500"/>
            </div>
          </div>

          {/* Vehicle */}
          <div className={s.field}>
            <label className="field-label">{t('build_vehicle')}</label>
            <div className={s.typeGrid}>
              {VEHICLE_TYPES.map(tp => (
                <button key={tp.id} type="button"
                  className={[s.typeBtn, form.vehicle===tp.id ? s.typeBtnActive : ''].join(' ')}
                  onClick={() => setForm(f=>({...f,vehicle:tp.id}))}>
                  <span>{tp.e}</span><span>{isIt?tp.it:tp.en}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className={s.field}>
            <label className="field-label">{isIt?'La tua valutazione':'Your rating'}</label>
            <div className={s.stars}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f=>({...f,rating:n}))}>
                  <Star size={22} fill={n <= form.rating ? '#C49010' : 'none'} color={n <= form.rating ? '#C49010' : 'var(--border3)'}/>
                </button>
              ))}
              <span className={s.ratingLabel}>{form.rating}/5</span>
            </div>
          </div>

          {/* Notes & Tips */}
          <div className={s.field}>
            <label className="field-label">{isIt?'Note generali':'General notes'}</label>
            <textarea className="field-input" rows={3} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} placeholder={isIt?'Com\'è stato il viaggio? Cosa hai scoperto?':'How was the trip? What did you discover?'}/>
          </div>
          <div className={s.field}>
            <label className="field-label">{isIt?'Consigli per altri':'Tips for others'}</label>
            <textarea className="field-input" rows={3} value={form.tips} onChange={e => setForm(f=>({...f,tips:e.target.value}))} placeholder={isIt?'Consigli pratici che vorresti avere saputo prima…':'Practical tips you wish you\'d known beforehand…'}/>
          </div>
          <div className={s.field}>
            <label className="field-label">{isIt?'Momenti clou (separati da virgola)':'Highlights (comma-separated)'}</label>
            <input className="field-input" value={form.highlights} onChange={e => setForm(f=>({...f,highlights:e.target.value}))} placeholder={isIt?'Tramonto Cappadocia, Medina di Fes, Deserto Merzouga':'Cappadocia sunset, Fes Medina, Merzouga Desert'}/>
          </div>
        </div>

        {/* Stops */}
        <div className={s.stopsCard}>
          <h2 className={s.cardTitle}>{isIt?'Tappe del viaggio':'Trip stops'}</h2>
          <p className={s.stopsSub}>{isIt?'Aggiungi le città principali che hai visitato.':'Add the main cities you visited.'}</p>

          {stops.map((stop, i) => (
            <div key={stop.id} className={s.stopRow}>
              <div className={s.stopNum}>{i+1}</div>
              <div className={s.stopFields}>
                <div className={s.stopInputRow}>
                  <input className="field-input" value={stop.city} onChange={e => updateStop(stop.id,'city',e.target.value)} placeholder={isIt?'Città':'City'}/>
                  <input className="field-input" value={stop.country} onChange={e => updateStop(stop.id,'country',e.target.value)} placeholder={isIt?'Paese':'Country'}/>
                  <input type="number" className={[s.nightsInput, 'field-input'].join(' ')} value={stop.nights} min={0} max={99} onChange={e => updateStop(stop.id,'nights',parseInt(e.target.value)||1)}/>
                  <span className={s.nightsLbl}>{isIt?'n':'n'}</span>
                </div>
              </div>
              {stops.length > 1 && (
                <button className={s.removeBtn} onClick={() => removeStop(stop.id)}><Trash2 size={13}/></button>
              )}
            </div>
          ))}

          <button className={s.addStopBtn} onClick={addStop}>
            <Plus size={14}/> {isIt?'Aggiungi tappa':'Add stop'}
          </button>
        </div>
      </div>

      {/* Save */}
      <div className={s.saveRow}>
        <button className={s.saveBtn} onClick={handleSave} disabled={saving}>
          {saving
            ? (isIt?'Salvataggio…':'Saving…')
            : <><Upload size={15}/> {isIt?'Importa viaggio':'Import trip'}</>
          }
        </button>
        <p className={s.saveNote}>{isIt?'Il viaggio verrà salvato come "completato" nel tuo profilo.':'The trip will be saved as "completed" in your profile.'}</p>
      </div>
    </div>
  )
}
