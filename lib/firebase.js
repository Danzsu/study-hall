'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

function getFirebaseApp() {
  if (typeof window === 'undefined') return null
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return null
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export function getFirebaseAuth() {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase not configured')
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  return result.user
}

export async function signOutUser() {
  const auth = getFirebaseAuth()
  if (auth) await signOut(auth)
}

// Backward-compat export — only valid on the client after hydration
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : null
