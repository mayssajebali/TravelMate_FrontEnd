# TravelMate : Frontend (React + Vite)

Interface du réseau social de voyage. Elle communique avec l'API Django.

Cloner le projet:

```bash
git clone [<url-du-frontend>](https://github.com/mayssajebali/TravelMate_FrontEnd.git)   # puis suivre les étapes ci-dessous
```

## Lancer le projet
| Frontend React | `npm install` puis `npm run dev` | `http://localhost:5173` |

Prérequis : **Node.js 20+** (`node -v` pour vérifier).

> Le frontend envoie ses requêtes à `/api/...` et Vite les redirige vers Django
> (proxy configuré dans `vite.config.js`). Après toute modification de ce fichier,
> **relancer `npm run dev`**.

Pour appeler une autre adresse d'API : copier `.env.example` en `.env` et modifier `VITE_API_URL`.
