import * as admin from 'firebase-admin'

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin env vars missing: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY')
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

export async function verifyIdToken(token) {
  const app = getAdminApp()
  return admin.auth(app).verifyIdToken(token)
}

export function isAdminEmail(email) {
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return allowed.includes((email || '').toLowerCase())
}
