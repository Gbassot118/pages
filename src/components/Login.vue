<script setup>
import { ref } from 'vue'
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const error = ref(null)
const loading = ref(false)
const email = ref('')
const password = ref('')
const isSignUp = ref(false)

const signInWithGoogle = async () => {
  try {
    loading.value = true
    error.value = null
    await signInWithPopup(auth, googleProvider)
  } catch (err) {
    console.error('Erreur lors de la connexion avec Google:', err)
    error.value = 'Erreur lors de la connexion avec Google. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

const signInWithEmail = async () => {
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs.'
    return
  }

  try {
    loading.value = true
    error.value = null

    if (isSignUp.value) {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    }
  } catch (err) {
    console.error('Erreur lors de l\'authentification:', err)

    if (err.code === 'auth/email-already-in-use') {
      error.value = 'Cet email est déjà utilisé.'
    } else if (err.code === 'auth/weak-password') {
      error.value = 'Le mot de passe doit contenir au moins 6 caractères.'
    } else if (err.code === 'auth/invalid-email') {
      error.value = 'Email invalide.'
    } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      error.value = 'Email ou mot de passe incorrect.'
    } else if (err.code === 'auth/invalid-credential') {
      error.value = 'Email ou mot de passe incorrect.'
    } else {
      error.value = isSignUp.value
        ? 'Erreur lors de l\'inscription. Veuillez réessayer.'
        : 'Erreur lors de la connexion. Veuillez réessayer.'
    }
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = null
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Bienvenue</h1>
      <p class="subtitle">{{ isSignUp ? 'Créez votre compte' : 'Connectez-vous pour accéder à l\'application' }}</p>

      <div class="error-message" v-if="error">
        {{ error }}
      </div>

      <!-- Formulaire Email/Mot de passe -->
      <form @submit.prevent="signInWithEmail" class="email-form">
        <div class="form-group">
          <label for="email">Adresse e-mail</label>
          <input
            id="email"
            type="email"
            v-model="email"
            placeholder="exemple@email.com"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="Minimum 6 caractères"
            required
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="login-button email-button"
        >
          {{ isSignUp ? 'S\'inscrire' : 'Se connecter' }}
        </button>
      </form>

      <div class="toggle-mode">
        <button @click="toggleMode" class="toggle-button" :disabled="loading">
          {{ isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Inscrivez-vous' }}
        </button>
      </div>

      <div class="divider">
        <span>OU</span>
      </div>

      <!-- Bouton Google -->
      <button
        @click="signInWithGoogle"
        :disabled="loading"
        class="login-button google-button"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continuer avec Google</span>
      </button>

      <div v-if="loading" class="loading">
        {{ isSignUp ? 'Inscription en cours...' : 'Connexion en cours...' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 100%;
}

h1 {
  color: #333;
  font-size: 2em;
  margin: 0 0 12px 0;
  text-align: center;
}

.subtitle {
  color: #666;
  text-align: center;
  margin: 0 0 32px 0;
  font-size: 1em;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9em;
  text-align: center;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 24px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.email-button {
  background: #667eea;
  color: white;
  border-color: #667eea;
  margin-top: 8px;
}

.email-button:hover:not(:disabled) {
  background: #5568d3;
  border-color: #5568d3;
}

.toggle-mode {
  margin-top: 16px;
  text-align: center;
}

.toggle-button {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 0.95em;
  text-decoration: underline;
  padding: 8px;
}

.toggle-button:hover:not(:disabled) {
  color: #5568d3;
}

.toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999;
  font-size: 0.9em;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider span {
  padding: 0 16px;
}

.google-button {
  margin-top: 8px;
}

.google-button:hover:not(:disabled) {
  border-color: #4285F4;
  background: #f8f9ff;
}

.loading {
  text-align: center;
  margin-top: 20px;
  color: #667eea;
  font-weight: 500;
}

svg {
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  h1 {
    font-size: 1.75em;
  }
}
</style>
