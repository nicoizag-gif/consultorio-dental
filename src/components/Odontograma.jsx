import { useState } from 'react'

const DIENTES_PERM_SUP = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const DIENTES_PERM_INF = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]
const DIENTES_TEMP_SUP = [55,54,53,52,51,61,62,63,64,65]
const DIENTES_TEMP_INF = [85,84,83,82,81,71,72,73,74,75]

const HERRAMIENTAS = [
  { id:'caries',     label:'Caries',        color:'#E24B4A' },
  { id:'restaurado', label:'Restaurado',    color:'#1D9E75' },
  { id:'ausente',    label:'Ausente',       color:'#B4B2A9' },
  { id:'corona',     label:'Corona',        color:'#7F77DD' },
  { id:'tc',         label:'Trat. conducto',color:'#EF9F27' },
  { id:'limpiar',    label:'Limpiar',       color:'#888'    },
]

const COLOR = Object.fromEntries(HERRAMIENTAS.map(h => [h.id, h.color]))

// Todas las herramientas ahora trabajan por cara
const FACES = ['top','right','center','left','bot']

const FACE_COORDS = {
  top:    { x:1+26/3,   y:1,           w:26/3, h:26/3 },
  bot:    { x:1+26/3,   y:1+2*(26/3),  w:26/3, h:26/3 },
  left:   { x:1,        y:1+26/3,      w:26/3, h:26/3 },
  right:  { x:1+2*(26/3), y:1+26/3,   w:26/3, h:26/3 },
  center: { x:1+26/3,   y:1+26/3,      w:26/3, h:26/3 },
}

function Diente({ num, estado, herramienta, onChange }) {
  // estado = { caras: { top:'caries', center:'corona', ... }, tc: bool }
  const caras = estado?.caras || {}
  const tcActivo = estado?.tc || false
  const esAusente = Object.values(caras).some(v => v === 'ausente')

  function clickFace(face) {
    if (herramienta === 'limpiar') {
      const nuevas = { ...caras }
      delete nuevas[face]
      onChange(num, { caras: nuevas, tc: tcActivo })
      return
    }
    if (herramienta === 'tc') {
      // TC marca todas las caras Y activa el punto
      const isOn = tcActivo
      const nuevas = { ...caras }
      if (isOn) {
        FACES.forEach(f => { if (nuevas[f] === 'tc') delete nuevas[f] })
      } else {
        FACES.forEach(f => { nuevas[f] = 'tc' })
      }
      onChange(num, { caras: nuevas, tc: !isOn })
      return
    }
    if (herramienta === 'ausente') {
      // Ausente marca todas las caras
      const isOn = Object.values(caras).every(v => v === 'ausente') && Object.keys(caras).length === 5
      const nuevas = isOn ? {} : Object.fromEntries(FACES.map(f => [f, 'ausente']))
      onChange(num, { caras: nuevas, tc: isOn ? false : tcActivo })
      return
    }
    // Corona marca todas las caras
if (herramienta === 'corona') {
  const isOn = FACES.every(f => caras[f] === 'corona')
  const nuevas = { ...caras }
  if (isOn) {
    FACES.forEach(f => { if (nuevas[f] === 'corona') delete nuevas[f] })
  } else {
    FACES.forEach(f => { nuevas[f] = 'corona' })
  }
  onChange(num, { caras: nuevas, tc: tcActivo })
  return
}
// Para caries y restaurado — cara individual
const isOn = caras[face] === herramienta
const nuevas = { ...caras }
if (isOn) {
  delete nuevas[face]
} else {
  nuevas[face] = herramienta
}
onChange(num, { caras: nuevas, tc: tcActivo })
  }

  function clickNum() {
    // Clic en número activa la herramienta en todas las caras
    if (herramienta === 'limpiar') {
      onChange(num, { caras: {}, tc: false })
      return
    }
    if (herramienta === 'tc') {
      clickFace('center')
      return
    }
    if (herramienta === 'ausente') {
      clickFace('center')
      return
    }
    // Para cara-a-cara, el clic en número marca todas
    const isOn = FACES.every(f => caras[f] === herramienta)
    const nuevas = { ...caras }
    if (isOn) {
      FACES.forEach(f => { if (nuevas[f] === herramienta) delete nuevas[f] })
    } else {
      FACES.forEach(f => { nuevas[f] = herramienta })
    }
    onChange(num, { caras: nuevas, tc: tcActivo })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1px' }}>
      <div style={{ fontSize:'8px', color: esAusente ? '#E24B4A' : '#999',
        cursor:'pointer', lineHeight:1, fontWeight: esAusente ? '700' : '400',
        userSelect:'none' }}
        onClick={clickNum}>{num}</div>

      {esAusente ? (
        <div style={{ width:'26px', height:'26px', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:'14px', color:'#B4B2A9',
          fontWeight:'700', cursor:'pointer' }}
          onClick={clickNum}>×</div>
      ) : (
        <svg width={26} height={26} viewBox="0 0 26 26" style={{ cursor:'pointer' }}>
          {FACES.map(face => {
            const c = FACE_COORDS[face]
            const marca = caras[face]
            return (
              <rect key={face}
                x={c.x} y={c.y} width={c.w} height={c.h} rx={1}
                fill={marca ? COLOR[marca] : '#fff'}
                stroke='#ccc' strokeWidth={0.6}
                onClick={() => clickFace(face)} />
            )
          })}
        </svg>
      )}

      {/* Punto TC */}
      <div style={{
        width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
        background: tcActivo ? '#EF9F27' : 'transparent',
        border: tcActivo ? 'none' : '1px solid #ddd',
        cursor:'pointer'
      }} onClick={() => {
        if (herramienta === 'tc' || herramienta === 'limpiar') {
          onChange(num, { caras, tc: !tcActivo })
        }
      }} />
    </div>
  )
}

