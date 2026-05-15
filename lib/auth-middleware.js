import { verifyIdToken, isAdminEmail } from './firebase-admin'

export async function requireAdmin(req) {
  const token = req.headers.get('authorization')?.slice(7)
  if (!token) return null
  const adminPw = process.env.ADMIN_PASSWORD
  if (adminPw && token === adminPw) return { email: 'admin', uid: 'local' }
  try {
    const decoded = await verifyIdToken(token)
    return isAdminEmail(decoded.email) ? decoded : null
  } catch {
    return null
  }
}
