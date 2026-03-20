import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy } from 'firebase/firestore'
import { db } from './firebase-config'

// Chaque user a sa collection : /users/{uid}/cards/{cardId}
function userCardsRef(uid) {
  return collection(db, 'users', uid, 'cards')
}

export async function loadCardsFromFirestore(uid) {
  const q = query(userCardsRef(uid), orderBy('addedAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addCardsToFirestore(uid, cards) {
  const batch = writeBatch(db)
  cards.forEach(card => {
    const ref = doc(db, 'users', uid, 'cards', card.id)
    batch.set(ref, card)
  })
  await batch.commit()
}

export async function deleteCardFromFirestore(uid, cardId) {
  await deleteDoc(doc(db, 'users', uid, 'cards', cardId))
}

export async function clearAllCardsFirestore(uid) {
  const snap = await getDocs(userCardsRef(uid))
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}
