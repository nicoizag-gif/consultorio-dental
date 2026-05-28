import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    // ... todo el código actual ...
  } catch (err) {
    console.error('ERROR GENERAL:', err.message, err.stack)
    return res.status(500).json({ error: err.message })
  }
}

  // Calcular fecha de mañana
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  const fechaManana = manana.toISOString().split('T')[0]

  // Buscar turnos de mañana con datos del paciente
  const { data: turnos, error } = await supabase
    .from('turnos')
    .select('*, pacientes(nombre, email, preferencia_notif)')
    .eq('fecha', fechaManana)
    .neq('estado', 'cancelado')

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Cargar datos del profesional
  const { data: config } = await supabase
    .from('configuracion')
    .select('*')
    .limit(1)
  const prof = config?.[0]

  const resultados = []

  for (const turno of turnos) {
    const paciente = turno.pacientes
    const prefNotif = paciente?.preferencia_notif

    // Respetar preferencia de notificación
    if (!paciente?.email || !['email', 'ambos'].includes(prefNotif)) {
      resultados.push({ turno: turno.id, status: 'omitido', motivo: 'sin email o preferencia no aplica' })
      continue
    }

    try {
      const response = await fetch(`${process.env.VITE_APP_URL}/api/enviar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: paciente.email,
          paciente: paciente.nombre,
          fecha: turno.fecha,
          hora: turno.hora.slice(0, 5),
          motivo: turno.motivo,
          duracion: turno.duracion,
          direccion: prof?.direccion ? `${prof.direccion}, ${prof.localidad || ''}` : '',
          profesional: prof ? `${prof.nombre} ${prof.apellido} — ${prof.especialidad || ''}` : '',
          esRecordatorio: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        resultados.push({ turno: turno.id, status: 'error', detalle: data })
      } else {
        resultados.push({ turno: turno.id, status: 'enviado', emailId: data.id })
      }
    } catch (e) {
      resultados.push({ turno: turno.id, status: 'excepcion', detalle: e.message })
    }
  }

  return res.status(200).json({
    fecha: fechaManana,
    total: turnos.length,
    resultados
  })
}