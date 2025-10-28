<template>
  <div class="room-list">
    <div class="header">
      <h2>Salons de discussion</h2>
      <button @click="$emit('create-room')" class="btn-create">
        + Créer un salon
      </button>
    </div>

    <div v-if="loading && rooms.length === 0" class="loading">
      Chargement des salons...
    </div>

    <div v-else-if="rooms.length === 0" class="empty">
      <p>Aucun salon disponible pour le moment.</p>
      <p>Soyez le premier à créer un salon !</p>
    </div>

    <div v-else class="rooms-grid">
      <div
        v-for="room in roomsWithCounts"
        :key="room.id"
        class="room-card"
        :class="{ active: currentRoomId === room.id }"
      >
        <div class="room-header">
          <h3>{{ room.name }}</h3>
          <span class="participant-count">
            {{ room.participantCount }}
            {{ room.participantCount > 1 ? 'participants' : 'participant' }}
          </span>
        </div>

        <div class="room-info">
          <p class="creator">
            Créé par {{ room.createdByName }}
          </p>
          <p class="created-at" v-if="room.createdAt">
            {{ formatDate(room.createdAt) }}
          </p>
        </div>

        <div class="room-actions">
          <button
            v-if="currentRoomId !== room.id"
            @click="$emit('join-room', room.id)"
            class="btn-join"
          >
            Rejoindre
          </button>
          <button
            v-else
            @click="$emit('leave-room', room.id)"
            class="btn-leave"
          >
            Quitter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRooms } from '../composables/useRooms'

const props = defineProps({
  currentRoomId: {
    type: String,
    default: null
  }
})

defineEmits(['create-room', 'join-room', 'leave-room'])

const { rooms, subscribeToRooms, getParticipantCount, loading } = useRooms()
const roomsWithCounts = ref([])
let unsubscribe = null

const updateParticipantCounts = async () => {
  const updatedRooms = await Promise.all(
    rooms.value.map(async (room) => {
      const count = await getParticipantCount(room.id)
      return {
        ...room,
        participantCount: count
      }
    })
  )
  roomsWithCounts.value = updatedRooms
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  unsubscribe = subscribeToRooms(async () => {
    await updateParticipantCounts()
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

watch(() => props.currentRoomId, async () => {
  await updateParticipantCounts()
})
</script>

<style scoped>
.room-list {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.btn-create {
  background: #42b983;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-create:hover {
  background: #359268;
  transform: translateY(-2px);
}

.loading,
.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.room-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.room-card.active {
  border-color: #42b983;
  background: #f0fdf7;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.room-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
  word-break: break-word;
}

.participant-count {
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  white-space: nowrap;
  font-weight: 500;
}

.room-card.active .participant-count {
  background: #42b983;
  color: white;
}

.room-info {
  margin-bottom: 1rem;
}

.room-info p {
  margin: 0.25rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.creator {
  font-weight: 500;
  color: #495057;
}

.room-actions {
  margin-top: 1rem;
}

.btn-join,
.btn-leave {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-join {
  background: #42b983;
  color: white;
}

.btn-join:hover {
  background: #359268;
}

.btn-leave {
  background: #dc3545;
  color: white;
}

.btn-leave:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-create {
    width: 100%;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>
