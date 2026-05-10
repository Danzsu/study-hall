'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithGoogle, getFirebaseAuth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const hasFirebase = typeof process === 'undefined'
  ? false
  : !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY

function getInitialError(code) {
  if (code === 'forbidden') return 'Ez a fiók nem rendelkezik admin jogosultsággal.'
  if (code === 'invalid_token') return 'Érvénytelen munkamenet, kérjük jelentkezz be újra.'
  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(() => getInitialError(error))
  const [password, setPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    if (!hasFirebase) return
    const firebaseAuth = getFirebaseAuth()
    if (!firebaseAuth) return
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/upload/check-auth', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          document.cookie = `admin-token=${token}; path=/; SameSite=Strict`
          sessionStorage.setItem('admin-token', token)
          router.replace('/admin/upload')
        }
      } catch { /* not yet authenticated */ }
    })
    return () => unsub()
  }, [router])

  async function handleSignIn() {
    setLoading(true)
    setErr(null)
    try {
      const user = await signInWithGoogle()
      const token = await user.getIdToken()
      const res = await fetch('/api/upload/check-auth', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        document.cookie = `admin-token=${token}; path=/; SameSite=Strict`
        sessionStorage.setItem('admin-token', token)
        router.replace('/admin/upload')
      } else {
        setErr('Ez a Google-fiók nem rendelkezik admin hozzáféréssel.')
      }
    } catch (e) {
      setErr(e.message || 'Bejelentkezési hiba.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault()
    if (!password) return
    setPwLoading(true)
    setErr(null)
    try {
      const res = await fetch('/api/upload/check-auth', {
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.ok) {
        document.cookie = `admin-token=${password}; path=/; SameSite=Strict`
        sessionStorage.setItem('admin-token', password)
        router.replace('/admin/upload')
      } else {
        setErr('Hibás jelszó.')
      }
    } catch {
      setErr('Kapcsolódási hiba.')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F2EE' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem 2rem', width: 360, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4, color: '#1A1A1A' }}>Study Hall Admin</h1>
        <p style={{ color: '#9B9590', fontSize: '0.9rem', marginBottom: 24 }}>
          Csak jogosult fiókok léphetnek be.
        </p>

        {err && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: 16, fontSize: '0.875rem' }}>
            {err}
          </div>
        )}

        {hasFirebase && (
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: 'none',
              background: loading ? '#ccc' : '#4285F4', color: '#fff', fontWeight: 600,
              fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
            </svg>
            {loading ? 'Bejelentkezés...' : 'Belépés Google-fiókkal'}
          </button>
        )}

        {/* Password fallback */}
        <div style={{ marginTop: hasFirebase ? 24 : 0, borderTop: hasFirebase ? '1px solid #E4DDD4' : 'none', paddingTop: hasFirebase ? 20 : 0 }}>
          {hasFirebase && (
            <p style={{ fontSize: '0.8rem', color: '#9B9590', marginBottom: 12 }}>Vagy belépés jelszóval:</p>
          )}
          <form onSubmit={handlePasswordLogin} style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin jelszó"
              style={{
                flex: 1, padding: '0.6rem 0.8rem', borderRadius: 8,
                border: '1px solid #E4DDD4', fontSize: '0.9rem',
                outline: 'none', color: '#1A1A1A', background: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={pwLoading}
              style={{
                padding: '0.6rem 1rem', borderRadius: 8,
                background: pwLoading ? '#9B9590' : '#374151',
                color: '#fff', border: 'none', fontWeight: 600,
                cursor: pwLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem', whiteSpace: 'nowrap',
              }}
            >
              {pwLoading ? '...' : 'Belépés'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
