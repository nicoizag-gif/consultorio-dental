import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#1e1e2e', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'40px',
        width:'100%', maxWidth:'380px', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>

        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <p style={{ fontSize:'32px', margin:'0 0 8px' }}>🦷</p>
          <h1 style={{ fontSize:'20px', fontWeight:'700', margin:'0 0 4px', color:'#111' }}>
            Consultorio
          </h1>
          <p style={{ fontSize:'13px', color:'#888', margin:0 }}>Sistema de gestión odontológica</p>
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <label style={{ fontSize:'12px', color:'#666', fontWeight:'500' }}>Email</label>
            <input type='email' value={email} onChange={e => setEmail(e.target.value)}
              placeholder='tu@email.com' required
              style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:'9px',
                fontSize:'14px', color:'#111', outline:'none' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            <label style={{ fontSize:'12px', color:'#666', fontWeight:'500' }}>Contraseña</label>
            <input type='password' value={password} onChange={e => setPassword(e.target.value)}
              placeholder='••••••••' required
              style={{ padding:'10px 12px', border:'1px solid #ddd', borderRadius:'9px',
                fontSize:'14px', color:'#111', outline:'none' }} />
          </div>

          {error && (
            <div style={{ padding:'10px', background:'#FCEBEB', borderRadius:'8px',
              fontSize:'13px', color:'#E24B4A', textAlign:'center' }}>
              {error}
            </div>
          )}

          <button type='submit' disabled={loading}
            style={{ padding:'12px', background: loading ? '#aaa' : '#378ADD', color:'#fff',
              border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:'600',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop:'4px' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}