export default async function handler(req, res) {
  console.log('Iniciando recordatorio-turnos...')
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTA')
    console.log('KEY preview:', supabaseKey?.substring(0, 20))
    console.log('VITE_APP_URL:', process.env.VITE_APP_URL ? 'OK' : 'FALTA')

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Faltan variables de entorno de Supabase' })
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }

    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaManana = manana.toISOString().split('T')[0]
    console.log('Buscando turnos para:', fechaManana)

    const turnosRes = await fetch(
      `${supabaseUrl}/rest/v1/turnos?fecha=eq.${fechaManana}&estado=neq.cancelado&select=*`,
      { headers }
    )

    if (!turnosRes.ok) {
      const err = await turnosRes.text()
      console.error('Error fetch turnos:', err)
      return res.status(500).json({ error: err })
    }

    const turnos = await turnosRes.json()
    console.log('Turnos encontrados:', turnos.length)

    const configRes = await fetch(
      `${supabaseUrl}/rest/v1/configuracion?select=*&limit=1`,
      { headers }
    )
    const configData = await configRes.json()
    const prof = configData?.[0]

    const resultados = []

    for (const turno of turnos) {
      const pacRes = await fetch(
        `${supabaseUrl}/rest/v1/pacientes?id=eq.${turno.paciente_id}&select=nombre,email,preferencia_notif`,
        { headers }
      )
      const pacData = await pacRes.json()
      const paciente = pacData?.[0]

      console.log('Paciente:', paciente?.nombre, '| Email:', paciente?.email, '| Notif:', paciente?.preferencia_notif)

      if (!paciente?.email || !['email', 'ambos'].includes(paciente.preferencia_notif)) {
        resultados.push({ turno: turno.id, status: 'omitido' })
        continue
      }

      try {
        const appUrl = process.env.VITE_APP_URL || 'https://consultorio-dental-jade.vercel.app'
        const response = await fetch(`${appUrl}/api/enviar-email`, {
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
            profesional: prof ? `${prof.nombre} ${prof.apellido} - ${prof.especialidad || ''}` : '',
            esRecordatorio: true
          })
        })
        const data = await response.json()
        if (!response.ok) {
          console.error('Error enviando email:', JSON.stringify(data))
          resultados.push({ turno: turno.id, status: 'error', detalle: data })
        } else {
          console.log('Email enviado OK para turno:', turno.id)
          resultados.push({ turno: turno.id, status: 'enviado' })
        }
      } catch (e) {
        console.error('Excepcion enviando email:', e.message)
        resultados.push({ turno: turno.id, status: 'excepcion', detalle: e.message })
      }
    }

    return res.status(200).json({ fecha: fechaManana, total: turnos.length, resultados })
  } catch (err) {
    console.error('ERROR GENERAL:', err.message, err.stack)
    return res.status(500).json({ error: err.message })
  }
}
