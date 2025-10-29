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

const user = useCurrentUser()
const currentDateTime = ref('')
const { joinRoom, leaveRoom } = useRooms()

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
        <img v-if="user.photoURL" :src="user.photoURL" alt="Avatar" class="avatar" />
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
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gl-red-primary) 0%, var(--gl-red-dark) 100%);
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--gl-white);
  box-shadow: var(--shadow-md);
  gap: 1rem;
  flex-wrap: wrap;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex: 1;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--gl-red-primary);
  flex-shrink: 0;
}

.user-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  color: var(--gl-gray-dark);
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.datetime {
  color: var(--gl-gray-medium);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-button {
  background: var(--gl-red-primary);
  color: var(--gl-white);
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-button:hover {
  background: var(--gl-red-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.logout-button:active {
  transform: translateY(0);
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Tablette */
@media (max-width: 1024px) {
  .main-content {
    padding: 1.5rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .user-info {
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .user-details {
    gap: 0.75rem;
  }

  .avatar {
    width: 40px;
    height: 40px;
  }

  .user-name {
    font-size: 0.9rem;
  }

  .datetime {
    font-size: 0.7rem;
  }

  .logout-button {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .main-content {
    padding: 1rem;
  }
}

/* Très petit mobile */
@media (max-width: 480px) {
  .user-info {
    padding: 0.5rem 0.75rem;
  }

  .user-text {
    display: none;
  }

  .logout-button {
    padding: 0.5rem 0.85rem;
    font-size: 0.8rem;
  }

  .main-content {
    padding: 0.75rem;
  }
}
</style>
