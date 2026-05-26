import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Odontograma from '../components/Odontograma'

const ANTECEDENTES = ['Diabetes','Hipertensión','Alergia a anestesia','Cardiopatía','Anticoagulantes','Embarazo']

const FORM_VACIO = {
  nombre:'', fecha_nacimiento:'', telefono:'', email:'',
  whatsapp:'', obra_social:'', nro_afiliado:'', dni:'', domicilio:'',
  localidad:'', ocupacion:'', preferencia_notif:'whatsapp',
  antecedentes:{}, observaciones:''
}

const getUrl = (path) => `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/fichas/${path}`

function HistorialPaciente({ pacienteId }) {
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '', tratamiento_realizado: '', medicacion: '', proximo_paso: ''
  })
  const [editId, setEditId] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [pacienteId])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('historial_clinico')
      .select('*').eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    setHistorial(data || [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.descripcion.trim()) { alert('La descripción es obligatoria'); return }
    setGuardando(true)
    if (editId) {
      await supabase.from('historial_clinico').update({
        fecha: form.fecha, descripcion: form.descripcion,
        tratamiento_realizado: form.tratamiento_realizado || null,
        medicacion: form.medicacion || null,
        proximo_paso: form.proximo_paso || null,
      }).eq('id', editId)
    } else {
      await supabase.from('historial_clinico').insert([{
        paciente_id: pacienteId, fecha: form.fecha,
        descripcion: form.descripcion,
        tratamiento_realizado: form.tratamiento_realizado || null,
        medicacion: form.medicacion || null,
        proximo_paso: form.proximo_paso || null,
      }])
    }
    await cargar()
    setShowForm(false)
    setEditId(null)
    setForm({ fecha: new Date().toISOString().split('T')[0], descripcion:'', tratamiento_realizado:'', medicacion:'', proximo_paso:'' })
    setGuardando(false)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('historial_clinico').delete().eq('id', id)
    await cargar()
  }

  function abrirEdicion(h) {
    setForm({
      fecha: h.fecha, descripcion: h.descripcion || '',
      tratamiento_realizado: h.tratamiento_realizado || '',
      medicacion: h.medicacion || '', proximo_paso: h.proximo_paso || ''
    })
    setEditId(h.id)
    setShowForm(true)
  }

  const inp = (label, key, multi=false, placeholder='') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      {multi ? (
        <textarea value={form[key]} rows={2} placeholder={placeholder}
          onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
          style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px',
            fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
      ) : (
        <input type='text' value={form[key]} placeholder={placeholder}
          onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
          style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
      )}
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
        <p style={{ fontSize:'13px', fontWeight:'600', color:'#111', margin:0 }}>
          Historial clínico <span style={{ fontSize:'11px', fontWeight:'400', color:'#888' }}>({historial.length} registros)</span>
        </p>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ fecha: new Date().toISOString().split('T')[0], descripcion:'', tratamiento_realizado:'', medicacion:'', proximo_paso:'' }) }}
          style={{ padding:'7px 14px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
          + Nueva entrada
        </button>
      </div>

      {showForm && (
        <div style={{ background:'#f8f8f6', borderRadius:'12px', padding:'16px',
          marginBottom:'14px', border:'1px solid #eee' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <p style={{ fontWeight:'600', fontSize:'13px', margin:0 }}>
              {editId ? 'Editar registro' : 'Nueva entrada clínica'}
            </p>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'18px', color:'#888' }}>×</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
              <input type='date' value={form.fecha}
                onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px', maxWidth:'180px' }} />
            </div>
            {inp('Descripción / Evolución *', 'descripcion', true, 'Estado del paciente, hallazgos clínicos...')}
            {inp('Tratamiento realizado', 'tratamiento_realizado', true, 'Procedimientos realizados en esta sesión...')}
            {inp('Medicación indicada', 'medicacion', false, 'Ej: Ibuprofeno 400mg cada 8hs')}
            {inp('Próximo paso', 'proximo_paso', false, 'Ej: Control en 7 días...')}
          </div>
          <button onClick={guardar} disabled={guardando}
            style={{ width:'100%', marginTop:'12px', padding:'9px', background: guardando ? '#aaa' : '#378ADD',
              color:'#fff', border:'none', borderRadius:'8px', fontSize:'13px',
              fontWeight:'500', cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando...' : editId ? 'Guardar cambios' : 'Registrar entrada'}
          </button>
        </div>
      )}

      {loading ? <p style={{ color:'#888', fontSize:'13px' }}>Cargando...</p> :
        historial.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', color:'#888' }}>
            <p style={{ fontSize:'24px', margin:'0 0 6px' }}>📋</p>
            <p style={{ fontSize:'13px', margin:0 }}>Sin registros. Agregá la primera entrada.</p>
          </div>
        ) : historial.map((h, idx) => (
          <div key={h.id} style={{ background: idx === 0 ? '#EBF4FF' : '#fff',
            border: idx === 0 ? '1px solid #B5D4F4' : '1px solid #eee',
            borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 14px', borderBottom:'1px solid #eee' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%',
                  background: idx === 0 ? '#378ADD' : '#ccc' }} />
                <p style={{ fontWeight:'600', fontSize:'13px', margin:0,
                  color: idx === 0 ? '#378ADD' : '#333' }}>
                  {h.fecha?.split('-').reverse().join('/')}
                  {idx === 0 && <span style={{ fontSize:'10px', marginLeft:'8px',
                    background:'#378ADD', color:'#fff', padding:'1px 7px',
                    borderRadius:'20px' }}>Última</span>}
                </p>
              </div>
              <div style={{ display:'flex', gap:'5px' }}>
                <button onClick={() => abrirEdicion(h)}
                  style={{ padding:'3px 9px', background:'#E6F1FB', border:'none',
                    borderRadius:'5px', color:'#185FA5', fontSize:'11px', cursor:'pointer' }}>✏️</button>
                <button onClick={() => eliminar(h.id)}
                  style={{ padding:'3px 8px', background:'#FCEBEB', border:'none',
                    borderRadius:'5px', color:'#E24B4A', fontSize:'11px', cursor:'pointer' }}>🗑</button>
              </div>
            </div>
            <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'8px' }}>
              <div>
                <p style={{ fontSize:'10px', color:'#888', margin:'0 0 2px', fontWeight:'600',
                  textTransform:'uppercase', letterSpacing:'.04em' }}>Evolución</p>
                <p style={{ fontSize:'13px', color:'#111', margin:0 }}>{h.descripcion}</p>
              </div>
              {h.tratamiento_realizado && (
                <div>
                  <p style={{ fontSize:'10px', color:'#888', margin:'0 0 2px', fontWeight:'600',
                    textTransform:'uppercase', letterSpacing:'.04em' }}>Tratamiento realizado</p>
                  <p style={{ fontSize:'13px', color:'#333', margin:0 }}>{h.tratamiento_realizado}</p>
                </div>
              )}
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {h.medicacion && (
                  <div style={{ background:'#FAEEDA', borderRadius:'8px', padding:'7px 10px', flex:1, minWidth:'150px' }}>
                    <p style={{ fontSize:'10px', color:'#633806', margin:'0 0 2px', fontWeight:'600' }}>💊 MEDICACIÓN</p>
                    <p style={{ fontSize:'12px', color:'#633806', margin:0 }}>{h.medicacion}</p>
                  </div>
                )}
                {h.proximo_paso && (
                  <div style={{ background:'#E1F5EE', borderRadius:'8px', padding:'7px 10px', flex:1, minWidth:'150px' }}>
                    <p style={{ fontSize:'10px', color:'#085041', margin:'0 0 2px', fontWeight:'600' }}>→ PRÓXIMO PASO</p>
                    <p style={{ fontSize:'12px', color:'#085041', margin:0 }}>{h.proximo_paso}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      }
    </div>
  )
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

  function quitarArchivo(idx) { setArchivos(prev => prev.filter((_,i) => i !== idx)) }
  function quitarExistente(idx) { setArchivosExistentes(prev => prev.filter((_,i) => i !== idx)) }

  async function handleGuardar() {
    if (!form.nombre.trim()) { alert('El nombre es obligatorio'); return }
    setGuardando(true)
    const archivosSubidos = []
    for (const a of archivos) {
      const ext = a.name.split('.').pop()
      const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('fichas').upload(path, a.file)
      if (!error) archivosSubidos.push({ name: a.name, path, tipo: a.tipo })
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
          {campo('DNI', 'dni', 'text', '12.345.678')}
          {campo('Teléfono', 'telefono', 'tel', '3442-555555')}
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
            fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
      </div>

      <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
        <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'8px' }}>
          📎 Fichas y archivos del paciente
        </p>
        <p style={{ fontSize:'11px', color:'#999', marginBottom:'12px' }}>
          Subí fotos de fichas manuales, radiografías, estudios o cualquier documento.
        </p>
        <div onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.background='#E6F1FB' }}
          onDragLeave={e => e.currentTarget.style.background='#f8f8f6'}
          onDrop={e => { e.currentTarget.style.background='#f8f8f6'; handleDrop(e) }}
          style={{ border:'2px dashed #ccc', borderRadius:'10px', padding:'24px',
            textAlign:'center', cursor:'pointer', background:'#f8f8f6', transition:'background .15s', marginBottom:'12px' }}>
          <input ref={fileRef} type='file' multiple accept='image/*,.pdf'
            style={{ display:'none' }} onChange={e => handleArchivos(e.target.files)} />
          <p style={{ fontSize:'24px', margin:'0 0 6px' }}>📁</p>
          <p style={{ fontSize:'13px', fontWeight:'500', color:'#555', margin:'0 0 3px' }}>
            Clic para seleccionar o arrastrá archivos acá
          </p>
          <p style={{ fontSize:'11px', color:'#aaa', margin:0 }}>JPG, PNG, PDF · Sin límite de cantidad</p>
        </div>

        {archivosExistentes.length > 0 && (
          <div style={{ marginBottom:'10px' }}>
            <p style={{ fontSize:'11px', color:'#888', marginBottom:'6px' }}>Archivos guardados:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {archivosExistentes.map((a, i) => (
                <div key={i} style={{ position:'relative', width:'80px' }}>
                  {a.tipo?.startsWith('image/') ? (
                    <img src={getUrl(a.path)} alt={a.name}
                      style={{ width:'80px', height:'80px', objectFit:'cover', borderRadius:'8px', border:'1px solid #ddd', cursor:'pointer' }}
                      onClick={() => window.open(getUrl(a.path))} />
                  ) : (
                    <div style={{ width:'80px', height:'80px', borderRadius:'8px', border:'1px solid #ddd',
                      background:'#f5f5f5', display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:'4px', cursor:'pointer' }}
                      onClick={() => window.open(getUrl(a.path))}>
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
                      cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  <p style={{ fontSize:'9px', color:'#888', margin:'3px 0 0', textAlign:'center',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {archivos.length > 0 && (
          <div>
            <p style={{ fontSize:'11px', color:'#888', marginBottom:'6px' }}>Archivos a subir:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {archivos.map((a, i) => (
                <div key={i} style={{ position:'relative', width:'80px' }}>
                  {a.preview ? (
                    <img src={a.preview} alt={a.name}
                      style={{ width:'80px', height:'80px', objectFit:'cover', borderRadius:'8px', border:'1px solid #ddd' }} />
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
                      cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
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
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('lista')
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [tabFicha, setTabFicha] = useState('datos')
  const [odontogramaActual, setOdontogramaActual] = useState({})
  const [odontogramaTratado, setOdontogramaTratado] = useState({})
  const [guardandoOdonto, setGuardandoOdonto] = useState(false)

  useEffect(() => { cargarPacientes() }, [])

  async function cargarPacientes() {
    setLoading(true)
    const { data } = await supabase.from('pacientes').select('*').order('nombre')
    setPacientes(data || [])
    setLoading(false)
  }

  async function guardarNuevo(form, archivos) {
    const { data, error } = await supabase.from('pacientes').insert([{
      nombre: form.nombre,
      fecha_nacimiento: form.fecha_nacimiento || null,
      telefono: form.telefono || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      obra_social: form.obra_social || null,
      nro_afiliado: form.nro_afiliado || null,
      dni: form.dni || null,
      domicilio: form.domicilio || null,
      localidad: form.localidad || null,
      ocupacion: form.ocupacion || null,
      preferencia_notif: form.preferencia_notif,
      antecedentes: form.antecedentes || {},
      observaciones: form.observaciones || null,
    }]).select()
    if (error) { alert('Error: ' + error.message); return }
    const pacId = data[0].id
    if (archivos.length > 0) {
      await supabase.from('paciente_archivos').insert(
        archivos.map(a => ({ paciente_id: pacId, name: a.name, path: a.path, tipo: a.tipo }))
      )
    }
    await cargarPacientes()
    setVista('lista')
  }

  async function guardarEdicion(form, archivos) {
    const { error } = await supabase.from('pacientes').update({
      nombre: form.nombre,
      fecha_nacimiento: form.fecha_nacimiento || null,
      telefono: form.telefono || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      obra_social: form.obra_social || null,
      nro_afiliado: form.nro_afiliado || null,
      dni: form.dni || null,
      domicilio: form.domicilio || null,
      localidad: form.localidad || null,
      ocupacion: form.ocupacion || null,
      preferencia_notif: form.preferencia_notif,
      antecedentes: form.antecedentes || {},
      observaciones: form.observaciones || null,
    }).eq('id', pacienteSeleccionado.id)
    if (error) { alert('Error: ' + error.message); return }
    if (archivos.length > 0) {
      await supabase.from('paciente_archivos').insert(
        archivos.map(a => ({ paciente_id: pacienteSeleccionado.id, name: a.name, path: a.path, tipo: a.tipo }))
      )
    }
    await cargarPacientes()
    setVista('lista')
    setPacienteSeleccionado(null)
  }

  async function guardarOdontograma() {
    setGuardandoOdonto(true)
    const { error } = await supabase.from('pacientes').update({
      odontograma: { actual: odontogramaActual, tratado: odontogramaTratado }
    }).eq('id', pacienteSeleccionado.id)
    setGuardandoOdonto(false)
    if (error) { alert('Error: ' + error.message); return }
    setPacienteSeleccionado(prev => ({
      ...prev,
      odontograma: { actual: odontogramaActual, tratado: odontogramaTratado }
    }))
    await cargarPacientes()
    alert('Odontograma guardado ✓')
  }

  async function eliminarPaciente(id) {
    if (!confirm('¿Eliminar este paciente?')) return
    await supabase.from('pacientes').delete().eq('id', id)
    await cargarPacientes()
    setVista('lista')
  }

  async function abrirEdicion(p) {
    const { data } = await supabase.from('paciente_archivos')
      .select('*').eq('paciente_id', p.id).order('created_at')
    setPacienteSeleccionado({ ...p, _archivos: data || [] })
    setVista('editar')
  }

  async function abrirFicha(p) {
    const { data: archivos } = await supabase.from('paciente_archivos')
      .select('*').eq('paciente_id', p.id).order('created_at')
    const { data: pacFresh } = await supabase.from('pacientes')
      .select('*').eq('id', p.id).single()
    setPacienteSeleccionado({ ...pacFresh, _archivos: archivos || [] })
    setOdontogramaActual(pacFresh?.odontograma?.actual || {})
    setOdontogramaTratado(pacFresh?.odontograma?.tratado || {})
    setTabFicha('datos')
    setVista('ficha')
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.obra_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.telefono || '').includes(busqueda) ||
    (p.dni || '').includes(busqueda)
  )

  if (vista === 'nuevo') return (
    <FormPaciente titulo='Nuevo paciente' inicial={FORM_VACIO}
      onGuardar={guardarNuevo} onVolver={() => setVista('lista')} />
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
        dni: pacienteSeleccionado.dni || '',
        domicilio: pacienteSeleccionado.domicilio || '',
        localidad: pacienteSeleccionado.localidad || '',
        ocupacion: pacienteSeleccionado.ocupacion || '',
        preferencia_notif: pacienteSeleccionado.preferencia_notif || 'whatsapp',
        antecedentes: pacienteSeleccionado.antecedentes || {},
        observaciones: pacienteSeleccionado.observaciones || '',
        _archivos: pacienteSeleccionado._archivos || [],
      }}
      onGuardar={guardarEdicion}
      onVolver={() => { setVista('lista'); setPacienteSeleccionado(null) }}
    />
  )

  if (vista === 'ficha' && pacienteSeleccionado) {
    const archivos = pacienteSeleccionado._archivos || []
    return (
      <div style={{ padding:'24px', maxWidth:'800px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
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

        <div style={{ display:'flex', gap:'4px', borderBottom:'1px solid #eee', marginBottom:'16px' }}>
          {[
            { id:'datos', label:'👤 Datos' },
            { id:'odonto-actual', label:'🦷 Estado actual' },
            { id:'odonto-tratado', label:'✅ Tratamientos' },
            { id:'archivos', label:'📎 Archivos' },
            { id:'historial', label:'📋 Historial clínico' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setTabFicha(tab.id)}
              style={{ padding:'7px 14px', border:'none', background:'none', cursor:'pointer',
                fontSize:'12px', fontWeight: tabFicha === tab.id ? '600' : '400',
                color: tabFicha === tab.id ? '#378ADD' : '#888',
                borderBottom: tabFicha === tab.id ? '2px solid #378ADD' : '2px solid transparent',
                marginBottom:'-1px' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {tabFicha === 'datos' && (
          <>
            <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
              <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
                Datos personales
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  ['DNI', pacienteSeleccionado.dni],
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
            {Object.entries(pacienteSeleccionado.antecedentes || {}).filter(([,v]) => v).length > 0 && (
              <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee', marginBottom:'12px' }}>
                <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'10px' }}>
                  Antecedentes médicos
                </p>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {Object.entries(pacienteSeleccionado.antecedentes || {})
                    .filter(([,v]) => v)
                    .map(([k]) => (
                      <span key={k} style={{ padding:'3px 10px', background:'#FAEEDA', color:'#633806', borderRadius:'20px', fontSize:'12px' }}>{k}</span>
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
          </>
        )}

        {tabFicha === 'odonto-actual' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <p style={{ fontSize:'13px', fontWeight:'600', color:'#111', margin:0 }}>Estado actual</p>
              <button onClick={guardarOdontograma} disabled={guardandoOdonto}
                style={{ padding:'7px 16px', background: guardandoOdonto ? '#aaa' : '#378ADD', color:'#fff',
                  border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
                {guardandoOdonto ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
            <Odontograma value={odontogramaActual} onChange={setOdontogramaActual} />
          </div>
        )}

        {tabFicha === 'odonto-tratado' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <p style={{ fontSize:'13px', fontWeight:'600', color:'#111', margin:0 }}>Tratamientos realizados</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => {
                  if (!confirm('¿Copiar el Estado actual a Tratamientos? Se reemplazará lo que hay actualmente.')) return
                  setOdontogramaTratado({ ...odontogramaActual })
                }}
                  style={{ padding:'7px 14px', background:'#f5f5f5', color:'#555',
                    border:'1px solid #ddd', borderRadius:'8px', fontSize:'12px', cursor:'pointer' }}>
                  📋 Copiar desde Estado actual
                </button>
                <button onClick={guardarOdontograma} disabled={guardandoOdonto}
                  style={{ padding:'7px 16px', background: guardandoOdonto ? '#aaa' : '#1D9E75', color:'#fff',
                    border:'none', borderRadius:'8px', fontSize:'12px', cursor:'pointer', fontWeight:'500' }}>
                  {guardandoOdonto ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </div>
            {Object.keys(odontogramaTratado).length === 0 && (
              <div style={{ padding:'16px', background:'#f8f8f6', borderRadius:'8px', marginBottom:'14px',
                textAlign:'center', fontSize:'12px', color:'#888' }}>
                Tratamientos vacíos. Usá el botón <strong>"Copiar desde Estado actual"</strong> para empezar.
              </div>
            )}
            <Odontograma value={odontogramaTratado} onChange={setOdontogramaTratado} />
          </div>
        )}

        {tabFicha === 'archivos' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
            <p style={{ fontSize:'12px', fontWeight:'600', color:'#888', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'12px' }}>
              📎 Fichas y archivos
            </p>
            {archivos.length === 0 ? (
              <p style={{ fontSize:'13px', color:'#bbb', margin:0 }}>No hay archivos cargados.</p>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                {archivos.map((a, i) => {
                  const url = getUrl(a.path)
                  return (
                    <div key={i} style={{ width:'90px', cursor:'pointer' }} onClick={() => window.open(url)}>
                      {a.tipo?.startsWith('image/') ? (
                        <img src={url} alt={a.name}
                          style={{ width:'90px', height:'90px', objectFit:'cover', borderRadius:'8px', border:'1px solid #ddd' }} />
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
        )}

        {tabFicha === 'historial' && (
          <div style={{ background:'#fff', borderRadius:'14px', padding:'20px', border:'1px solid #eee' }}>
            <HistorialPaciente pacienteId={pacienteSeleccionado.id} />
          </div>
        )}
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

      <input placeholder='Buscar por nombre, DNI, obra social o teléfono...'
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
                    {p.dni ? ' · DNI ' + p.dni : ''}
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