<template>
  <div class="room-view">
    <div class="room-header">
      <div class="room-title">
        <h2>{{ roomName }}</h2>
        <span class="online-indicator">
          {{ participants.length }} {{ participants.length > 1 ? 'participants connectés' : 'participant connecté' }}
        </span>
      </div>
      <button @click="handleLeaveRoom" class="btn-leave">
        Quitter le salon
      </button>
    </div>

    <div class="room-content">
      <div class="participants-section">
        <h3>Participants</h3>

        <div v-if="loading && participants.length === 0" class="loading">
          Chargement des participants...
        </div>

        <div v-else-if="participants.length === 0" class="empty">
          Aucun participant pour le moment.
        </div>

        <div v-else class="participants-list">
          <div
            v-for="participant in participants"
            :key="participant.id"
            class="participant-card"
            :class="{ 'is-you': participant.userId === currentUserId }"
          >
            <div class="participant-avatar">
              <img
                v-if="participant.userPhotoURL"
                :src="participant.userPhotoURL"
                :alt="participant.userName"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitials(participant.userName) }}
              </div>
            </div>

            <div class="participant-info">
              <div class="participant-name">
                {{ participant.userName }}
                <span v-if="participant.userId === currentUserId" class="you-badge">
                  (Vous)
                </span>
              </div>
              <div class="participant-email">
                {{ participant.userEmail }}
              </div>
              <div class="participant-joined">
                Connecté {{ formatJoinTime(participant.joinedAt) }}
              </div>
            </div>

            <div class="online-dot"></div>
          </div>
        </div>
      </div>

      <div class="chat-placeholder">
        <p>💬 Espace de discussion</p>
        <p class="subtitle">Les participants peuvent se voir et interagir ici</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCurrentUser } from 'vuefire'
import { useRooms } from '../composables/useRooms'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['leave'])

const user = useCurrentUser()
const { participants, subscribeToParticipants, leaveRoom, loading } = useRooms()

let unsubscribe = null
const currentUserId = computed(() => user.value?.uid)

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const formatJoinTime = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'à l\'instant'
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleLeaveRoom = async () => {
  if (!user.value) return

  try {
    await leaveRoom(props.roomId, user.value.uid)
    emit('leave')
  } catch (err) {
    console.error('Erreur lors de la sortie du salon:', err)
  }
}

// Gérer la fermeture de la fenêtre
const handleBeforeUnload = () => {
  if (user.value && props.roomId) {
    // Utiliser sendBeacon pour envoyer une requête avant la fermeture
    // Note: leaveRoom sera appelé de manière synchrone
    leaveRoom(props.roomId, user.value.uid)
  }
}

onMounted(() => {
  // Écouter les participants du salon
  unsubscribe = subscribeToParticipants(props.roomId)

  // Ajouter un listener pour la fermeture de la fenêtre
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  // Quitter le salon lors de la destruction du composant
  if (user.value && props.roomId) {
    leaveRoom(props.roomId, user.value.uid)
  }

  // Nettoyer les listeners
  if (unsubscribe) {
    unsubscribe()
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.room-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  gap: 1rem;
}

.room-title {
  flex: 1;
}

.room-title h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.online-indicator {
  background: #42b983;
  color: white;
  padding: 0.35rem 0.85rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-leave {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-leave:hover {
  background: #c82333;
  transform: translateY(-2px);
}

.room-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
}

.participants-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.participants-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.75rem;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #6c757d;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.participant-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.participant-card:hover {
  background: #e9ecef;
}

.participant-card.is-you {
  background: #e8f5e9;
  border-color: #42b983;
}

.participant-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
}

.participant-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.participant-info {
  flex: 1;
  min-width: 0;
}

.participant-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.you-badge {
  background: #42b983;
  color: white;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 8px;
  font-weight: 500;
}

.participant-email {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-joined {
  font-size: 0.75rem;
  color: #adb5bd;
}

.online-dot {
  width: 12px;
  height: 12px;
  background: #42b983;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.3);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(66, 185, 131, 0.1);
  }
}

.chat-placeholder {
  background: white;
  border-radius: 8px;
  padding: 3rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.chat-placeholder p {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.chat-placeholder .subtitle {
  font-size: 1rem;
  color: #6c757d;
}

@media (max-width: 1024px) {
  .room-content {
    grid-template-columns: 1fr;
  }

  .participants-section {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-leave {
    width: 100%;
  }

  .participants-section {
    padding: 1rem;
  }
}
</style>
