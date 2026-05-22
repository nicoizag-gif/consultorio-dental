import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista') // 'lista' | 'nueva' | 'ficha'
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [form, setForm] = useState({
    nombre: '', fecha_nacimiento: '', telefono: '', email: '',
    whatsapp: '', obra_social: '', nro_afiliado: '', domicilio: '',
    localidad: '', ocupacion: '', preferencia_notif: 'whatsapp',
    antecedentes: {}, observaciones: ''
  })

  useEffect(() => { cargarPacientes() }, [])

  async function cargarPacientes() {
    setLoading(true)
    const { data } = await supabase.from('pacientes').select('*').order('nombre')
    setPacientes(data || [])
    setLoading(false)
  }

async function guardarPaciente() {
  if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return }
  if (!form.fecha_nacimiento) { alert('La fecha de nacimiento es obligatoria'); return }
  if (!form.telefono.trim()) { alert('El teléfono es obligatorio'); return }

  const { data, error } = await supabase.from('pacientes').insert([form]).select()
  if (error) { alert('Error: ' + JSON.stringify(error)); return }
  await cargarPacientes()
  setVista('lista')
  setForm({ nombre:'',fecha_nacimiento:'',telefono:'',email:'',whatsapp:'',
    obra_social:'',nro_afiliado:'',domicilio:'',localidad:'',ocupacion:'',
    preferencia_notif:'whatsapp',antecedentes:{},observaciones:'' })
}
  async function eliminarPaciente(id) {
    if (!confirm('¿Eliminar este paciente?')) return
    await supabase.from('pacientes').delete().eq('id', id)
    await cargarPacientes()
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.obra_social || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const campo = (label, key, type = 'text', placeholder = '') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      <input type={type} placeholder={placeholder}
        value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px',
          fontSize:'13px', background:'#fff', color:'#111' }} />
    </div>
  )

  const antecedentes = ['Diabetes','Hipertensión','Alergia a anestesia','Cardiopatía','Anticoagulantes','Embarazo']

  if (vista === 'lista') return (
    <div style={{ padding:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>Pacientes</h1>
          <p style={{ color:'#666', fontSize:'13px', margin:'4px 0 0' }}>{pacientes.length} pacientes registrados</p>
        </div>
        <button onClick={() => setVista('nueva')}
          style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
          + Nuevo paciente
        </button>
      </div>

      <input placeholder="Buscar por nombre u obra social..."
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
              <div key={p.id} onClick={() => { setPacienteSeleccionado(p); setVista('ficha') }}
                style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px',
                  padding:'14px 18px', cursor:'pointer', display:'flex',
                  alignItems:'center', gap:'14px', transition:'box-shadow .15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:'#E6F1FB',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'15px', fontWeight:'600', color:'#185FA5', flexShrink:0 }}>
                  {p.nombre.split(' ').map(n=>n[0]).slice(0,2).join('')}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:'500', fontSize:'14px', margin:0, color:'#111' }}>{p.nombre}</p>
                  <p style={{ fontSize:'12px', color:'#888', margin:'2px 0 0' }}>
                    {p.obra_social || 'Sin obra social'} {p.telefono ? '· ' + p.telefono : ''}
                  </p>
                </div>
                <button onClick={e => { e.stopPropagation(); eliminarPaciente(p.id) }}
                  style={{ padding:'5px 10px', background:'#fff', border:'1px solid #ffcdd2',
                    borderRadius:'6px', color:'#e53935', fontSize:'11px', cursor:'pointer' }}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )

  if (vista === 'nueva') return (
    <div style={{ padding:'32px', maxWidth:'700px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <button onClick={() => setVista('lista')}
          style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px',
            background:'#fff', cursor:'pointer', fontSize:'13px' }}>← Volver</button>
        <h1 style={{ fontSize:'20px', fontWeight:'600', margin:0 }}>Nuevo paciente</h1>
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', border:'1px solid #eee' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
          {campo('Apellido y nombre *', 'nombre', 'text', 'González, María')}
          {campo('Fecha de nacimiento', 'fecha_nacimiento', 'date')}
          {campo('Teléfono', 'telefono', 'tel', '3442-555555')}
          {campo('Email', 'email', 'email', 'paciente@email.com')}
          {campo('WhatsApp', 'whatsapp', 'tel', '3442-555555')}
          {campo('Obra social', 'obra_social', 'text', 'OSDE / IOMA / Particular')}
          {campo('N° de afiliado', 'nro_afiliado')}
          {campo('Ocupación', 'ocupacion')}
          {campo('Domicilio', 'domicilio', 'text', 'Av. Colón 1234')}
          {campo('Localidad', 'localidad', 'text', 'Concepción del Uruguay')}
        </div>

        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'6px' }}>
            Preferencia de notificación
          </label>
          <div style={{ display:'flex', gap:'12px' }}>
            {['whatsapp','email','ambos','ninguno'].map(op => (
              <label key={op} style={{ display:'flex', gap:'5px', alignItems:'center',
                fontSize:'13px', cursor:'pointer', color:'#333' }}>
                <input type="radio" name="notif" value={op}
                  checked={form.preferencia_notif === op}
                  onChange={() => setForm({ ...form, preferencia_notif: op })} />
                {op.charAt(0).toUpperCase() + op.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:'12px' }}>
          <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'6px' }}>
            Antecedentes médicos
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
            {antecedentes.map(a => (
              <label key={a} style={{ display:'flex', gap:'6px', alignItems:'center',
                fontSize:'12px', cursor:'pointer', color:'#333' }}>
                <input type="checkbox"
                  checked={!!form.antecedentes[a]}
                  onChange={e => setForm({ ...form, antecedentes: { ...form.antecedentes, [a]: e.target.checked } })} />
                {a}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:'20px' }}>
          <label style={{ fontSize:'11px', color:'#666', display:'block', marginBottom:'4px' }}>Observaciones</label>
          <textarea value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })}
            placeholder="Anotaciones libres..." rows={3}
            style={{ width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:'8px',
              fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
        </div>

        <button onClick={guardarPaciente}
          style={{ width:'100%', padding:'11px', background:'#378ADD', color:'#fff',
            border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
          Guardar paciente
        </button>
      </div>
    </div>
  )

  if (vista === 'ficha' && pacienteSeleccionado) return (
    <div style={{ padding:'32px', maxWidth:'700px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <button onClick={() => setVista('lista')}
          style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px',
            background:'#fff', cursor:'pointer', fontSize:'13px' }}>← Volver</button>
        <h1 style={{ fontSize:'20px', fontWeight:'600', margin:0 }}>{pacienteSeleccionado.nombre}</h1>
      </div>
      <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', border:'1px solid #eee' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          {[
            ['Teléfono', pacienteSeleccionado.telefono],
            ['Email', pacienteSeleccionado.email],
            ['WhatsApp', pacienteSeleccionado.whatsapp],
            ['Obra social', pacienteSeleccionado.obra_social],
            ['N° afiliado', pacienteSeleccionado.nro_afiliado],
            ['Domicilio', pacienteSeleccionado.domicilio],
            ['Localidad', pacienteSeleccionado.localidad],
            ['Ocupación', pacienteSeleccionado.ocupacion],
            ['Notificación', pacienteSeleccionado.preferencia_notif],
          ].map(([label, valor]) => valor ? (
            <div key={label}>
              <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>{label}</p>
              <p style={{ fontSize:'13px', color:'#111', margin:0, fontWeight:'500' }}>{valor}</p>
            </div>
          ) : null)}
        </div>
        {pacienteSeleccionado.observaciones && (
          <div style={{ marginTop:'16px', padding:'12px', background:'#f8f8f6', borderRadius:'8px' }}>
            <p style={{ fontSize:'11px', color:'#888', margin:'0 0 4px' }}>Observaciones</p>
            <p style={{ fontSize:'13px', color:'#333', margin:0 }}>{pacienteSeleccionado.observaciones}</p>
          </div>
        )}
      </div>
    </div>
  )
}