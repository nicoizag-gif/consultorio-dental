import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [turnosHoy, setTurnosHoy] = useState([])
  const [ultimosPacientes, setUltimosPacientes] = useState([])
  const [loading, setLoading] = useState(true)

  const hoy = new Date().toISOString().split('T')[0]
  const ahora = new Date()
  const horaActual = ahora.toTimeString().slice(0,5)
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaLabel = `${diasSemana[ahora.getDay()]}, ${ahora.getDate()} de ${meses[ahora.getMonth()]} de ${ahora.getFullYear()}`

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: turnos }, { data: pacientes }] = await Promise.all([
      supabase.from('turnos').select('*, pacientes(nombre, telefono, obra_social)')
        .eq('fecha', hoy).order('hora'),
      supabase.from('pacientes').select('id, nombre, obra_social, created_at')
        .order('created_at', { ascending: false }).limit(4),
    ])
    setTurnosHoy(turnos || [])
    setUltimosPacientes(pacientes || [])
    setLoading(false)
  }

  const estadoColor = { confirmado:'#1D9E75', pendiente:'#EF9F27', cancelado:'#E24B4A' }
  const estadoBg = { confirmado:'#E1F5EE', pendiente:'#FAEEDA', cancelado:'#FCEBEB' }

  // Calcular turno anterior, actual y próximo
  function calcularEstadoTurnos() {
    if (!turnosHoy.length) return { anterior: null, actual: null, proximo: null }
    
    const activos = turnosHoy.filter(t => t.estado !== 'cancelado')
    let anteriorIdx = -1
    let actualIdx = -1
    let proximoIdx = -1

    activos.forEach((t, i) => {
      const horaT = t.hora.slice(0,5)
      const horaFin = sumarMinutos(horaT, t.duracion || 60)
      if (horaT <= horaActual && horaFin > horaActual) {
        actualIdx = i
      } else if (horaFin <= horaActual) {
        anteriorIdx = i
      }
    })

    if (actualIdx === -1) {
      // No hay turno en curso — buscar el próximo
      for (let i = 0; i < activos.length; i++) {
        if (activos[i].hora.slice(0,5) > horaActual) {
          proximoIdx = i
          anteriorIdx = i > 0 ? i - 1 : -1
          break
        }
      }
    } else {
      proximoIdx = actualIdx + 1 < activos.length ? actualIdx + 1 : -1
    }

    return {
      anterior: anteriorIdx >= 0 ? activos[anteriorIdx] : null,
      actual: actualIdx >= 0 ? activos[actualIdx] : null,
      proximo: proximoIdx >= 0 ? activos[proximoIdx] : null,
    }
  }

  function sumarMinutos(hora, minutos) {
    const [h, m] = hora.split(':').map(Number)
    const total = h * 60 + m + minutos
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
  }

  function tiempoHasta(hora) {
    const [h, m] = hora.split(':').map(Number)
    const [ha, ma] = horaActual.split(':').map(Number)
    const diff = (h * 60 + m) - (ha * 60 + ma)
    if (diff <= 0) return 'ahora'
    if (diff < 60) return `en ${diff} min`
    const hs = Math.floor(diff/60)
    const ms = diff % 60
    return `en ${hs}h${ms > 0 ? ` ${ms}min` : ''}`
  }

  const { anterior, actual, proximo } = calcularEstadoTurnos()
  const turnosActivos = turnosHoy.filter(t => t.estado !== 'cancelado').length
  const confirmados = turnosHoy.filter(t => t.estado === 'confirmado').length
  const pendientes = turnosHoy.filter(t => t.estado === 'pendiente').length

  return (
    <div style={{ padding:'32px' }}>

      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'600', margin:'0 0 4px' }}>Buenos días 👋</h1>
          <p style={{ color:'#888', fontSize:'13px', margin:0 }}>{fechaLabel}</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ fontSize:'22px', fontWeight:'600', color:'#111', margin:0 }}>{horaActual}</p>
          <p style={{ fontSize:'11px', color:'#888', margin:'2px 0 0' }}>Hora actual</p>
        </div>
      </div>

      {/* MÉTRICAS SIMPLES */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
        <div style={{ background:'#E6F1FB', borderRadius:'14px', padding:'18px 20px' }}>
          <p style={{ fontSize:'11px', color:'#666', margin:'0 0 8px' }}>Turnos hoy</p>
          <p style={{ fontSize:'28px', fontWeight:'600', margin:'0 0 4px', color:'#111' }}>{loading ? '—' : turnosActivos}</p>
          <p style={{ fontSize:'11px', color:'#888', margin:0 }}>{confirmados} confirmados · {pendientes} pendientes</p>
        </div>
        <div style={{ background:'#E1F5EE', borderRadius:'14px', padding:'18px 20px', cursor:'pointer' }}
          onClick={() => navigate('/pacientes')}>
          <p style={{ fontSize:'11px', color:'#666', margin:'0 0 8px' }}>Total pacientes</p>
          <p style={{ fontSize:'28px', fontWeight:'600', margin:'0 0 4px', color:'#111' }}>{loading ? '—' : ultimosPacientes.length > 0 ? '→' : '0'}</p>
          <p style={{ fontSize:'11px', color:'#888', margin:0 }}>Ver listado completo</p>
        </div>
        <div style={{ background:'#EEEDFE', borderRadius:'14px', padding:'18px 20px', cursor:'pointer' }}
          onClick={() => navigate('/agenda')}>
          <p style={{ fontSize:'11px', color:'#666', margin:'0 0 8px' }}>Agenda</p>
          <p style={{ fontSize:'28px', fontWeight:'600', margin:'0 0 4px', color:'#111' }}>→</p>
          <p style={{ fontSize:'11px', color:'#888', margin:0 }}>Ver semana completa</p>
        </div>
      </div>

      {/* ESTADO ACTUAL DE TURNOS */}
      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px',
        padding:'20px', marginBottom:'20px' }}>
        <p style={{ fontWeight:'600', fontSize:'15px', margin:'0 0 16px' }}>🦷 Estado actual del consultorio</p>

        {loading ? <p style={{ color:'#888', fontSize:'13px' }}>Cargando...</p> :
          turnosHoy.filter(t => t.estado !== 'cancelado').length === 0 ? (
            <p style={{ color:'#888', fontSize:'13px', textAlign:'center', padding:'16px' }}>No hay turnos para hoy.</p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>

              {/* ANTERIOR */}
              <div style={{ padding:'14px', background:'#f8f8f6', borderRadius:'12px', opacity: anterior ? 1 : 0.4 }}>
                <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textTransform:'uppercase',
                  letterSpacing:'.06em', margin:'0 0 10px' }}>← Paciente anterior</p>
                {anterior ? (
                  <>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#333', margin:'0 0 4px' }}>
                      {anterior.pacientes?.nombre?.split(',')[0] || anterior.pacientes?.nombre}
                    </p>
                    <p style={{ fontSize:'12px', color:'#888', margin:'0 0 6px' }}>
                      {anterior.hora?.slice(0,5)} · {anterior.motivo}
                    </p>
                    <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px',
                      background: estadoBg[anterior.estado], color: estadoColor[anterior.estado] }}>
                      {anterior.estado}
                    </span>
                  </>
                ) : (
                  <p style={{ fontSize:'12px', color:'#bbb', margin:0 }}>Sin turno anterior</p>
                )}
              </div>

              {/* ACTUAL */}
              <div style={{ padding:'14px', background: actual ? '#EBF4FF' : '#f8f8f6',
                borderRadius:'12px', border: actual ? '2px solid #378ADD' : '2px solid transparent' }}>
                <p style={{ fontSize:'10px', fontWeight:'600', color: actual ? '#378ADD' : '#888',
                  textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 10px' }}>
                  ● En consultorio ahora
                </p>
                {actual ? (
                  <>
                    <p style={{ fontSize:'16px', fontWeight:'700', color:'#111', margin:'0 0 4px' }}>
                      {actual.pacientes?.nombre?.split(',')[0] || actual.pacientes?.nombre}
                    </p>
                    <p style={{ fontSize:'12px', color:'#555', margin:'0 0 4px' }}>
                      {actual.hora?.slice(0,5)} — {sumarMinutos(actual.hora?.slice(0,5), actual.duracion || 60)}
                    </p>
                    <p style={{ fontSize:'12px', color:'#888', margin:'0 0 6px' }}>{actual.motivo}</p>
                    {actual.pacientes?.telefono && (
                      <p style={{ fontSize:'11px', color:'#666', margin:0 }}>📞 {actual.pacientes.telefono}</p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize:'13px', color:'#888', margin:0 }}>Consultorio libre</p>
                )}
              </div>

              {/* PRÓXIMO */}
              <div style={{ padding:'14px', background:'#f8f8f6', borderRadius:'12px', opacity: proximo ? 1 : 0.4 }}>
                <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textTransform:'uppercase',
                  letterSpacing:'.06em', margin:'0 0 10px' }}>Próximo paciente →</p>
                {proximo ? (
                  <>
                    <p style={{ fontSize:'14px', fontWeight:'600', color:'#333', margin:'0 0 4px' }}>
                      {proximo.pacientes?.nombre?.split(',')[0] || proximo.pacientes?.nombre}
                    </p>
                    <p style={{ fontSize:'12px', color:'#888', margin:'0 0 4px' }}>
                      {proximo.hora?.slice(0,5)} · {proximo.motivo}
                    </p>
                    <p style={{ fontSize:'12px', fontWeight:'600', color:'#378ADD', margin:'0 0 6px' }}>
                      🕐 {tiempoHasta(proximo.hora?.slice(0,5))}
                    </p>
                    <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px',
                      background: estadoBg[proximo.estado], color: estadoColor[proximo.estado] }}>
                      {proximo.estado}
                    </span>
                  </>
                ) : (
                  <p style={{ fontSize:'12px', color:'#bbb', margin:0 }}>Sin más turnos hoy</p>
                )}
              </div>

            </div>
          )
        }
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

        {/* LISTA COMPLETA TURNOS HOY */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>📋 Todos los turnos de hoy</p>
            <button onClick={() => navigate('/agenda')}
              style={{ fontSize:'11px', padding:'4px 10px', border:'1px solid #ddd', borderRadius:'6px',
                background:'#fff', cursor:'pointer', color:'#666' }}>+ Nuevo →</button>
          </div>
          {loading ? <p style={{ color:'#888', fontSize:'13px' }}>Cargando...</p> :
            turnosHoy.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', color:'#888' }}>
                <p style={{ fontSize:'24px', margin:'0 0 6px' }}>📭</p>
                <p style={{ fontSize:'13px', margin:0 }}>No hay turnos para hoy</p>
              </div>
            ) : turnosHoy.map(t => {
              const esActual = actual?.id === t.id
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px',
                  padding:'9px 8px', borderRadius:'8px', marginBottom:'4px',
                  background: esActual ? '#EBF4FF' : 'transparent',
                  border: esActual ? '1px solid #B5D4F4' : '1px solid transparent' }}>
                  <div style={{ width:'40px', flexShrink:0, textAlign:'center' }}>
                    <p style={{ fontSize:'13px', fontWeight:'600', margin:0,
                      color: esActual ? '#378ADD' : '#111' }}>{t.hora?.slice(0,5)}</p>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'13px', fontWeight:'500', margin:0, color:'#111' }}>
                      {t.pacientes?.nombre?.split(',')[0] || t.pacientes?.nombre || '—'}
                    </p>
                    <p style={{ fontSize:'11px', color:'#888', margin:'1px 0 0' }}>{t.motivo} · {t.duracion || 60} min</p>
                  </div>
                  <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px',
                    background: estadoBg[t.estado] || '#f5f5f5',
                    color: estadoColor[t.estado] || '#888' }}>
                    {t.estado}
                  </span>
                </div>
              )
            })
          }
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px', padding:'20px' }}>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:'0 0 12px' }}>⚡ Módulos</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {[
                { label:'👤 Pacientes', desc:'Fichas y datos', link:'/pacientes', color:'#E6F1FB' },
                { label:'📅 Agenda', desc:'Turnos del día', link:'/agenda', color:'#E1F5EE' },
                { label:'💰 Cuenta cte.', desc:'Pagos y saldos', link:'/cuenta-corriente', color:'#FAEEDA' },
                { label:'📋 Obras sociales', desc:'Reportes mensuales', link:'/reportes', color:'#EEEDFE' },
              ].map(({ label, desc, link, color }) => (
                <div key={link} onClick={() => navigate(link)}
                  style={{ background: color, borderRadius:'10px', padding:'12px', cursor:'pointer', transition:'opacity .15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                  <p style={{ fontSize:'13px', fontWeight:'500', margin:'0 0 2px', color:'#111' }}>{label}</p>
                  <p style={{ fontSize:'11px', color:'#666', margin:0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
              <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>🕐 Últimos pacientes</p>
              <button onClick={() => navigate('/pacientes')}
                style={{ fontSize:'11px', padding:'4px 10px', border:'1px solid #ddd', borderRadius:'6px',
                  background:'#fff', cursor:'pointer', color:'#666' }}>Ver todos →</button>
            </div>
            {loading ? <p style={{ color:'#888', fontSize:'13px' }}>Cargando...</p> :
              ultimosPacientes.length === 0 ? (
                <p style={{ color:'#888', fontSize:'13px' }}>No hay pacientes todavía.</p>
              ) : ultimosPacientes.map((p, i) => {
                const colores = ['#E6F1FB','#E1F5EE','#FAEEDA','#EEEDFE']
                const textCol = ['#185FA5','#085041','#633806','#3C3489']
                return (
                  <div key={p.id} onClick={() => navigate('/pacientes')}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 0',
                      borderBottom:'1px solid #f5f5f5', cursor:'pointer' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'50%', background: colores[i],
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'12px', fontWeight:'600', color: textCol[i], flexShrink:0 }}>
                      {p.nombre.split(' ').map(n=>n[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:'13px', fontWeight:'500', margin:0, color:'#111' }}>{p.nombre}</p>
                      <p style={{ fontSize:'11px', color:'#888', margin:'1px 0 0' }}>{p.obra_social || 'Particular'}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}