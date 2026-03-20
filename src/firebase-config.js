import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCBG9Wtc3ZdLoImpEa8zkzr1lnMwuPDiyA",
  authDomain: "zoo-flashcards.firebaseapp.com",
  projectId: "zoo-flashcards",
  storageBucket: "zoo-flashcards.firebasestorage.app",
  messagingSenderId: "96716412956",
  appId: "1:96716412956:web:ea68f2bb4f0fa6efdbe7d9"
}

// ═══ Seuls ces emails peuvent se connecter ═══
export const ALLOWED_EMAILS = [
  "alexdhn1@gmail.com",
  "student.music.network.venues@gmail.com",
]

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
