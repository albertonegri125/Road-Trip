// src/context/AppContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, appleProvider } from '../lib/firebase'
import { T } from '../i18n/translations'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  // ── Theme ──
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('rt-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('rt-theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  // ── Language — auto-detect from browser ──
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('rt-lang')
    if (saved) return saved
    // Auto-detect from browser
    const browserLang = navigator.language?.toLowerCase() || 'it'
    return browserLang.startsWith('it') ? 'it' : 'en'
  })
  const t = k => T[lang]?.[k] ?? T.en?.[k] ?? k
  const changeLang = l => { setLang(l); localStorage.setItem('rt-lang', l) }

  // ── Auth ──
  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async fu => {
      if (fu) { setUser(fu); await loadOrCreate(fu) }
      else    { setUser(null); setProfile(null) }
      setAuthLoading(false)
    })
  }, [])

  async function loadOrCreate(fu) {
    const ref  = doc(db, 'users', fu.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) { setProfile(snap.data()); return }
    const p = {
      uid: fu.uid, displayName: fu.displayName || '',
      email: fu.email, photoURL: fu.photoURL || '',
      bio: '', nationality: '', homeCity: '',
      tripsCreated: 0, tripsCompleted: 0, totalKm: 0,
      countriesVisited: [], joinedAt: serverTimestamp(),
    }
    await setDoc(ref, p)
    setProfile(p)
  }

  const loginEmail    = (e, p) => signInWithEmailAndPassword(auth, e, p)
  const registerEmail = async (e, p, n) => {
    const c = await createUserWithEmailAndPassword(auth, e, p)
    await updateProfile(c.user, { displayName: n })
    return c
  }
  const loginGoogle   = () => signInWithPopup(auth, googleProvider)
  const loginApple    = () => signInWithPopup(auth, appleProvider)
  const logout        = () => signOut(auth)
  const resetPassword = e  => sendPasswordResetEmail(auth, e)
  const updateProfile2 = async data => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setProfile(p => ({ ...p, ...data }))
  }

  return (
    <Ctx.Provider value={{
      theme, toggleTheme,
      lang, changeLang, t,
      user, profile, authLoading,
      loginEmail, registerEmail, loginGoogle, loginApple,
      logout, resetPassword, updateProfile: updateProfile2,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}
