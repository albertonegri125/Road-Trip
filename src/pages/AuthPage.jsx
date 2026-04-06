// src/pages/AuthPage.jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { Compass, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'
import s from './AuthPage.module.css'

const ERR = {
  'auth/user-not-found':       { it:'Nessun account con questa email', en:'No account with this email' },
  'auth/wrong-password':       { it:'Password errata',                 en:'Wrong password' },
  'auth/email-already-in-use': { it:'Email già in uso',                en:'Email already in use' },
  'auth/weak-password':        { it:'Password min. 6 caratteri',       en:'Password min. 6 chars' },
  'auth/invalid-email':        { it:'Email non valida',                en:'Invalid email' },
  'auth/invalid-credential':   { it:'Credenziali non valide',          en:'Invalid credentials' },
}

export default function AuthPage() {
  const { loginEmail, registerEmail, loginGoogle, loginApple, resetPassword, t, lang, theme, toggleTheme, changeLang } = useApp()
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading('email')
    try {
      if (mode === 'login')    await loginEmail(email, password)
      else if (mode === 'reg') await registerEmail(email, password, name)
      else { await resetPassword(email); toast.success(lang==='it'?'Email inviata!':'Email sent!'); setMode('login'); setLoading(null); return }
      toast.success(lang==='it'?'Benvenuto! 🗺️':'Welcome! 🗺️')
      navigate('/dashboard')
    } catch(err) {
      toast.error(ERR[err.code]?.[lang] || err.message)
    } finally { setLoading(null) }
  }

  async function social(fn, key) {
    setLoading(key)
    try { await fn(); navigate('/dashboard') }
    catch(err) { if (err.code !== 'auth/popup-closed-by-user') toast.error(err.message) }
    finally { setLoading(null) }
  }

  return (
    <div className={s.page}>
      {/* Topbar */}
      <div className={s.topbar}>
        <div className={s.logo}><Compass size={19} style={{color:'var(--accent)'}}/> Road-Trip</div>
        <div className={s.topRight}>
          <div className={s.langSwitch}>
            {['it','en'].map(l=>(
              <button key={l} className={[s.langBtn,lang===l?s.langActive:''].join(' ')} onClick={()=>changeLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <button className={s.themeBtn} onClick={toggleTheme}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}</button>
        </div>
      </div>

      <div className={s.center}>
        {/* Left hero */}
        <div className={s.heroSide}>
          <div className={s.heroIcon}>🗺️</div>
          <h1 className={s.heroTitle}>{t('hero_title').split('\n').map((l,i)=><span key={i}>{l}<br/></span>)}</h1>
          <p className={s.heroDesc}>{t('hero_desc')}</p>
          <div className={s.stats}>
            <Stat n="12k+" label={lang==='it'?'Percorsi':'Routes'}/>
            <Stat n="89"   label={lang==='it'?'Paesi':'Countries'}/>
            <Stat n="4.8★" label="Rating"/>
          </div>
        </div>

        {/* Card */}
        <div className={s.card}>
          {mode === 'reset'
            ? <h2 className={s.resetTitle}>{t('reset')}</h2>
            : (
              <div className={s.tabs}>
                <button className={[s.tab,mode==='login'?s.tabActive:''].join(' ')} onClick={()=>setMode('login')}>{t('signin')}</button>
                <button className={[s.tab,mode==='reg'  ?s.tabActive:''].join(' ')} onClick={()=>setMode('reg')}>{t('register')}</button>
              </div>
            )
          }

          {mode !== 'reset' && (
            <>
              <div className={s.socials}>
                <button className={s.socialBtn} onClick={()=>social(loginGoogle,'google')} disabled={!!loading}>
                  {loading==='google'?<Spin/>:<GIcon/>} {t('with_google')}
                </button>
                <button className={s.socialBtn} onClick={()=>social(loginApple,'apple')} disabled={!!loading}>
                  {loading==='apple'?<Spin/>:<AIcon/>} {t('with_apple')}
                </button>
              </div>
              <div className={s.divider}><span>or</span></div>
            </>
          )}

          <form onSubmit={submit} className={s.form}>
            {mode==='reg' && <F label={t('fullname')} type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Marco Rossi" required/>}
            <F label={t('email')} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" required/>
            {mode!=='reset' && <F label={t('password')} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6}/>}
            {mode==='login' && <button type="button" className={s.forgot} onClick={()=>setMode('reset')}>{t('forgot')}</button>}
            <button className={s.submitBtn} type="submit" disabled={!!loading}>
              {loading==='email'?<Spin white/>:mode==='login'?t('signin'):mode==='reg'?t('register'):t('send_reset')}
            </button>
            {mode==='reset' && <button type="button" className={s.backBtn} onClick={()=>setMode('login')}>{t('back_login')}</button>}
          </form>
        </div>
      </div>
    </div>
  )
}

function F({ label, ...props }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</label>
      <input
        style={{background:'var(--bg3)',border:'1.5px solid var(--border)',borderRadius:9,padding:'10px 13px',color:'var(--text)',fontSize:14,outline:'none',width:'100%',transition:'border-color .15s',fontFamily:'inherit'}}
        onFocus={e=>e.target.style.borderColor='var(--accent)'}
        onBlur={e=>e.target.style.borderColor='var(--border)'}
        {...props}
      />
    </div>
  )
}

function Stat({ n, label }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
      <strong style={{fontFamily:'var(--font-head)',fontSize:22,fontWeight:800,color:'var(--accent)'}}>{n}</strong>
      <span style={{fontSize:12,color:'var(--text3)'}}>{label}</span>
    </div>
  )
}

function Spin({ white }) {
  return <div style={{width:14,height:14,border:`2px solid ${white?'rgba(255,255,255,.3)':'var(--border2)'}`,borderTopColor:white?'#fff':'var(--accent)',borderRadius:'50%',animation:'spin .7s linear infinite',flexShrink:0}}/>
}

function GIcon() {
  return <svg width="17" height="17" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
}
function AIcon() {
  return <svg width="15" height="15" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-164-39.3c-76 0-103.7 40.8-165.9 40.8s-105.3-57.8-155.3-127.4C46 523 0 417.1 0 316.2 0 131.7 133.8 9 265.4 9c70.7 0 129.5 46.3 173.3 46.3 42.8 0 109.6-49.2 190.1-49.2zM579.2.4c-14.4 62.1-44.7 113.4-82.4 149.5-37.7 36.1-78.8 55-123.1 55-2.2 0-4.3-.2-6.5-.4C360.4 171.4 404.7 38 568.3 0c3.2.1 7.4.2 10.9.4z"/></svg>
}
