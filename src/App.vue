<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCurrentUser } from 'vuefire'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import Login from './components/Login.vue'
import HelloWorld from './components/HelloWorld.vue'

const user = useCurrentUser()
const currentDateTime = ref('')

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
    await signOut(auth)
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
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
        <span class="user-name">{{ user.displayName || user.email }}</span>
      </div>
      <button @click="logout" class="logout-button">Déconnexion</button>
    </div>

    <HelloWorld msg="Hello World!" />
    <div class="datetime">{{ currentDateTime }}</div>
    <div class="info">
      <p>Cette application Vue.js est déployée automatiquement via GitHub Pages</p>
      <p>Elle est buildée avec Vite et utilise GitHub Actions pour le déploiement</p>
      <p>Vous êtes connecté avec Firebase Authentication</p>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
}

.user-info {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.logout-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.datetime {
  color: white;
  font-size: 1.5em;
  margin-top: 20px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
}

.info {
  margin-top: 40px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  max-width: 600px;
}

.info p {
  margin: 10px 0;
  font-size: 1.1em;
}

@media (max-width: 640px) {
  .user-info {
    position: static;
    margin-bottom: 20px;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
