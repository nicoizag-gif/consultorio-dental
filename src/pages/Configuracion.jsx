import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FORM_VACIO = {
  nombre:'', apellido:'', matricula:'', telefono:'',
  email:'', direccion:'', localidad:'', especialidad:'',
  horario_atencion:'', notas:''
}

export default function Configuracion() {
  const [form, setForm] = useState(FORM_VACIO)
  const [id, setId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarConfig() }, [])

  async function cargarConfig() {
  setLoading(true)
  const { data } = await supabase.from('configuracion').select('*').order('created_at').limit(1)
  if (data && data.length > 0) {
    const c = data[0]
    setId(c.id)
    setForm({
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      matricula: c.matricula || '',
      telefono: c.telefono || '',
      email: c.email || '',
      direccion: c.direccion || '',
      localidad: c.localidad || '',
      especialidad: c.especialidad || '',
      horario_atencion: c.horario_atencion || '',
      notas: c.notas || '',
    })
  }
  setLoading(false)
}
async function guardar() {
  setGuardando(true)
  let error
  if (id) {
    ({ error } = await supabase.from('configuracion').update(form).eq('id', id))
  } else {
    const { data, error: e } = await supabase.from('configuracion').insert([form]).select()
    error = e
    if (data?.[0]) setId(data[0].id)
  }
  setGuardando(false)
  if (error) { alert('Error: ' + error.message); return }
  setGuardado(true)
  setTimeout(() => setGuardado(false), 3000)
}

  const campo = (label, key, type='text', placeholder='', full=false) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px', gridColumn: full ? 'span 2' : 'span 1' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[key] || ''}
        onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', color:'#111' }} />
    </div>
  )

  return (
    <div style={{ padding:'28px', maxWidth:'680px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>⚙️ Configuración</h1>
          <p style={{ color:'#888', fontSize:'13px', margin:'4px 0 0' }}>Datos del profesional y del consultorio</p>
        </div>
        {guardado && (
          <span style={{ fontSize:'12px', padding:'6px 14px', background:'#E1F5EE',
            color:'#1D9E75', borderRadius:'20px', fontWeight:'500' }}>
            ✓ Guardado correctamente
          </span>
        )}
      </div>

      {loading ? <p style={{ color:'#888' }}>Cargando...</p> : (
        <>
          {/* DATOS PROFESIONAL */}
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase',
              letterSpacing:'.05em', marginBottom:'14px' }}>👤 Datos del profesional</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {campo('Nombre', 'nombre', 'text', 'María')}
              {campo('Apellido', 'apellido', 'text', 'González')}
              {campo('Especialidad', 'especialidad', 'text', 'Odontología general')}
              {campo('Matrícula', 'matricula', 'text', 'MP 1234')}
              {campo('Teléfono', 'telefono', 'tel', '3442-555555')}
              {campo('Email', 'email', 'email', 'consultorio@gmail.com')}
            </div>
          </div>

          {/* DATOS CONSULTORIO */}
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase',
              letterSpacing:'.05em', marginBottom:'14px' }}>🏥 Datos del consultorio</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {campo('Dirección', 'direccion', 'text', 'Av. Colón 1234')}
              {campo('Localidad', 'localidad', 'text', 'Concepción del Uruguay')}
              {campo('Horario de atención', 'horario_atencion', 'text', 'Lun a Vie 8:00 a 18:00')}
            </div>
          </div>

          {/* NOTAS */}
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'20px' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase',
              letterSpacing:'.05em', marginBottom:'14px' }}>📋 Notas adicionales</p>
            <textarea value={form.notas} onChange={e => setForm(f => ({...f, notas: e.target.value}))}
              placeholder='Información adicional que aparecerá en los reportes...' rows={3}
              style={{ width:'100%', padding:'8px 10px', border:'1px solid #ddd', borderRadius:'8px',
                fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
          </div>

          {/* PREVIEW */}
          <div style={{ background:'#f8f8f6', borderRadius:'14px', padding:'16px 20px', marginBottom:'20px',
            border:'1px solid #eee' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase',
              letterSpacing:'.05em', marginBottom:'10px' }}>Vista previa en reportes</p>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#111', margin:'0 0 2px' }}>
              {form.nombre || 'Nombre'} {form.apellido || 'Apellido'} — {form.especialidad || 'Especialidad'}
            </p>
            <p style={{ fontSize:'12px', color:'#666', margin:'0 0 2px' }}>
              {form.matricula ? 'Mat. ' + form.matricula : 'Matrícula'}
              {form.telefono ? ' · ' + form.telefono : ''}
            </p>
            <p style={{ fontSize:'12px', color:'#666', margin:'0 0 2px' }}>
              {form.direccion || 'Dirección'}{form.localidad ? ', ' + form.localidad : ''}
            </p>
            {form.horario_atencion && (
              <p style={{ fontSize:'12px', color:'#666', margin:0 }}>🕐 {form.horario_atencion}</p>
            )}
          </div>

          <button onClick={guardar} disabled={guardando}
            style={{ width:'100%', padding:'11px', background: guardando ? '#aaa' : '#378ADD',
              color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px',
              fontWeight:'500', cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando...' : '💾 Guardar configuración'}
          </button>
        </>
      )}
    </div>
  )
}