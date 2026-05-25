import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function Reportes() {
  const [movimientos, setMovimientos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().getMonth())
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [filtroOS, setFiltroOS] = useState('')
  const [profesional, setProfesional] = useState('Dr./Dra. — Odontología')

  useEffect(() => { cargarDatos() }, [mes, anio])

  async function cargarDatos() {
    setLoading(true)
  const mesStr = String(mes+1).padStart(2,'0')
  const desde = `${anio}-${mesStr}-01`
  // Último día real del mes
  const ultimoDia = new Date(anio, mes+1, 0).getDate()
  const hasta = `${anio}-${mesStr}-${String(ultimoDia).padStart(2,'0')}`
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from('cuenta_corriente')
        .select('*, pacientes(nombre, obra_social, nro_afiliado, email, telefono)')
        .eq('tipo', 'debe')
        .gte('fecha', desde)
        .lte('fecha', hasta)
        .order('fecha'),
      supabase.from('pacientes').select('id, nombre, obra_social').order('nombre')
    ])
    setMovimientos(m || [])
    setPacientes(p || [])
    setLoading(false)
  }

  const fmt = n => '$' + Math.round(n).toLocaleString('es-AR')

  const obrasSociales = [...new Set(
    movimientos.map(m => m.pacientes?.obra_social || 'Particular').filter(Boolean)
  )].sort()

  const movFiltrados = filtroOS
    ? movimientos.filter(m => (m.pacientes?.obra_social || 'Particular') === filtroOS)
    : movimientos

  // Agrupar por obra social
  const porOS = obrasSociales.reduce((acc, os) => {
    const movOS = movimientos.filter(m => (m.pacientes?.obra_social || 'Particular') === os)
    const porPac = {}
    movOS.forEach(m => {
      const id = m.paciente_id
      if (!porPac[id]) porPac[id] = { paciente: m.pacientes, movs: [] }
      porPac[id].movs.push(m)
    })
    acc[os] = porPac
    return acc
  }, {})

  const totalGeneral = movFiltrados.reduce((a, m) => a + m.importe, 0)
  const totalPacientes = new Set(movFiltrados.map(m => m.paciente_id)).size

  function imprimir() {
    const osImprimir = filtroOS ? { [filtroOS]: porOS[filtroOS] } : porOS
    let html = `
      <html><head><meta charset="utf-8">
      <title>Reporte ${MESES[mes]} ${anio}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
        h1 { font-size: 16px; margin: 0 0 4px; }
        h2 { font-size: 13px; margin: 18px 0 6px; padding: 4px 8px; background: #eee; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 10px; }
        th { background: #f5f5f5; padding: 5px 7px; border-bottom: 1px solid #ccc; text-align: left; }
        td { padding: 5px 7px; border-bottom: 1px solid #eee; }
        .num { text-align: right; }
        .total { font-weight: bold; background: #f5f5f5; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
        .firma { display: flex; justify-content: space-between; margin-top: 40px; }
        .firma-line { border-top: 1px solid #999; padding-top: 4px; width: 200px; text-align: center; font-size: 10px; }
        .resumen { display: flex; gap: 32px; margin-top: 16px; padding-top: 10px; border-top: 2px solid #333; font-size: 11px; }
      </style></head><body>
      <div class="header">
        <div>
          <h1>Reporte de prestaciones — ${MESES[mes]} ${anio}</h1>
          <p style="margin:2px 0;color:#555">${profesional}</p>
          <p style="margin:2px 0;color:#555">Obra social: ${filtroOS || 'Todas'}</p>
        </div>
        <div style="text-align:right;color:#888;font-size:10px">
          <p>Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}</p>
        </div>
      </div>`

    Object.entries(osImprimir).forEach(([os, pacs]) => {
      const totalOS = Object.values(pacs).reduce((a, p) => a + p.movs.reduce((b, m) => b + m.importe, 0), 0)
      const cantPacs = Object.keys(pacs).length
      const cantPrest = Object.values(pacs).reduce((a, p) => a + p.movs.length, 0)
      html += `<h2>${os} — ${cantPacs} paciente${cantPacs !== 1 ? 's' : ''} · ${cantPrest} prestación${cantPrest !== 1 ? 'es' : ''}</h2>
        <table><thead><tr>
          <th>Paciente</th><th>Afiliado</th><th>Fecha</th><th>Cód.</th>
          <th>Prestación</th><th>Diente</th><th class="num">Importe</th>
        </tr></thead><tbody>`
      Object.values(pacs).forEach(({ paciente, movs }) => {
        movs.forEach((m, i) => {
          html += `<tr>
            <td>${i === 0 ? paciente?.nombre || '—' : ''}</td>
            <td>${i === 0 ? paciente?.nro_afiliado || '—' : ''}</td>
            <td>${m.fecha?.split('-').reverse().join('/')}</td>
            <td>${m.codigo_prestacion || '—'}</td>
            <td>${m.concepto}</td>
            <td style="text-align:center">${m.diente || '—'}</td>
            <td class="num">${fmt(m.importe)}</td>
          </tr>`
        })
        const subTotal = movs.reduce((a, m) => a + m.importe, 0)
        html += `<tr style="background:#fafafa">
          <td colspan="6" style="font-style:italic;color:#666">Subtotal ${paciente?.nombre?.split(',')[0]}</td>
          <td class="num" style="font-weight:500">${fmt(subTotal)}</td>
        </tr>`
      })
      html += `<tr class="total">
        <td colspan="6">TOTAL ${os.toUpperCase()}</td>
        <td class="num">${fmt(totalOS)}</td>
      </tr></tbody></table>`
    })

    html += `<div class="resumen">
      <span><strong>Total prestaciones:</strong> ${movFiltrados.length}</span>
      <span><strong>Pacientes atendidos:</strong> ${totalPacientes}</span>
      <span><strong>Total facturado:</strong> ${fmt(totalGeneral)}</span>
    </div>
    <div class="firma">
      <div class="firma-line">Firma del profesional</div>
      <div class="firma-line">Sello</div>
    </div>
    </body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  return (
    <div style={{ padding:'28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>Reportes — obras sociales</h1>
          <p style={{ color:'#888', fontSize:'13px', margin:'4px 0 0' }}>Prestaciones mensuales para presentación</p>
        </div>
        <button onClick={imprimir}
          style={{ padding:'9px 18px', background:'#378ADD', color:'#fff', border:'none',
            borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'500' }}>
          🖨️ Imprimir reporte
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px',
        padding:'16px 20px', marginBottom:'16px', display:'grid',
        gridTemplateColumns:'1fr 1fr 1fr 2fr', gap:'12px', alignItems:'end' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'11px', color:'#666' }}>Mes</label>
          <select value={mes} onChange={e => setMes(parseInt(e.target.value))}
            style={{ padding:'7px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'11px', color:'#666' }}>Año</label>
          <select value={anio} onChange={e => setAnio(parseInt(e.target.value))}
            style={{ padding:'7px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
            {[2024,2025,2026,2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'11px', color:'#666' }}>Obra social</label>
          <select value={filtroOS} onChange={e => setFiltroOS(e.target.value)}
            style={{ padding:'7px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }}>
            <option value=''>Todas</option>
            {obrasSociales.map(os => <option key={os} value={os}>{os}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <label style={{ fontSize:'11px', color:'#666' }}>Nombre del profesional</label>
          <input value={profesional} onChange={e => setProfesional(e.target.value)}
            style={{ padding:'7px 9px', border:'1px solid #ddd', borderRadius:'7px', fontSize:'13px' }} />
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'Total prestaciones', val: movFiltrados.length },
          { label:'Pacientes atendidos', val: totalPacientes },
          { label:'Total facturado', val: fmt(totalGeneral) },
        ].map(({ label, val }) => (
          <div key={label} style={{ background:'#fff', border:'1px solid #eee', borderRadius:'10px', padding:'14px 18px' }}>
            <p style={{ fontSize:'11px', color:'#888', margin:'0 0 4px' }}>{label}</p>
            <p style={{ fontSize:'22px', fontWeight:'600', margin:0 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* CONTENIDO */}
      {loading ? <p style={{ color:'#888' }}>Cargando...</p> :
        movFiltrados.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px', color:'#888' }}>
            <p style={{ fontSize:'28px' }}>📋</p>
            <p>No hay prestaciones registradas para {MESES[mes]} {anio}.</p>
            <p style={{ fontSize:'12px', marginTop:'8px' }}>Las prestaciones se cargan desde el módulo de Cuenta corriente.</p>
          </div>
        ) : (
          Object.entries(filtroOS ? { [filtroOS]: porOS[filtroOS] } : porOS).map(([os, pacs]) => {
            const totalOS = Object.values(pacs).reduce((a, p) => a + p.movs.reduce((b, m) => b + m.importe, 0), 0)
            return (
              <div key={os} style={{ background:'#fff', border:'1px solid #eee', borderRadius:'12px',
                marginBottom:'12px', overflow:'hidden' }}>
                <div style={{ background:'#EBF4FF', padding:'12px 18px', display:'flex',
                  justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontWeight:'600', fontSize:'14px', margin:0, color:'#185FA5' }}>🏥 {os}</p>
                    <p style={{ fontSize:'11px', color:'#666', margin:'2px 0 0' }}>
                      {Object.keys(pacs).length} paciente{Object.keys(pacs).length !== 1 ? 's' : ''} ·{' '}
                      {Object.values(pacs).reduce((a, p) => a + p.movs.length, 0)} prestación{Object.values(pacs).reduce((a, p) => a + p.movs.length, 0) !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <p style={{ fontSize:'16px', fontWeight:'600', margin:0, color:'#185FA5' }}>{fmt(totalOS)}</p>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                    <thead>
                      <tr style={{ background:'#f8f8f6' }}>
                        {['Paciente','Afiliado','Fecha','Cód.','Prestación','Diente','Importe'].map(h => (
                          <th key={h} style={{ padding:'8px 12px', textAlign: h === 'Importe' ? 'right' : 'left',
                            fontSize:'11px', fontWeight:'500', color:'#888', borderBottom:'1px solid #eee' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(pacs).map(({ paciente, movs }) => (
                        movs.map((m, i) => (
                          <tr key={m.id} style={{ borderBottom:'1px solid #f5f5f5' }}>
                            <td style={{ padding:'8px 12px', fontWeight: i === 0 ? '500' : '400', color: i === 0 ? '#111' : 'transparent' }}>
                              {i === 0 ? paciente?.nombre : ''}
                            </td>
                            <td style={{ padding:'8px 12px', color:'#888' }}>{i === 0 ? paciente?.nro_afiliado || '—' : ''}</td>
                            <td style={{ padding:'8px 12px', color:'#888', whiteSpace:'nowrap' }}>
                              {m.fecha?.split('-').reverse().join('/')}
                            </td>
                            <td style={{ padding:'8px 12px', color:'#888', fontFamily:'monospace' }}>{m.codigo_prestacion || '—'}</td>
                            <td style={{ padding:'8px 12px' }}>{m.concepto}</td>
                            <td style={{ padding:'8px 12px', textAlign:'center', color:'#888' }}>{m.diente || '—'}</td>
                            <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:'500' }}>{fmt(m.importe)}</td>
                          </tr>
                        ))
                      ))}
                      <tr style={{ background:'#f8f8f6', borderTop:'1px solid #eee' }}>
                        <td colSpan={6} style={{ padding:'8px 12px', fontWeight:'600' }}>TOTAL {os.toUpperCase()}</td>
                        <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:'600', color:'#185FA5' }}>{fmt(totalOS)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })
        )
      }
    </div>
  )
}