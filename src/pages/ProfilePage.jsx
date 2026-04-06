// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Camera, Edit2, Check, X, Globe, MapPin, Languages } from 'lucide-react'
import toast from 'react-hot-toast'
import s from './ProfilePage.module.css'

const COUNTRIES_IT = ['Italia','Germania','Francia','Spagna','Portogallo','Turchia','Marocco','Grecia','Croazia','Polonia','Rep. Ceca','Austria','Svizzera','Paesi Bassi','Belgio','Regno Unito','Norvegia','Svezia','Finlandia','Danimarca','Iran','India','Cina','Giappone','Tailandia','Vietnam','Mongolia','Georgia','Armenia','Azerbaigian']
const COUNTRIES_EN = ['Italy','Germany','France','Spain','Portugal','Turkey','Morocco','Greece','Croatia','Poland','Czech Republic','Austria','Switzerland','Netherlands','Belgium','United Kingdom','Norway','Sweden','Finland','Denmark','Iran','India','China','Japan','Thailand','Vietnam','Mongolia','Georgia','Armenia','Azerbaijan']

export default function ProfilePage() {
  const { user, profile, updateProfile, t, lang, changeLang } = useApp()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({
    displayName: profile?.displayName||'',
    bio:         profile?.bio||'',
    nationality: profile?.nationality||'',
    homeCity:    profile?.homeCity||'',
  })

  const COUNTRIES = lang==='it'?COUNTRIES_IT:COUNTRIES_EN

  async function save() {
    setSaving(true)
    try { await updateProfile(form); toast.success(lang==='it'?'Profilo aggiornato!':'Profile updated!'); setEditing(false) }
    catch { toast.error('Error') }
    finally { setSaving(false) }
  }

  function cancel() {
    setForm({ displayName:profile?.displayName||'', bio:profile?.bio||'', nationality:profile?.nationality||'', homeCity:profile?.homeCity||'' })
    setEditing(false)
  }

  const avatar = user?.photoURL
    ? <img src={user.photoURL} alt="" className={s.avatarImg}/>
    : <span className={s.avatarLetter}>{(profile?.displayName||user?.email||'T')[0].toUpperCase()}</span>

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>{t('prof_title')}</h1>
        <div className={s.hActions}>
          {!editing
            ? <button className={s.editBtn} onClick={()=>setEditing(true)}><Edit2 size={14}/> {t('prof_edit')}</button>
            : <><button className={s.cancelBtn} onClick={cancel}><X size={14}/> {t('prof_cancel')}</button>
               <button className={s.saveBtn} onClick={save} disabled={saving}><Check size={14}/> {saving?t('loading'):t('prof_save')}</button></>
          }
        </div>
      </div>

      <div className={s.layout}>
        {/* Left col */}
        <div className={s.left}>
          <div className={s.avatarWrap}>
            <div className={s.avatar}>{avatar}</div>
            <button className={s.camBtn}><Camera size={14}/></button>
          </div>

          <div className={s.statsCard}>
            <h3 className={s.statsTitle}>{t('prof_stats')}</h3>
            <div className={s.statsList}>
              <StatRow label={t('prof_planned')}   val={profile?.tripsCreated||0} />
              <StatRow label={t('prof_completed')} val={profile?.tripsCompleted||0} />
              <StatRow label={t('dash_km')}        val={(profile?.totalKm||0).toLocaleString()} />
              <StatRow label={t('prof_countries')} val={profile?.countriesVisited?.length||0} />
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className={s.right}>
          <div className={s.card}>
            <h2 className={s.cardTitle}>{lang==='it'?'Informazioni personali':'Personal info'}</h2>
            <div className={s.fields}>
              <Field label={lang==='it'?'Nome':'Full name'} editing={editing}>
                {editing ? <input className={s.input} value={form.displayName} onChange={e=>setForm(p=>({...p,displayName:e.target.value}))} placeholder={lang==='it'?'Il tuo nome':'Your name'}/> : <span>{profile?.displayName||<em style={{color:'var(--text3)'}}>—</em>}</span>}
              </Field>
              <Field label="Email" editing={false}>
                <span className={s.emailRow}>{user?.email} <span className={s.verified}>✓</span></span>
              </Field>
              <Field label={t('prof_bio')} editing={editing}>
                {editing ? <textarea className={s.textarea} rows={3} value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder={lang==='it'?'Raccontati…':'About you…'}/> : <span>{profile?.bio||<em style={{color:'var(--text3)'}}>—</em>}</span>}
              </Field>
              <div className={s.fieldRow}>
                <Field label={t('prof_nationality')} editing={editing}>
                  {editing ? <select className={s.select} value={form.nationality} onChange={e=>setForm(p=>({...p,nationality:e.target.value}))}><option value="">{lang==='it'?'Seleziona…':'Select…'}</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select> : <span>{profile?.nationality||<em style={{color:'var(--text3)'}}>—</em>}</span>}
                </Field>
                <Field label={t('prof_city')} editing={editing}>
                  {editing ? <input className={s.input} value={form.homeCity} onChange={e=>setForm(p=>({...p,homeCity:e.target.value}))} placeholder={lang==='it'?'es. Milano':'e.g. Milan'}/> : <span className={s.withIcon}><MapPin size={13}/>{profile?.homeCity||<em style={{color:'var(--text3)'}}>—</em>}</span>}
                </Field>
              </div>
            </div>
          </div>

          <div className={s.card}>
            <div className={s.cardTitleRow}>
              <h2 className={s.cardTitle}>{t('prof_countries')}</h2>
              <span className={s.countBadge}>{profile?.countriesVisited?.length||0}</span>
            </div>
            {!profile?.countriesVisited?.length ? (
              <div className={s.empty}><Globe size={28}/><p>{lang==='it'?'Nessun paese ancora. Importa i tuoi viaggi passati!':'No countries yet. Import your past trips!'}</p></div>
            ) : (
              <div className={s.countryChips}>{profile?.countriesVisited.map(c=><span key={c} className={s.chip}>{c}</span>)}</div>
            )}
          </div>

          <div className={s.card}>
            <h2 className={s.cardTitle}><Languages size={16} style={{display:'inline',marginRight:6}}/>{lang==='it'?'Lingua':'Language'}</h2>
            <div className={s.langOptions}>
              <button className={[s.langOption, lang==='it'?s.langOptionActive:''].join(' ')} onClick={()=>changeLang('it')}>
                <span style={{fontSize:20}}>🇮🇹</span>
                <div><div style={{fontWeight:700}}>Italiano</div><div style={{fontSize:12,color:'var(--text3)'}}>Lingua del sito</div></div>
                {lang==='it'&&<span className={s.langCheck}>✓</span>}
              </button>
              <button className={[s.langOption, lang==='en'?s.langOptionActive:''].join(' ')} onClick={()=>changeLang('en')}>
                <span style={{fontSize:20}}>🇬🇧</span>
                <div><div style={{fontWeight:700}}>English</div><div style={{fontSize:12,color:'var(--text3)'}}>Site language</div></div>
                {lang==='en'&&<span className={s.langCheck}>✓</span>}
              </button>
            </div>
          </div>

          <div className={s.card}>
            <h2 className={s.cardTitle}>{t('prof_auth')}</h2>
            <div className={s.providers}>
              {user?.providerData?.map(p=>(
                <div key={p.providerId} className={s.provider}>
                  <span className={s.providerIcon}>{p.providerId==='google.com'?'🔵':p.providerId==='apple.com'?'⚫':'✉️'}</span>
                  <span>{p.providerId==='google.com'?'Google':p.providerId==='apple.com'?'Apple ID':'Email'}</span>
                  <span className={s.linked}>✓ {lang==='it'?'Collegato':'Linked'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <div className={s.field}><label className={s.label}>{label}</label><div className={s.fieldVal}>{children}</div></div>
}
function StatRow({ label, val }) {
  return <div className={s.statRow}><span>{label}</span><strong>{val}</strong></div>
}
