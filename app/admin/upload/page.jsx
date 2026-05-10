'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Upload from '@/src/screens/Upload'

export default function AdminUploadPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('admin-token')
    if (!token) {
      router.replace('/admin/login')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F2EE',
      }}>
        <p style={{ color: '#6B6560', fontSize: 14 }}>Ellenőrzés...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F2EE', padding: '40px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <img
            src="/assets/mascot-plain.png"
            alt=""
            style={{ width: 40, height: 40, objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
            Study Hall Admin
          </h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin-token')
              document.cookie = 'admin-token=; Max-Age=0; path=/'
              router.replace('/admin/login')
            }}
            style={{
              marginLeft: 'auto',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #E4DDD4',
              background: '#F0ECE6',
              color: '#6B6560',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Kijelentkezés
          </button>
        </div>

        {/* Upload screen */}
        <Upload />
      </div>
    </div>
  )
}
