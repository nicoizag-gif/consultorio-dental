import { useState, useEffect, useRef } from 'react'
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
  const [archivos, setArchivos] = useState([])
  const [archivosExistentes, setArchivosExistentes] = useState(inicial?._archivos || [])
  const fileRef = useRef()

  const campo = (label, key, type='text', placeholder='') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[key] || ''}
        onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
        style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', color:'#111' }} />
    </div>
  )

  function handleArchivos(files) {
    const nuevos = Array.from(files).map(f => ({
      file: f, name: f.name, size: f.size,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      tipo: f.type
    }))
    setArchivos(prev => [...prev, ...nuevos])
  }

  function handleDrop(e) {
    e.preventDefault()
    handleArchivos(e.dataTransfer.files)
  }

  function quitarArchivo(idx) {
    setArchivos(prev => prev.filter((_,i) => i !== idx))
  }

  function quitarExistente(idx) {
    setArchivosExistentes(prev => prev.filter((_,i) => i !== idx))
  }

  async function handleGuardar() {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return }
    setGuardando(true)

    // Subir archivos nuevos a Supabase Storage
    const archivosSubidos = [...archivosExistentes]
    for (const a of archivos) {
      const ext = a.name.split('.').pop()
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('fichas').upload(path, a.file)
      if (!error) {
        archivosSubidos.push({ name: a.name, path, tipo: a.tipo })
      }
    }

    await onGuardar(form, archivosSubidos)
    setGuardando(false)
  }

  const fmtSize = b => b < 1024*1024 ? (b/1024).toFixed(0)+'KB' : (b/1024/1024).toFixed(1)+'MB'

  return (
    <div style={{ padding:'24px', maxWidth:'700px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
        <button onClick={onVolver}
          style={{ padding:'6px 12px', border:'1px solid #ddd', borderRadius:'8px', background:'#fff', cursor:'pointer', fontSize:'13px' }}>
          ← Volver
        </button>
        <h1 style={{ fontSize:'20px', fontWeight:'600', margin:0 }}>{titulo}</h1>
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
          Datos personales <span style={{ fontSize:'10px', fontWeight:'400', color:'#bbb' }}>— solo el nombre es obligatorio</span>
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
          {campo('Apellido y nombre *', 'nombre', 'text', 'González, María')}
          {campo('Fecha de nacimiento', 'fecha_nacimiento', 'date')}
          {campo('Teléfono', 'telefono', 'tel', '3442-555555')}
          {campo('Email', 'email', 'email', 'paciente@email.com')}
          {campo('WhatsApp', 'whatsapp', 'tel', '3442-555555')}
          {campo('Obra social', 'obra_social', 'text', 'OSDE / IOMA / Particular')}
          {campo('DNI', 'dni', 'text', '12.345.678')}
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
            fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
      </div>

      {/* SECCIÓN ARCHIVOS */}
      <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
          📎 Fichas y archivos del paciente
        </p>
        <p style={{ fontSize:'11px', color:'#999', marginBottom:'12px' }}>
          Subí fotos de fichas manuales, radiografías, estudios o cualquier documento del paciente.
        </p>

        {/* ZONA DE DROP */}
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background='#E6F1FB' }}
          onDragLeave={e => e.currentTarget.style.background='#f8f8f6'}
          onDrop={e => { e.currentTarget.style.background='#f8f8f6'; handleDrop(e) }}
          style={{ border:'2px dashed #ccc', borderRadius:'10px', padding:'24px',
            textAlign:'center', cursor:'pointer', background:'#f8f8f6',
            transition:'background .15s', marginBottom:'12px' }}>
          <input ref={fileRef} type='file' multiple accept='image/*,.pdf'
            style={{ display:'none' }} onChange={e => handleArchivos(e.target.files)} />
          <p style={{ fontSize:'24px', margin:'0 0 6px' }}>📁</p>
          <p style={{ fontSize:'13px', fontWeight:'500', color:'#555', margin:'0 0 3px' }}>
            Clic para seleccionar o arrastrá archivos acá
          </p>
          <p style={{ fontSize:'11px', color:'#aaa', margin:0 }}>JPG, PNG, PDF · Sin límite de cantidad</p>
        </div>

        {/* ARCHIVOS EXISTENTES */}
        {archivosExistentes.length > 0 && (
          <div style={{ marginBottom:'8px' }}>
            <p style={{ fontSize:'11px', color:'#888', marginBottom:'6px' }}>Archivos guardados:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {archivosExistentes.map((a, i) => (
                <div key={i} style={{ position:'relative', width:'80px' }}>
                  {a.tipo?.startsWith('image/') ? (
                    <img src={supabase.storage.from('fichas').getPublicUrl(a.path).data.publicUrl}
                      alt={a.name}
                      style={{ width:'80px', height:'80px', objectFit:'cover',
                        borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer' }}
                      onClick={() => window.open(supabase.storage.from('fichas').getPublicUrl(a.path).data.publicUrl)} />
                  ) : (
                    <div style={{ width:'80px', height:'80px', borderRadius:'8px', border:'1px solid #ddd',
                      background:'#f5f5f5', display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:'4px', cursor:'pointer' }}
                      onClick={() => window.open(supabase.storage.from('fichas').getPublicUrl(a.path).data.publicUrl)}>
                      <span style={{ fontSize:'22px' }}>📄</span>
                      <span style={{ fontSize:'9px', color:'#888', textAlign:'center',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'70px', padding:'0 4px' }}>
                        {a.name}
                      </span>
                    </div>
                  )}
                  <button onClick={() => quitarExistente(i)}
                    style={{ position:'absolute', top:'-6px', right:'-6px', width:'18px', height:'18px',
                      borderRadius:'50%', background:'#E24B4A', color:'#fff', border:'none',
                      cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ×
                  </button>
                  <p style={{ fontSize:'9px', color:'#888', margin:'3px 0 0', textAlign:'center',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARCHIVOS NUEVOS */}
        {archivos.length > 0 && (
          <div>
            <p style={{ fontSize:'11px', color:'#888', marginBottom:'6px' }}>Archivos a subir:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {archivos.map((a, i) => (
                <div key={i} style={{ position:'relative', width:'80px' }}>
                  {a.preview ? (
                    <img src={a.preview} alt={a.name}
                      style={{ width:'80px', height:'80px', objectFit:'cover',
                        borderRadius:'8px', border:'1px solid #ddd' }} />
                  ) : (
                    <div style={{ width:'80px', height:'80px', borderRadius:'8px', border:'1px solid #ddd',
                      background:'#f5f5f5', display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:'4px' }}>
                      <span style={{ fontSize:'22px' }}>📄</span>
                      <span style={{ fontSize:'9px', color:'#888', textAlign:'center',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'70px', padding:'0 4px' }}>
                        {a.name}
                      </span>
                    </div>
                  )}
                  <button onClick={() => quitarArchivo(i)}
                    style={{ position:'absolute', top:'-6px', right:'-6px', width:'18px', height:'18px',
                      borderRadius:'50%', background:'#E24B4A', color:'#fff', border:'none',
                      cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ×
                  </button>
                  <p style={{ fontSize:'9px', color:'#888', margin:'3px 0 0', textAlign:'center' }}>{fmtSize(a.size)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={handleGuardar} disabled={guardando}
        style={{ width:'100%', padding:'11px', background: guardando ? '#aaa' : '#378ADD', color:'#fff',
          border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:'500',
          cursor: guardando ? 'not-allowed' : 'pointer' }}>
        {guardando ? 'Guardando...' : 'Guardar paciente'}
      </button>
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState([])
  const [busqueda2, setBusqueda2] = useState('')
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

  async function guardarNuevo(form, archivos) {
    const datos = { ...form }
    if (archivos.length > 0) datos._archivos = archivos
    const { error } = await supabase.from('pacientes').insert([{ ...form, observaciones: form.observaciones || null }])
    if (error) { alert('Error: ' + error.message); return }
    // Guardar referencia de archivos en el paciente
    if (archivos.length > 0) {
      const { data } = await supabase.from('pacientes').select('id').order('created_at', { ascending: false }).limit(1)
      if (data?.[0]) {
        await supabase.from('pacientes').update({ observaciones: form.observaciones || null }).eq('id', data[0].id)
      }
    }
    await cargarPacientes()
    setVista('lista')
  }

  async function guardarEdicion(form, archivos) {
    const update = { ...form }
    if (archivos.length > 0) update.antecedentes = { ...form.antecedentes, _archivos: archivos }
    const { error } = await supabase.from('pacientes').update(update).eq('id', pacienteSeleccionado.id)
    if (error) { alert('Error: ' + error.message); return }
    await cargarPacientes()
    setVista('lista')
    setPacienteSeleccionado(null)
  }

  async function eliminarPaciente(id) {
    if (!confirm('¿Eliminar este paciente?')) return
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
    p.nombre.toLowerCase().includes(busqueda2.toLowerCase()) ||
    (p.obra_social || '').toLowerCase().includes(busqueda2.toLowerCase()) ||
    (p.telefono || '').includes(busqueda2)
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
        _archivos: pacienteSeleccionado.antecedentes?._archivos || [],
      }}
      onGuardar={guardarEdicion}
      onVolver={() => { setVista('lista'); setPacienteSeleccionado(null) }}
    />
  )

  if (vista === 'ficha' && pacienteSeleccionado) {
    const archivos = pacienteSeleccionado.antecedentes?._archivos || []
    return (
      <div style={{ padding:'24px', maxWidth:'700px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
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

        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
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
              ['DNI', pacienteSeleccionado.dni],
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

        {Object.entries(pacienteSeleccionado.antecedentes || {})
          .filter(([k,v]) => k !== '_archivos' && v).length > 0 && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>
              Antecedentes médicos
            </p>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {Object.entries(pacienteSeleccionado.antecedentes || {})
                .filter(([k,v]) => k !== '_archivos' && v)
                .map(([k]) => (
                  <span key={k} style={{ padding:'3px 10px', background:'#FAEEDA', color:'#633806',
                    borderRadius:'20px', fontSize:'12px' }}>{k}</span>
                ))}
            </div>
          </div>
        )}

        {pacienteSeleccionado.observaciones && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
              Observaciones
            </p>
            <p style={{ fontSize:'13px', color:'#333', margin:0 }}>{pacienteSeleccionado.observaciones}</p>
          </div>
        )}

        {/* ARCHIVOS */}
        <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
            📎 Fichas y archivos
          </p>
          {archivos.length === 0 ? (
            <p style={{ fontSize:'13px', color:'#bbb', margin:0 }}>No hay archivos cargados.</p>
          ) : (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {archivos.map((a, i) => {
                const url = supabase.storage.from('fichas').getPublicUrl(a.path).data.publicUrl
                return (
                  <div key={i} style={{ width:'90px', cursor:'pointer' }} onClick={() => window.open(url)}>
                    {a.tipo?.startsWith('image/') ? (
                      <img src={url} alt={a.name}
                        style={{ width:'90px', height:'90px', objectFit:'cover',
                          borderRadius:'8px', border:'1px solid #ddd' }} />
                    ) : (
                      <div style={{ width:'90px', height:'90px', borderRadius:'8px', border:'1px solid #ddd',
                        background:'#f5f5f5', display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center', gap:'4px' }}>
                        <span style={{ fontSize:'26px' }}>📄</span>
                        <span style={{ fontSize:'9px', color:'#888', textAlign:'center',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          width:'80px', padding:'0 4px' }}>{a.name}</span>
                      </div>
                    )}
                    <p style={{ fontSize:'10px', color:'#888', margin:'4px 0 0', textAlign:'center',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
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
        value={busqueda2} onChange={e => setBusqueda2(e.target.value)}
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