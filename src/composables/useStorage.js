import { ref } from 'vue'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { firebaseApp, db } from '../firebase'

export function useStorage() {
  const uploading = ref(false)
  const error = ref(null)
  const progress = ref(0)

  const storage = getStorage(firebaseApp)

  // Uploader un avatar pour l'utilisateur
  const uploadAvatar = async (user, file) => {
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    if (!file) {
      throw new Error('Aucun fichier sélectionné')
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.')
    }

    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux. Maximum 5MB.')
    }

    try {
      uploading.value = true
      error.value = null
      progress.value = 0

      // Créer une référence unique pour le fichier
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `avatars/${user.uid}/${timestamp}.${fileExtension}`
      const fileRef = storageRef(storage, fileName)

      // Uploader le fichier
      progress.value = 50
      await uploadBytes(fileRef, file)

      // Récupérer l'URL de téléchargement
      progress.value = 75
      const downloadURL = await getDownloadURL(fileRef)

      // Mettre à jour le profil utilisateur dans Firebase Auth
      await updateProfile(user, {
        photoURL: downloadURL
      })

      // Mettre à jour userPhotoURL dans tous les salons où l'utilisateur participe
      progress.value = 90
      await updateAvatarInRooms(user.uid, downloadURL)

      progress.value = 100
      return downloadURL
    } catch (err) {
      console.error('Erreur lors de l\'upload de l\'avatar:', err)
      error.value = err.message || 'Erreur lors de l\'upload de l\'avatar'
      throw err
    } finally {
      uploading.value = false
    }
  }

  // Mettre à jour l'avatar de l'utilisateur dans tous les salons où il participe
  const updateAvatarInRooms = async (userId, photoURL) => {
    try {
      // Récupérer tous les salons
      const roomsSnapshot = await getDocs(collection(db, 'rooms'))

      // Pour chaque salon, vérifier si l'utilisateur est participant et mettre à jour
      const updatePromises = []

      for (const roomDoc of roomsSnapshot.docs) {
        const participantRef = doc(db, 'rooms', roomDoc.id, 'participants', userId)

        // Mettre à jour sans vérifier l'existence (updateDoc échoue silencieusement si le doc n'existe pas)
        const updatePromise = updateDoc(participantRef, {
          userPhotoURL: photoURL
        }).catch(() => {
          // Ignorer les erreurs (le participant n'existe peut-être pas dans ce salon)
        })

        updatePromises.push(updatePromise)
      }

      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'avatar dans les salons:', err)
      // Ne pas échouer l'upload si cette étape échoue
    }
  }

  // Supprimer un ancien avatar (optionnel - pour éviter d'accumuler des fichiers)
  const deleteAvatar = async (avatarURL) => {
    try {
      if (!avatarURL || !avatarURL.includes('firebasestorage')) {
        // Ne pas supprimer les avatars qui ne sont pas dans notre storage
        return
      }

      const fileRef = storageRef(storage, avatarURL)
      await deleteObject(fileRef)
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'ancien avatar:', err)
      // Ne pas échouer si on ne peut pas supprimer l'ancien avatar
    }
  }

  return {
    uploading,
    error,
    progress,
    uploadAvatar,
    deleteAvatar
  }
}
