import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const HORAS = []
for (let h = 8; h <= 21; h++) {
  HORAS.push(`${String(h).padStart(2,'0')}:00`)
  if (h < 21) HORAS.push(`${String(h).padStart(2,'00')}:30`)
}

const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
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

function BuscadorPaciente({ pacientes, value, onChange }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [formNuevo, setFormNuevo] = useState({ nombre:'', telefono:'', email:'' })
  const [guardando, setGuardando] = useState(false)
  const ref = useRef()

  const pacienteActual = pacientes.find(p => p.id === value)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtrados = query.trim()
    ? pacientes.filter(p =>
        p.nombre.toLowerCase().includes(query.toLowerCase()) ||
        (p.telefono || '').includes(query)
      )
    : pacientes

  function seleccionar(p) {
    onChange(p.id)
    setQuery('')
    setAbierto(false)
    setMostrarNuevo(false)
  }

  async function crearPaciente() {
    if (!formNuevo.nombre.trim()) { alert('El nombre es obligatorio'); return }
    setGuardando(true)
    const { data, error } = await supabase.from('pacientes').insert([{
      nombre: formNuevo.nombre,
      telefono: formNuevo.telefono || null,
      email: formNuevo.email || null,
    }]).select()
    setGuardando(false)
    if (error) { alert('Error: ' + error.message); return }
    onChange(data[0].id)
    setMostrarNuevo(false)
    setAbierto(false)
    setQuery('')
    window.dispatchEvent(new Event('recargar-pacientes'))
  }

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>Paciente</label>
      <div style={{ display:'flex', gap:'6px' }}>
        <input
          value={abierto ? query : (pacienteActual?.nombre || '')}
          placeholder='Buscar paciente...'
          onFocus={() => { setAbierto(true); setQuery('') }}
          onChange={e => { setQuery(e.target.value); setAbierto(true) }}
          style={{ flex:1, padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px',
            fontSize:'13px', color:'#111' }} />
        <button onClick={() => { setMostrarNuevo(!mostrarNuevo); setAbierto(false) }}
          style={{ padding:'6px 10px', background:'#E1F5EE', border:'1px solid #9FE1CB',
            borderRadius:'7px', fontSize:'11px', color:'#085041', cursor:'pointer',
            fontWeight:'500', whiteSpace:'nowrap' }}>
          + Nuevo
        </button>
      </div>

      {abierto && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff',
          border:'1px solid #ddd', borderRadius:'8px', zIndex:100, maxHeight:'180px',
          overflowY:'auto', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', marginTop:'2px' }}>
          {filtrados.length === 0 ? (
            <p style={{ padding:'10px 12px', fontSize:'12px', color:'#888', margin:0 }}>
              No se encontraron pacientes. Usá "+ Nuevo" para crear uno.
            </p>
          ) : filtrados.map(p => (
            <div key={p.id} onClick={() => seleccionar(p)}
              style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid #f5f5f5',
                background: value === p.id ? '#EBF4FF' : '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background='#f8f8f6'}
              onMouseLeave={e => e.currentTarget.style.background= value === p.id ? '#EBF4FF' : '#fff'}>
              <p style={{ fontSize:'13px', fontWeight:'500', margin:0, color:'#111' }}>{p.nombre}</p>
              {p.telefono && <p style={{ fontSize:'11px', color:'#888', margin:0 }}>{p.telefono}</p>}
            </div>
          ))}
        </div>
      )}

      {mostrarNuevo && (
        <div style={{ marginTop:'8px', background:'#f8f8f6', borderRadius:'10px',
          padding:'12px', border:'1px solid #eee' }}>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'#333', margin:'0 0 8px' }}>
            Nuevo paciente rápido
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
            <input placeholder='Apellido y nombre *' value={formNuevo.nombre}
              onChange={e => setFormNuevo(f => ({...f, nombre: e.target.value}))}
              style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            <input placeholder='Teléfono' value={formNuevo.telefono}
              onChange={e => setFormNuevo(f => ({...f, telefono: e.target.value}))}
              style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            <input placeholder='Email' value={formNuevo.email}
              onChange={e => setFormNuevo(f => ({...f, email: e.target.value}))}
              style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
          </div>
          <div style={{ display:'flex', gap:'6px', marginTop:'8px' }}>
            <button onClick={crearPaciente} disabled={guardando}
              style={{ flex:1, padding:'7px', background: guardando ? '#aaa' : '#1D9E75',
                color:'#fff', border:'none', borderRadius:'7px', fontSize:'12px',
                cursor: guardando ? 'not-allowed' : 'pointer', fontWeight:'500' }}>
              {guardando ? 'Guardando...' : 'Crear y seleccionar'}
            </button>
            <button onClick={() => setMostrarNuevo(false)}
              style={{ padding:'7px 12px', background:'#fff', border:'1px solid #ddd',
                borderRadius:'7px', fontSize:'12px', cursor:'pointer', color:'#666' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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

  useEffect(() => {
    cargarDatos()
    window.addEventListener('recargar-pacientes', cargarDatos)
    return () => window.removeEventListener('recargar-pacientes', cargarDatos)
  }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('turnos').select('*, pacientes(nombre, telefono, obra_social)').order('fecha').order('hora'),
      supabase.from('pacientes').select('id, nombre, telefono').order('nombre')
    ])
    setTurnos(t || [])
    setPacientes(p || [])
    setLoading(false)
  }

  async function guardarTurno() {
  if (!form.paciente_id) { alert('Seleccioná un paciente'); return }
  if (!form.fecha) { alert('Seleccioná una fecha'); return }

  const [fh, fm] = form.hora.split(':').map(Number)
  const inicioNuevo = fh * 60 + fm
  const finNuevo = inicioNuevo + (form.duracion || 60)

  const hayConflicto = turnos.some(t => {
    if (t.fecha !== form.fecha) return false
    const [th, tm] = t.hora.slice(0,5).split(':').map(Number)
    const inicioExistente = th * 60 + tm
    const finExistente = inicioExistente + (t.duracion || 60)
    return inicioNuevo < finExistente && finNuevo > inicioExistente
  })

  if (hayConflicto) {
    alert('⚠️ Ya hay un turno en ese horario. Por favor elegí otro horario.')
    return
  }

  const { error } = await supabase.from('turnos').insert([form])
  if (error) { alert('Error: ' + error.message); return }

  // Enviar email de confirmación si el paciente tiene email
  const paciente = pacientes.find(p => p.id === form.paciente_id)
  if (paciente?.email) {
    try {
      // Cargar datos del profesional
      const { data: config } = await supabase.from('configuracion').select('*').limit(1)
      const prof = config?.[0]
      await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: paciente.email,
          paciente: paciente.nombre,
          fecha: form.fecha,
          hora: form.hora,
          motivo: form.motivo,
          duracion: form.duracion,
          direccion: prof?.direccion ? `${prof.direccion}, ${prof.localidad || ''}` : '',
          profesional: prof ? `${prof.nombre} ${prof.apellido} — ${prof.especialidad || ''}` : '',
          esRecordatorio: false
        })
      })
    } catch (e) {
      console.log('Email no enviado:', e)
    }
  }

  await cargarDatos()
  setShowForm(false)
  setForm({ paciente_id:'', fecha:'', hora:'08:00', motivo:'Consulta general', duracion:60, observaciones:'' })
}

  async function guardarEdicion() {
    const { error } = await supabase.from('turnos').update({
      fecha: turnoDetalle.fecha, hora: turnoDetalle.hora,
      motivo: turnoDetalle.motivo, duracion: turnoDetalle.duracion,
      observaciones: turnoDetalle.observaciones, estado: turnoDetalle.estado,
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

  function abrirFormEnCelda(fecha, hora) {
    setTurnoDetalle(null)
    setForm({ paciente_id:'', fecha, hora, motivo:'Consulta general', duracion:60, observaciones:'' })
    setShowForm(true)
  }

  const lunes = getLunes(baseDate)
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d
  })
  const hoy = fmtDate(new Date())
  const horaActual = new Date().toTimeString().slice(0,5)

  const turnoEnCelda = (fecha, hora) =>
    turnos.find(t => t.fecha === fecha && t.hora.slice(0,5) === hora)

  const celdaBloqueada = (fecha, hora) => {
    return turnos.find(t => {
      if (t.fecha !== fecha) return false
      const [th, tm] = t.hora.slice(0,5).split(':').map(Number)
      const [hh, hm] = hora.split(':').map(Number)
      const inicioTurno = th * 60 + tm
      const inicioCelda = hh * 60 + hm
      const finTurno = inicioTurno + (t.duracion || 60)
      return inicioCelda > inicioTurno && inicioCelda < finTurno
    })
  }

  const estadoColor = { confirmado:'#1D9E75', pendiente:'#EF9F27', cancelado:'#E24B4A' }
  const estadoBg = { confirmado:'#E1F5EE', pendiente:'#FAEEDA', cancelado:'#FCEBEB' }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        <div style={{ padding:'16px 20px', borderBottom:'1px solid #ddd', background:'#fff',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()-7); setBaseDate(d) }}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>←</button>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>
              {lunes.getDate()} {MESES[lunes.getMonth()]} — {semana[6].getDate()} {MESES[semana[6].getMonth()]} {semana[6].getFullYear()}
            </p>
            <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()+7); setBaseDate(d) }}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>→</button>
            <button onClick={() => setBaseDate(new Date())}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#666' }}>
              Hoy
            </button>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <p style={{ fontSize:'12px', color:'#888', margin:0 }}>Clic en celda vacía para agregar turno</p>
            <button onClick={() => { setShowForm(true); setTurnoDetalle(null) }}
              style={{ padding:'7px 16px', background:'#378ADD', color:'#fff', border:'none',
                borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
              + Nuevo turno
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
          {loading ? <p style={{ padding:'20px', color:'#888' }}>Cargando...</p> : (
            <table style={{ borderCollapse:'collapse', minWidth:'900px', width:'100%' }}>
              <thead style={{ position:'sticky', top:0, zIndex:10 }}>
                <tr>
                  <th style={{ width:'52px', background:'#DCDCDC', border:'1px solid #ccc',
                    padding:'8px 4px', fontSize:'11px', color:'#555' }}>Hora</th>
                  {semana.map(dia => {
                    const fecha = fmtDate(dia)
                    const esHoy = fecha === hoy
                    const dayIdx = dia.getDay() === 0 ? 6 : dia.getDay() - 1
                    return (
                      <th key={fecha} style={{
                        background: esHoy ? '#BBDEFB' : '#EBEBEB',
                        border:'1px solid #ccc', padding:'8px 4px',
                        fontSize:'12px', fontWeight:'600',
                        color: esHoy ? '#1565C0' : '#444',
                        textAlign:'center', minWidth:'120px'
                      }}>
                        <div>{DIAS_SEMANA[dayIdx]}</div>
                        <div style={{ fontSize:'15px', fontWeight:'700' }}>{dia.getDate()}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {HORAS.map(hora => {
                  const esMediaHora = hora.endsWith(':30')
                  const horaIdx = HORAS.indexOf(hora)
                  const horaFin = HORAS[horaIdx + 1] || '21:30'
                  const esHoraActual = horaActual >= hora && horaActual < horaFin
                  return (
                    <tr key={hora}>
                      <td style={{
                        padding:'0 6px', fontSize:'10px',
                        color: esHoraActual ? '#1565C0' : '#666',
                        fontWeight: esHoraActual ? '700' : '400',
                        background: esMediaHora ? '#E8E8E8' : '#DCDCDC',
                        border:'1px solid #ccc', textAlign:'right',
                        whiteSpace:'nowrap', verticalAlign:'top', paddingTop:'3px', width:'52px'
                      }}>
                        {!esMediaHora ? hora : '· · ·'}
                      </td>
                      {semana.map(dia => {
                        const fecha = fmtDate(dia)
                        const esHoy2 = fecha === hoy
                        const turno = turnoEnCelda(fecha, hora)
                        const bloqueada = celdaBloqueada(fecha, hora)
                        const bgCelda = esHoraActual && esHoy2 ? '#BBDEFB' :
                                        esHoy2 ? '#E3F2FD' :
                                        esMediaHora ? '#F0F0F0' : '#FAFAFA'
                        return (
                          <td key={fecha}
                            onClick={() => !turno && !bloqueada && abrirFormEnCelda(fecha, hora)}
                            style={{
                              border:'1px solid #ddd',
                              borderTop: esMediaHora ? '1px dashed #D0D0D0' : '1px solid #ddd',
                              height:'28px', verticalAlign:'top',
                              background: bloqueada
                                ? (estadoBg[bloqueada.estado] || '#f5f5f5')
                                : bgCelda,
                              cursor: turno || bloqueada ? 'not-allowed' : 'pointer',
                              padding:'1px', position:'relative'
                            }}
                            onMouseEnter={e => { if (!turno && !bloqueada) e.currentTarget.style.background = '#B3D4F0' }}
                            onMouseLeave={e => { if (!turno && !bloqueada) e.currentTarget.style.background = bgCelda }}>
                            {turno && (
                <div onClick={() => abrirDetalle(turno)}
                  style={{
                    background: estadoBg[turno.estado] || '#f5f5f5',
                    borderLeft: `3px solid ${estadoColor[turno.estado] || '#ccc'}`,
                    borderRadius:'3px', padding:'2px 5px',
                    cursor:'pointer', height:'100%', overflow:'hidden'
                  }}>
                  <p style={{ fontSize:'10px', fontWeight:'600', margin:0,
                    color: estadoColor[turno.estado],
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {turno.pacientes?.nombre?.split(',')[0] || '—'}
                  </p>
                  <p style={{ fontSize:'9px', margin:0, color:'#555',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {turno.motivo}
                  </p>
                </div>
              )}
              {bloqueada && !turno && (
                <div onClick={() => abrirDetalle(bloqueada)}
                  style={{
                    borderLeft: `3px solid ${estadoColor[bloqueada.estado] || '#ccc'}`,
                    height:'100%', cursor:'pointer',
                    background: estadoBg[bloqueada.estado] || '#f5f5f5',
                  }} />
              )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(showForm || turnoDetalle) && (
        <div style={{ width:'320px', flexShrink:0, background:'#fff', borderLeft:'1px solid #ddd',
          overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #eee',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:'600', fontSize:'14px', margin:0 }}>
              {showForm ? 'Nuevo turno' : 'Detalle del turno'}
            </p>
            <button onClick={() => { setShowForm(false); setTurnoDetalle(null); setEditando(false) }}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'20px', color:'#888' }}>×</button>
          </div>

          <div style={{ padding:'16px 20px', flex:1 }}>
            {showForm && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <BuscadorPaciente
                  pacientes={pacientes}
                  value={form.paciente_id}
                  onChange={id => setForm(f => ({...f, paciente_id: id}))}
                />
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
                  <input type='date' value={form.fecha}
                    onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Hora</label>
                  <select value={form.hora} onChange={e => setForm(f => ({...f, hora: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Prestación</label>
                  <select value={form.motivo} onChange={e => setForm(f => ({...f, motivo: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Duración</label>
                  <select value={form.duracion} onChange={e => setForm(f => ({...f, duracion: parseInt(e.target.value)}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Observaciones</label>
                  <input value={form.observaciones} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))}
                    placeholder="Indicaciones previas..."
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
                </div>
                <button onClick={guardarTurno}
                  style={{ width:'100%', padding:'10px', background:'#378ADD', color:'#fff',
                    border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer', marginTop:'4px' }}>
                  Confirmar turno
                </button>
              </div>
            )}

            {turnoDetalle && !showForm && (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}