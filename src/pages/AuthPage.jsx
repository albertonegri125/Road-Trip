import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate, Link } from 'react-router-dom'
import { Compass, Sun, Moon, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import s from './AuthPage.module.css'

const ERR = {
  'auth/user-not-found':       { it:'Nessun account con questa email', en:'No account found' },
  'auth/wrong-password':       { it:'Password errata', en:'Wrong password' },
  'auth/email-already-in-use': { it:'Email già in uso', en:'Email already in use' },
  'auth/weak-password':        { it:'Password min. 6 caratteri', en:'Password min. 6 chars' },
  'auth/invalid-email':        { it:'Email non valida', en:'Invalid email' },
  'auth/invalid-credential':   { it:'Credenziali non valide', en:'Invalid credentials' },
}

export default function AuthPage() {
  const { loginEmail, registerEmail, loginGoogle, loginApple, resetPassword, t, lang, theme, toggleTheme, changeLang } = useApp()
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading('email')
    try {
      if (mode === 'login')    await loginEmail(email, password)
      else if (mode === 'reg') await registerEmail(email, password, name)
      else {
        await resetPassword(email)
        toast.success(lang === 'it' ? 'Email inviata! Controlla la tua casella.' : 'Email sent! Check your inbox.')
        setMode('login'); setLoading(null); return
      }
      toast.success(lang === 'it' ? 'Benvenuto! 🗺️' : 'Welcome! 🗺️')
      navigate('/dashboard')
    } catch (err) {
      toast.error(ERR[err.code]?.[lang] || err.message)
    } finally { setLoading(null) }
  }

  async function social(fn, key) {
    setLoading(key)
    try { await fn(); navigate('/dashboard') }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') toast.error(err.message) }
    finally { setLoading(null) }
  }

  const isIt = lang === 'it'

  return (
    <div className={s.page}>
      {/* Topbar */}
      <div className={s.topbar}>
        <Link to="/" className={s.logo}>
          <Compass size={18} style={{ color:'var(--fire)' }}/> Road-Trip
        </Link>
        <div className={s.topRight}>
          <div className={s.langSwitch}>
            {['it','en'].map(l => (
              <button key={l} className={[s.langBtn, lang===l ? s.langActive : ''].join(' ')} onClick={() => changeLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button className={s.themeBtn} onClick={toggleTheme}>
            {theme==='dark' ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </div>

      <div className={s.split}>
        {/* Left panel */}
        <div className={s.left}>
          <div className={s.leftInner}>
            <div className={s.tagline}>
              <span className={s.taglineAccent}>Road-Trip</span>
              <h2>{isIt ? 'La strada è il viaggio.' : 'The road is the journey.'}</h2>
              <p>{isIt ? 'Percorsi reali. GPX ad alta densità. Documenti per ogni paese.' : 'Real routes. High-density GPX. Documents for every country.'}</p>
            </div>
            <div className={s.stats}>
              {[
                { n:'14.200+', l: isIt ? 'Percorsi creati' : 'Routes created' },
                { n:'5000–10k', l: isIt ? 'Punti GPX' : 'GPX points' },
                { n:'50+',     l: isIt ? 'Paesi coperti' : 'Countries covered' },
              ].map(st => (
                <div key={st.n} className={s.stat}>
                  <span className={s.statN}>{st.n}</span>
                  <span className={s.statL}>{st.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className={s.right}>
          <div className={s.card}>
            {/* Tabs */}
            <div className={s.tabs}>
              <button className={[s.tab, mode==='login' ? s.tabActive : ''].join(' ')} onClick={() => setMode('login')}>
                {isIt ? 'Accedi' : 'Sign in'}
              </button>
              <button className={[s.tab, mode==='reg' ? s.tabActive : ''].join(' ')} onClick={() => setMode('reg')}>
                {isIt ? 'Registrati' : 'Sign up'}
              </button>
            </div>

            <h1 className={s.cardTitle}>
              {mode==='login' ? (isIt ? 'Bentornato' : 'Welcome back')
               : mode==='reg' ? (isIt ? 'Crea account' : 'Create account')
               : (isIt ? 'Reset password' : 'Reset password')}
            </h1>

            {/* Social */}
            {mode !== 'reset' && (
              <div className={s.socials}>
                <button className={s.socialBtn} onClick={() => social(loginGoogle, 'google')} disabled={!!loading}>
                  {loading==='google' ? <Spin/> : (
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Google
                </button>
                <button className={s.socialBtn} onClick={() => social(loginApple, 'apple')} disabled={!!loading}>
                  {loading==='apple' ? <Spin/> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.4.07 2.38.74 3.2.8 1.22-.24 2.38-.93 3.7-.84 1.58.12 2.77.72 3.54 1.82-3.26 1.97-2.72 6.08.54 7.27-.65 1.65-1.5 3.28-3 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  Apple
                </button>
              </div>
            )}

            {mode !== 'reset' && <div className={s.divider}><span>{isIt ? 'oppure con email' : 'or with email'}</span></div>}

            {/* Form */}
            <form onSubmit={submit} className={s.form}>
              {mode === 'reg' && (
                <div className={s.field}>
                  <label className="field-label">{isIt ? 'Nome completo' : 'Full name'}</label>
                  <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder={isIt ? 'Mario Rossi' : 'John Doe'} required/>
                </div>
              )}
              <div className={s.field}>
                <label className="field-label">Email</label>
                <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required/>
              </div>
              {mode !== 'reset' && (
                <div className={s.field}>
                  <label className="field-label">{isIt ? 'Password' : 'Password'}</label>
                  <div className={s.pwRow}>
                    <input className="field-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ paddingRight:36 }}/>
                    <button type="button" className={s.eyeBtn} onClick={() => setShowPw(p => !p)}>
                      {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className={s.submitBtn} disabled={!!loading}>
                {loading==='email' ? <Spin white/> : null}
                {mode==='login' ? (isIt ? 'Accedi' : 'Sign in')
                 : mode==='reg' ? (isIt ? 'Crea account' : 'Create account')
                 : (isIt ? 'Invia email reset' : 'Send reset email')}
              </button>
            </form>

            <div className={s.footer}>
              {mode === 'login' && (
                <>
                  <button className={s.link} onClick={() => setMode('reset')}>{isIt ? 'Password dimenticata?' : 'Forgot password?'}</button>
                  <button className={s.link} onClick={() => setMode('reg')}>{isIt ? 'Crea un account →' : 'Create an account →'}</button>
                </>
              )}
              {mode === 'reg' && <button className={s.link} onClick={() => setMode('login')}>{isIt ? '← Hai già un account?' : '← Already have an account?'}</button>}
              {mode === 'reset' && <button className={s.link} onClick={() => setMode('login')}>{isIt ? '← Torna al login' : '← Back to login'}</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spin({ white }) {
  return <div style={{ width:14, height:14, border:`2px solid ${white?'rgba(255,255,255,.35)':'var(--border3)'}`, borderTopColor:white?'#fff':'var(--fire)', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
}
