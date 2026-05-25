import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ANTECEDENTES = ['Diabetes','Hipertensión','Alergia a anestesia','Cardiopatía','Anticoagulantes','Embarazo']

const FORM_VACIO = {
  nombre:'', fecha_nacimiento:'', telefono:'', email:'',
  whatsapp:'', obra_social:'', nro_afiliado:'', domicilio:'',
  localidad:'', ocupacion:'', preferencia_notif:'whatsapp',
  antecedentes:{}, observaciones:''
}

function FormPaciente({ titulo, inicial, onGuardar, onVolver }) {
  const [form, setForm] = useState(inicial || FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const campo = (label, key, type='text', placeholder='') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[key] || ''}
        onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', color:'#111' }} />
    </div>
  )

  async function handleGuardar() {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return }
    if (!form.fecha_nacimiento) { alert('La fecha de nacimiento es obligatoria'); return }
    if (!form.telefono.trim()) { alert('El teléfono es obligatorio'); return }
    setGuardando(true)
    await onGuardar(form)
    setGuardando(false)
  }

  return (
    <div style={{ padding:'32px', maxWidth:'700px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <button onClick={onVolver}
          style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px', background:'#fff', cursor:'pointer', fontSize:'13px' }}>
          ← Volver
        </button>
        <h1 style={{ fontSize:'20px', fontWeight:'600', margin:0 }}>{titulo}</h1>
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', border:'1px solid #eee' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
          Datos personales
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          {campo('Apellido y nombre *', 'nombre', 'text', 'González, María')}
          {campo('Fecha de nacimiento *', 'fecha_nacimiento', 'date')}
          {campo('Teléfono *', 'telefono', 'tel', '3442-555555')}
          {campo('Email', 'email', 'email', 'paciente@email.com')}
          {campo('WhatsApp', 'whatsapp', 'tel', '3442-555555')}
          {campo('Obra social', 'obra_social', 'text', 'OSDE / IOMA / Particular')}
          {campo('N° de afiliado', 'nro_afiliado')}
          {campo('Ocupación', 'ocupacion')}
          {campo('Domicilio', 'domicilio', 'text', 'Av. Colón 1234')}
          {campo('Localidad', 'localidad', 'text', 'Concepción del Uruguay')}
        </div>

        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
          Preferencia de notificación
        </p>
        <div style={{ display:'flex', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>
          {['whatsapp','email','ambos','ninguno'].map(op => (
            <label key={op} style={{ display:'flex', gap:'5px', alignItems:'center', fontSize:'13px', cursor:'pointer', color:'#333' }}>
              <input type='radio' name='notif' value={op}
                checked={form.preferencia_notif === op}
                onChange={() => setForm(f => ({...f, preferencia_notif: op}))} />
              {op.charAt(0).toUpperCase() + op.slice(1)}
            </label>
          ))}
        </div>

        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
          Antecedentes médicos
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
          {ANTECEDENTES.map(a => (
            <label key={a} style={{ display:'flex', gap:'6px', alignItems:'center', fontSize:'12px', cursor:'pointer', color:'#333' }}>
              <input type='checkbox'
                checked={!!form.antecedentes[a]}
                onChange={e => setForm(f => ({...f, antecedentes: {...f.antecedentes, [a]: e.target.checked}}))} />
              {a}
            </label>
          ))}
        </div>

        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
          Observaciones
        </p>
        <textarea value={form.observaciones} onChange={e => setForm(f => ({...f, observaciones: e.target.value}))}
          placeholder='Anotaciones libres del profesional...' rows={3}
          style={{ width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:'8px',
            fontSize:'13px', resize:'vertical', fontFamily:'inherit', marginBottom:'20px' }} />

        <button onClick={handleGuardar} disabled={guardando}
          style={{ width:'100%', padding:'11px', background: guardando ? '#aaa' : '#378ADD', color:'#fff',
            border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'500', cursor: guardando ? 'not-allowed' : 'pointer' }}>
          {guardando ? 'Guardando...' : 'Guardar paciente'}
        </button>
      </div>
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)

  useEffect(() => { cargarPacientes() }, [])

  async function cargarPacientes() {
    setLoading(true)
    const { data } = await supabase.from('pacientes').select('*').order('nombre')
    setPacientes(data || [])
    setLoading(false)
  }

  async function guardarNuevo(form) {
    const { error } = await supabase.from('pacientes').insert([form])
    if (error) { alert('Error: ' + error.message); return }
    await cargarPacientes()
    setVista('lista')
  }

  async function guardarEdicion(form) {
    const { error } = await supabase.from('pacientes').update(form).eq('id', pacienteSeleccionado.id)
    if (error) { alert('Error: ' + error.message); return }
    await cargarPacientes()
    setVista('lista')
    setPacienteSeleccionado(null)
  }

  async function eliminarPaciente(id) {
    if (!confirm('¿Eliminar este paciente? Se eliminarán también sus turnos y movimientos.')) return
    await supabase.from('pacientes').delete().eq('id', id)
    await cargarPacientes()
    setVista('lista')
  }

  function abrirEdicion(p) {
    setPacienteSeleccionado(p)
    setVista('editar')
  }

  function abrirFicha(p) {
    setPacienteSeleccionado(p)
    setVista('ficha')
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.obra_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.telefono || '').includes(busqueda)
  )

  if (vista === 'nuevo') return (
    <FormPaciente
      titulo='Nuevo paciente'
      inicial={FORM_VACIO}
      onGuardar={guardarNuevo}
      onVolver={() => setVista('lista')}
    />
  )

  if (vista === 'editar' && pacienteSeleccionado) return (
    <FormPaciente
      titulo={`Editando: ${pacienteSeleccionado.nombre}`}
      inicial={{
        nombre: pacienteSeleccionado.nombre || '',
        fecha_nacimiento: pacienteSeleccionado.fecha_nacimiento || '',
        telefono: pacienteSeleccionado.telefono || '',
        email: pacienteSeleccionado.email || '',
        whatsapp: pacienteSeleccionado.whatsapp || '',
        obra_social: pacienteSeleccionado.obra_social || '',
        nro_afiliado: pacienteSeleccionado.nro_afiliado || '',
        domicilio: pacienteSeleccionado.domicilio || '',
        localidad: pacienteSeleccionado.localidad || '',
        ocupacion: pacienteSeleccionado.ocupacion || '',
        preferencia_notif: pacienteSeleccionado.preferencia_notif || 'whatsapp',
        antecedentes: pacienteSeleccionado.antecedentes || {},
        observaciones: pacienteSeleccionado.observaciones || '',
      }}
      onGuardar={guardarEdicion}
      onVolver={() => { setVista('lista'); setPacienteSeleccionado(null) }}
    />
  )

  if (vista === 'ficha' && pacienteSeleccionado) return (
    <div style={{ padding:'32px', maxWidth:'700px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <button onClick={() => setVista('lista')}
          style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px', background:'#fff', cursor:'pointer', fontSize:'13px' }}>
          ← Volver
        </button>
        <h1 style={{ fontSize:'20px', fontWeight:'600', margin:0 }}>{pacienteSeleccionado.nombre}</h1>
        <button onClick={() => abrirEdicion(pacienteSeleccionado)}
          style={{ marginLeft:'auto', padding:'6px 14px', background:'#378ADD', color:'#fff',
            border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
          ✏️ Editar
        </button>
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', border:'1px solid #eee', marginBottom:'12px' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
          Datos personales
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {[
            ['Fecha de nacimiento', pacienteSeleccionado.fecha_nacimiento?.split('-').reverse().join('/')],
            ['Teléfono', pacienteSeleccionado.telefono],
            ['Email', pacienteSeleccionado.email],
            ['WhatsApp', pacienteSeleccionado.whatsapp],
            ['Obra social', pacienteSeleccionado.obra_social],
            ['N° afiliado', pacienteSeleccionado.nro_afiliado],
            ['Domicilio', pacienteSeleccionado.domicilio],
            ['Localidad', pacienteSeleccionado.localidad],
            ['Ocupación', pacienteSeleccionado.ocupacion],
            ['Notificación', pacienteSeleccionado.preferencia_notif],
          ].filter(([,v]) => v).map(([label, valor]) => (
            <div key={label}>
              <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>{label}</p>
              <p style={{ fontSize:'13px', color:'#111', margin:0, fontWeight:'500' }}>{valor}</p>
            </div>
          ))}
        </div>
      </div>

      {Object.values(pacienteSeleccionado.antecedentes || {}).some(Boolean) && (
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>
            Antecedentes médicos
          </p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {Object.entries(pacienteSeleccionado.antecedentes || {})
              .filter(([,v]) => v)
              .map(([k]) => (
                <span key={k} style={{ padding:'3px 10px', background:'#FAEEDA', color:'#633806',
                  borderRadius:'20px', fontSize:'12px' }}>{k}</span>
              ))}
          </div>
        </div>
      )}

      {pacienteSeleccionado.observaciones && (
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
            Observaciones
          </p>
          <p style={{ fontSize:'13px', color:'#333', margin:0 }}>{pacienteSeleccionado.observaciones}</p>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>Pacientes</h1>
          <p style={{ color:'#666', fontSize:'13px', margin:'4px 0 0' }}>{pacientes.length} pacientes registrados</p>
        </div>
        <button onClick={() => setVista('nuevo')}
          style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
          + Nuevo paciente
        </button>
      </div>

      <input placeholder='Buscar por nombre, obra social o teléfono...'
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        style={{ width:'100%', padding:'10px 14px', border:'1px solid #ddd', borderRadius:'10px',
          fontSize:'13px', marginBottom:'20px', background:'#fff' }} />

      {loading ? <p style={{ color:'#888' }}>Cargando...</p> :
        pacientesFiltrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#888' }}>
            <p style={{ fontSize:'32px' }}>👤</p>
            <p>No hay pacientes todavía. ¡Agregá el primero!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {pacientesFiltrados.map(p => (
              <div key={p.id} style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px',
                padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#E6F1FB',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'15px', fontWeight:'600', color:'#185FA5', flexShrink:0 }}>
                  {p.nombre.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <div style={{ flex:1, cursor:'pointer' }} onClick={() => abrirFicha(p)}>
                  <p style={{ fontWeight:'500', fontSize:'14px', margin:0, color:'#111' }}>{p.nombre}</p>
                  <p style={{ fontSize:'12px', color:'#888', margin:'2px 0 0' }}>
                    {p.obra_social || 'Sin obra social'} {p.telefono ? '· ' + p.telefono : ''}
                    {p.fecha_nacimiento ? ' · ' + p.fecha_nacimiento.split('-').reverse().join('/') : ''}
                  </p>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={() => abrirEdicion(p)}
                    style={{ padding:'5px 12px', background:'#E6F1FB', border:'none',
                      borderRadius:'6px', color:'#185FA5', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
                    ✏️ Editar
                  </button>
                  <button onClick={() => eliminarPaciente(p.id)}
                    style={{ padding:'5px 10px', background:'#fff', border:'1px solid #ffcdd2',
                      borderRadius:'6px', color:'#e53935', fontSize:'12px', cursor:'pointer' }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}