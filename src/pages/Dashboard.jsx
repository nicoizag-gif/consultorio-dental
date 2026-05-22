export default function Dashboard() {
  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
        Buenos días 👋
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Sistema de gestión odontológica
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Turnos hoy', valor: '0', color: '#E6F1FB' },
          { label: 'Pacientes este mes', valor: '0', color: '#E1F5EE' },
          { label: 'Facturado', valor: '$0', color: '#EAF3DE' },
          { label: 'Saldo pendiente', valor: '$0', color: '#FAEEDA' },
        ].map(({ label, valor, color }) => (
          <div key={label} style={{ background: color, borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>{valor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}