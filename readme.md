# Application de gestion d'evenements

Une application web moderne et complète de gestion d'événements avec React, TypeScript, Node.js et PostgreSQL. Créez, modifiez, dupliquez et gérez vos événements facilement !

## Table des matières

1. Fonctionnalités
2. Installation
3. Configuration Base de Données
4. Démarrage
5. Utilisation
6. API Endpoints
7. Troubleshooting

## Fonctionnalités

### Authentification
- Inscription et Connexion sécurisée
- Tokens JWT
- Hachage bcryptjs pour les mots de passe

### Gestion des Événements
- Créer, modifier, supprimer des événements
- Dupliquer instantanément un événement
- Ajouter une image de fond (URL)
- Design responsive avec image en haut, infos en bas

### Gestion des inscriptions
- S'inscrire/désinscrire aux événements
- Voir la liste des inscrits (propriétaire)
- Gestion des places (max_subscribers)

### Recherche et Filtrage
- Recherche en temps réel
- Filtre par catégorie (Cinéma, Études, Sport, Autres)
- Séparation Événements à venir vs Passés

### Pagination et Défilement
- Mode Pagination avec Préc/Suiv
- Mode Défilement infini avec "Charger plus"
- Sélection flexible : 4, 6 ou 12 items par page

### Validation et Sécurité
- Validation Zod côté frontend
- Messages d'erreur en français
- Protection des routes via JWT

### Interface utilisateur
- Mode clair/sombre
- Notifications toast
- Dialogs modales (Radix UI)
- Design responsive
- Icônes emoji

## Installation

### Prérequis
- Node.js v16+ et npm
- PostgreSQL 12+

### Étape 1 : Backend

cd event-backend
npm install

### Étape 2 : Frontend

cd event-frontend
npm install

## Configuration Base de Données

### Créer la base de données

Ouvrez pgAdmin ou un terminal PostgreSQL et exécutez :

CREATE DATABASE event_manager;

### Créer les tables

Connectez-vous à la base event_manager et exécutez ce script complet :

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  event_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nb_subscribers INTEGER DEFAULT 0,
  max_subscribers INTEGER DEFAULT 20,
  category VARCHAR(50) DEFAULT 'Autres',
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_events_owner ON events(owner_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_users_events_user ON users_events(user_id);
CREATE INDEX idx_users_events_event ON users_events(event_id);

### Configurer la connexion

Modifiez le fichier event-backend/db.js avec vos identifiants PostgreSQL :

const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "votre_mot_de_passe",
  database: "event_manager",
  port: 5432,
});

module.exports = pool;

## Démarrage

Ouvrez deux terminaux différents.

### Terminal 1 - Backend

cd event-backend
npm start

Le serveur API démarre sur http://localhost:5000

### Terminal 2 - Frontend

cd event-frontend
npm run dev

L'application démarre sur http://localhost:5173

## Utilisation

### 1. Inscription

Allez sur http://localhost:5173. Cliquez sur "S'inscrire". Créez un compte avec un username et password. Vous êtes automatiquement connecté.

### 2. Créer un événement

Cliquez sur le bouton "Créer". Remplissez les champs du formulaire :
- Titre : le nom de votre événement
- Description : une brève description
- Date : la date de l'événement
- Lieu : où se déroulera l'événement
- Nombre de places : le nombre maximum de participants
- URL image : un lien vers une image (optionnel, exemple : https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500)
- Catégorie : choisir entre Cinéma, Études, Sport, Autres

Cliquez sur "Créer" pour créer l'événement.

### 3. Rechercher et filtrer les événements

Utilisez la barre de recherche en haut pour trouver des événements par titre, description ou lieu. Cliquez sur les boutons des catégories pour filtrer par type d'événement. Vous pouvez combiner la recherche et les filtres.

### 4. S'inscrire à un événement

Sur la page "Tous", cliquez sur le bouton "Valider" sur la carte d'un événement pour vous y inscrire. Vous apparaîtrez dans la liste des inscrits.

