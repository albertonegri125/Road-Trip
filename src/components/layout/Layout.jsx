import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Map, Users, Upload, User, LogOut, Sun, Moon, Menu, X, Plus, Compass, MessageSquare } from 'lucide-react'
import s from './Layout.module.css'

export default function Layout() {
  const { user, profile, logout, theme, toggleTheme, lang, t } = useApp()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    toast.success(lang === 'it' ? 'A presto! 👋' : 'See you soon! 👋')
    navigate('/')
  }

  const navItems = [
    { to: '/dashboard',  icon: LayoutDashboard, key: 'nav_home' },
    { to: '/build',      icon: Plus,            key: 'nav_build',     accent: true },
    { to: '/my-trips',   icon: Map,             key: 'nav_mytrips' },
    { to: '/import',     icon: Upload,          key: 'nav_import' },
    { to: '/community',  icon: Users,           key: 'nav_community' },
    { to: '/forum',      icon: MessageSquare,   key: 'nav_forum' },
  ]

  const initials = (profile?.displayName || user?.email || '?')[0].toUpperCase()
  const avatarEl = user?.photoURL
    ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>
    : <span>{initials}</span>

  const SidebarContent = () => (
    <aside className={s.sidebar}>
      <div className={s.brand}>
        <Compass size={18} className={s.brandIcon}/>
        <span className={s.brandName}>Road-Trip</span>
      </div>

      <nav className={s.nav}>
        {navItems.map(({ to, icon: Icon, key, accent }) => (
          <NavLink key={to} to={to} onClick={() => setOpen(false)}
            className={({ isActive }) => [s.navItem, isActive ? s.navActive : '', accent ? s.navAccent : ''].filter(Boolean).join(' ')}>
            <Icon size={16}/>
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>

      <div className={s.bottom}>
        <button className={s.themeRow} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
          <span>{theme === 'dark' ? (lang==='it'?'Tema scuro':'Dark mode') : (lang==='it'?'Tema chiaro':'Light mode')}</span>
        </button>

        <NavLink to="/profile" onClick={() => setOpen(false)}
          className={({ isActive }) => [s.profileRow, isActive ? s.profileRowActive : ''].join(' ')}>
          <div className={s.avatar}>{avatarEl}</div>
          <div className={s.profileInfo}>
            <span className={s.profileName}>{profile?.displayName || t('nav_profile')}</span>
            <span className={s.profileEmail}>{user?.email}</span>
          </div>
        </NavLink>

        <button className={s.logoutBtn} onClick={handleLogout}>
          <LogOut size={13}/> {t('nav_signout')}
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
            <button className={s.closeBtn} onClick={() => setOpen(false)}><X size={18}/></button>
            <SidebarContent/>
          </div>
        </div>
      )}

      <div className={s.main}>
        <header className={s.mobileHeader}>
          <button className={s.menuBtn} onClick={() => setOpen(true)}><Menu size={20}/></button>
          <span className={s.mobileBrand}><Compass size={16}/> Road-Trip</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={toggleTheme} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', display:'flex', alignItems:'center' }}>
              {theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}
            </button>
            <div className={s.avatar} style={{ width:28, height:28, fontSize:11 }}>{avatarEl}</div>
          </div>
        </header>
        <main className={s.content}><Outlet/></main>
      </div>
    </div>
  )
}
