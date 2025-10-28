<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCurrentUser } from 'vuefire'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { useRooms } from './composables/useRooms'
import Login from './components/Login.vue'
import RoomList from './components/RoomList.vue'
import CreateRoom from './components/CreateRoom.vue'
import RoomView from './components/RoomView.vue'
import AvatarUpload from './components/AvatarUpload.vue'

const user = useCurrentUser()
const currentDateTime = ref('')
const { joinRoom, leaveRoom } = useRooms()
const showAvatarModal = ref(false)

// Gestion des vues
const currentView = ref('room-list') // 'room-list', 'create-room', 'room-view'
const currentRoomId = ref(null)
const currentRoomName = ref('')

const updateDateTime = () => {
  const now = new Date()
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  currentDateTime.value = now.toLocaleDateString('fr-FR', options)
}

const logout = async () => {
  try {
    // Si l'utilisateur est dans un salon, le quitter d'abord
    if (currentRoomId.value && user.value) {
      await leaveRoom(currentRoomId.value, user.value.uid)
    }
    await signOut(auth)
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

const showCreateRoom = () => {
  currentView.value = 'create-room'
}

const handleRoomCreated = async (roomId) => {
  // Après création, rejoindre automatiquement le salon
  if (user.value) {
    try {
      await joinRoom(roomId, user.value)
      const rooms = await import('./composables/useRooms')
      const { subscribeToRooms } = rooms.useRooms()

      // Trouver le nom du salon créé
      subscribeToRooms((roomsList) => {
        const room = roomsList.find(r => r.id === roomId)
        if (room) {
          currentRoomName.value = room.name
          currentRoomId.value = roomId
          currentView.value = 'room-view'
        }
      })
    } catch (err) {
      console.error('Erreur lors de la jonction au salon créé:', err)
    }
  }
}

const handleCancelCreate = () => {
  currentView.value = 'room-list'
}

const handleJoinRoom = async (roomId) => {
  if (!user.value) return

  try {
    await joinRoom(roomId, user.value)

    // Trouver le nom du salon
    const rooms = await import('./composables/useRooms')
    const { subscribeToRooms } = rooms.useRooms()

    subscribeToRooms((roomsList) => {
      const room = roomsList.find(r => r.id === roomId)
      if (room) {
        currentRoomName.value = room.name
        currentRoomId.value = roomId
        currentView.value = 'room-view'
      }
    })
  } catch (err) {
    console.error('Erreur lors de la jonction au salon:', err)
  }
}

const handleLeaveRoom = async () => {
  if (!user.value || !currentRoomId.value) return

  try {
    await leaveRoom(currentRoomId.value, user.value.uid)
    currentRoomId.value = null
    currentRoomName.value = ''
    currentView.value = 'room-list'
  } catch (err) {
    console.error('Erreur lors de la sortie du salon:', err)
  }
}

const openAvatarModal = () => {
  showAvatarModal.value = true
}

const closeAvatarModal = () => {
  showAvatarModal.value = false
}

const handleAvatarUploaded = (downloadURL) => {
  console.log('Avatar mis à jour:', downloadURL)
  // Fermer le modal après un court délai pour voir la confirmation
  setTimeout(() => {
    closeAvatarModal()
  }, 500)
}

let intervalId = null

onMounted(() => {
  updateDateTime()
  intervalId = setInterval(updateDateTime, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <!-- Page de connexion si l'utilisateur n'est pas connecté -->
  <Login v-if="!user" />

  <!-- Contenu de l'application si l'utilisateur est connecté -->
  <div v-else class="app">
    <div class="user-info">
      <div class="user-details">
        <div class="avatar-wrapper" @click="openAvatarModal" title="Changer l'avatar">
          <img v-if="user.photoURL" :src="user.photoURL" alt="Avatar" class="avatar" />
          <div v-else class="avatar-placeholder">
            {{ (user.displayName || user.email || '?').substring(0, 2).toUpperCase() }}
          </div>
          <div class="avatar-edit-icon">✏️</div>
        </div>
        <div class="user-text">
          <span class="user-name">{{ user.displayName || user.email }}</span>
          <span class="datetime">{{ currentDateTime }}</span>
        </div>
      </div>
      <button @click="logout" class="logout-button">Déconnexion</button>
    </div>

    <div class="main-content">
      <!-- Liste des salons -->
      <RoomList
        v-if="currentView === 'room-list'"
        :current-room-id="currentRoomId"
        @create-room="showCreateRoom"
        @join-room="handleJoinRoom"
        @leave-room="handleLeaveRoom"
      />

      <!-- Création d'un salon -->
      <CreateRoom
        v-else-if="currentView === 'create-room'"
        @created="handleRoomCreated"
        @cancel="handleCancelCreate"
      />

      <!-- Vue d'un salon -->
      <RoomView
        v-else-if="currentView === 'room-view' && currentRoomId"
        :room-id="currentRoomId"
        :room-name="currentRoomName"
        @leave="handleLeaveRoom"
      />
    </div>

    <!-- Modal de changement d'avatar -->
    <div v-if="showAvatarModal" class="modal-overlay" @click="closeAvatarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Changer votre avatar</h3>
          <button @click="closeAvatarModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <AvatarUpload
            :current-avatar="user?.photoURL"
            :user-name="user?.displayName || user?.email || ''"
            @uploaded="handleAvatarUploaded"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 1rem;
  flex-wrap: wrap;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  cursor: pointer;
  transition: all 0.3s;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #42b983;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border: 2px solid #42b983;
}

.avatar-edit-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #42b983;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  border: 2px solid white;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-edit-icon {
  opacity: 1;
}

.user-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1rem;
}

.datetime {
  color: #6c757d;
  font-size: 0.8rem;
}

.logout-button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  padding: 2rem;
}

@media (max-width: 768px) {
  .user-info {
    padding: 1rem;
  }

  .user-text {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }

  .modal-content {
    max-width: 100%;
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }
}
</style>
