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

function fmtDate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
              No se encontraron pacientes. Usa "+ Nuevo" para crear uno.
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
            Nuevo paciente rapido
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
            <input placeholder='Apellido y nombre *' value={formNuevo.nombre}
              onChange={e => setFormNuevo(f => ({...f, nombre: e.target.value}))}
              style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            <input placeholder='Telefono' value={formNuevo.telefono}
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
  const [notas, setNotas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [baseDate, setBaseDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [showNotaForm, setShowNotaForm] = useState(false)
  const [turnoDetalle, setTurnoDetalle] = useState(null)
  const [notaDetalle, setNotaDetalle] = useState(null)
  const [editando, setEditando] = useState(false)
  const [esSobreturnoForm, setEsSobreturnoForm] = useState(false)
  const [form, setForm] = useState({
    paciente_id:'', fecha:'', hora:'08:00',
    motivo:'Consulta general', duracion:60, observaciones:''
  })
  const [formNota, setFormNota] = useState({
    titulo:'', fecha:'', hora_inicio:'08:00', hora_fin:'09:00'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
    window.addEventListener('recargar-pacientes', cargarDatos)
    return () => window.removeEventListener('recargar-pacientes', cargarDatos)
  }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: n }] = await Promise.all([
      supabase.from('turnos').select('*, pacientes(nombre, telefono, obra_social)').order('fecha').order('hora'),
      supabase.from('pacientes').select('id, nombre, telefono, email, preferencia_notif').order('nombre'),
      supabase.from('notas_agenda').select('*').order('fecha').order('hora_inicio')
    ])
    setTurnos(t || [])
    setPacientes(p || [])
    setNotas(n || [])
    setLoading(false)
  }

  async function enviarEmail({ pacienteId, turno, esRecordatorio, esCancelacion }) {
    const paciente = pacientes.find(p => p.id === pacienteId)
    if (!paciente?.email || !['email', 'ambos'].includes(paciente.preferencia_notif)) return
    try {
      const { data: config } = await supabase.from('configuracion').select('*').limit(1)
      const prof = config?.[0]
      await fetch('/api/enviar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: paciente.email,
          paciente: paciente.nombre,
          fecha: turno.fecha,
          hora: turno.hora.slice ? turno.hora.slice(0,5) : turno.hora,
          motivo: turno.motivo,
          duracion: turno.duracion,
          direccion: prof?.direccion ? `${prof.direccion}, ${prof.localidad || ''}` : '',
          profesional: prof ? `${prof.nombre} ${prof.apellido} - ${prof.especialidad || ''}` : '',
          esRecordatorio: esRecordatorio || false,
          esCancelacion: esCancelacion || false
        })
      })
    } catch (e) {
      console.log('Email no enviado:', e)
    }
  }

  // Turno principal (no sobreturno) en una celda exacta
  const turnoEnCelda = (fecha, hora) =>
    turnos.find(t => t.fecha === fecha && t.hora.slice(0,5) === hora && !t.es_sobreturno)

  // Sobreturno en una celda exacta
  const sobreturnoEnCelda = (fecha, hora) =>
    turnos.find(t => t.fecha === fecha && t.hora.slice(0,5) === hora && t.es_sobreturno)

  // Celda bloqueada por extension de duracion (solo turnos principales)
  const celdaBloqueada = (fecha, hora) => {
    return turnos.find(t => {
      if (t.fecha !== fecha) return false
      if (t.es_sobreturno) return false
      const [th, tm] = t.hora.slice(0,5).split(':').map(Number)
      const [hh, hm] = hora.split(':').map(Number)
      const inicioTurno = th * 60 + tm
      const inicioCelda = hh * 60 + hm
      const finTurno = inicioTurno + (t.duracion || 60)
      return inicioCelda > inicioTurno && inicioCelda < finTurno
    })
  }

  function notaEnCelda(fecha, hora) {
    return notas.find(n => {
      if (n.fecha !== fecha) return false
      return n.hora_inicio.slice(0,5) === hora
    })
  }

  function celdaBloqueadaNota(fecha, hora) {
    return notas.find(n => {
      if (n.fecha !== fecha) return false
      const [nh, nm] = n.hora_inicio.slice(0,5).split(':').map(Number)
      const [hh, hm] = hora.split(':').map(Number)
      const [fh, fm] = n.hora_fin.slice(0,5).split(':').map(Number)
      const inicioNota = nh * 60 + nm
      const finNota = fh * 60 + fm
      const inicioCelda = hh * 60 + hm
      return inicioCelda > inicioNota && inicioCelda < finNota
    })
  }

  async function guardarTurno(confirmar) {
    if (!form.paciente_id) { alert('Selecciona un paciente'); return }
    if (!form.fecha) { alert('Selecciona una fecha'); return }

    if (!esSobreturnoForm) {
      // Solo verificar conflicto si NO es sobreturno
      const [fh, fm] = form.hora.split(':').map(Number)
      const inicioNuevo = fh * 60 + fm
      const finNuevo = inicioNuevo + (form.duracion || 60)

      const hayConflicto = turnos.some(t => {
        if (t.fecha !== form.fecha) return false
        if (t.es_sobreturno) return false
        const [th, tm] = t.hora.slice(0,5).split(':').map(Number)
        const inicioExistente = th * 60 + tm
        const finExistente = inicioExistente + (t.duracion || 60)
        return inicioNuevo < finExistente && finNuevo > inicioExistente
      })

      if (hayConflicto) {
        alert('Ya hay un turno en ese horario. Para agregar un sobreturno, hace clic en la celda ocupada.')
        return
      }
    }

    const turnoAInsertar = {
      ...form,
      estado: confirmar ? 'confirmado' : 'pendiente',
      es_sobreturno: esSobreturnoForm
    }

    const { error } = await supabase.from('turnos').insert([turnoAInsertar])
    if (error) { alert('Error: ' + error.message); return }

    if (confirmar) {
      await enviarEmail({ pacienteId: form.paciente_id, turno: form, esRecordatorio: false, esCancelacion: false })
    }

    await cargarDatos()
    setShowForm(false)
    setEsSobreturnoForm(false)
    setForm({ paciente_id:'', fecha:'', hora:'08:00', motivo:'Consulta general', duracion:60, observaciones:'' })
  }

  async function guardarNota() {
    if (!formNota.titulo.trim()) { alert('El titulo es obligatorio'); return }
    if (!formNota.fecha) { alert('Selecciona una fecha'); return }
    if (!formNota.hora_inicio || !formNota.hora_fin) { alert('Selecciona hora inicio y fin'); return }
    if (formNota.hora_fin <= formNota.hora_inicio) { alert('La hora fin debe ser mayor a la hora inicio'); return }

    const { error } = await supabase.from('notas_agenda').insert([formNota])
    if (error) { alert('Error: ' + error.message); return }

    await cargarDatos()
    setShowNotaForm(false)
    setFormNota({ titulo:'', fecha:'', hora_inicio:'08:00', hora_fin:'09:00' })
  }

  async function eliminarNota(id) {
    if (!confirm('Eliminar esta nota?')) return
    await supabase.from('notas_agenda').delete().eq('id', id)
    await cargarDatos()
    setNotaDetalle(null)
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

    // Solo enviar email al CANCELAR, no al confirmar
    if (estado === 'cancelado') {
      const turno = turnos.find(t => t.id === id)
      await enviarEmail({ pacienteId: turno?.paciente_id, turno: { ...turno, hora: turno.hora.slice(0,5) }, esRecordatorio: false, esCancelacion: true })
    }

    await cargarDatos()
  }

  async function eliminarTurno(id) {
    if (!confirm('Eliminar este turno?')) return
    await supabase.from('turnos').delete().eq('id', id)
    await cargarDatos()
    setTurnoDetalle(null)
  }

  function abrirDetalle(t) {
    setTurnoDetalle({ ...t })
    setNotaDetalle(null)
    setEditando(false)
    setShowForm(false)
    setShowNotaForm(false)
  }

  function abrirDetalleNota(n) {
    setNotaDetalle({ ...n })
    setTurnoDetalle(null)
    setShowForm(false)
    setShowNotaForm(false)
  }

  function abrirFormEnCelda(fecha, hora) {
    setTurnoDetalle(null)
    setNotaDetalle(null)
    setEsSobreturnoForm(false)
    setForm({ paciente_id:'', fecha, hora, motivo:'Consulta general', duracion:60, observaciones:'' })
    setShowForm(true)
    setShowNotaForm(false)
  }

  // Click en celda ocupada por turno principal -> abrir sobreturno
  function abrirSobreturnoEnCelda(fecha, hora) {
    setTurnoDetalle(null)
    setNotaDetalle(null)
    setEsSobreturnoForm(true)
    setForm({ paciente_id:'', fecha, hora, motivo:'Consulta general', duracion:60, observaciones:'' })
    setShowForm(true)
    setShowNotaForm(false)
  }

  const lunes = getLunes(baseDate)
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d
  })
  const hoy = fmtDate(new Date())
  const horaActual = new Date().toTimeString().slice(0,5)

  const estadoColor = { confirmado:'#1D9E75', pendiente:'#EF9F27', cancelado:'#E24B4A' }
  const estadoBg = { confirmado:'#E1F5EE', pendiente:'#FAEEDA', cancelado:'#FCEBEB' }

  const panelAbierto = showForm || showNotaForm || turnoDetalle || notaDetalle

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        <div style={{ padding:'16px 20px', borderBottom:'1px solid #ddd', background:'#fff',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()-7); setBaseDate(d) }}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>
              &#8592;
            </button>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>
              {lunes.getDate()} {MESES[lunes.getMonth()]} &mdash; {semana[6].getDate()} {MESES[semana[6].getMonth()]} {semana[6].getFullYear()}
            </p>
            <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate()+7); setBaseDate(d) }}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer' }}>
              &#8594;
            </button>
            <button onClick={() => setBaseDate(new Date())}
              style={{ padding:'5px 12px', border:'1px solid #ccc', borderRadius:'7px', background:'#fff', cursor:'pointer', fontSize:'12px', color:'#666' }}>
              Hoy
            </button>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <p style={{ fontSize:'12px', color:'#888', margin:0 }}>Clic en celda vacia para agregar turno</p>
            <button onClick={() => { setShowNotaForm(true); setShowForm(false); setTurnoDetalle(null); setNotaDetalle(null) }}
              style={{ padding:'7px 16px', background:'#7C3AED', color:'#fff', border:'none',
                borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
              + Nueva nota
            </button>
            <button onClick={() => { setShowForm(true); setShowNotaForm(false); setTurnoDetalle(null); setNotaDetalle(null); setEsSobreturnoForm(false) }}
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
                        const sobreturno = sobreturnoEnCelda(fecha, hora)
                        const bloqueada = celdaBloqueada(fecha, hora)
                        const nota = notaEnCelda(fecha, hora)
                        const bloqueadaNota = celdaBloqueadaNota(fecha, hora)
                        const bgCelda = esHoraActual && esHoy2 ? '#BBDEFB' :
                                        esHoy2 ? '#E3F2FD' :
                                        esMediaHora ? '#F0F0F0' : '#FAFAFA'
                        // La celda se puede clickear si no tiene nota/bloqueadaNota
                        // Si tiene turno -> abrir sobreturno; si vacia -> nuevo turno
                        const ocupadaNota = nota || bloqueadaNota
                        const esBloqueadaSoloTurno = (turno || bloqueada) && !ocupadaNota

                        return (
                          <td key={fecha}
                            onClick={() => {
                              if (ocupadaNota) return
                              if (turno) {
                                abrirSobreturnoEnCelda(fecha, hora)
                              } else if (!bloqueada) {
                                abrirFormEnCelda(fecha, hora)
                              }
                            }}
                            style={{
                              border:'1px solid #ddd',
                              borderTop: esMediaHora ? '1px dashed #D0D0D0' : '1px solid #ddd',
                              verticalAlign:'top',
                              background: bloqueada && !turno
                                ? (estadoBg[bloqueada.estado] || '#f5f5f5')
                                : bloqueadaNota ? '#F3F0FF'
                                : bgCelda,
                              cursor: ocupadaNota ? 'not-allowed' : (bloqueada && !turno) ? 'not-allowed' : 'pointer',
                              padding:'1px', position:'relative'
                            }}
                            onMouseEnter={e => {
                              if (!ocupadaNota && !bloqueada) e.currentTarget.style.background = '#B3D4F0'
                            }}
                            onMouseLeave={e => {
                              if (!ocupadaNota && !bloqueada) e.currentTarget.style.background = bgCelda
                            }}>

                            {/* Turno principal */}
                            {turno && (
                              <div>
                                <div onClick={e => { e.stopPropagation(); abrirDetalle(turno) }}
                                  style={{
                                    background: estadoBg[turno.estado] || '#f5f5f5',
                                    borderLeft: `3px solid ${estadoColor[turno.estado] || '#ccc'}`,
                                    borderRadius:'3px', padding:'2px 5px',
                                    cursor:'pointer', overflow:'hidden'
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

                                {/* Sobreturno apilado debajo del turno principal */}
                                {sobreturno && (
                                  <div onClick={e => { e.stopPropagation(); abrirDetalle(sobreturno) }}
                                    style={{
                                      background:'#FEF3C7',
                                      borderLeft:'3px solid #D97706',
                                      borderRadius:'3px', padding:'2px 5px',
                                      cursor:'pointer', overflow:'hidden',
                                      marginTop:'1px'
                                    }}>
                                    <p style={{ fontSize:'10px', fontWeight:'600', margin:0,
                                      color:'#D97706',
                                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                      ST - {sobreturno.pacientes?.nombre?.split(',')[0] || '—'}
                                    </p>
                                    <p style={{ fontSize:'9px', margin:0, color:'#92400E',
                                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                      {sobreturno.motivo}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Celda bloqueada por duracion (solo cuando no hay turno en esa celda) */}
                            {bloqueada && !turno && (
                              <div onClick={e => { e.stopPropagation(); abrirDetalle(bloqueada) }}
                                style={{
                                  borderLeft: `3px solid ${estadoColor[bloqueada.estado] || '#ccc'}`,
                                  height:'100%', cursor:'pointer',
                                  background: estadoBg[bloqueada.estado] || '#f5f5f5',
                                }} />
                            )}

                            {/* Nota */}
                            {nota && (
                              <div onClick={e => { e.stopPropagation(); abrirDetalleNota(nota) }}
                                style={{
                                  background:'#EDE9FE',
                                  borderLeft:'3px solid #7C3AED',
                                  borderRadius:'3px', padding:'2px 5px',
                                  cursor:'pointer', height:'100%', overflow:'hidden'
                                }}>
                                <p style={{ fontSize:'10px', fontWeight:'600', margin:0, color:'#7C3AED',
                                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                  NOTA
                                </p>
                                <p style={{ fontSize:'9px', margin:0, color:'#555',
                                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                                  {nota.titulo}
                                </p>
                              </div>
                            )}

                            {bloqueadaNota && !nota && (
                              <div onClick={e => { e.stopPropagation(); abrirDetalleNota(bloqueadaNota) }}
                                style={{
                                  borderLeft:'3px solid #7C3AED',
                                  height:'100%', cursor:'pointer',
                                  background:'#EDE9FE',
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

      {panelAbierto && (
        <div style={{ width:'320px', flexShrink:0, background:'#fff', borderLeft:'1px solid #ddd',
          overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #eee',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontWeight:'600', fontSize:'14px', margin:0 }}>
              {showForm
                ? (esSobreturnoForm ? 'Nuevo sobreturno' : 'Nuevo turno')
                : showNotaForm ? 'Nueva nota'
                : notaDetalle ? 'Detalle de nota'
                : turnoDetalle?.es_sobreturno ? 'Detalle del sobreturno'
                : 'Detalle del turno'}
            </p>
            <button onClick={() => { setShowForm(false); setShowNotaForm(false); setTurnoDetalle(null); setNotaDetalle(null); setEditando(false); setEsSobreturnoForm(false) }}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'20px', color:'#888' }}>
              &#215;
            </button>
          </div>

          <div style={{ padding:'16px 20px', flex:1 }}>

            {/* FORMULARIO NUEVO TURNO / SOBRETURNO */}
            {showForm && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {esSobreturnoForm && (
                  <div style={{ background:'#FEF3C7', border:'1px solid #D97706', borderRadius:'8px',
                    padding:'8px 12px', fontSize:'12px', color:'#92400E' }}>
                    Sobreturno: se agregara sobre el turno existente en ese horario.
                  </div>
                )}
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
                  <label style={{ fontSize:'11px', color:'#666' }}>Prestacion</label>
                  <select value={form.motivo} onChange={e => setForm(f => ({...f, motivo: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Duracion</label>
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
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'4px' }}>
                  <button onClick={() => guardarTurno(true)}
                    style={{ width:'100%', padding:'10px',
                      background: esSobreturnoForm ? '#D97706' : '#378ADD',
                      color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
                    {esSobreturnoForm ? 'Confirmar sobreturno' : 'Confirmar turno'}
                  </button>
                  <button onClick={() => guardarTurno(false)}
                    style={{ width:'100%', padding:'10px', background:'#fff', color:'#EF9F27',
                      border:'2px solid #EF9F27', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
                    {esSobreturnoForm ? 'Sobreturno pendiente' : 'Turno pendiente'}
                  </button>
                </div>
              </div>
            )}

            {/* FORMULARIO NUEVA NOTA */}
            {showNotaForm && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Titulo</label>
                  <input value={formNota.titulo} onChange={e => setFormNota(f => ({...f, titulo: e.target.value}))}
                    placeholder="Ej: Reunion, Cierre, Capacitacion..."
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
                  <input type='date' value={formNota.fecha}
                    onChange={e => setFormNota(f => ({...f, fecha: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Hora inicio</label>
                  <select value={formNota.hora_inicio} onChange={e => setFormNota(f => ({...f, hora_inicio: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                  <label style={{ fontSize:'11px', color:'#666' }}>Hora fin</label>
                  <select value={formNota.hora_fin} onChange={e => setFormNota(f => ({...f, hora_fin: e.target.value}))}
                    style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                    {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <button onClick={guardarNota}
                  style={{ width:'100%', padding:'10px', background:'#7C3AED', color:'#fff',
                    border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer', marginTop:'4px' }}>
                  Guardar nota
                </button>
              </div>
            )}

            {/* DETALLE DE NOTA */}
            {notaDetalle && !showForm && !showNotaForm && (
              <>
                <div style={{ padding:'10px', background:'#F3F0FF', borderRadius:'9px', marginBottom:'14px',
                  borderLeft:'3px solid #7C3AED' }}>
                  <p style={{ fontSize:'13px', fontWeight:'600', margin:0, color:'#7C3AED' }}>NOTA</p>
                  <p style={{ fontSize:'15px', fontWeight:'600', margin:'4px 0 0', color:'#111' }}>{notaDetalle.titulo}</p>
                </div>
                <div style={{ marginBottom:'10px' }}>
                  <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Fecha</p>
                  <p style={{ fontSize:'13px', color:'#111', margin:0 }}>{notaDetalle.fecha?.split('-').reverse().join('/')}</p>
                </div>
                <div style={{ marginBottom:'10px' }}>
                  <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Horario</p>
                  <p style={{ fontSize:'13px', color:'#111', margin:0 }}>{notaDetalle.hora_inicio?.slice(0,5)} - {notaDetalle.hora_fin?.slice(0,5)} hs</p>
                </div>
                <button onClick={() => eliminarNota(notaDetalle.id)}
                  style={{ width:'100%', padding:'8px', background:'#FCEBEB', color:'#E24B4A',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', marginTop:'8px' }}>
                  Eliminar nota
                </button>
              </>
            )}

            {/* DETALLE DE TURNO */}
            {turnoDetalle && !showForm && !showNotaForm && (
              <>
                <div style={{ padding:'10px',
                  background: turnoDetalle.es_sobreturno ? '#FEF3C7' : '#f8f8f6',
                  borderLeft: turnoDetalle.es_sobreturno ? '3px solid #D97706' : 'none',
                  borderRadius:'9px', marginBottom:'14px' }}>
                  {turnoDetalle.es_sobreturno && (
                    <p style={{ fontSize:'11px', fontWeight:'700', color:'#D97706', margin:'0 0 4px' }}>SOBRETURNO</p>
                  )}
                  <p style={{ fontSize:'13px', fontWeight:'600', margin:'0 0 4px' }}>{turnoDetalle.pacientes?.nombre}</p>
                  {turnoDetalle.pacientes?.telefono && (
                    <p style={{ fontSize:'12px', color:'#666', margin:'2px 0' }}>Tel: {turnoDetalle.pacientes.telefono}</p>
                  )}
                  {turnoDetalle.pacientes?.obra_social && (
                    <p style={{ fontSize:'12px', color:'#666', margin:'2px 0' }}>OS: {turnoDetalle.pacientes.obra_social}</p>
                  )}
                </div>

                {!editando ? (
                  <>
                    {[
                      ['Fecha', turnoDetalle.fecha?.split('-').reverse().join('/')],
                      ['Hora', turnoDetalle.hora?.slice(0,5)],
                      ['Prestacion', turnoDetalle.motivo],
                      ['Duracion', turnoDetalle.duracion + ' min'],
                      ['Observaciones', turnoDetalle.observaciones || '—'],
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
                            onClick={() => {
                              cambiarEstado(turnoDetalle.id, est)
                              setTurnoDetalle({...turnoDetalle, estado: est})
                            }}
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
                        Editar
                      </button>
                      <button onClick={() => eliminarTurno(turnoDetalle.id)}
                        style={{ padding:'8px 12px', background:'#FCEBEB', color:'#E24B4A',
                          border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>
                        Eliminar
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
                      { label:'Prestacion', key:'motivo', opts: MOTIVOS },
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
                      <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'3px' }}>Duracion</label>
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
