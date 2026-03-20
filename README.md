# Zoo Board Flashcards 🦎

App de révision pour le Board Européen de Médecine Vétérinaire Zoologique.

## Structure

```
zoo-flashcards/
├── index.html                ← Entry point Vite
├── vite.config.js            ← Config Vite (modifier base pour GitHub Pages)
├── package.json
├── src/
│   ├── main.jsx              ← Point d'entrée React
│   ├── App.jsx               ← Logique app + auth + state + vues
│   ├── components.jsx        ← Composants UI (FlashCard, LoginScreen, etc.)
│   ├── categories.js         ← Constantes catégories (icônes, couleurs, noms)
│   ├── firebase-config.js    ← Config Firebase + whitelist emails
│   ├── firestore.js          ← CRUD Firestore
│   ├── parser.js             ← Parser de flashcards
│   └── styles.css            ← Tous les styles
└── README.md
```

## Pour itérer

| Tu veux modifier...           | Tu touches...           |
|-------------------------------|-------------------------|
| Le parsing des flashcards     | `src/parser.js`         |
| Le design / CSS               | `src/styles.css`        |
| Les composants React (UI)     | `src/components.jsx`    |
| La logique app / auth / state | `src/App.jsx`           |
| Les emails autorisés          | `src/firebase-config.js`|
| Les opérations Firestore      | `src/firestore.js`      |
| Les catégories (icônes, noms) | `src/categories.js`     |

## Développement local

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 dans ton navigateur.

## Build & Déploiement GitHub Pages

### 1. Modifier le base path dans `vite.config.js`

```js
base: '/nom-de-ton-repo/'
```

### 2. Build

```bash
npm run build
```

Le dossier `dist/` contient les fichiers statiques prêts à déployer.

### 3. Déployer sur GitHub Pages

Option A — **GitHub Actions** (recommandé, auto-deploy à chaque push) :

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

Puis dans Settings → Pages → Source : **GitHub Actions**.

Option B — **Manuel** :

```bash
npm run build
# Push le contenu de dist/ sur une branche gh-pages
npx gh-pages -d dist
```

### 4. Firebase : Ajouter le domaine autorisé

Firebase Console → Authentication → Settings → Authorized domains  
→ Ajouter `ton-username.github.io`

## Workflow utilisateur

1. Ouvrir le **Projet Claude** → uploader un PDF → "analyze this article"
2. Copier la section Flashcards de la réponse
3. Ouvrir l'app → coller → "Add to deck"
4. Réviser avec les cartes interactives (flip, filtres, shuffle)
