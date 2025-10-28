<template>
  <div class="create-room">
    <h2>Créer un nouveau salon</h2>
    <form @submit.prevent="handleCreateRoom">
      <div class="form-group">
        <label for="roomName">Nom du salon</label>
        <input
          id="roomName"
          v-model="roomName"
          type="text"
          placeholder="Entrez le nom du salon"
          required
          :disabled="loading"
        />
      </div>

      <div v-if="error" class="error-message">
        <strong>Erreur :</strong> {{ error }}
        <div v-if="error.includes('Firestore')" class="error-help">
          <a href="https://console.firebase.google.com" target="_blank" rel="noopener">
            → Ouvrir la console Firebase
          </a>
        </div>
      </div>

      <div class="button-group">
        <button type="submit" :disabled="loading || !roomName.trim()">
          {{ loading ? 'Création...' : 'Créer le salon' }}
        </button>
        <button type="button" @click="$emit('cancel')" :disabled="loading">
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCurrentUser } from 'vuefire'
import { useRooms } from '../composables/useRooms'

const emit = defineEmits(['created', 'cancel'])

const user = useCurrentUser()
const { createRoom, loading, error } = useRooms()

const roomName = ref('')

const handleCreateRoom = async () => {
  if (!roomName.value.trim() || !user.value) return

  try {
    const roomId = await createRoom(roomName.value.trim(), user.value)
    roomName.value = ''
    emit('created', roomId)
  } catch (err) {
    console.error('Erreur lors de la création du salon:', err)
  }
}
</script>

<style scoped>
.create-room {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #42b983;
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 1rem;
}

button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

button[type="submit"] {
  background: #42b983;
  color: white;
}

button[type="submit"]:hover:not(:disabled) {
  background: #359268;
  transform: translateY(-2px);
}

button[type="button"] {
  background: #6c757d;
  color: white;
}

button[type="button"]:hover:not(:disabled) {
  background: #5a6268;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border-left: 4px solid #c33;
}

.error-help {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fcc;
}

.error-help a {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
}

.error-help a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .create-room {
    padding: 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
