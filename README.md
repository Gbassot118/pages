# Vue.js App - GitHub Pages

Application Vue.js 3 déployée automatiquement sur GitHub Pages.

## Technologies

- **Vue 3** - Framework JavaScript progressif
- **Vite** - Build tool rapide et moderne
- **GitHub Actions** - CI/CD pour le déploiement automatique
- **GitHub Pages** - Hébergement statique

## Fonctionnalités

- Affichage "Hello World" avec design moderne
- Date et heure en temps réel (mise à jour chaque seconde)
- Design responsive avec gradient
- Déploiement automatique à chaque push sur main

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
