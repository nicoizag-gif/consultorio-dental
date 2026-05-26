import { useState } from 'react'

const DIENTES_PERM_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const DIENTES_PERM_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
const DIENTES_TEMP_SUP = [55,54,53,52,51,61,62,63,64,65]
const DIENTES_TEMP_INF = [85,84,83,82,81,71,72,73,74,75]

const HERRAMIENTAS = [
  { id:'caries',   label:'Caries',        color:'#E24B4A', tipo:'cara' },
  { id:'ausente',  label:'Ausente',        color:'#E24B4A', tipo:'diente' },
  { id:'corona',   label:'Corona',         color:'#7F77DD', tipo:'diente' },
  { id:'tc',       label:'Trat. conducto', color:'#EF9F27', tipo:'indicador' },
  { id:'implante', label:'Implante',       color:'#378ADD', tipo:'indicador' },
  { id:'limpiar',  label:'Limpiar',        color:'#888',    tipo:'limpiar' },
]

const FACES = ['top','bot','left','right','center']

function getFaceCoords(size) {
  const pad = 1
  const third = (size - pad * 2) / 3
  return {
    top:    { x: pad + third,       y: pad,             w: third, h: third },
    bot:    { x: pad + third,       y: pad + 2 * third, w: third, h: third },
    left:   { x: pad,               y: pad + third,     w: third, h: third },
    right:  { x: pad + 2 * third,   y: pad + third,     w: third, h: third },
    center: { x: pad + third,       y: pad + third,     w: third, h: third },
  }
}

function Diente({ num, estado, herramienta, onChange }) {
  const size = 36
  const coords = getFaceCoords(size)
  const caras = estado?.caras || {}
  const esAusente = estado?.ausente || false
  const tieneCorona = estado?.corona || false
  const tieneTC = estado?.tc || false
  const tieneImplante = estado?.implante || false

  function handleClick(face) {
    if (herramienta === 'limpiar') {
      onChange(num, { caras:{}, ausente:false, corona:false, tc:false, implante:false })
      return
    }
    if (herramienta === 'ausente') {
      onChange(num, { ...estado, caras, ausente: !esAusente })
      return
    }
    if (herramienta === 'corona') {
      onChange(num, { ...estado, caras, corona: !tieneCorona })
      return
    }
    if (herramienta === 'tc') {
      onChange(num, { ...estado, caras, tc: !tieneTC })
      return
    }
    if (herramienta === 'implante') {
      onChange(num, { ...estado, caras, implante: !tieneImplante })
      return
    }
    const isOn = caras[face] === 'caries'
    const nuevas = { ...caras }
    if (isOn) delete nuevas[face]
    else nuevas[face] = 'caries'
    onChange(num, { ...estado, caras: nuevas })
  }

  function handleClickNum() {
    if (herramienta === 'limpiar') {
      onChange(num, { caras:{}, ausente:false, corona:false, tc:false, implante:false })
      return
    }
    if (herramienta === 'caries') {
      const todasMarcadas = FACES.every(f => caras[f] === 'caries')
      const nuevas = todasMarcadas ? {} : Object.fromEntries(FACES.map(f => [f,'caries']))
      onChange(num, { ...estado, caras: nuevas })
      return
    }
    handleClick('center')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1px' }}>
      <div style={{ fontSize:'9px', color:'#999', textAlign:'center',
        lineHeight:1, cursor:'pointer', userSelect:'none' }}
        onClick={handleClickNum}>{num}</div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ cursor:'pointer' }}>
        {esAusente ? (
          <>
            <line x1="4" y1="4" x2={size-4} y2={size-4}
              stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"
              onClick={handleClickNum} />
            <line x1={size-4} y1="4" x2="4" y2={size-4}
              stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"
              onClick={handleClickNum} />
          </>
        ) : (
          FACES.map(face => {
            const c = coords[face]
            const marcada = caras[face] === 'caries'
            return (
              <rect key={face} x={c.x} y={c.y} width={c.w} height={c.h} rx={1.5}
                fill={marcada ? '#E24B4A' : '#fff'}
                stroke="#ccc" strokeWidth={0.8}
                onClick={() => handleClick(face)} />
            )
          })
        )}
        {tieneCorona && !esAusente && (
          <circle cx={size/2} cy={size/2} r={size/2 - 2}
            fill="none" stroke="#7F77DD" strokeWidth={2.5}
            onClick={() => handleClick('center')} />
        )}
      </svg>

      <div style={{ display:'flex', gap:'2px', justifyContent:'center', minHeight:'14px' }}>
        {tieneTC && (
          <div onClick={() => handleClick('center')}
            style={{ width:'13px', height:'13px', borderRadius:'2px',
              background:'#EF9F27', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'9px', fontWeight:'700',
              color:'#fff', fontFamily:'monospace', cursor:'pointer' }}>T</div>
        )}
        {tieneImplante && (
          <div onClick={() => handleClick('center')}
            style={{ width:'13px', height:'13px', borderRadius:'2px',
              background:'#378ADD', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'9px', fontWeight:'700',
              color:'#fff', fontFamily:'monospace', cursor:'pointer' }}>I</div>
        )}
      </div>
    </div>
  )
}

function FilaDientes({ dientes, estados, herramienta, onChange }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:'3px', padding:'4px 0' }}>
      {dientes.map(num => (
        <Diente key={num} num={num}
          estado={estados[num]}
          herramienta={herramienta}
          onChange={onChange} />
      ))}
    </div>
  )
}

