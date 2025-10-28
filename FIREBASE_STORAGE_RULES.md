# Configuration des règles de sécurité Firebase Storage

Pour permettre aux utilisateurs d'uploader leur avatar, vous devez configurer les règles de sécurité Firebase Storage.

## Étapes de configuration

1. Allez dans la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet "pages-6c81c"
3. Dans le menu de gauche, cliquez sur **Storage**
4. Si Storage n'est pas activé, cliquez sur "Commencer" pour l'activer
5. Une fois activé, cliquez sur l'onglet **Rules** (Règles)
6. Remplacez les règles existantes par les règles ci-dessous
7. Cliquez sur **Publier** pour appliquer les règles

## Règles de sécurité recommandées

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Règles pour les avatars
    match /avatars/{userId}/{fileName} {
      // Autoriser la lecture publique des avatars
      allow read: if true;

      // Autoriser l'écriture uniquement pour l'utilisateur authentifié qui possède le fichier
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Limite de 5MB
                   && request.resource.contentType.matches('image/.*');  // Seulement des images
    }

    // Tout autre chemin est interdit par défaut
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Explications des règles

- **Lecture publique** : Tout le monde peut voir les avatars (nécessaire pour les afficher dans l'application)
- **Écriture limitée** :
  - L'utilisateur doit être authentifié
  - Il peut uniquement uploader dans son propre dossier (userId doit correspondre)
  - Taille maximale du fichier : 5MB
  - Types de fichiers acceptés : images uniquement (JPEG, PNG, GIF, WebP, etc.)

## Vérification

Une fois les règles configurées, testez l'upload d'avatar dans l'application :
1. Connectez-vous à l'application
2. Cliquez sur votre avatar dans la barre supérieure
3. Sélectionnez une image de moins de 5MB
4. Confirmez l'upload

Si l'upload échoue, vérifiez :
- Que Firebase Storage est bien activé
- Que les règles ont été correctement publiées
- Que l'image fait moins de 5MB
- Que le format de l'image est bien supporté (JPG, PNG, GIF, WebP)
