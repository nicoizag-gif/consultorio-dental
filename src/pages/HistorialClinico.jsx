import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FORM_VACIO = {
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  tratamiento_realizado: '',
  medicacion: '',
  proximo_paso: '',
}

export default function HistorialClinico() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [historial, setHistorial] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarPacientes() }, [])
  useEffect(() => { if (pacienteId) cargarHistorial() }, [pacienteId])

  async function cargarPacientes() {
    const { data } = await supabase.from('pacientes').select('id, nombre, obra_social, fecha_nacimiento').order('nombre')
    setPacientes(data || [])
    if (data?.length > 0) setPacienteId(data[0].id)
  }

  async function cargarHistorial() {
    setLoading(true)
    const { data } = await supabase.from('historial_clinico')
      .select('*, turnos(hora, motivo)')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    setHistorial(data || [])
    setLoading(false)
  }

  async function guardar() {
    if (!form.descripcion.trim()) { alert('La descripción es obligatoria'); return }
    setGuardando(true)
    if (editId) {
      const { error } = await supabase.from('historial_clinico').update({
        fecha: form.fecha,
        descripcion: form.descripcion,
        tratamiento_realizado: form.tratamiento_realizado || null,
        medicacion: form.medicacion || null,
        proximo_paso: form.proximo_paso || null,
      }).eq('id', editId)
      if (error) { alert('Error: ' + error.message); setGuardando(false); return }
    } else {
      const { error } = await supabase.from('historial_clinico').insert([{
        paciente_id: pacienteId,
        fecha: form.fecha,
        descripcion: form.descripcion,
        tratamiento_realizado: form.tratamiento_realizado || null,
        medicacion: form.medicacion || null,
        proximo_paso: form.proximo_paso || null,
      }])
      if (error) { alert('Error: ' + error.message); setGuardando(false); return }
    }
    await cargarHistorial()
    setShowForm(false)
    setEditId(null)
    setForm(FORM_VACIO)
    setGuardando(false)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('historial_clinico').delete().eq('id', id)
    await cargarHistorial()
  }

  function abrirEdicion(h) {
    setForm({
      fecha: h.fecha,
      descripcion: h.descripcion || '',
      tratamiento_realizado: h.tratamiento_realizado || '',
      medicacion: h.medicacion || '',
      proximo_paso: h.proximo_paso || '',
    })
    setEditId(h.id)
    setShowForm(true)
  }

  const pacienteActual = pacientes.find(p => p.id === pacienteId)

  const campo = (label, key, multiline=false, placeholder='') => (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      <label style={{ fontSize:'11px', color:'#666' }}>{label}</label>
      {multiline ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
          placeholder={placeholder} rows={3}
          style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px',
            fontSize:'13px', resize:'vertical', fontFamily:'inherit' }} />
      ) : (
        <input type='text' value={form[key]} placeholder={placeholder}
          onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
          style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px' }} />
      )}
    </div>
  )

  return (
    <div style={{ padding:'28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>📋 Historial clínico</h1>
          <p style={{ color:'#888', fontSize:'13px', margin:'4px 0 0' }}>Evolución y registros por sesión</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(FORM_VACIO) }}
          style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
          + Nueva entrada
        </button>
      </div>

      {/* SELECTOR PACIENTE */}
      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px',
        padding:'14px 18px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ flex:1 }}>
          <label style={{ fontSize:'11px', color:'#888', display:'block', marginBottom:'4px' }}>Paciente</label>
          <select value={pacienteId} onChange={e => setPacienteId(e.target.value)}
            style={{ fontSize:'14px', fontWeight:'500', border:'none', background:'transparent',
              color:'#111', cursor:'pointer', width:'100%' }}>
            {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        {pacienteActual && (
          <div style={{ display:'flex', gap:'16px', flexShrink:0 }}>
            {pacienteActual.obra_social && (
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Obra social</p>
                <p style={{ fontSize:'13px', fontWeight:'500', margin:0 }}>{pacienteActual.obra_social}</p>
              </div>
            )}
            {pacienteActual.fecha_nacimiento && (
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Nacimiento</p>
                <p style={{ fontSize:'13px', fontWeight:'500', margin:0 }}>
                  {pacienteActual.fecha_nacimiento.split('-').reverse().join('/')}
                </p>
              </div>
            )}
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Registros</p>
              <p style={{ fontSize:'13px', fontWeight:'500', margin:0 }}>{historial.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* FORM NUEVA ENTRADA */}
      {showForm && (
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px',
          padding:'20px', marginBottom:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>
              {editId ? 'Editar registro' : 'Nueva entrada clínica'}
            </p>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'20px', color:'#888' }}>×</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
              <input type='date' value={form.fecha}
                onChange={e => setForm(f => ({...f, fecha: e.target.value}))}
                style={{ padding:'7px 10px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', maxWidth:'200px' }} />
            </div>
            {campo('Descripción / Evolución *', 'descripcion', true, 'Describí la consulta, el estado del paciente, hallazgos clínicos...')}
            {campo('Tratamiento realizado', 'tratamiento_realizado', true, 'Procedimientos realizados en esta sesión...')}
            {campo('Medicación indicada', 'medicacion', false, 'Ej: Ibuprofeno 400mg cada 8hs por 3 días')}
            {campo('Próximo paso / Indicaciones', 'proximo_paso', false, 'Ej: Control en 7 días, continuar tratamiento...')}
          </div>
          <button onClick={guardar} disabled={guardando}
            style={{ width:'100%', marginTop:'16px', padding:'10px', background: guardando ? '#aaa' : '#378ADD',
              color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px',
              fontWeight:'500', cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? 'Guardando...' : editId ? 'Guardar cambios' : 'Registrar entrada'}
          </button>
        </div>
      )}

      {/* HISTORIAL */}
      {loading ? <p style={{ color:'#888' }}>Cargando...</p> :
        historial.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px', color:'#888' }}>
            <p style={{ fontSize:'32px', margin:'0 0 8px' }}>📋</p>
            <p style={{ fontSize:'14px', fontWeight:'500', margin:'0 0 4px' }}>Sin registros clínicos</p>
            <p style={{ fontSize:'12px' }}>Agregá la primera entrada con el botón "Nueva entrada".</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {historial.map((h, idx) => (
              <div key={h.id} style={{ background:'#fff', border:'1px solid #eee',
                borderRadius:'12px', overflow:'hidden' }}>
                {/* HEADER */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'12px 16px', background: idx === 0 ? '#EBF4FF' : '#f8f8f6',
                  borderBottom:'1px solid #eee' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%',
                      background: idx === 0 ? '#378ADD' : '#ccc', flexShrink:0 }} />
                    <p style={{ fontWeight:'600', fontSize:'14px', margin:0,
                      color: idx === 0 ? '#378ADD' : '#333' }}>
                      {h.fecha?.split('-').reverse().join('/')}
                      {idx === 0 && <span style={{ fontSize:'10px', marginLeft:'8px',
                        background:'#378ADD', color:'#fff', padding:'1px 7px',
                        borderRadius:'20px' }}>Última entrada</span>}
                    </p>
                    {h.turnos && (
                      <span style={{ fontSize:'11px', color:'#888' }}>
                        · Turno {h.turnos.hora?.slice(0,5)} — {h.turnos.motivo}
                      </span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={() => abrirEdicion(h)}
                      style={{ padding:'4px 10px', background:'#E6F1FB', border:'none',
                        borderRadius:'6px', color:'#185FA5', fontSize:'11px', cursor:'pointer' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => eliminar(h.id)}
                      style={{ padding:'4px 8px', background:'#FCEBEB', border:'none',
                        borderRadius:'6px', color:'#E24B4A', fontSize:'11px', cursor:'pointer' }}>
                      🗑
                    </button>
                  </div>
                </div>
                {/* CONTENIDO */}
                <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div>
                    <p style={{ fontSize:'11px', color:'#888', margin:'0 0 3px', fontWeight:'500',
                      textTransform:'uppercase', letterSpacing:'.04em' }}>Evolución</p>
                    <p style={{ fontSize:'13px', color:'#111', margin:0, lineHeight:1.5 }}>{h.descripcion}</p>
                  </div>
                  {h.tratamiento_realizado && (
                    <div>
                      <p style={{ fontSize:'11px', color:'#888', margin:'0 0 3px', fontWeight:'500',
                        textTransform:'uppercase', letterSpacing:'.04em' }}>Tratamiento realizado</p>
                      <p style={{ fontSize:'13px', color:'#333', margin:0, lineHeight:1.5 }}>{h.tratamiento_realizado}</p>
                    </div>
                  )}
                  <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                    {h.medicacion && (
                      <div style={{ background:'#FAEEDA', borderRadius:'8px', padding:'8px 12px', flex:1, minWidth:'200px' }}>
                        <p style={{ fontSize:'10px', color:'#633806', margin:'0 0 2px', fontWeight:'600' }}>💊 MEDICACIÓN</p>
                        <p style={{ fontSize:'12px', color:'#633806', margin:0 }}>{h.medicacion}</p>
                      </div>
                    )}
                    {h.proximo_paso && (
                      <div style={{ background:'#E1F5EE', borderRadius:'8px', padding:'8px 12px', flex:1, minWidth:'200px' }}>
                        <p style={{ fontSize:'10px', color:'#085041', margin:'0 0 2px', fontWeight:'600' }}>→ PRÓXIMO PASO</p>
                        <p style={{ fontSize:'12px', color:'#085041', margin:0 }}>{h.proximo_paso}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}