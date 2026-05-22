import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import CuentaCorriente from './pages/CuentaCorriente'
import Reportes from './pages/Reportes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        
        <nav style={{ width: '220px', background: '#1e1e2e', padding: '20px 0', flexShrink: 0 }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #333' }}>
            <p style={{ color: '#fff', fontWeight: '600', fontSize: '15px', margin: 0 }}>🦷 Consultorio</p>
            <p style={{ color: '#888', fontSize: '11px', margin: '4px 0 0' }}>Sistema odontológico</p>
          </div>
          <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { to: '/', label: '📊 Panel principal', end: true },
              { to: '/pacientes', label: '👤 Pacientes' },
              { to: '/agenda', label: '📅 Agenda' },
              { to: '/cuenta-corriente', label: '💰 Cuenta corriente' },
              { to: '/reportes', label: '📋 Obras sociales' },
            ].map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
                display: 'block', padding: '8px 12px', borderRadius: '8px',
                color: isActive ? '#fff' : '#aaa', background: isActive ? '#378ADD' : 'transparent',
                textDecoration: 'none', fontSize: '13px', transition: 'all .15s'
              })}>
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <main style={{ flex: 1, background: '#f8f8f6', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/cuenta-corriente" element={<CuentaCorriente />} />
            <Route path="/reportes" element={<Reportes />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App