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
  getDocs
} from 'firebase/firestore'
import { db } from '../firebase'

export function useRooms() {
  const rooms = ref([])
  const participants = ref([])
  const loading = ref(false)
  const error = ref(null)

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
        createdAt: serverTimestamp()
      }

      const roomRef = await addDoc(collection(db, 'rooms'), roomData)
      return roomRef.id
    } catch (err) {
      console.error('Erreur lors de la création du salon:', err)
      error.value = err.message
      throw err
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
      error.value = err.message
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
        joinedAt: serverTimestamp()
      }

      const participantRef = doc(db, 'rooms', roomId, 'participants', user.uid)
      await setDoc(participantRef, participantData)

      return true
    } catch (err) {
      console.error('Erreur lors de la jonction au salon:', err)
      error.value = err.message
      throw err
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
      error.value = err.message
      throw err
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
      error.value = err.message
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
    getParticipantCount
  }
}
