<template>
  <div class="firestore-setup-alert">
    <div class="alert-icon">⚠️</div>
    <div class="alert-content">
      <h3>Configuration Firestore requise</h3>
      <p>Pour utiliser les salons de discussion, vous devez configurer Firestore dans votre projet Firebase.</p>

      <div class="steps">
        <h4>Étapes à suivre :</h4>
        <ol>
          <li>
            <strong>Activer Firestore :</strong>
            <br>Allez dans la console Firebase → Firestore Database → Créer une base de données
          </li>
          <li>
            <strong>Configurer les règles de sécurité :</strong>
            <br>Copiez les règles depuis la documentation du projet
          </li>
          <li>
            <strong>Publier les règles</strong>
            <br>Cliquez sur "Publier" dans l'onglet Règles
          </li>
        </ol>
      </div>

      <a
        href="https://console.firebase.google.com/project/pages-6c81c/firestore"
        target="_blank"
        rel="noopener"
        class="btn-firebase"
      >
        Ouvrir la console Firebase
      </a>
    </div>
  </div>
</template>

<style scoped>
.firestore-setup-alert {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 700px;
  margin: 2rem auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #ff9800;
}

.alert-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.alert-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  text-align: center;
}

.alert-content p {
  color: #6c757d;
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.steps {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.steps h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.steps ol {
  margin: 0;
  padding-left: 1.5rem;
}

.steps li {
  margin-bottom: 1rem;
  color: #495057;
  line-height: 1.6;
}

.steps li:last-child {
  margin-bottom: 0;
}

.steps strong {
  color: #2c3e50;
}

.btn-firebase {
  display: block;
  background: #ff9800;
  color: white;
  text-align: center;
  padding: 1rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s;
}

.btn-firebase:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

@media (max-width: 768px) {
  .firestore-setup-alert {
    padding: 1.5rem;
    margin: 1rem;
  }

  .steps {
    padding: 1rem;
  }

  .steps ol {
    padding-left: 1rem;
  }
}
</style>
