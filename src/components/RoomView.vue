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

      <div class="poker-section">
        <h3>Planning Poker</h3>

        <!-- Zone des votes des participants -->
        <div class="voting-area">
          <div
            v-for="participant in participants"
            :key="participant.id"
            class="participant-vote"
          >
            <div class="participant-mini">
              <div class="participant-mini-avatar">
                <img
                  v-if="participant.userPhotoURL"
                  :src="participant.userPhotoURL"
                  :alt="participant.userName"
                />
                <div v-else class="avatar-mini-placeholder">
                  {{ getInitials(participant.userName) }}
                </div>
              </div>
              <div class="participant-mini-name">
                {{ participant.userName }}
              </div>
            </div>

            <PokerCard
              :value="participant.selectedCard || '?'"
              :isRevealed="allVoted"
              :hasValue="participant.selectedCard !== null"
              :isSelectable="false"
            />
          </div>
        </div>

        <!-- Statistiques si tout le monde a voté -->
        <div v-if="allVoted" class="voting-stats">
          <div class="stats-header">
            <h4>Résultats du vote</h4>
            <button @click="handleResetRound" class="btn-new-round">
              🔄 Nouveau tour
            </button>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">Moyenne :</span>
              <span class="stat-value">{{ averageVote }}</span>
            </div>
            <div class="stat-item" v-if="consensusValue">
              <span class="stat-label">Consensus :</span>
              <span class="stat-value">{{ consensusValue }}</span>
            </div>
          </div>
        </div>

        <!-- Message d'attente -->
        <div v-else-if="someVoted" class="waiting-message">
          En attente des autres participants... ({{ votedCount }}/{{ participants.length }})
        </div>

        <!-- Sélection des cartes -->
        <div class="card-selection">
          <h4>Choisissez votre carte</h4>
          <div class="cards-container">
            <PokerCard
              v-for="cardValue in fibonacciCards"
              :key="cardValue"
              :value="cardValue"
              :isSelected="currentUserCard === cardValue"
              :isRevealed="true"
              :isSelectable="true"
              @select="handleCardSelect"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useCurrentUser } from 'vuefire'
import { useRooms } from '../composables/useRooms'
import PokerCard from './PokerCard.vue'

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
const { participants, subscribeToParticipants, leaveRoom, selectCard, resetRound, resetOwnCard, subscribeToRoom, loading } = useRooms()

let unsubscribe = null
let unsubscribeRoom = null
const currentUserId = computed(() => user.value?.uid)
const currentRoundNumber = ref(0)

// Cartes Fibonacci pour le Planning Poker
const fibonacciCards = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '?', 'coffee']

// Carte sélectionnée par l'utilisateur actuel
const currentUserCard = computed(() => {
  const currentParticipant = participants.value.find(p => p.userId === currentUserId.value)
  return currentParticipant?.selectedCard
})

// Nombre de participants ayant voté
const votedCount = computed(() => {
  return participants.value.filter(p => p.selectedCard !== null).length
})

// Est-ce que certains participants ont voté ?
const someVoted = computed(() => votedCount.value > 0 && votedCount.value < participants.value.length)

// Est-ce que tous les participants ont voté ?
const allVoted = computed(() => {
  return participants.value.length > 0 && votedCount.value === participants.value.length
})

// Calculer la moyenne des votes (exclut '?' et 'coffee')
const averageVote = computed(() => {
  if (!allVoted.value) return null

  const numericVotes = participants.value
    .map(p => p.selectedCard)
    .filter(card => typeof card === 'number' && !isNaN(card))

  if (numericVotes.length === 0) return 'N/A'

  const sum = numericVotes.reduce((acc, val) => acc + val, 0)
  const avg = sum / numericVotes.length
  return avg.toFixed(1)
})

// Vérifier s'il y a un consensus (tous ont voté la même valeur)
const consensusValue = computed(() => {
  if (!allVoted.value) return null

  const votes = participants.value.map(p => p.selectedCard)
  const firstVote = votes[0]

  if (votes.every(vote => vote === firstVote)) {
    return firstVote
  }

  return null
})

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

// Gérer la sélection d'une carte
const handleCardSelect = async (cardValue) => {
  if (!user.value) return

  try {
    await selectCard(props.roomId, user.value.uid, cardValue)
  } catch (err) {
    console.error('Erreur lors de la sélection de la carte:', err)
  }
}

// Gérer le nouveau tour
const handleResetRound = async () => {
  try {
    await resetRound(props.roomId)
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du tour:', err)
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

  // Écouter les changements du salon (notamment currentRound)
  unsubscribeRoom = subscribeToRoom(props.roomId, (roomData) => {
    const newRound = roomData.currentRound || 0

    // Si le round a changé et qu'on avait déjà un round précédent
    if (newRound > currentRoundNumber.value && currentRoundNumber.value > 0) {
      // Réinitialiser automatiquement notre propre carte
      if (user.value) {
        resetOwnCard(props.roomId, user.value.uid).catch(err => {
          console.error('Erreur lors de la réinitialisation de la carte:', err)
        })
      }
    }

    currentRoundNumber.value = newRound
  })

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
  if (unsubscribeRoom) {
    unsubscribeRoom()
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

.poker-section {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.poker-section h3 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.4rem;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.75rem;
}

.poker-section h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 1.1rem;
}

/* Zone de vote des participants */
.voting-area {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  justify-content: center;
}

.participant-vote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.participant-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.participant-mini-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.participant-mini-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-mini-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
}

.participant-mini-name {
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
  text-align: center;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Statistiques de vote */
.voting-stats {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.stats-header h4 {
  margin: 0;
  color: white;
}

.btn-new-round {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-new-round:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.stats-content {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
}

/* Message d'attente */
.waiting-message {
  text-align: center;
  padding: 1.5rem;
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  font-weight: 500;
  margin-bottom: 2rem;
}

/* Sélection des cartes */
.card-selection {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e9ecef;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 1024px) {
  .room-content {
    grid-template-columns: 1fr;
  }

  .participants-section {
    max-height: 300px;
  }

  .voting-area {
    gap: 1rem;
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

  .poker-section {
    padding: 1rem;
  }

  .voting-area {
    padding: 1rem;
    gap: 0.75rem;
  }

  .stats-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-new-round {
    width: 100%;
  }

  .cards-container {
    gap: 0.75rem;
  }
}
</style>
