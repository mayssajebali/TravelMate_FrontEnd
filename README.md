# TravelMate : Frontend (React + Vite)

Interface du réseau social de voyage. Elle communique avec l'API Django (`/api/...`).

## Deux dépôts

| Dépôt | Contenu |
|---|---|
| **travelmate-frontend** (celui-ci) | React + Vite |
| **<nom-du-dépôt-backend>** | Django + MongoDB (API) |

Cloner les deux, par exemple côte à côte :

```bash
git clone <url-du-backend>    # puis suivre son README pour lancer Django
git clone <url-du-frontend>   # puis suivre les étapes ci-dessous
```

## Lancer le projet

Il faut **3 choses qui tournent en même temps** :

| Quoi | Commande | Adresse |
|---|---|---|
| MongoDB | `mongod` (ou le service installé) | `localhost:27017` |
| Backend Django | `python manage.py runserver` | `http://localhost:8000` |
| Frontend React | `npm install` puis `npm run dev` | `http://localhost:5173` |

Prérequis : **Node.js 20+** (`node -v` pour vérifier).

> Le frontend envoie ses requêtes à `/api/...` et Vite les redirige vers Django
> (proxy configuré dans `vite.config.js`). Après toute modification de ce fichier,
> **relancer `npm run dev`**.

Pour appeler une autre adresse d'API : copier `.env.example` en `.env` et modifier `VITE_API_URL`.

## React en 30 secondes (pour ceux qui ne connaissent pas)

- Un **composant** = une fonction qui renvoie du HTML (écrit en JSX). Un fichier `.jsx` = un morceau de page.
- Les **props** = les paramètres qu'on donne à un composant : `<Post post={p} />`.
- Le **state** (`useState`) = une donnée qui, quand elle change, met l'affichage à jour tout seul.
- Le HTML reste du HTML, sauf `class` qui s'écrit `className`.
- Le CSS est dans des fichiers `.css` classiques.

## Organisation du code

```
src/
├── api.js              ← TOUS les appels vers Django (login, trips, feed...)
├── App.jsx             ← chef d'orchestre : garde l'utilisateur connecté, les posts,
│                         les voyages, et choisit la page à afficher
├── App.css             ← styles globaux (couleurs, layout, posts, stories...)
└── components/
    ├── Auth.jsx / .css         Écran connexion + inscription (carte postale)
    ├── Navbar.jsx / .css       Barre du haut + bouton « Log out »
    ├── LeftSidebar.jsx / .css  Menu de gauche (profil, navigation, stats)
    ├── RightSidebar.jsx        Colonne de droite (prochain voyage, etc.)
    ├── TripsPage.jsx / Trips.css   Page « Mes voyages » (ajout, modif, suppression)
    ├── Composer.jsx            Zone « publier un post »
    ├── Post.jsx                Un post du fil d'actualité
    ├── Stories.jsx, AiCard.jsx
```

## Comment ça marche

1. **Connexion** : `Auth.jsx` appelle `login()` / `register()` de `api.js`.
   Django renvoie `{ tokens: { access }, user }`. Le token est stocké dans le `localStorage`
   (clé `access`) puis envoyé à chaque requête (`Authorization: Bearer ...`).
2. **Session** : au chargement, `App.jsx` appelle `/api/auth/me/` pour savoir si le token est encore valide.
3. **Token expiré** (erreur 401) : retour automatique à l'écran de connexion.
4. **Déconnexion** : bouton « Log out » dans la Navbar (supprime le token).

## Routes API utilisées

| Fonction (`api.js`) | Route Django |
|---|---|
| `login`, `register`, `me` | `POST /api/auth/login/`, `POST /api/auth/register/`, `GET /api/auth/me/` |
| `getFeed`, `createPost` | `GET /api/feed/`, `POST /api/posts/` |
| `getTrips`, `createTrip`, `updateTrip`, `deleteTrip` | `/api/trips/` et `/api/trips/<id>/` |
| `getProfile`, `updateProfile` | `GET/PUT /api/users/me/` (page profil pas encore faite) |

La doc interactive de l'API est sur `http://localhost:8000/api/docs/`.

## Ajouter / modifier quelque chose

- **Un appel API** : ajouter une fonction dans `api.js` (copier une existante).
- **Un texte ou une couleur** : chercher le texte dans `src/components/`; les couleurs sont les variables en haut de `App.css` (`--turq`, `--coral`...).
- **Une nouvelle page** : créer `components/MaPage.jsx`, ajouter une entrée dans `NAV` de `LeftSidebar.jsx`, puis l'afficher dans `App.jsx`
  (`{section === 'maPage' && <MaPage />}`).

## Avancement

- [x] Connexion / inscription / déconnexion
- [x] Navbar, sidebars (infos réelles de l'utilisateur)
- [x] Mes voyages (CRUD complet) + « prochain voyage » dans le sidebar droit
- [ ] Composer / Post connectés à l'API (props prévues dans `App.jsx`)
- [ ] Page profil (`/api/users/me/`)
- [ ] Explorer, Travel Mates, Communautés, Messages, Enregistrés
