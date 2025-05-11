# Café Connecté

## Description du projet

Café Connecté est une application web simulant une machine à café connectée avec un système Click & Collect, permettant aux utilisateurs de commander leur café en ligne et de suivre sa préparation en temps réel.

## Prérequis et démarrage rapide

### Prérequis
- Docker et Docker Compose
- Visual Studio Code (recommandé)
- Extension "Dev Containers" pour VS Code (recommandé)
- Git

### Récupération du code
```bash
# Clonez le dépôt
git clone https://github.com/SylvainM98/CoffeeMachine.git

# Accédez au répertoire du projet
cd CoffeeMachine
```

### Démarrage en une commande (Option 1 - VS Code)
1. Ouvrez le projet dans VS Code
2. Exécutez `Dev Containers: Reopen in Container` (Ctrl+Shift+P ou Cmd+Shift+P)

### Démarrage alternatif (Option 2 - Terminal)
```bash
cd .devcontainer
docker-compose up -d
```

Pour arrêter les conteneurs: `docker-compose down`

L'environnement complet démarre automatiquement:
- Frontend Next.js: http://localhost:3000
- Backend Laravel: http://localhost:8000
- API REST: http://localhost:8000/api/v1
- Documentation Swagger: http://localhost:8000/api/documentation
- Base de données MySQL: accessible via la configuration du projet

## Architecture technique et choix technologies

### Stack technique
- **Backend**: Laravel 12 (PHP 8.2)
- **Frontend**: Next.js 15.3 avec React 19 et TypeScript
- **Base de données**: MySQL
- **Documentation API**: Swagger/OpenAPI
- **Conteneurisation**: Docker et Docker Compose

### Technologies supplémentaires utilisées

#### Backend
- **Laravel Swagger/OpenAPI** (darkaonline/l5-swagger) - Documentation API auto-générée
- **Carbon** - Manipulation avancée des dates et heures
- **Eloquent ORM** - Mapping objet-relationnel

#### Frontend
- **TailwindCSS** - Framework CSS utilitaire
- **React Hooks** - Gestion d'état et effets dans les composants fonctionnels
- **Canvas API** - Pour les animations et rendus graphiques personnalisés

### Architecture
L'application suit une architecture client-serveur avec:
- Une API REST en Laravel pour gérer les commandes et l'état du système
- Un worker backend en continu simulant le processus physique de préparation du café
- Une interface utilisateur interactive en Next.js/React pour visualiser et interagir avec le système

### Système de worker en continu
Le système utilise un worker Laravel personnalisé (`CoffeeMachineWorker`) qui:
- S'exécute en arrière-plan comme un processus continu
- Simule la préparation physique du café avec des délais réalistes
- Gère intelligemment les commandes immédiates et les réservations
- Met à jour en temps réel l'état et la progression des commandes

## Fonctionnalités principales

### Commande immédiate de café
- Sélection du type de café (espresso, cappuccino, latte)
- Animation interactive du processus de préparation
- Indicateur de progression en temps réel

### Système de réservation avec créneaux horaires
- Visualisation et sélection des créneaux disponibles
- Validation des créneaux pour éviter les conflits
- Suggestions automatiques d'horaires alternatifs

### File d'attente intelligente avec prioritisation
- Gestion automatique des priorités (commandes immédiates vs réservations)
- Calcul du temps d'attente estimé
- Visualisation de l'état de la file d'attente

### Simulation du processus de préparation
- Animation visuelle de la préparation du café
- Barre de progression en temps réel
- Notification lorsque le café est prêt

## Documentation technique

### Documentation Swagger
La documentation complète de l'API est disponible à l'adresse:
```
http://localhost:8000/api/documentation
```
Cette documentation interactive vous permet de tester tous les endpoints directement depuis votre navigateur.

### Structure de l'API (endpoints principaux)
- **GET /api/v1/coffees** - Liste des cafés disponibles
- **POST /api/v1/orders** - Créer une nouvelle commande
- **GET /api/v1/process/{order}/progress** - Obtenir la progression d'une commande
- **GET /api/v1/queue/status** - Obtenir l'état de la file d'attente
- **GET /api/v1/queue/available-slots** - Obtenir les créneaux disponibles
- **POST /api/v1/queue/validate-slot** - Valider un créneau de réservation

### Modèles de données
- **Coffee**: type, prix, temps de préparation
- **Order**: référence au café, statut, progression, heure estimée de fin, nom du client, heure de retrait

### Flux de communication
1. Le frontend interroge périodiquement l'état de la machine
2. Lors d'une commande, une requête POST est envoyée au backend
3. Le worker backend traite la commande et met à jour son statut
4. Le frontend poll l'endpoint de progression pour mettre à jour l'UI

### Détails d'exécution automatique
Notre configuration DevContainer exécute automatiquement:
1. Installation des dépendances
2. Initialisation de la base de données MySQL
3. Migrations et seeders
4. Démarrage des serveurs de développement

Cette approche respecte l'exigence du projet de pouvoir "se lancer en une seule ligne de commande".

## Auteur et contact

Projet développé par Sylvain MOLINIER dans le cadre d'une évaluation technique.

Contact: sylvain.molinier@orange.fr