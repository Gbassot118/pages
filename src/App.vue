<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

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
  <div class="app">
    <HelloWorld msg="Hello World!" />
    <div class="datetime">{{ currentDateTime }}</div>
    <div class="info">
      <p>Cette application Vue.js est déployée automatiquement via GitHub Pages</p>
      <p>Elle est buildée avec Vite et utilise GitHub Actions pour le déploiement</p>
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
</style>
