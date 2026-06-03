import { createClient } from '@supabase/supabase-js'
 
export default async function handler(req, res) {
  console.log('Iniciando recordatorio-turnos...')
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALTA')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'OK' : 'FALTA')
    console.log('VITE_APP_URL:', process.env.VITE_APP_URL ? 'OK' : 'FALTA')
 
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Faltan variables de entorno de Supabase' })
    }
 
    const supabase = createClient(supabaseUrl, supabaseKey)
 
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaManana = manana.toISOString().split('T')[0]
    console.log('Buscando turnos para:', fechaManana)
 
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('*, pacientes(nombre, email, preferencia_notif)')
      .eq('fecha', fechaManana)
      .neq('estado', 'cancelado')
 
    if (error) {
      console.error('Error Supabase:', error.message)
      return res.status(500).json({ error: error.message })
    }
 
    console.log('Turnos encontrados:', turnos?.length || 0)
 
    const { data: config } = await supabase.from('configuracion').select('*').limit(1)
    const prof = config?.[0]
    const resultados = []
 
    for (const turno of turnos) {
      const paciente = turno.pacientes
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