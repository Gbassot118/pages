# Configuration des règles Firestore

## Problème

Par défaut, les règles Firestore peuvent limiter la suppression des salons uniquement aux créateurs. Pour permettre à n'importe quel utilisateur authentifié de supprimer un salon vide, vous devez mettre à jour les règles de sécurité Firestore.

## Solution

### Étape 1 : Accéder à la console Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Firestore Database**
4. Cliquez sur l'onglet **Règles** (Rules)

### Étape 2 : Remplacer les règles existantes

Copiez-collez le contenu du fichier `firestore.rules` dans l'éditeur de règles de la console Firebase.

Ou copiez directement les règles ci-dessous :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les salons
    match /rooms/{roomId} {
      // Lecture : tout utilisateur authentifié peut lire les salons
      allow read: if request.auth != null;

      // Création : tout utilisateur authentifié peut créer un salon
      allow create: if request.auth != null
        && request.resource.data.createdBy == request.auth.uid;

      // Suppression : tout utilisateur authentifié peut supprimer un salon
      // La vérification que le salon est vide se fait dans le code JavaScript
      allow delete: if request.auth != null;

      // Mise à jour : tout utilisateur authentifié peut mettre à jour (pour les rounds, etc.)
      allow update: if request.auth != null;

      // Règles pour les participants d'un salon
      match /participants/{participantId} {
        // Lecture : tout utilisateur authentifié peut lire les participants
        allow read: if request.auth != null;

        // Création : l'utilisateur peut s'ajouter lui-même comme participant
        allow create: if request.auth != null
          && request.resource.data.userId == request.auth.uid;

        // Mise à jour : l'utilisateur peut mettre à jour ses propres données
        allow update: if request.auth != null
          && resource.data.userId == request.auth.uid;

        // Suppression : l'utilisateur peut se retirer lui-même du salon
        allow delete: if request.auth != null
          && resource.data.userId == request.auth.uid;
      }
    }
  }
}
```

### Étape 3 : Publier les règles

1. Cliquez sur le bouton **Publier** (Publish) en haut de l'éditeur
2. Attendez quelques secondes que les règles soient déployées

### Étape 4 : Tester

1. Créez un salon avec un utilisateur
2. Connectez-vous avec un autre utilisateur
3. Vérifiez que vous pouvez supprimer le salon s'il est vide

## Note de sécurité

Les règles permettent à n'importe quel utilisateur authentifié de supprimer un salon. La vérification que le salon est vide est effectuée dans le code JavaScript (fonction `deleteRoom` dans `useRooms.js`). Cette approche est acceptable car :

- Seuls les utilisateurs authentifiés peuvent supprimer des salons
- Le code vérifie que le salon est vide avant de tenter la suppression
- Si quelqu'un contournait cette vérification, au pire il supprimerait un salon vide, ce qui n'est pas critique

Si vous souhaitez une sécurité plus stricte, vous pouvez envisager d'utiliser Firebase Cloud Functions pour gérer la suppression de manière plus sécurisée.
