import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import CuentaCorriente from './pages/CuentaCorriente'
import Reportes from './pages/Reportes'
import './App.css'

const NAV_ITEMS = [
  { to:'/', label:'📊 Panel principal', end:true },
  { to:'/pacientes', label:'👤 Pacientes' },
  { to:'/agenda', label:'📅 Agenda' },
  { to:'/cuenta-corriente', label:'💰 Cuenta corriente' },
  { to:'/reportes', label:'📋 Obras sociales' },
]

function App() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [esCelular, setEsCelular] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setEsCelular(window.innerWidth < 768)
      if (window.innerWidth >= 768) setMenuAbierto(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <BrowserRouter>
      <div style={{ display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', position:'relative' }}>

        {/* OVERLAY celular */}
        {esCelular && menuAbierto && (
          <div onClick={() => setMenuAbierto(false)}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} />
        )}

        {/* SIDEBAR */}
        <nav style={{
          width: '220px',
          background: '#1e1e2e',
          padding: '0',
          flexShrink: 0,
          position: esCelular ? 'fixed' : 'relative',
          top: 0, left: 0, height: '100%',
          zIndex: 50,
          transform: esCelular && !menuAbierto ? 'translateX(-220px)' : 'translateX(0)',
          transition: 'transform .25s ease',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid #333' }}>
            <p style={{ color:'#fff', fontWeight:'600', fontSize:'15px', margin:0 }}>🦷 Consultorio</p>
            <p style={{ color:'#888', fontSize:'11px', margin:'4px 0 0' }}>Sistema odontológico</p>
          </div>
          <div style={{ padding:'16px 12px', display:'flex', flexDirection:'column', gap:'4px', flex:1, overflowY:'auto' }}>
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                onClick={() => esCelular && setMenuAbierto(false)}
                style={({ isActive }) => ({
                  display:'block', padding:'9px 12px', borderRadius:'8px',
                  color: isActive ? '#fff' : '#aaa',
                  background: isActive ? '#378ADD' : 'transparent',
                  textDecoration:'none', fontSize:'13px', transition:'all .15s'
                })}>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#f8f8f6' }}>

          {/* TOPBAR celular */}
          {esCelular && (
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px',
              background:'#1e1e2e', borderBottom:'1px solid #333', flexShrink:0, position:'sticky', top:0, zIndex:30 }}>
              <button onClick={() => setMenuAbierto(!menuAbierto)}
                style={{ background:'none', border:'none', color:'#fff', fontSize:'22px',
                  cursor:'pointer', padding:'0', lineHeight:1 }}>
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
              <Route path="/cuenta-corriente" element={<CuentaCorriente />} />
              <Route path="/reportes" element={<Reportes />} />
            </Routes>
          </main>

          {/* BOTTOM NAV celular */}
          {esCelular && (
            <nav style={{ display:'flex', background:'#1e1e2e', borderTop:'1px solid #333',
              position:'sticky', bottom:0, zIndex:30 }}>
              {NAV_ITEMS.map(({ to, label, end }) => {
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