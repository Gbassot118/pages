<template>
  <div class="avatar-upload-container">
    <div class="avatar-display" @click="openFileInput">
      <img v-if="currentAvatar" :src="currentAvatar" alt="Avatar" class="avatar-image" />
      <div v-else class="avatar-placeholder">
        {{ getInitials(userName) }}
      </div>
      <div class="avatar-overlay">
        <span class="upload-icon">📷</span>
        <span class="upload-text">Changer</span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      @change="handleFileSelect"
      style="display: none"
    />

    <div v-if="uploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">Upload en cours... {{ progress }}%</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="previewUrl && !uploading" class="preview-section">
      <h4>Aperçu</h4>
      <img :src="previewUrl" alt="Aperçu" class="preview-image" />
      <div class="preview-actions">
        <button @click="confirmUpload" class="btn-confirm">
          Confirmer
        </button>
        <button @click="cancelUpload" class="btn-cancel">
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCurrentUser } from 'vuefire'
import { useStorage } from '../composables/useStorage'

const props = defineProps({
  currentAvatar: {
    type: String,
    default: null
  },
  userName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['uploaded'])

const user = useCurrentUser()
const { uploading, error, progress, uploadAvatar } = useStorage()

const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)

const openFileInput = () => {
  if (!uploading.value) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  selectedFile.value = file

  // Créer un aperçu
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result
  }
  reader.readAsDataURL(file)
}

const confirmUpload = async () => {
  if (!selectedFile.value || !user.value) return

  try {
    const downloadURL = await uploadAvatar(user.value, selectedFile.value)
    emit('uploaded', downloadURL)

    // Réinitialiser
    selectedFile.value = null
    previewUrl.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err) {
    console.error('Erreur lors de l\'upload:', err)
  }
}

const cancelUpload = () => {
  selectedFile.value = null
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-display {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 3px solid #42b983;
}

.avatar-display:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-image {
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
  font-size: 2.5rem;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  gap: 0.25rem;
}

.avatar-display:hover .avatar-overlay {
  opacity: 1;
}

.upload-icon {
  font-size: 2rem;
}

.upload-text {
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
}

.upload-progress {
  width: 100%;
  max-width: 300px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b983 0%, #359268 100%);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.5rem;
}

.error-message {
  padding: 0.75rem 1rem;
  background: #f8d7da;
  border: 1px solid #f5c2c7;
  border-radius: 4px;
  color: #842029;
  font-size: 0.9rem;
  max-width: 300px;
  text-align: center;
}

.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  max-width: 400px;
}

.preview-section h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.preview-image {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #42b983;
}

.preview-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.btn-confirm,
.btn-cancel {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm {
  background: #42b983;
  color: white;
}

.btn-confirm:hover {
  background: #359268;
  transform: translateY(-2px);
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
  transform: translateY(-2px);
}
</style>
