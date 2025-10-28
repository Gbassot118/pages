import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Configuration Firebase - À remplacer avec vos clés API
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
}

// Initialiser Firebase
const firebaseApp = initializeApp(firebaseConfig)

// Initialiser Firestore
const db = getFirestore(firebaseApp)

// Initialiser Auth
const auth = getAuth(firebaseApp)

export { firebaseApp, db, auth }
