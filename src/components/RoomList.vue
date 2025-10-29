<template>
  <div class="room-list">
    <div class="header">
      <h2>Salons de discussion</h2>
      <button @click="$emit('create-room')" class="btn-create">
        + Créer un salon
      </button>
    </div>

    <FirestoreSetupAlert v-if="error && error.includes('Firestore')" />

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
          <button
            v-if="room.participantCount === 0 && currentRoomId !== room.id"
            @click="handleDeleteRoom(room.id, room.name)"
            class="btn-delete"
            title="Supprimer ce salon vide"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useRooms } from '../composables/useRooms'
import FirestoreSetupAlert from './FirestoreSetupAlert.vue'

const props = defineProps({
  currentRoomId: {
    type: String,
    default: null
  }
})

defineEmits(['create-room', 'join-room', 'leave-room', 'delete-room'])

const { rooms, subscribeToRooms, deleteRoom, loading, error } = useRooms()
const roomsWithCounts = ref([])
const participantCounts = ref({})
let unsubscribeRooms = null
const participantUnsubscribers = new Map()

// Souscrire aux participants d'un salon spécifique
const subscribeToRoomParticipants = (roomId) => {
  // Si déjà abonné, ne pas recréer le listener
  if (participantUnsubscribers.has(roomId)) {
    return
  }

  const participantsRef = collection(db, 'rooms', roomId, 'participants')
  const unsubscribe = onSnapshot(query(participantsRef), (snapshot) => {
    participantCounts.value[roomId] = snapshot.size
    updateRoomsWithCounts()
  }, (err) => {
    console.error(`Erreur lors de l'écoute des participants du salon ${roomId}:`, err)
  })

  participantUnsubscribers.set(roomId, unsubscribe)
}

// Mettre à jour la liste des salons avec les compteurs
const updateRoomsWithCounts = () => {
  roomsWithCounts.value = rooms.value.map((room) => ({
    ...room,
    participantCount: participantCounts.value[room.id] || 0
  }))
}

// Gérer les changements de la liste des salons
const handleRoomsChange = () => {
  // Désabonner des salons qui n'existent plus
  const currentRoomIds = new Set(rooms.value.map(r => r.id))
  for (const [roomId, unsubscribe] of participantUnsubscribers.entries()) {
    if (!currentRoomIds.has(roomId)) {
      unsubscribe()
      participantUnsubscribers.delete(roomId)
      delete participantCounts.value[roomId]
    }
  }

  // S'abonner aux nouveaux salons
  rooms.value.forEach((room) => {
    subscribeToRoomParticipants(room.id)
  })

  updateRoomsWithCounts()
}

const handleDeleteRoom = async (roomId, roomName) => {
  if (confirm(`Voulez-vous vraiment supprimer le salon "${roomName}" ?`)) {
    try {
      await deleteRoom(roomId)
    } catch (err) {
      alert(err.message)
    }
  }
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
  unsubscribeRooms = subscribeToRooms(handleRoomsChange)
})

onUnmounted(() => {
  if (unsubscribeRooms) {
    unsubscribeRooms()
  }
  // Désabonner de tous les listeners de participants
  for (const unsubscribe of participantUnsubscribers.values()) {
    unsubscribe()
  }
  participantUnsubscribers.clear()
})

watch(() => props.currentRoomId, () => {
  updateRoomsWithCounts()
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
  color: var(--gl-white);
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-create {
  background: var(--gl-white);
  color: var(--gl-red-primary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: var(--shadow-md);
  min-height: 44px;
}

.btn-create:hover {
  background: var(--gl-gray-lighter);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-create:active {
  transform: translateY(0);
}

.loading,
.empty {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gl-white);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
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
  background: var(--gl-white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all 0.3s;
  border: 3px solid transparent;
}

.room-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.room-card.active {
  border-color: var(--gl-red-primary);
  background: #fff5f5;
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
  color: var(--gl-gray-dark);
  font-size: 1.3rem;
  word-break: break-word;
  flex: 1;
}

.participant-count {
  background: var(--gl-gray-light);
  color: var(--gl-gray-dark);
  padding: 0.35rem 0.85rem;
  border-radius: 16px;
  font-size: 0.85rem;
  white-space: nowrap;
  font-weight: 600;
  flex-shrink: 0;
}

.room-card.active .participant-count {
  background: var(--gl-red-primary);
  color: var(--gl-white);
}

.room-info {
  margin-bottom: 1rem;
}

.room-info p {
  margin: 0.25rem 0;
  color: var(--gl-gray-medium);
  font-size: 0.9rem;
}

.creator {
  font-weight: 500;
  color: var(--gl-gray-dark);
}

.room-actions {
  margin-top: 1rem;
}

.btn-join,
.btn-leave {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 44px;
}

.btn-join {
  background: var(--gl-red-primary);
  color: var(--gl-white);
}

.btn-join:hover {
  background: var(--gl-red-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-join:active {
  transform: translateY(0);
}

.btn-leave {
  background: var(--color-danger);
  color: var(--gl-white);
}

.btn-leave:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-leave:active {
  transform: translateY(0);
}

/* Tablette */
@media (max-width: 1024px) {
  .rooms-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
    text-align: center;
  }

  .btn-create {
    width: 100%;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .room-card {
    padding: 1.25rem;
  }

  .room-header h3 {
    font-size: 1.2rem;
  }
}

/* Très petit mobile */
@media (max-width: 480px) {
  h2 {
    font-size: 1.35rem;
  }

  .room-card {
    padding: 1rem;
    border-radius: 10px;
  }

  .room-header {
    gap: 0.75rem;
  }

  .room-header h3 {
    font-size: 1.1rem;
  }

  .participant-count {
    font-size: 0.8rem;
    padding: 0.3rem 0.7rem;
  }

  .room-info p {
    font-size: 0.85rem;
  }

  .btn-join,
  .btn-leave {
    padding: 0.65rem 1.25rem;
    font-size: 0.95rem;
  }

  .loading,
  .empty {
    padding: 2rem 1rem;
  }

  .empty p {
    font-size: 1rem;
  }
}
</style>
