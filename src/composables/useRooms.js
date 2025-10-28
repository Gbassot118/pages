import { ref } from 'vue'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  writeBatch,
  increment
} from 'firebase/firestore'
import { db } from '../firebase'

export function useRooms() {
  const rooms = ref([])
  const participants = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Formater les messages d'erreur Firestore
  const getFirestoreErrorMessage = (err) => {
    if (err.code === 'permission-denied') {
      return 'Permissions Firestore non configurées. Veuillez configurer les règles de sécurité dans la console Firebase.'
    }
    if (err.code === 'unavailable') {
      return 'Firestore n\'est pas disponible. Vérifiez que Firestore est activé dans votre projet Firebase.'
    }
    if (err.code === 'not-found') {
      return 'Base de données Firestore introuvable. Activez Firestore dans la console Firebase.'
    }
    return err.message || 'Une erreur inconnue est survenue.'
  }

  // Créer un nouveau salon
  const createRoom = async (roomName, user) => {
    try {
      loading.value = true
      error.value = null

      const roomData = {
        name: roomName,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        currentRound: 0
      }

      const roomRef = await addDoc(collection(db, 'rooms'), roomData)
      return roomRef.id
    } catch (err) {
      console.error('Erreur lors de la création du salon:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Écouter la liste des salons en temps réel
  const subscribeToRooms = (callback) => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'))

    return onSnapshot(q, (snapshot) => {
      const roomsList = []
      snapshot.forEach((doc) => {
        roomsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      rooms.value = roomsList
      if (callback) callback(roomsList)
    }, (err) => {
      console.error('Erreur lors de l\'écoute des salons:', err)
      error.value = getFirestoreErrorMessage(err)
    })
  }

  // Rejoindre un salon
  const joinRoom = async (roomId, user) => {
    try {
      loading.value = true
      error.value = null

      const participantData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        userPhotoURL: user.photoURL || null,
        joinedAt: serverTimestamp(),
        selectedCard: null,
        selectedAt: null,
        isSpectator: false
      }

      const participantRef = doc(db, 'rooms', roomId, 'participants', user.uid)
      await setDoc(participantRef, participantData)

      return true
    } catch (err) {
      console.error('Erreur lors de la jonction au salon:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Quitter un salon
  const leaveRoom = async (roomId, userId) => {
    try {
      loading.value = true
      error.value = null

      const participantRef = doc(db, 'rooms', roomId, 'participants', userId)
      await deleteDoc(participantRef)

      return true
    } catch (err) {
      console.error('Erreur lors de la sortie du salon:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Écouter les participants d'un salon en temps réel
  const subscribeToParticipants = (roomId, callback) => {
    const q = query(
      collection(db, 'rooms', roomId, 'participants'),
      orderBy('joinedAt', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
      const participantsList = []
      snapshot.forEach((doc) => {
        participantsList.push({
          id: doc.id,
          ...doc.data()
        })
      })
      participants.value = participantsList
      if (callback) callback(participantsList)
    }, (err) => {
      console.error('Erreur lors de l\'écoute des participants:', err)
      error.value = getFirestoreErrorMessage(err)
    })
  }

  // Obtenir le nombre de participants dans un salon
  const getParticipantCount = async (roomId) => {
    try {
      const participantsSnapshot = await getDocs(
        collection(db, 'rooms', roomId, 'participants')
      )
      return participantsSnapshot.size
    } catch (err) {
      console.error('Erreur lors de la récupération du nombre de participants:', err)
      return 0
    }
  }

  // Sélectionner une carte pour le Planning Poker
  const selectCard = async (roomId, userId, cardValue) => {
    try {
      loading.value = true
      error.value = null

      const participantRef = doc(db, 'rooms', roomId, 'participants', userId)
      await updateDoc(participantRef, {
        selectedCard: cardValue,
        selectedAt: serverTimestamp()
      })

      return true
    } catch (err) {
      console.error('Erreur lors de la sélection de la carte:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Réinitialiser sa propre carte
  const resetOwnCard = async (roomId, userId) => {
    try {
      const participantRef = doc(db, 'rooms', roomId, 'participants', userId)
      await updateDoc(participantRef, {
        selectedCard: null,
        selectedAt: null
      })
      return true
    } catch (err) {
      console.error('Erreur lors de la réinitialisation de la carte:', err)
      throw err
    }
  }

  // Basculer le mode spectateur
  const toggleSpectatorMode = async (roomId, userId, isSpectator) => {
    try {
      loading.value = true
      error.value = null

      const participantRef = doc(db, 'rooms', roomId, 'participants', userId)
      await updateDoc(participantRef, {
        isSpectator: isSpectator,
        // Si on devient spectateur, réinitialiser la carte
        ...(isSpectator && { selectedCard: null, selectedAt: null })
      })

      return true
    } catch (err) {
      console.error('Erreur lors du basculement en mode spectateur:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Réinitialiser le tour (nouveau tour) - Incrémente le compteur de round
  const resetRound = async (roomId) => {
    try {
      loading.value = true
      error.value = null

      // Incrémenter le numéro de round dans le salon de manière atomique
      const roomRef = doc(db, 'rooms', roomId)
      await updateDoc(roomRef, {
        currentRound: increment(1)
      })

      return true
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du tour:', err)
      const errorMessage = getFirestoreErrorMessage(err)
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // Écouter les changements d'un salon spécifique
  const subscribeToRoom = (roomId, callback) => {
    const roomRef = doc(db, 'rooms', roomId)

    return onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = {
          id: snapshot.id,
          ...snapshot.data()
        }
        if (callback) callback(roomData)
      }
    }, (err) => {
      console.error('Erreur lors de l\'écoute du salon:', err)
      error.value = getFirestoreErrorMessage(err)
    })
  }

  return {
    rooms,
    participants,
    loading,
    error,
    createRoom,
    subscribeToRooms,
    joinRoom,
    leaveRoom,
    subscribeToParticipants,
    getParticipantCount,
    selectCard,
    resetRound,
    resetOwnCard,
    subscribeToRoom,
    toggleSpectatorMode
  }
}
