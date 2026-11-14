# Jobi

**Jobi** est une application web personnelle, exécutée en local sur votre ordinateur, pour centraliser vos recherches d'emploi, évaluer la pertinence des offres par rapport à votre profil et préparer vos candidatures.

Toutes vos données (profil, CV, offres, candidatures et clés API) restent stockées dans votre propre base de données locale.

---

## Ce que permet Jobi

L'application s'organise autour de cinq espaces accessibles depuis le menu latéral :

1. **Tableau de bord (`/`)** — Vérifie d'un coup d'œil que l'application et la base de données fonctionnent correctement et donne accès aux actions principales.
2. **Mon profil (`/profil`)** — Permet de renseigner votre parcours, vos expériences et vos critères de recherche (poste visé, localisation, télétravail, salaire minimum souhaité, types de contrat, compétences). Vous pouvez également importer votre CV (**PDF** ou **DOCX**, jusqu'à 5 Mo) pour en extraire le texte et obtenir une analyse ATS.
3. **Offres (`/offres`)** — Regroupe et déduplique les offres d'emploi récupérées depuis **France Travail** et **Adzuna**. Chaque offre reçoit un score de compatibilité calculé automatiquement selon votre profil et vos préférences.
4. **Candidatures (`/candidatures`)** — Aide à rédiger des brouillons de messages de candidature grâce à l'intelligence artificielle (**Mistral**, **OpenAI** ou **Anthropic**), en choisissant le ton (professionnel, direct ou enthousiaste) et des consignes personnalisées. Permet ensuite de suivre l'avancement (`brouillon`, `validée`, `envoyée`, `archivée`) et de consulter les statistiques d'utilisation et le coût estimé des appels IA.
5. **Paramètres (`/parametres`)** — Permet de saisir et enregistrer de manière chiffrée vos clés API (France Travail, Adzuna, Mistral, OpenAI, Anthropic), d'activer la synchronisation automatique des offres et de consulter l'historique des dernières collectes.

---

## Guide de démarrage rapide (recommandé : avec Docker)

Cette méthode est la plus simple si vous ne souhaitez pas installer manuellement Node.js et PostgreSQL sur votre machine.

### 1. Prérequis

- Installer **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Windows / Mac) ou Docker + Docker Compose (Linux).
- Récupérer les fichiers du projet sur votre ordinateur.

### 2. Configurer le fichier d'environnement

À la racine du projet, copiez le fichier `.env.example` et renommez la copie en `.env` :

```powershell
# Sous Windows (PowerShell)
Copy-Item .env.example .env
```

```bash
# Sous macOS / Linux
cp .env.example .env
```

Ouvrez ensuite le fichier `.env` avec un éditeur de texte et remplacez les deux secrets d'exemple par des valeurs aléatoires :

- `APP_ENCRYPTION_KEY` : clé de chiffrement utilisée pour protéger vos clés API en base de données (**64 caractères hexadécimaux** ou **32 octets encodés en base64**).
- `CRON_SECRET` : mot de passe aléatoire utilisé pour sécuriser le déclenchement automatique de la collecte d'offres.

> Les autres variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`) peuvent rester telles quelles pour une utilisation locale avec Docker.

### 3. Lancer l'application

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
docker compose up -d --build
```

Docker démarre trois services :
- **`db`** : la base de données PostgreSQL ;
- **`app`** : l'interface web Jobi ;
- **`cron`** : un planificateur qui déclenche la récupération des offres toutes les 15 minutes (lorsqu'elle est activée dans les paramètres).

### 4. Créer les tables de la base de données (première installation)

Si la base de données est vide lors du premier lancement, appliquez les migrations avec :

```bash
npm run db:migrate
```

*(Nécessite Node.js en local avec `DATABASE_URL=postgresql://jobi:jobi@localhost:5432/jobi`, car le port `5432` de PostgreSQL est exposé par Docker sur votre machine.)*

### 5. Ouvrir Jobi

Rendez-vous dans votre navigateur à l'adresse :

**[http://localhost:3000](http://localhost:3000)**

Pour commencer :
1. Allez dans **Paramètres** pour renseigner vos identifiants **France Travail** et/ou **Adzuna**, ainsi que la clé API du fournisseur IA de votre choix (**Mistral**, **OpenAI** ou **Anthropic**).
2. Complétez **Mon profil** et importez votre CV.
3. Consultez **Offres** puis générez vos premières **Candidatures**.

---

## Installation sans Docker (mode développement)

Utile si vous souhaitez modifier le code ou exécuter l'application directement avec Node.js.

### Prérequis

- **Node.js 22** (ou supérieur) et `npm`
- **PostgreSQL 16** (en local ou via `docker compose up -d db`)

### Étapes

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et adapter .env (pointant vers votre instance PostgreSQL locale)
cp .env.example .env

# 3. Appliquer les migrations de base de données
npm run db:migrate

# 4. Lancer le serveur de développement
npm run dev
```

L'application est alors accessible sur [http://localhost:3000](http://localhost:3000).

---

## Commandes utiles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Lance l'application en mode développement (rechargement à chaud). |
| `npm run build` | Compile l'application pour la production. |
| `npm run start` | Démarre l'application compilée (après `npm run build`). |
| `npm run lint` | Vérifie la qualité et le formatage du code avec ESLint. |
| `npm run test` | Exécute la suite de tests automatisés avec Vitest. |
| `npm run db:generate` | Génère une nouvelle migration SQL Drizzle à partir du schéma. |
| `npm run db:migrate` | Applique les migrations en attente sur la base PostgreSQL. |
| `npm run docker:rebuild` | Reconstruit et redémarre les conteneurs Docker (`docker compose up -d --build`). |

---

## Stack technique

- **Framework & Interface** : [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Design & Composants** : [Tailwind CSS 4](https://tailwindcss.com/), [Flowbite React](https://flowbite-react.com/), [Heroicons](https://heroicons.com/)
- **Base de données & ORM** : [PostgreSQL 16](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
- **Analyse de documents** : `pdf-parse` (lecture de CV PDF), `mammoth` (lecture de CV DOCX)
- **Validation & Tests** : [Zod](https://zod.dev/), [Vitest](https://vitest.dev/), Testing Library, ESLint
- **Intégrations externes** : API France Travail, API Adzuna, API Mistral / OpenAI / Anthropic
- **Conteneurisation** : Docker & Docker Compose

---

## Structure du projet

```text
├── drizzle/               # Migrations SQL générées par Drizzle
├── public/                # Ressources statiques
├── src/
│   ├── app/               # Pages Next.js (/, /offres, /candidatures, /profil, /parametres) et routes API
│   ├── components/        # Composants d'interface (offres, candidatures, profil, paramètres, layout)
│   ├── lib/               # Logique métier (ingestion, scoring, parsing CV/ATS, clients IA, chiffrement)
│   ├── server/db/         # Schéma et client PostgreSQL / Drizzle
│   └── test/              # Utilitaires et configuration de tests
├── .env.example           # Modèle de variables d'environnement
├── docker-compose.yml     # Orchestration Docker (db, app, cron)
├── Dockerfile             # Image de production Next.js
└── package.json           # Dépendances et scripts npm
```

---

## Licence

Ce projet est distribué sous licence **MIT** (voir le fichier [`LICENSE`](LICENSE)).
