import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBgdlYF_GyBPaP44TIPRCaJ7ip6Olm0lBA",
  authDomain: "pages-6c81c.firebaseapp.com",
  projectId: "pages-6c81c",
  storageBucket: "pages-6c81c.firebasestorage.app",
  messagingSenderId: "227547075363",
  appId: "1:227547075363:web:adafe80a8bd79d9ebd7296",
  measurementId: "G-8DG64WSMK8"
}

// Initialiser Firebase
const firebaseApp = initializeApp(firebaseConfig)

// Initialiser Firestore
const db = getFirestore(firebaseApp)

// Initialiser Auth
const auth = getAuth(firebaseApp)

export { firebaseApp, db, auth }
