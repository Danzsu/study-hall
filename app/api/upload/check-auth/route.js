import { verifyIdToken, isAdminEmail } from '@/lib/firebase-admin'

export async function GET(req) {
  const token = req.headers.get('authorization')?.slice(7)
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Password fallback (when Firebase not configured)
  const adminPw = process.env.ADMIN_PASSWORD
  if (adminPw && token === adminPw) {
    return Response.json({ ok: true, email: 'admin' })
  }

  try {
    const decoded = await verifyIdToken(token)
    if (!isAdminEmail(decoded.email)) return Response.json({ error: 'Forbidden' }, { status: 403 })
    return Response.json({ ok: true, email: decoded.email })
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }
}
