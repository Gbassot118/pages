<script setup>
defineProps({
  msg: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div class="badge">
      <span>Vue 3</span>
      <span>+</span>
      <span>Vite</span>
      <span>+</span>
      <span>GitHub Pages</span>
    </div>
  </div>
</template>

<style scoped>
.hello {
  text-align: center;
}

h1 {
  color: white;
  font-size: 3.5em;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: fadeIn 1s ease-in;
}

.badge {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.badge span {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  font-size: 0.9em;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
