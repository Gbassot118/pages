# Vue.js App - GitHub Pages

Application Vue.js 3 déployée automatiquement sur GitHub Pages.

## Technologies

- **Vue 3** - Framework JavaScript progressif
- **Vite** - Build tool rapide et moderne
- **Firebase** - Backend-as-a-Service (Firestore, Authentication)
- **GitHub Actions** - CI/CD pour le déploiement automatique
- **GitHub Pages** - Hébergement statique

## Fonctionnalités

- **Salons de discussion** - Créer et rejoindre des salons
- **Planning Poker** - Voter avec des cartes Fibonacci ou personnalisées
- **Mode spectateur** - Observer sans participer aux votes
- **Temps réel** - Synchronisation instantanée via Firestore
- **Gestion des salons** - Supprimer les salons vides
- **Avatars personnalisés** - Support des photos de profil
- Design responsive et moderne

## Configuration Firebase

Cette application utilise Firebase pour l'authentification et Firestore pour la base de données.

### Configuration des règles Firestore

**Important** : Pour permettre à n'importe quel utilisateur de supprimer un salon vide, vous devez configurer les règles Firestore dans la console Firebase.

Consultez le fichier [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) pour les instructions détaillées.

Les règles Firestore recommandées sont disponibles dans le fichier [firestore.rules](./firestore.rules).

## Développement local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Builder pour la production
npm run build

# Preview du build
npm run preview
```

## Déploiement

L'application est déployée automatiquement via GitHub Actions à chaque push sur la branche `main`.

Le workflow :
1. Installe les dépendances
2. Build l'application avec Vite
3. Déploie le dossier `dist` sur GitHub Pages

## Configuration GitHub Pages

Pour activer GitHub Pages :
1. Allez dans Settings > Pages
2. Sélectionnez "GitHub Actions" comme source
3. Le workflow se déclenchera automatiquement

## URL de l'application

Une fois déployée : `https://gbassot118.github.io/pages/`
