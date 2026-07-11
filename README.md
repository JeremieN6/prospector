# Prospector Sassify

Un SaaS moderne pour générer des listes de prospects qualifiés en quelques clics. Scrape les données publiques, enrichit les contacts et exporte les résultats pour vos campagnes commerciales.

## 🎯 Fonctionnalités

- **Création de campagnes de prospection** - Définissez votre cible (produit, zone géographique, requête de recherche)
- **Scraping intelligent** - Extraction automatique de données via Google Places et enrichissement par Brevo
- **Génération de leads** - Export des prospects avec emails et contacts
- **Historique des campagnes** - Suivez vos campagnes et visualisez les résultats
- **Authentification sécurisée** - Inscription/connexion avec hachage des mots de passe

## 🛠 Stack Technique

### Frontend
- **Nuxt 3** - Framework Vue moderne avec SSR
- **Vue 3** - Framework réactif
- **TailwindCSS** - Utility-first CSS
- **TypeScript** - Typage statique

### Backend
- **Nitro** (Nuxt) - Serveur HTTP
- **Prisma** - ORM pour PostgreSQL
- **PostgreSQL** - Base de données
- **Redis + BullMQ** - Queue d'emplois pour scraping asynchrone

### Intégrations
- **Google Places API** - Recherche de lieux et récupération de données
- **Brevo API** - Enrichissement d'emails et gestion de listes

## 🚀 Démarrage

### Prérequis
- Node.js 18+
- PostgreSQL
- Redis
- Clés API : Google Places, Brevo

### Installation

```bash
# Cloner et installer
git clone <repo>
cd prospector
npm install

# Variables d'environnement
cp .env.example .env.local
# Configurez : DATABASE_URL, REDIS_URL, GOOGLE_PLACES_KEY, BREVO_API_KEY, SESSION_SECRET

# Base de données
npm run db:push
npm run db:seed

# Développement
npm run dev    # Serveur sur http://localhost:3000

# Production
npm run build
npm run start
```

### Commandes Utiles

```bash
npm run db:migrate    # Créer une migration
npm run db:seed       # Remplir la BD avec des données test
npm run worker        # Lancer le worker de scraping
```

## 📁 Architecture

```
├── pages/               # Routes Nuxt (landing, auth, app)
├── components/          # Composants Vue
│   ├── landing/        # Page d'accueil
│   └── app/            # Interface app
├── server/
│   ├── api/            # Endpoints API (campagnes, auth, etc)
│   └── utils/          # Utilitaires (Brevo, scraper, auth)
├── prisma/             # Schéma & migrations
├── workers/            # Workers asynchrones (scraping)
├── composables/        # Composables Vue
└── middleware/         # Middleware d'authentification
```

## 🔐 Authentification

- Inscription/connexion par email
- Mots de passe hachés (bcryptjs)
- Sessions avec JWT expirables
- Middleware global pour protéger les routes

## 📊 Base de Données

Modèles principaux :
- **User** - Utilisateurs inscrits
- **Session** - Sessions actives
- **ApiCredentials** - Clés API stockées chiffrées
- **Campaign** - Campagnes de prospection
- **Lead** - Leads générés
- **Event** - Historique des actions

## 🔄 Flux de Prospection

1. Utilisateur crée une campagne (produit, zones, requête)
2. Job de scraping lancé via BullMQ
3. Worker scrap Google Places selon la requête
4. Enrichissement via Brevo (emails)
5. Stockage des leads en BD
6. Utilisateur visualise et exporte les résultats

## 📝 Variables d'Environnement

```env
# Base de données
DATABASE_URL=postgresql://...

# Cache & jobs
REDIS_URL=redis://...

# Authentification
SESSION_SECRET=votre-secret-session
ENCRYPTION_SECRET=votre-secret-chiffrement

# APIs externes
GOOGLE_PLACES_KEY=votre-clé-google
BREVO_API_KEY=votre-clé-brevo
```

## 🧪 Tests & Développement

```bash
# Mode développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm run start
```

## 📦 Déploiement

1. Préparez vos variables d'environnement
2. `npm run build` pour compiler
3. `npm run start` ou déployez via votre plateforme (Vercel, Railway, etc.)

## 📄 Licence

Propriétaire

## 🤝 Contribution

Pour le développement interne. Consultez `tasks/todo.md` pour les tâches en cours.
