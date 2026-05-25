import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const HORAS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
               '12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']
const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MOTIVOS = ['Consulta general','Obturación','Extracción','Trat. de conducto',
                 'Limpieza / profilaxis','Corona','Ortodoncia','Control de rutina','Blanqueamiento','Otro']

function getLunes(d) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(d)
  lunes.setDate(d.getDate() + diff)
  return lunes
}

function fmtDate(d) { return d.toISOString().split('T')[0] }

export default function Agenda() {
  const [turnos, setTurnos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [baseDate, setBaseDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [turnoDetalle, setTurnoDetalle] = useState(null)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    paciente_id:'', fecha:'', hora:'08:00',
    motivo:'Consulta general', duracion:60, observaciones:''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('turnos').select('*, pacientes(nombre, telefono, obra_social)').order('fecha').order('hora'),
      supabase.from('pacientes').select('id, nombre').order('nombre')
    ])
    setTurnos(t || [])
    setPacientes(p || [])
    setLoading(false)
  }

  async function guardarTurno() {
    if (!form.paciente_id) { alert('Seleccioná un paciente'); return }
    if (!form.fecha) { alert('Seleccioná una fecha'); return }
    const { error } = await supabase.from('turnos').insert([form])
    if (error) { alert('Error: ' + error.message); return }
    await cargarDatos()
    setShowForm(false)
    setForm({ paciente_id:'', fecha:'', hora:'08:00', motivo:'Consulta general', duracion:60, observaciones:'' })
  }

  async function guardarEdicion() {
    const { error } = await supabase.from('turnos').update({
      fecha: turnoDetalle.fecha,
      hora: turnoDetalle.hora,
      motivo: turnoDetalle.motivo,
      duracion: turnoDetalle.duracion,
      observaciones: turnoDetalle.observaciones,
      estado: turnoDetalle.estado,
    }).eq('id', turnoDetalle.id)
    if (error) { alert('Error: ' + error.message); return }
    await cargarDatos()
    setEditando(false)
    setTurnoDetalle(null)
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('turnos').update({ estado }).eq('id', id)
    await cargarDatos()
  }

  async function eliminarTurno(id) {
    if (!confirm('¿Eliminar este turno?')) return
    await supabase.from('turnos').delete().eq('id', id)
    await cargarDatos()
    setTurnoDetalle(null)
  }

  function abrirDetalle(t) {
    setTurnoDetalle({ ...t })
    setEditando(false)
    setShowForm(false)
  }

  const lunes = getLunes(baseDate)
  const semana = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d
  })
  const hoy = fmtDate(new Date())
  const turnosDia = (fecha) => turnos.filter(t => t.fecha === fecha).sort((a,b) => a.hora.localeCompare(b.hora))
  const estadoColor = { confirmado:'#1D9E75', pendiente:'#EF9F27', cancelado:'#E24B4A' }
  const estadoBg = { confirmado:'#E1F5EE', pendiente:'#FAEEDA', cancelado:'#FCEBEB' }

  return (
    <div style={{ padding:'28px', display:'flex', gap:'24px' }}>

      {/* COLUMNA PRINCIPAL */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>Agenda de turnos</h1>
            <p style={{ color:'#888', fontSize:'13px', margin:'4px 0 0' }}>
              {turnos.filter(t => t.fecha === hoy).length} turnos hoy
            </p>
          </div>
          <button onClick={() => { setShowForm(true); setTurnoDetalle(null) }}
            style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
              borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
            + Nuevo turno
          </button>
        </div>

        {/* FORM NUEVO TURNO */}
        {showForm && (
          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px',
            padding:'22px', marginBottom:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>Nuevo turno</p>
              <button onClick={() => setShowForm(false)}
                style={{ border:'none', background:'none', cursor:'pointer', fontSize:'18px', color:'#888' }}>×</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm({...form, paciente_id: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                  <option value=''>— Seleccioná un paciente —</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
                <input type='date' value={form.fecha}
                  onChange={e => setForm({...form, fecha: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Hora</label>
                <select value={form.hora} onChange={e => setForm({...form, hora: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                  {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Prestación</label>
                <select value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                  {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Duración</label>
                <select value={form.duracion} onChange={e => setForm({...form, duracion: parseInt(e.target.value)})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'3px', gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Observaciones</label>
                <input value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})}
                  placeholder="Indicaciones previas..."
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
              </div>
            </div>
            <button onClick={guardarTurno}
              style={{ width:'100%', padding:'10px', background:'#378ADD', color:'#fff',
                border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
              Confirmar turno
            </button>
          </div>
        )}

        {/* NAVEGACIÓN SEMANA */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
          <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()-7); setBaseDate(d) }}
            style={{ padding:'5px 12px', border:'1px solid #ddd', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>←</button>
          <p style={{ fontWeight:'500', fontSize:'14px', margin:0 }}>
            {lunes.getDate()} {MESES[lunes.getMonth()]} — {semana[5].getDate()} {MESES[semana[5].getMonth()]} {semana[5].getFullYear()}
          </p>
          <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()+7); setBaseDate(d) }}
            style={{ padding:'5px 12px', border:'1px solid #ddd', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>→</button>
          <button onClick={() => setBaseDate(new Date())}
            style={{ padding:'5px 12px', border:'1px solid #ddd', borderRadius:'7px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#666' }}>
            Hoy
          </button>
        </div>

        {/* GRILLA SEMANAL */}
        {loading ? <p style={{ color:'#888' }}>Cargando...</p> : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
            {semana.map(dia => {
              const fecha = fmtDate(dia)
              const esHoy = fecha === hoy
              const turnos_dia = turnosDia(fecha)
              return (
                <div key={fecha} style={{ background: esHoy ? '#EBF4FF' : '#fff',
                  border: esHoy ? '1.5px solid #378ADD' : '1px solid #eee',
                  borderRadius:'12px', padding:'10px', minHeight:'120px' }}>
                  <p style={{ fontSize:'11px', fontWeight:'600', color: esHoy ? '#378ADD' : '#888',
                    margin:'0 0 8px', textAlign:'center' }}>
                    {DIAS[dia.getDay()-1 < 0 ? 5 : dia.getDay()-1]} {dia.getDate()}
                  </p>
                  {turnos_dia.length === 0 ? (
                    <p style={{ fontSize:'10px', color:'#ccc', textAlign:'center', margin:'12px 0' }}>Sin turnos</p>
                  ) : turnos_dia.map(t => (
                    <div key={t.id} onClick={() => abrirDetalle(t)}
                      style={{ background: estadoBg[t.estado] || '#f5f5f5',
                        borderRadius:'7px', padding:'6px 8px', marginBottom:'5px', cursor:'pointer',
                        border: turnoDetalle?.id === t.id ? '1.5px solid #378ADD' : '1.5px solid transparent' }}>
                      <p style={{ fontSize:'10px', fontWeight:'600', margin:0,
                        color: estadoColor[t.estado] || '#333' }}>{t.hora.slice(0,5)}</p>
                      <p style={{ fontSize:'10px', margin:'1px 0 0', color:'#333',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {t.pacientes?.nombre?.split(',')[0] || '—'}
                      </p>
                      <p style={{ fontSize:'9px', margin:'1px 0 0', color:'#888' }}>{t.motivo}</p>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* LISTA HOY */}
        <div style={{ marginTop:'24px' }}>
          <p style={{ fontWeight:'600', fontSize:'15px', marginBottom:'12px' }}>Turnos de hoy</p>
          {turnosDia(hoy).length === 0 ? (
            <p style={{ color:'#888', fontSize:'13px' }}>No hay turnos para hoy.</p>
          ) : turnosDia(hoy).map(t => (
            <div key={t.id} onClick={() => abrirDetalle(t)}
              style={{ background: turnoDetalle?.id === t.id ? '#EBF4FF' : '#fff',
                border: turnoDetalle?.id === t.id ? '1.5px solid #378ADD' : '1px solid #eee',
                borderRadius:'11px', padding:'12px 16px', marginBottom:'8px',
                display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }}>
              <div style={{ width:'44px', textAlign:'center', flexShrink:0 }}>
                <p style={{ fontSize:'13px', fontWeight:'600', margin:0 }}>{t.hora.slice(0,5)}</p>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:'500', fontSize:'13px', margin:0 }}>{t.pacientes?.nombre || '—'}</p>
                <p style={{ fontSize:'11px', color:'#888', margin:'2px 0 0' }}>{t.motivo} · {t.duracion} min</p>
              </div>
              <span style={{ fontSize:'10px', padding:'3px 9px', borderRadius:'20px',
                background: estadoBg[t.estado] || '#f5f5f5', color: estadoColor[t.estado] || '#333' }}>
                {t.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DETALLE */}
      {turnoDetalle && (
        <div style={{ width:'300px', flexShrink:0, background:'#fff', border:'1px solid #eee',
          borderRadius:'14px', padding:'20px', alignSelf:'flex-start', position:'sticky', top:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>Detalle del turno</p>
            <button onClick={() => { setTurnoDetalle(null); setEditando(false) }}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'18px', color:'#888' }}>×</button>
          </div>

          {/* INFO PACIENTE */}
          <div style={{ padding:'10px', background:'#f8f8f6', borderRadius:'9px', marginBottom:'14px' }}>
            <p style={{ fontSize:'13px', fontWeight:'600', margin:'0 0 4px' }}>{turnoDetalle.pacientes?.nombre}</p>
            {turnoDetalle.pacientes?.telefono && (
              <p style={{ fontSize:'12px', color:'#666', margin:'2px 0' }}>📞 {turnoDetalle.pacientes.telefono}</p>
            )}
            {turnoDetalle.pacientes?.obra_social && (
              <p style={{ fontSize:'12px', color:'#666', margin:'2px 0' }}>🏥 {turnoDetalle.pacientes.obra_social}</p>
            )}
          </div>

          {!editando ? (
            <>
              {[
                ['📅 Fecha', turnoDetalle.fecha?.split('-').reverse().join('/')],
                ['🕐 Hora', turnoDetalle.hora?.slice(0,5)],
                ['🦷 Prestación', turnoDetalle.motivo],
                ['⏱ Duración', turnoDetalle.duracion + ' min'],
                ['📋 Observaciones', turnoDetalle.observaciones || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ marginBottom:'10px' }}>
                  <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>{label}</p>
                  <p style={{ fontSize:'13px', color:'#111', margin:0 }}>{val}</p>
                </div>
              ))}

              <div style={{ marginBottom:'14px' }}>
                <p style={{ fontSize:'11px', color:'#888', margin:'0 0 6px' }}>Estado</p>
                <div style={{ display:'flex', gap:'6px' }}>
                  {['pendiente','confirmado','cancelado'].map(est => (
                    <button key={est}
                      onClick={() => { cambiarEstado(turnoDetalle.id, est); setTurnoDetalle({...turnoDetalle, estado: est}) }}
                      style={{ flex:1, padding:'5px 4px', border:'none', borderRadius:'7px', fontSize:'10px',
                        cursor:'pointer', fontWeight:'500',
                        background: turnoDetalle.estado === est ? estadoBg[est] : '#f5f5f5',
                        color: turnoDetalle.estado === est ? estadoColor[est] : '#888',
                        outline: turnoDetalle.estado === est ? `1.5px solid ${estadoColor[est]}` : 'none' }}>
                      {est.charAt(0).toUpperCase() + est.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setEditando(true)}
                  style={{ flex:1, padding:'8px', background:'#378ADD', color:'#fff',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
                  ✏️ Editar
                </button>
                <button onClick={() => eliminarTurno(turnoDetalle.id)}
                  style={{ padding:'8px 12px', background:'#FCEBEB', color:'#E24B4A',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>
                  🗑
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom:'10px' }}>
                <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>Fecha</label>
                <input type='date' value={turnoDetalle.fecha || ''}
                  onChange={e => setTurnoDetalle({...turnoDetalle, fecha: e.target.value})}
                  style={{ width:'100%', padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
              </div>
              {[
                { label:'Hora', key:'hora', opts: HORAS },
                { label:'Prestación', key:'motivo', opts: MOTIVOS },
              ].map(({ label, key, opts }) => (
                <div key={key} style={{ marginBottom:'10px' }}>
                  <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>{label}</label>
                  <select value={turnoDetalle[key]}
                    onChange={e => setTurnoDetalle({...turnoDetalle, [key]: e.target.value})}
                    style={{ width:'100%', padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom:'10px' }}>
                <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>Duración</label>
                <select value={turnoDetalle.duracion}
                  onChange={e => setTurnoDetalle({...turnoDetalle, duracion: parseInt(e.target.value)})}
                  style={{ width:'100%', padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                </select>
              </div>
              <div style={{ marginBottom:'14px' }}>
                <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>Observaciones</label>
                <textarea value={turnoDetalle.observaciones || ''} rows={3}
                  onChange={e => setTurnoDetalle({...turnoDetalle, observaciones: e.target.value})}
                  style={{ width:'100%', padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px',
                    fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={guardarEdicion}
                  style={{ flex:1, padding:'8px', background:'#1D9E75', color:'#fff',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
                  Guardar
                </button>
                <button onClick={() => setEditando(false)}
                  style={{ flex:1, padding:'8px', background:'#f5f5f5', color:'#666',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}