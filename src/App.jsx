import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import CuentaCorriente from './pages/CuentaCorriente'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import HistorialClinico from './pages/HistorialClinico'
import Login from './pages/Login'
import './App.css'

const NAV_ITEMS = [
    { to:'/', label:'📊 Panel principal', end:true },
  { to:'/pacientes', label:'👤 Pacientes' },
  { to:'/agenda', label:'📅 Agenda' },
  { to:'/historial', label:'📋 Historial clínico' },
  { to:'/cuenta-corriente', label:'💰 Cuenta corriente' },
  { to:'/reportes', label:'📋 Obras sociales' },
  { to:'/configuracion', label:'⚙️ Configuración' },
]

function App() {
  const [session, setSession] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [esCelular, setEsCelular] = useState(window.innerWidth < 768)
  const [nombreProfesional, setNombreProfesional] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoadingAuth(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      supabase.from('configuracion').select('nombre, apellido').limit(1)
        .then(({ data }) => {
          if (data?.[0]) {
            const { nombre, apellido } = data[0]
            if (nombre || apellido) setNombreProfesional(`${nombre || ''} ${apellido || ''}`.trim())
          }
        })
    }
  }, [session])

  useEffect(() => {
    const handleResize = () => {
      setEsCelular(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMenuAbierto(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loadingAuth) return (
    <div style={{ minHeight:'100vh', background:'#1e1e2e', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#888', fontSize:'14px' }}>Cargando...</p>
    </div>
  )

  if (!session) return <BrowserRouter><Login /></BrowserRouter>

  return (
    <BrowserRouter>
      <div style={{ display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', position:'relative' }}>

        {esCelular && menuAbierto && (
          <div onClick={() => setMenuAbierto(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
        )}

        <nav style={{
          width:'210px', background:'#1e1e2e', padding:'0', flexShrink:0,
          position: esCelular ? 'fixed' : 'relative',
          top:0, left:0, height:'100%', zIndex:50,
          transform: esCelular && !menuAbierto ? 'translateX(-210px)' : 'translateX(0)',
          transition:'transform .25s ease',
          display:'flex', flexDirection:'column'
        }}>
          <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #333' }}>
            <p style={{ color:'#fff', fontWeight:'600', fontSize:'14px', margin:0 }}>🦷 Consultorio</p>
            <p style={{ color:'#aaa', fontSize:'11px', margin:'4px 0 0' }}>{nombreProfesional || 'Sistema odontológico'}</p>
          </div>

          <div style={{ padding:'10px 10px', display:'flex', flexDirection:'column', gap:'2px', flex:1, overflowY:'auto' }}>
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                onClick={() => esCelular && setMenuAbierto(false)}
                style={({ isActive }) => ({
                  display:'block', padding:'9px 12px', borderRadius:'8px',
                  color: isActive ? '#fff' : '#aaa',
                  background: isActive ? '#378ADD' : 'transparent',
                  textDecoration:'none', fontSize:'14px', transition:'all .15s'
          })}>
                {label}
              </NavLink>
            ))}
          </div>

          <div style={{ padding:'10px', borderTop:'1px solid #333' }}>
            <button onClick={handleLogout}
              style={{ width:'100%', padding:'8px', background:'transparent', color:'#888',
                border:'1px solid #333', borderRadius:'8px', fontSize:'12px',
                cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#2a2a3e'; e.currentTarget.style.color='#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#888' }}>
              🚪 Cerrar sesión
            </button>
          </div>
        </nav>

        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#f8f8f6' }}>
          {esCelular && (
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
              background:'#1e1e2e', borderBottom:'1px solid #333', flexShrink:0, position:'sticky', top:0, zIndex:30 }}>
              <button onClick={() => setMenuAbierto(!menuAbierto)}
                style={{ background:'none', border:'none', color:'#fff', fontSize:'22px', cursor:'pointer', padding:'0', lineHeight:1 }}>
                {menuAbierto ? '✕' : '☰'}
              </button>
              <p style={{ color:'#fff', fontWeight:'600', fontSize:'15px', margin:0 }}>🦷 Consultorio</p>
            </div>
          )}

          <main style={{ flex:1, overflowY:'auto' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/historial" element={<HistorialClinico />} />
              <Route path="/cuenta-corriente" element={<CuentaCorriente />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {esCelular && (
            <nav style={{ display:'flex', background:'#1e1e2e', borderTop:'1px solid #333',
              position:'sticky', bottom:0, zIndex:30 }}>
              {NAV_ITEMS.slice(0,5).map(({ to, label, end }) => {
                const emoji = label.split(' ')[0]
                const nombre = label.split(' ').slice(1).join(' ')
                return (
                  <NavLink key={to} to={to} end={end}
                    style={({ isActive }) => ({
                      flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                      padding:'8px 4px', textDecoration:'none',
                      color: isActive ? '#378ADD' : '#888',
                      fontSize:'9px', gap:'3px'
                    })}>
                    <span style={{ fontSize:'18px' }}>{emoji}</span>
                    <span style={{ textAlign:'center', lineHeight:1.2 }}>{nombre}</span>
                  </NavLink>
                )
              })}
            </nav>
          )}
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App