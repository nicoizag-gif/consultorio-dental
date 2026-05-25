import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PRESTACIONES = ['Consulta general','Obturación composite','Obturación amalgama',
  'Extracción','Trat. de conducto','Limpieza / profilaxis','Corona','Implante',
  'Blanqueamiento','Ortodoncia','Radiografía','Otra prestación']
const PAGOS = ['Efectivo','Transferencia','Débito','Crédito','Obra social']

export default function CuentaCorriente() {
  const [pacientes, setPacientes] = useState([])
  const [pacienteId, setPacienteId] = useState('')
  const [movimientos, setMovimientos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formTab, setFormTab] = useState('debe')
  const [form, setForm] = useState({ fecha:'', concepto:'Consulta general', diente:'', tipo:'debe', importe:'', codigo_prestacion:'', obs:'' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { cargarPacientes() }, [])
  useEffect(() => { if (pacienteId) cargarMovimientos() }, [pacienteId])

  async function cargarPacientes() {
    const { data } = await supabase.from('pacientes').select('id, nombre, obra_social').order('nombre')
    setPacientes(data || [])
    if (data && data.length > 0) setPacienteId(data[0].id)
  }

  async function cargarMovimientos() {
    setLoading(true)
    const { data } = await supabase.from('cuenta_corriente')
      .select('*').eq('paciente_id', pacienteId).order('fecha').order('created_at')
    setMovimientos(data || [])
    setLoading(false)
  }

  async function guardarMovimiento() {
    if (!form.importe || parseFloat(form.importe) <= 0) { alert('Ingresá un importe válido'); return }
    if (!form.fecha) { alert('Ingresá la fecha'); return }
    const datos = {
      paciente_id: pacienteId,
      fecha: form.fecha,
      concepto: form.concepto,
      diente: form.diente || null,
      tipo: formTab,
      importe: parseFloat(form.importe),
      codigo_prestacion: form.codigo_prestacion || null,
      obs: form.obs || null,
    }
    const { error } = await supabase.from('cuenta_corriente').insert([datos])
    if (error) { alert('Error: ' + error.message); return }
    await cargarMovimientos()
    setShowForm(false)
    setForm({ fecha:'', concepto:'Consulta general', diente:'', tipo:'debe', importe:'', codigo_prestacion:'', obs:'' })
  }

  async function eliminarMovimiento(id) {
    if (!confirm('¿Eliminar este movimiento?')) return
    await supabase.from('cuenta_corriente').delete().eq('id', id)
    await cargarMovimientos()
  }

  const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR')

  const conSaldo = movimientos.reduce((acc, m, i) => {
    const prev = i > 0 ? acc[i-1].saldo : 0
    const saldo = m.tipo === 'debe' ? prev + m.importe : prev - m.importe
    return [...acc, { ...m, saldo }]
  }, [])

  const totalDebe = movimientos.filter(m => m.tipo === 'debe').reduce((a, m) => a + m.importe, 0)
  const totalHaber = movimientos.filter(m => m.tipo === 'haber').reduce((a, m) => a + m.importe, 0)
  const saldoFinal = totalDebe - totalHaber
  const pacienteActual = pacientes.find(p => p.id === pacienteId)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding:'28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>Cuenta corriente</h1>
          <p style={{ color:'#888', fontSize:'13px', margin:'4px 0 0' }}>Debe · Haber · Saldo por paciente</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
          + Nuevo movimiento
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
        {pacienteActual?.obra_social && (
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Obra social</p>
            <p style={{ fontSize:'13px', fontWeight:'500', margin:0 }}>{pacienteActual.obra_social}</p>
          </div>
        )}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontSize:'11px', color:'#888', margin:'0 0 2px' }}>Saldo actual</p>
          <p style={{ fontSize:'18px', fontWeight:'600', margin:0,
            color: saldoFinal > 0 ? '#E24B4A' : saldoFinal < 0 ? '#1D9E75' : '#888' }}>
            {fmt(Math.abs(saldoFinal))} {saldoFinal > 0 ? 'D' : saldoFinal < 0 ? 'H' : ''}
          </p>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Total facturado', val: fmt(totalDebe), color:'#E24B4A' },
          { label:'Total cobrado', val: fmt(totalHaber), color:'#1D9E75' },
          { label:'Saldo pendiente', val: fmt(Math.abs(saldoFinal)), color: saldoFinal > 0 ? '#E24B4A' : '#1D9E75' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #eee', borderRadius:'10px', padding:'12px 16px' }}>
            <p style={{ fontSize:'11px', color:'#888', margin:'0 0 4px' }}>{label}</p>
            <p style={{ fontSize:'20px', fontWeight:'600', margin:0, color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* FORM NUEVO MOVIMIENTO */}
      {showForm && (
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'14px',
          padding:'22px', marginBottom:'16px', maxWidth:'580px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <p style={{ fontWeight:'600', fontSize:'15px', margin:0 }}>Nuevo movimiento</p>
            <button onClick={() => setShowForm(false)}
              style={{ border:'none', background:'none', cursor:'pointer', fontSize:'18px', color:'#888' }}>×</button>
          </div>

          {/* TABS DEBE / HABER */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
            {[
              { key:'debe', label:'↑ Prestación / Debe', bg:'#FCEBEB', color:'#E24B4A' },
              { key:'haber', label:'↓ Pago / Haber', bg:'#E1F5EE', color:'#1D9E75' },
            ].map(({ key, label, bg, color }) => (
              <button key={key} onClick={() => {
                setFormTab(key)
                setForm({...form, concepto: key === 'debe' ? 'Consulta general' : 'Efectivo'})
              }}
                style={{ flex:1, padding:'8px', border:'none', borderRadius:'8px', fontSize:'13px',
                  cursor:'pointer', fontWeight:'500',
                  background: formTab === key ? bg : '#f5f5f5',
                  color: formTab === key ? color : '#888' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>Fecha</label>
              <input type='date' value={form.fecha || today}
                onChange={e => setForm({...form, fecha: e.target.value})}
                style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>Importe ($)</label>
              <input type='number' value={form.importe} placeholder='0.00' min='0' step='0.01'
                onChange={e => setForm({...form, importe: e.target.value})}
                style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>{formTab === 'debe' ? 'Prestación' : 'Forma de pago'}</label>
              <select value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})}
                style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
                {(formTab === 'debe' ? PRESTACIONES : PAGOS).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {formTab === 'debe' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Diente n° (opcional)</label>
                <input type='text' value={form.diente} placeholder='—'
                  onChange={e => setForm({...form, diente: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
              </div>
            )}
            {formTab === 'debe' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                <label style={{ fontSize:'11px', color:'#666' }}>Código prestación (opcional)</label>
                <input type='text' value={form.codigo_prestacion} placeholder='01.01'
                  onChange={e => setForm({...form, codigo_prestacion: e.target.value})}
                  style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:'3px', gridColumn:'span 2' }}>
              <label style={{ fontSize:'11px', color:'#666' }}>Observación</label>
              <input type='text' value={form.obs} placeholder='Notas adicionales...'
                onChange={e => setForm({...form, obs: e.target.value})}
                style={{ padding:'6px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
            </div>
          </div>
          <button onClick={guardarMovimiento}
            style={{ width:'100%', padding:'10px', background:'#378ADD', color:'#fff',
              border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'500', cursor:'pointer' }}>
            Registrar movimiento
          </button>
        </div>
      )}

      {/* TABLA */}
      {loading ? <p style={{ color:'#888' }}>Cargando...</p> : movimientos.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px', color:'#888' }}>
          <p style={{ fontSize:'28px' }}>💰</p>
          <p>No hay movimientos todavía.</p>
        </div>
      ) : (
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'#f8f8f6' }}>
                  {['Fecha','Concepto','Diente','Tipo','Debe','Haber','Saldo',''].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign: ['Debe','Haber','Saldo'].includes(h) ? 'right' : 'left',
                      fontSize:'11px', fontWeight:'500', color:'#888', borderBottom:'1px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conSaldo.map(m => (
                  <tr key={m.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                    <td style={{ padding:'9px 12px', color:'#888', whiteSpace:'nowrap' }}>
                      {m.fecha?.split('-').reverse().join('/')}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <p style={{ margin:0, fontWeight:'500' }}>{m.concepto}</p>
                      {m.obs && <p style={{ margin:'1px 0 0', fontSize:'11px', color:'#888' }}>{m.obs}</p>}
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'center', color:'#888' }}>{m.diente || '—'}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px',
                        background: m.tipo === 'debe' ? '#FCEBEB' : '#E1F5EE',
                        color: m.tipo === 'debe' ? '#E24B4A' : '#1D9E75' }}>
                        {m.tipo === 'debe' ? 'Prestación' : 'Pago'}
                      </span>
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'right', color:'#E24B4A', fontWeight:'500' }}>
                      {m.tipo === 'debe' ? fmt(m.importe) : '—'}
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'right', color:'#1D9E75', fontWeight:'500' }}>
                      {m.tipo === 'haber' ? fmt(m.importe) : '—'}
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:'500',
                      color: m.saldo > 0 ? '#E24B4A' : m.saldo < 0 ? '#1D9E75' : '#888' }}>
                      {fmt(Math.abs(m.saldo))} {m.saldo > 0 ? 'D' : m.saldo < 0 ? 'H' : ''}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <button onClick={() => eliminarMovimiento(m.id)}
                        style={{ padding:'3px 8px', background:'#f5f5f5', color:'#888',
                          border:'none', borderRadius:'5px', fontSize:'11px', cursor:'pointer' }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f8f8f6', borderTop:'2px solid #eee' }}>
                  <td colSpan={4} style={{ padding:'10px 12px', fontWeight:'600', fontSize:'13px' }}>Total</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'600', color:'#E24B4A' }}>{fmt(totalDebe)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'600', color:'#1D9E75' }}>{fmt(totalHaber)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:'600',
                    color: saldoFinal > 0 ? '#E24B4A' : '#1D9E75' }}>
                    {fmt(Math.abs(saldoFinal))} {saldoFinal > 0 ? 'D' : 'H'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}