function FilaDientes({ dientes, estados, herramienta, onChange }) {
  return (
    <div style={{ display:'flex', justifyContent:'center', gap:'2px', padding:'4px 0' }}>
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
    const caras = nuevoEstado?.caras || {}
    const tc = nuevoEstado?.tc || false
    if (Object.keys(caras).length === 0 && !tc) {
      delete nuevo[num]
    } else {
      nuevo[num] = nuevoEstado
    }
    onChange(nuevo)
  }

  const sep = { height:'2px', background:'#ddd', margin:'2px 0' }

  return (
    <div>
      {!readOnly && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
          {HERRAMIENTAS.map(h => (
            <button key={h.id} onClick={() => setHerramienta(h.id)}
              style={{ fontSize:'11px', padding:'4px 9px', borderRadius:'6px', cursor:'pointer',
                border: herramienta === h.id ? `1.5px solid ${h.color}` : '1px solid #ddd',
                background: herramienta === h.id ? h.color+'22' : '#fff',
                color: herramienta === h.id ? h.color : '#555',
                fontWeight: herramienta === h.id ? '600' : '400' }}>
              <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'2px',
                background: h.color, marginRight:'5px', verticalAlign:'middle' }} />
              {h.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'8px' }}>
        {HERRAMIENTAS.filter(h => h.id !== 'limpiar').map(h => (
          <div key={h.id} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#666' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'2px',
              background: h.color, display:'inline-block' }} />
            {h.label}
          </div>
        ))}
      </div>

      <div style={{ background:'#f8f8f6', borderRadius:'10px', padding:'10px', border:'1px solid #eee' }}>
        <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textAlign:'center',
          margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
          Dentición permanente
        </p>
        <FilaDientes dientes={DIENTES_PERM_SUP} estados={estados} herramienta={herramienta} onChange={handleChange} />
        <div style={sep} />
        <FilaDientes dientes={DIENTES_PERM_INF} estados={estados} herramienta={herramienta} onChange={handleChange} />

        <p style={{ fontSize:'10px', fontWeight:'600', color:'#888', textAlign:'center',
          margin:'10px 0 4px', textTransform:'uppercase', letterSpacing:'.05em' }}>
          Dentición temporaria
        </p>
        <FilaDientes dientes={DIENTES_TEMP_SUP} estados={estados} herramienta={herramienta} onChange={handleChange} />
        <div style={sep} />
        <FilaDientes dientes={DIENTES_TEMP_INF} estados={estados} herramienta={herramienta} onChange={handleChange} />
      </div>

      {!readOnly && (
        <p style={{ fontSize:'10px', color:'#aaa', margin:'6px 0 0' }}>
          Caries/Restaurado/Corona: clic en cara individual o en el número para marcar todas ·
          Ausente/TC: clic en cualquier lugar de la pieza
        </p>
      )}
    </div>
  )
}