### 5. Gérer vos événements

Allez à l'onglet "Mes événements". Pour chaque événement que vous avez créé, vous pouvez :
- Modifier : cliquez sur le bouton "Modifier" pour changer les détails
- Dupliquer : cliquez sur "Dupliquer" pour créer une copie de l'événement
- Voir inscrits : cliquez sur "Voir inscrits" pour voir qui s'est inscrit
- Supprimer : cliquez sur "Supprimer" pour supprimer l'événement

### 6. Mode clair/sombre

Cliquez sur le bouton "Dark" ou "Light" en haut à droite pour changer le thème.

### 7. Pagination et défilement

Sur la page "Tous", vous pouvez choisir entre deux modes :
- Mode Pagination : cliquez "Pagination" et utilisez les boutons "Préc" et "Suiv" pour naviguer
- Mode Défilement infini : cliquez "Défilement infini" et le contenu se charge automatiquement quand vous scrollez

Vous pouvez aussi choisir le nombre d'événements affichés par page (4, 6 ou 12).

## API Endpoints

### Authentification

POST /api/signup - Crée un nouvel utilisateur avec username et password
POST /api/login - Connecte un utilisateur et retourne un token JWT
GET /api/me - Retourne les informations de l'utilisateur authentifié

### Événements

GET /api/events - Retourne tous les événements
GET /api/events/mine - Retourne les événements créés par l'utilisateur
POST /api/events - Crée un nouvel événement
PUT /api/events/:id - Modifie un événement (propriétaire uniquement)
DELETE /api/events/:id - Supprime un événement (propriétaire uniquement)
POST /api/events/:id/subscribe - S'inscrire à un événement
DELETE /api/events/:id/subscribe - Se désinscrire d'un événement
GET /api/events/:id/subscribers - Voir la liste des inscrits (propriétaire uniquement)
POST /api/events/:id/duplicate - Dupliquer un événement (propriétaire uniquement)

## Technologies utilisées

Backend :
- Express.js : Framework serveur Node.js
- PostgreSQL : Base de données relationnelle
- JWT : Authentification par tokens
- bcryptjs : Hachage sécurisé des mots de passe

Frontend :
- React 19 : Framework UI
- TypeScript : Langage typé
- Vite : Builder et dev server rapide
- React Router : Routage des pages
- Radix UI : Composants modales et tabs
- react-hot-toast : Système de notifications
- Zod : Validation des données
- Sass : Styles CSS préprocessés

## Troubleshooting

### "Cannot connect to database"

Vérifiez que :
- PostgreSQL est en cours d'exécution sur votre machine
- La base de données "event_manager" a été créée
- Les identifiants dans event-backend/db.js sont corrects (user, password)
- Le port 5432 est libre

### "CORS error"

Vérifiez que :
- CORS est activé dans event-backend/src/server.js (app.use(cors()))
- Le frontend s'exécute sur http://localhost:5173
- Le backend s'exécute sur http://localhost:5000

### "Module not found"

Réinstallez les dépendances :

rm -rf node_modules package-lock.json
npm install

### "Images ne s'affichent pas"

Vérifiez que :
- L'URL de l'image commence par https://
- L'URL est publique et accessible
- Exemples de sites : https://unsplash.com, https://pexels.com

### "Port 5000 ou 5173 déjà utilisé"

Windows :
netstat -ano | findstr :5000
taskkill /PID <PID> /F

Mac/Linux :
lsof -i :5000
kill -9 <PID>

## Quick Start (5 minutes)

1. Créer la base de données PostgreSQL :

psql -U postgres -c "CREATE DATABASE event_manager;"

2. Exécuter le script SQL des tables ci-dessus dans pgAdmin ou psql

3. Démarrer le backend :

cd event-backend
npm install
npm start

4. Dans un autre terminal, démarrer le frontend :

cd event-frontend
npm install
npm run dev

5. Ouvrez http://localhost:5173 dans votre navigateur

## Licence

ISC - Libre d'utilisation

Made with React

Bon développement !