export default function Odontograma({ value, onChange, readOnly }) {
  const [herramienta, setHerramienta] = useState('caries')
  const estados = value || {}

  function handleChange(num, nuevoEstado) {
    if (readOnly) return
    const nuevo = { ...estados }
    const vacio = !nuevoEstado?.ausente && !nuevoEstado?.corona &&
      !nuevoEstado?.tc && !nuevoEstado?.implante &&
      Object.keys(nuevoEstado?.caras || {}).length === 0
    if (vacio) delete nuevo[num]
    else nuevo[num] = nuevoEstado
    onChange(nuevo)
  }

  const sep = { height:'2px', background:'#ddd', margin:'2px 0' }

  return (
    <div>
      {!readOnly && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
          {HERRAMIENTAS.map(h => (
            <button key={h.id} onClick={() => setHerramienta(h.id)}
              style={{ fontSize:'12px', padding:'5px 10px', borderRadius:'6px', cursor:'pointer',
                border: herramienta === h.id ? `1.5px solid ${h.color}` : '1px solid #ddd',
                background: herramienta === h.id ? h.color+'22' : '#fff',
                color: herramienta === h.id ? h.color : '#555',
                fontWeight: herramienta === h.id ? '600' : '400',
                display:'flex', alignItems:'center', gap:'6px' }}>
              {h.id === 'tc' && (
                <span style={{ width:'12px', height:'12px', borderRadius:'2px',
                  background:'#EF9F27', display:'inline-flex', alignItems:'center',
                  justifyContent:'center', fontSize:'8px', fontWeight:'700',
                  color:'#fff', fontFamily:'monospace' }}>T</span>
              )}
              {h.id === 'implante' && (
                <span style={{ width:'12px', height:'12px', borderRadius:'2px',
                  background:'#378ADD', display:'inline-flex', alignItems:'center',
                  justifyContent:'center', fontSize:'8px', fontWeight:'700',
                  color:'#fff', fontFamily:'monospace' }}>I</span>
              )}
              {h.id === 'ausente' && (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <line x1="1" y1="1" x2="11" y2="11" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="11" y1="1" x2="1" y2="11" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              {h.id === 'corona' && (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <circle cx="6" cy="6" r="5" fill="none" stroke="#7F77DD" strokeWidth="1.5"/>
                </svg>
              )}
              {h.id === 'caries' && (
                <span style={{ width:'10px', height:'10px', borderRadius:'2px',
                  background:'#E24B4A', display:'inline-block' }} />
              )}
              {h.id === 'limpiar' && (
                <span style={{ width:'10px', height:'10px', borderRadius:'2px',
                  background:'#888', display:'inline-block' }} />
              )}
              {h.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'10px' }}>
        {[
          { label:'Caries', tipo:'cuadrado', color:'#E24B4A' },
          { label:'Ausente', tipo:'x', color:'#E24B4A' },
          { label:'Corona', tipo:'circulo', color:'#7F77DD' },
          { label:'Trat. conducto', tipo:'letra', color:'#EF9F27', letra:'T' },
          { label:'Implante', tipo:'letra', color:'#378ADD', letra:'I' },
        ].map(h => (
          <div key={h.label} style={{ display:'flex', alignItems:'center', gap:'4px',
            fontSize:'11px', color:'#666' }}>
            {h.tipo === 'cuadrado' && (
              <span style={{ width:'11px', height:'11px', borderRadius:'2px',
                background:h.color, display:'inline-block' }} />
            )}
            {h.tipo === 'x' && (
              <svg width="11" height="11" viewBox="0 0 11 11">
                <line x1="1" y1="1" x2="10" y2="10" stroke={h.color} strokeWidth="2" strokeLinecap="round"/>
                <line x1="10" y1="1" x2="1" y2="10" stroke={h.color} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {h.tipo === 'circulo' && (
              <svg width="11" height="11" viewBox="0 0 11 11">
                <circle cx="5.5" cy="5.5" r="4.5" fill="none" stroke={h.color} strokeWidth="1.5"/>
              </svg>
            )}
            {h.tipo === 'letra' && (
              <span style={{ width:'13px', height:'13px', borderRadius:'2px',
                background:h.color, display:'inline-flex', alignItems:'center',
                justifyContent:'center', fontSize:'9px', fontWeight:'700',
                color:'#fff', fontFamily:'monospace' }}>{h.letra}</span>
            )}
            {h.label}
          </div>
        ))}
      </div>

      <div style={{ background:'#f8f8f6', borderRadius:'10px', padding:'12px',
        border:'1px solid #eee', overflowX:'auto' }}>
        <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textAlign:'center',
          margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
          Dentición permanente
        </p>
        <FilaDientes dientes={DIENTES_PERM_SUP} estados={estados}
          herramienta={herramienta} onChange={handleChange} />
        <div style={sep} />
        <FilaDientes dientes={DIENTES_PERM_INF} estados={estados}
          herramienta={herramienta} onChange={handleChange} />

        <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textAlign:'center',
          margin:'12px 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
          Dentición temporaria
        </p>
        <FilaDientes dientes={DIENTES_TEMP_SUP} estados={estados}
          herramienta={herramienta} onChange={handleChange} />
        <div style={sep} />
        <FilaDientes dientes={DIENTES_TEMP_INF} estados={estados}
          herramienta={herramienta} onChange={handleChange} />
      </div>

      {!readOnly && (
        <p style={{ fontSize:'10px', color:'#aaa', margin:'6px 0 0' }}>
          Caries: clic en cada cara individual · Clic en número marca todas las caras ·
          Ausente / Corona / TC / Implante: clic en cualquier parte del diente
        </p>
      )}
    </div>
  )
}