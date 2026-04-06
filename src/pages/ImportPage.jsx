// src/pages/ImportPage.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Upload, Plus, Trash2, Star } from 'lucide-react'
import GeoInput from '../components/ui/GeoInput'
import toast from 'react-hot-toast'
import s from './ImportPage.module.css'

const TRANSPORTS = {
  it:['Auto','Moto','Bici','A piedi','Camper','Barca','Misto'],
  en:['Car','Motorcycle','Bicycle','On foot','Camper','Boat','Mixed'],
}

export default function ImportPage() {
  const { user, t, lang } = useApp()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title:'', from:'', to:'', year:new Date().getFullYear(),
    duration:'', transport:'', totalKm:'', rating:5,
    highlights:'', tips:'', wouldRepeat:true, isPublic:true,
    stops:[{ city:'', country:'', highlights:'' }],
  })

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const addStop = () => setForm(p=>({...p,stops:[...p.stops,{city:'',country:'',highlights:''}]}))
  const removeStop = i => setForm(p=>({...p,stops:p.stops.filter((_,j)=>j!==i)}))
  const updStop = (i,k,v) => setForm(p=>({...p,stops:p.stops.map((s,j)=>j===i?{...s,[k]:v}:s)}))

  async function save() {
    if (!form.title||!form.from||!form.to) { toast.error(lang==='it'?'Compila i campi obbligatori':'Fill in required fields'); return }
    setSaving(true)
    try {
      const countries = [...new Set(form.stops.map(s=>s.country).filter(Boolean))]
      await addDoc(collection(db,'trips'), { ...form, countries, isPast:true, type:'imported', status:'completed', tripType:form.transport.toLowerCase()||'car', userId:user.uid, createdAt:serverTimestamp() })
      await updateDoc(doc(db,'users',user.uid), { tripsCompleted:increment(1), totalKm:increment(Number(form.totalKm)||0), countriesVisited:arrayUnion(...countries) })
      toast.success(lang==='it'?'Viaggio importato! 🎉':'Trip imported! 🎉')
      navigate('/my-trips')
    } catch(err) { console.error(err); toast.error('Error') }
    finally { setSaving(false) }
  }

  return (
    <div className={s.page}>
      <h1 className={s.title}>{t('imp_title')}</h1>
      <p className={s.subtitle}>{t('imp_subtitle')}</p>
      <div className={s.banner}><Upload size={17}/> <span>{t('imp_banner')}</span></div>

      <div className={s.card}>
        <h2 className={s.cardTitle}>{lang==='it'?'Informazioni viaggio':'Trip info'}</h2>
        <div className={s.fields}>
          <div className={s.field}><label className={s.label}>{t('imp_tripname')} *</label><input className={s.input} value={form.title} onChange={e=>set('title',e.target.value)} placeholder={lang==='it'?'es. Trans-Siberia 2023':'e.g. Trans-Siberia 2023'} /></div>
          <div className={s.fieldRow}>
            <GeoInput label={`${lang==='it'?'Da':'From'} *`} value={form.from} onChange={v=>set('from',v)} onSelect={r=>set('from',r.short)} placeholder={lang==='it'?'Partenza':'Departure'} />
            <span className={s.arrow}>→</span>
            <GeoInput label={`${lang==='it'?'A':'To'} *`} value={form.to} onChange={v=>set('to',v)} onSelect={r=>set('to',r.short)} placeholder={lang==='it'?'Destinazione':'Destination'} />
          </div>
          <div className={s.fieldRow3}>
            <div className={s.field}><label className={s.label}>{t('imp_year')}</label><input className={s.input} type="number" min={1980} max={2025} value={form.year} onChange={e=>set('year',e.target.value)} /></div>
            <div className={s.field}><label className={s.label}>{t('imp_duration')}</label><input className={s.input} type="number" min={1} value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="30" /></div>
            <div className={s.field}><label className={s.label}>{t('imp_km')}</label><input className={s.input} type="number" min={0} value={form.totalKm} onChange={e=>set('totalKm',e.target.value)} placeholder="5000" /></div>
          </div>
          <div className={s.field}><label className={s.label}>{lang==='it'?'Mezzo':'Transport'}</label>
            <select className={s.select} value={form.transport} onChange={e=>set('transport',e.target.value)}>
              <option value="">{lang==='it'?'Seleziona…':'Select…'}</option>
              {TRANSPORTS[lang].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <h2 className={s.cardTitle}>{lang==='it'?'Tappe e paesi':'Stops & countries'}</h2>
        <div className={s.stopsList}>
          {form.stops.map((stop,i)=>(
            <div key={i} className={s.stopCard}>
              <div className={s.stopHead}><span className={s.stopLabel}>Stop {i+1}</span>{form.stops.length>1&&<button className={s.removeBtn} onClick={()=>removeStop(i)}><Trash2 size={13}/></button>}</div>
              <div className={s.fieldRow}>
                <div className={s.field}><label className={s.label}>{lang==='it'?'Città':'City'}</label><input className={s.input} value={stop.city} onChange={e=>updStop(i,'city',e.target.value)} placeholder={lang==='it'?'Città':'City'} /></div>
                <div className={s.field}><label className={s.label}>{lang==='it'?'Paese':'Country'}</label><input className={s.input} value={stop.country} onChange={e=>updStop(i,'country',e.target.value)} placeholder={lang==='it'?'Paese':'Country'} /></div>
              </div>
              <div className={s.field}><label className={s.label}>{lang==='it'?'Cosa c\'era di speciale?':'What was special?'}</label><input className={s.input} value={stop.highlights} onChange={e=>updStop(i,'highlights',e.target.value)} placeholder={lang==='it'?'es. Vista mozzafiato sul lago...':'e.g. Stunning lake views...'} /></div>
            </div>
          ))}
          <button className={s.addBtn} onClick={addStop}><Plus size={14}/> {lang==='it'?'Aggiungi tappa':'Add stop'}</button>
        </div>
      </div>

      <div className={s.card}>
        <h2 className={s.cardTitle}>{lang==='it'?'La tua recensione':'Your review'}</h2>
        <div className={s.fields}>
          <div className={s.field}>
            <label className={s.label}>{t('rating')}</label>
            <div className={s.stars}>{[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>set('rating',n)} style={{padding:3}}>
                <Star size={22} fill={form.rating>=n?'var(--yellow)':'none'} color={form.rating>=n?'var(--yellow)':'var(--text3)'}/>
              </button>
            ))}<span className={s.ratingLbl}>{form.rating}/5</span></div>
          </div>
          <div className={s.field}><label className={s.label}>{t('imp_highlights')}</label><textarea className={s.textarea} rows={3} value={form.highlights} onChange={e=>set('highlights',e.target.value)} placeholder={lang==='it'?'I momenti migliori del viaggio?':'Best moments of the trip?'}/></div>
          <div className={s.field}><label className={s.label}>{t('imp_tips')}</label><textarea className={s.textarea} rows={3} value={form.tips} onChange={e=>set('tips',e.target.value)} placeholder={lang==='it'?'Cosa devono sapere gli altri viaggiatori?':'What should others know?'}/></div>
          <div className={s.checkRow}>
            <label className={s.checkLabel}><input type="checkbox" checked={form.wouldRepeat} onChange={e=>set('wouldRepeat',e.target.checked)}/> {t('imp_repeat')}</label>
            <label className={s.checkLabel}><input type="checkbox" checked={form.isPublic} onChange={e=>set('isPublic',e.target.checked)}/> {t('imp_share')}</label>
          </div>
        </div>
      </div>

      <div className={s.actions}>
        <button className={s.saveBtn} onClick={save} disabled={saving}>
          {saving?`${lang==='it'?'Importando…':'Importing…'}`:<><Upload size={16}/> {t('imp_save')}</>}
        </button>
      </div>
    </div>
  )
}
