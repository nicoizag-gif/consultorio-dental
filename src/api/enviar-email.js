export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, paciente, fecha, hora, motivo, duracion, direccion, profesional } = req.body

  if (!to || !paciente || !fecha || !hora) {
    return res.status(400).json({ error: 'Faltan datos' })
  }

  // Generar archivo ICS
  const fechaObj = new Date(`${fecha}T${hora}:00`)
  const fechaFin = new Date(fechaObj.getTime() + (duracion || 60) * 60000)

  function fmtICS(d) {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Consultorio Dental//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@consultorio-dental`,
    `DTSTAMP:${fmtICS(new Date())}`,
    `DTSTART:${fmtICS(fechaObj)}`,
    `DTEND:${fmtICS(fechaFin)}`,
    `SUMMARY:Turno odontológico - ${profesional || 'Consultorio'}`,
    `DESCRIPTION:Prestación: ${motivo}\\nDuración: ${duracion || 60} min`,
    `LOCATION:${direccion || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const icsBase64 = Buffer.from(ics).toString('base64')

  // Fecha formateada para el email
  const [anio, mes, dia] = fecha.split('-')
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre']
  const fechaLabel = `${dia} de ${meses[parseInt(mes)-1]} de ${anio}`

  const esRecordatorio = req.body.esRecordatorio || false

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="background: #378ADD; padding: 20px 24px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">🦷 ${esRecordatorio ? 'Recordatorio de turno' : 'Turno confirmado'}</h1>
      </div>
      <div style="background: #f8f8f6; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none;">
        <p style="font-size: 15px; color: #333; margin: 0 0 16px;">
          ${esRecordatorio ? `Hola <strong>${paciente}</strong>, te recordamos que mañana tenés turno:` : `Hola <strong>${paciente}</strong>, tu turno fue confirmado:`}
        </p>
        <div style="background: #fff; border-radius: 8px; padding: 16px; border: 1px solid #eee; margin-bottom: 16px;">
          <table style="width: 100%; font-size: 14px; color: #333;">
            <tr><td style="padding: 6px 0; color: #888;">📅 Fecha</td><td style="padding: 6px 0; font-weight: bold;">${fechaLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">🕐 Hora</td><td style="padding: 6px 0; font-weight: bold;">${hora} hs</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">🦷 Prestación</td><td style="padding: 6px 0;">${motivo}</td></tr>
            <tr><td style="padding: 6px 0; color: #888;">⏱ Duración</td><td style="padding: 6px 0;">${duracion || 60} minutos</td></tr>
            ${direccion ? `<tr><td style="padding: 6px 0; color: #888;">📍 Dirección</td><td style="padding: 6px 0;">${direccion}</td></tr>` : ''}
          </table>
        </div>
        <p style="font-size: 13px; color: #888; margin: 0 0 8px;">El archivo adjunto (.ics) te permite agregar el turno a tu calendario con un clic.</p>
        <p style="font-size: 13px; color: #555; margin: 0;">
          Ante cualquier consulta comunicate con el consultorio.<br>
          <strong>${profesional || 'Consultorio odontológico'}</strong>
        </p>
      </div>
    </div>
  `

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Consultorio Dental <onboarding@resend.dev>',
        to: [to],
        subject: esRecordatorio
          ? `Recordatorio: turno mañana ${fechaLabel} a las ${hora} hs`
          : `Turno confirmado: ${fechaLabel} a las ${hora} hs`,
        html,
        attachments: [{
          filename: 'turno.ics',
          content: icsBase64,
        }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(500).json({ error: data })
    }

    return res.status(200).json({ ok: true, id: data.id })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}