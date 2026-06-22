// ProfilePage.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'
import { User, Globe, Edit3, Save } from 'lucide-react'
import s from './ProfilePage.module.css'

const NATIONALITIES_IT = ['Italiana','Tedesca','Francese','Spagnola','Inglese','Olandese','Belga','Svizzera','Austriaca','Americana','Altra']
const NATIONALITIES_EN = ['Italian','German','French','Spanish','English','Dutch','Belgian','Swiss','Austrian','American','Other']

export default function ProfilePage() {
  const { user, profile, updateProfile, t, lang, changeLang } = useApp()
  const isIt = lang === 'it'
  const [form, setForm] = useState({
    displayName: profile?.displayName || '',
    bio:         profile?.bio || '',
    nationality: profile?.nationality || '',
    homeCity:    profile?.homeCity || '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success(isIt ? 'Profilo salvato!' : 'Profile saved!')
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const initials = (profile?.displayName || user?.email || '?')[0].toUpperCase()

  return (
    <div className={s.page}>
      <h1 className={s.title}>{t('prof_title')}</h1>

      <div className={s.grid}>
        {/* Avatar + stats */}
        <div className={s.sideCard}>
          <div className={s.avatarBig}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className={s.avatarImg}/>
              : <span className={s.avatarLetter}>{initials}</span>
            }
          </div>
          <div className={s.profileName}>{profile?.displayName || user?.email}</div>
          <div className={s.profileEmail}>{user?.email}</div>
          <div className={s.stats}>
            <div className={s.stat}><span className={s.statN}>{profile?.tripsCreated || 0}</span><span className={s.statL}>{isIt?'Viaggi':'Trips'}</span></div>
            <div className={s.stat}><span className={s.statN}>{(profile?.totalKm||0).toLocaleString()}</span><span className={s.statL}>km</span></div>
            <div className={s.stat}><span className={s.statN}>{(profile?.countriesVisited||[]).length}</span><span className={s.statL}>{isIt?'Paesi':'Countries'}</span></div>
          </div>
        </div>

        {/* Edit form */}
        <div className={s.formCard}>
          <h2 className={s.formTitle}><Edit3 size={16}/> {isIt?'Modifica profilo':'Edit profile'}</h2>

          <div className={s.field}>
            <label className="field-label">{isIt?'Nome':'Name'}</label>
            <input className="field-input" value={form.displayName} onChange={e => setForm(f=>({...f,displayName:e.target.value}))}/>
          </div>
          <div className={s.field}>
            <label className="field-label">{t('prof_bio')}</label>
            <textarea className="field-input" rows={3} value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} placeholder={isIt?'Raccontati ai tuoi compagni di viaggio…':'Tell fellow travelers about yourself…'}/>
          </div>
          <div className={s.row2}>
            <div className={s.field}>
              <label className="field-label">{t('prof_nationality')}</label>
              <select className="field-input" value={form.nationality} onChange={e => setForm(f=>({...f,nationality:e.target.value}))}>
                <option value="">{isIt?'Seleziona…':'Select…'}</option>
                {(isIt?NATIONALITIES_IT:NATIONALITIES_EN).map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className="field-label">{t('prof_homecity')}</label>
              <input className="field-input" value={form.homeCity} onChange={e => setForm(f=>({...f,homeCity:e.target.value}))} placeholder={isIt?'es. Milano':'e.g. Milan'}/>
            </div>
          </div>

          <div className={s.field}>
            <label className="field-label"><Globe size={12}/> {t('prof_lang')}</label>
            <div className={s.langSwitch}>
              {['it','en'].map(l => (
                <button key={l} className={[s.langBtn, lang===l ? s.langActive : ''].join(' ')} onClick={() => changeLang(l)}>
                  {l === 'it' ? '🇮🇹 Italiano' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          <button className={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? '…' : <><Save size={14}/> {t('prof_save')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
