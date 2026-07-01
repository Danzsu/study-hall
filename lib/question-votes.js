'use client'
import { getFirestore, doc, getDoc, runTransaction } from 'firebase/firestore'
import { getFirebaseApp } from './firebase'

function getDb() {
  const app = getFirebaseApp()
  return app ? getFirestore(app) : null
}

function calcTrustPct(positiveVotes, totalVotes) {
  return totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0
}

// voteType: 'trust' | 'distrust'
// Returns updated { positiveVotes, totalVotes, trustPct } or null on failure
export async function voteQuestion(subjectSlug, questionId, userId, voteType) {
  const db = getDb()
  if (!db || !userId) return null

  const docId = `${subjectSlug}_${questionId}`
  const trustRef = doc(db, 'questionTrustVotes', docId)
  const userVoteRef = doc(db, 'userVotes', userId, 'questionVotes', docId)

  return runTransaction(db, async (tx) => {
    const [userVoteSnap, trustSnap] = await Promise.all([tx.get(userVoteRef), tx.get(trustRef)])
    const prev = trustSnap.exists()
      ? trustSnap.data()
      : { positiveVotes: 0, totalVotes: 0 }

    if (userVoteSnap.exists()) {
      const existing = userVoteSnap.data().voteType
      if (existing === voteType) {
        return { ...prev, trustPct: calcTrustPct(prev.positiveVotes, prev.totalVotes) }
      }
      const delta = voteType === 'trust' ? 1 : -1
      const updated = { positiveVotes: prev.positiveVotes + delta, totalVotes: prev.totalVotes }
      tx.set(trustRef, updated)
      tx.set(userVoteRef, { voteType })
      return { ...updated, trustPct: calcTrustPct(updated.positiveVotes, updated.totalVotes) }
    }

    const updated = {
      positiveVotes: prev.positiveVotes + (voteType === 'trust' ? 1 : 0),
      totalVotes: prev.totalVotes + 1,
    }
    tx.set(trustRef, updated)
    tx.set(userVoteRef, { voteType })
    return { ...updated, trustPct: calcTrustPct(updated.positiveVotes, updated.totalVotes) }
  })
}

// Returns { positiveVotes, totalVotes, trustPct } or null if Firebase not configured
export async function getQuestionTrustScore(subjectSlug, questionId) {
  const db = getDb()
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, 'questionTrustVotes', `${subjectSlug}_${questionId}`))
    if (!snap.exists()) return { positiveVotes: 0, totalVotes: 0, trustPct: 0 }
    const { positiveVotes, totalVotes } = snap.data()
    return { positiveVotes, totalVotes, trustPct: calcTrustPct(positiveVotes, totalVotes) }
  } catch {
    return null
  }
}
