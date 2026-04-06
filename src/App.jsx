// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout        from './components/layout/Layout'
import LandingPage   from './pages/LandingPage'
import AuthPage      from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import BuilderPage   from './pages/BuilderPage'
import MyTripsPage   from './pages/MyTripsPage'
import TripDetailPage from './pages/TripDetailPage'
import ImportPage    from './pages/ImportPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage   from './pages/ProfilePage'

function Loader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:38, height:38, border:'3px solid var(--bg4)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
    </div>
  )
}

function Private({ children }) {
  const { user, authLoading } = useApp()
  if (authLoading) return <Loader/>
  return user ? children : <Navigate to="/auth" replace/>
}
function PublicOnly({ children }) {
  const { user, authLoading } = useApp()
  if (authLoading) return <Loader/>
  return user ? <Navigate to="/dashboard" replace/> : children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"     element={<PublicOnly><LandingPage/></PublicOnly>}/>
      <Route path="/auth" element={<PublicOnly><AuthPage/></PublicOnly>}/>
      <Route element={<Private><Layout/></Private>}>
        <Route path="/dashboard"    element={<DashboardPage/>}/>
        <Route path="/build"        element={<BuilderPage/>}/>
        <Route path="/my-trips"     element={<MyTripsPage/>}/>
        <Route path="/my-trips/:id" element={<TripDetailPage/>}/>
        <Route path="/import"       element={<ImportPage/>}/>
        <Route path="/community"    element={<CommunityPage/>}/>
        <Route path="/profile"      element={<ProfilePage/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}
