// src/components/layout/Layout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Map, Users, Upload, User, LogOut, Sun, Moon, Menu, X, Plus, Compass } from 'lucide-react'
import s from './Layout.module.css'

export default function Layout() {
  const { user, profile, logout, theme, toggleTheme, lang, changeLang, t } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    toast.success(lang === 'it' ? 'A presto! 👋' : 'See you soon! 👋')
    navigate('/')
  }

  const navItems = [
    { to: '/dashboard',  icon: LayoutDashboard, key: 'nav_home',      label: true },
    { to: '/build',      icon: Plus,            key: 'nav_build',     accent: true },
    { to: '/my-trips',   icon: Map,             key: 'nav_mytrips' },
    { to: '/import',     icon: Upload,          key: 'nav_import' },
    { to: '/community',  icon: Users,           key: 'nav_community' },
  ]

  const avatarEl = user?.photoURL
    ? <img src={user.photoURL} alt="" className={s.avatarImg}/>
    : <span className={s.avatarLetter}>{(profile?.displayName || user?.email || 'T')[0].toUpperCase()}</span>

  const SidebarContent = () => (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <Compass size={20} className={s.brandIcon}/>
        <span className={s.brandName}>Road-Trip</span>
      </div>

      <nav className={s.nav}>
        {navItems.map(({ to, icon: Icon, key, accent }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) => [s.navItem, isActive ? s.navActive : '', accent ? s.navAccent : ''].filter(Boolean).join(' ')}>
            <Icon size={17}/>
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={s.bottom}>
        <div className={s.controls}>
          <button className={s.iconBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <span className={s.themeLabel}>{theme === 'dark' ? (lang==='it'?'Scuro':'Dark') : (lang==='it'?'Chiaro':'Light')}</span>
        </div>

        <NavLink to="/profile" onClick={() => setOpen(false)}
          className={({ isActive }) => [s.profileRow, isActive ? s.navActive : ''].join(' ')}>
          <div className={s.avatar}>{avatarEl}</div>
          <div className={s.profileInfo}>
            <span className={s.profileName}>{profile?.displayName || t('nav_profile')}</span>
            <span className={s.profileEmail}>{user?.email}</span>
          </div>
        </NavLink>

        <button className={s.logoutBtn} onClick={handleLogout}>
          <LogOut size={15}/> {t('nav_signout')}
        </button>
      </div>
    </aside>
  )

  return (
    <div className={s.layout}>
      <div className={s.desktopSidebar}><SidebarContent/></div>

      {open && (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.mobileSidebar} onClick={e => e.stopPropagation()}>
            <button className={s.closeBtn} onClick={() => setOpen(false)}><X size={19}/></button>
            <SidebarContent/>
          </div>
        </div>
      )}

      <div className={s.main}>
        <header className={s.mobileHeader}>
          <button className={s.menuBtn} onClick={() => setOpen(true)}><Menu size={20}/></button>
          <span className={s.mobileBrand}><Compass size={17}/> Road-Trip</span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button className={s.iconBtn} onClick={toggleTheme}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}</button>
            <div className={s.avatar} style={{ width:30, height:30, fontSize:12 }}>{avatarEl}</div>
          </div>
        </header>
        <main className={s.content}><Outlet/></main>
      </div>
    </div>
  )
}
