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
  background: var(--gl-white);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  max-width: 500px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 1.5rem 0;
  color: var(--gl-gray-dark);
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--gl-gray-dark);
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--gl-gray-light);
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--gl-red-primary);
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1);
}

input:disabled {
  background: var(--gl-gray-lighter);
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
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 44px;
}

button[type="submit"] {
  background: var(--gl-red-primary);
  color: var(--gl-white);
}

button[type="submit"]:hover:not(:disabled) {
  background: var(--gl-red-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

button[type="submit"]:active:not(:disabled) {
  transform: translateY(0);
}

button[type="button"] {
  background: var(--gl-gray-medium);
  color: var(--gl-white);
}

button[type="button"]:hover:not(:disabled) {
  background: #555555;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

button[type="button"]:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.error-message {
  background: #fee;
  color: var(--color-danger);
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid var(--color-danger);
}

.error-help {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fcc;
}

.error-help a {
  color: var(--color-info);
  text-decoration: none;
  font-weight: 500;
}

.error-help a:hover {
  text-decoration: underline;
}

/* Tablette */
@media (max-width: 768px) {
  .create-room {
    padding: 1.75rem;
  }

  h2 {
    font-size: 1.4rem;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .create-room {
    padding: 1.5rem;
  }

  h2 {
    font-size: 1.3rem;
  }

  .button-group {
    flex-direction: column;
  }

  button {
    width: 100%;
  }

  input {
    font-size: 16px; /* Évite le zoom automatique sur iOS */
  }
}

/* Très petit mobile */
@media (max-width: 480px) {
  .create-room {
    padding: 1.25rem;
  }

  h2 {
    font-size: 1.2rem;
  }
}
</style>
