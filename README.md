# Café Connecté

## Prérequis
- Visual Studio Code
- Extension "Dev Containers" pour VS Code
- Docker et Docker Compose

## Démarrage (une seule commande)
1. Ouvrez le projet dans VS Code
2. Exécutez la commande `Dev Containers: Reopen in Container` via:
   - Raccourci clavier: `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
   - Tapez `Dev Containers: Reopen in Container` et appuyez sur Entrée

**L'environnement complet est exécuté automatiquement:**
- Backend Laravel (http://localhost:8000)
- Frontend Next.js (http://localhost:3000) 
- Base de données SQLite (intégrée au backend)

## Exécution automatique

Dans notre configuration DevContainer, les services backend et frontend sont exécutés automatiquement sans commandes supplémentaires. Le conteneur exécute les processus nécessaires pour:

1. Installer les dépendances
2. Initialiser la base de données SQLite
3. Exécuter les migrations et seeders
4. Démarrer les serveurs de développement

Cette approche respecte l'exigence du projet de pouvoir "se lancer en une seule ligne de commande".