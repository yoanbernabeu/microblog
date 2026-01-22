# MicroBlog

Un generateur de site statique de micro-blogging personnel construit avec Astro et Tailwind CSS.

## Fonctionnalites

- Posts de 280 caracteres avec images (max 4)
- Hashtags cliquables
- Theme clair/sombre
- Recherche integree (Cmd+K)
- Flux RSS
- Interface admin pour gerer les posts
- Authentification GitHub OAuth (Device Flow)
- Deploiement automatique sur GitHub Pages

## Installation

```bash
npm install
```

## Developpement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:4321`

## Configuration

### 1. Variables d'environnement locales

Copiez `.env.example` vers `.env` et configurez :

```env
PUBLIC_GITHUB_REPO=username/repo
PUBLIC_GITHUB_CLIENT_ID=votre_client_id
PUBLIC_GITHUB_PROXY_URL=https://votre-worker.workers.dev
```

### 2. Personnalisation

Editez `src/config.yml` avec vos informations personnelles (nom, bio, avatar, liens sociaux).

## Deploiement sur GitHub Pages

### Etape 1 : Creer une OAuth App GitHub

1. Allez sur [GitHub Developer Settings](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Remplissez :
   - **Application name** : MicroBlog (ou ce que vous voulez)
   - **Homepage URL** : `https://votre-username.github.io/microblog`
   - **Authorization callback URL** : `https://github.com` (pas utilise par Device Flow)
4. Cliquez **Register application**
5. Dans les settings de l'app, cochez **Enable Device Flow**
6. Notez le **Client ID**

### Etape 2 : Deployer le proxy CORS (Cloudflare Worker)

Le Device Flow OAuth necessite un proxy CORS car GitHub ne supporte pas les appels directs depuis le navigateur.

1. Creez un compte sur [Cloudflare](https://dash.cloudflare.com/)
2. Allez dans **Workers & Pages** → **Create application** → **Create Worker**
3. Donnez un nom (ex: `microblog-oauth-proxy`)
4. Cliquez **Deploy**, puis **Edit code**
5. Remplacez le contenu par le code de `cloudflare-worker/worker.js`
6. **Save and deploy**
7. Notez l'URL du worker (ex: `https://microblog-oauth-proxy.votre-compte.workers.dev`)

### Etape 3 : Configurer les variables GitHub Actions

1. Dans votre repo GitHub, allez dans **Settings** → **Secrets and variables** → **Actions**
2. Onglet **Variables** → **New repository variable**
3. Ajoutez :

| Name | Value |
|------|-------|
| `PUBLIC_GITHUB_CLIENT_ID` | Votre Client ID OAuth |
| `PUBLIC_GITHUB_PROXY_URL` | URL de votre Cloudflare Worker |

> Note : `PUBLIC_GITHUB_REPO` est automatiquement defini par le workflow.

### Etape 4 : Activer GitHub Pages

1. Dans votre repo, allez dans **Settings** → **Pages**
2. **Source** : GitHub Actions

### Etape 5 : Deployer

Poussez sur la branche `main` :

```bash
git push origin main
```

Le workflow GitHub Actions va automatiquement build et deployer le site.

## Fonctionnement

### Authentification

L'admin utilise GitHub OAuth Device Flow :
1. L'utilisateur clique "Se connecter avec GitHub"
2. Un code s'affiche (ex: `ABCD-1234`)
3. L'utilisateur va sur github.com/login/device et entre le code
4. L'app detecte l'autorisation et connecte l'utilisateur

Seuls les utilisateurs avec des droits **push** sur le repository peuvent acceder a l'admin.

Une methode de fallback avec token personnel (PAT) est disponible si OAuth n'est pas configure.

### Posts programmes

Les posts peuvent etre programmes avec une date future. Le workflow GitHub Actions s'execute toutes les 30 minutes pour publier les posts programmes.

## Structure

```
src/
├── components/     # Composants Astro
├── content/posts/  # Posts Markdown
├── layouts/        # Layouts de page
├── lib/            # Utilitaires TypeScript
├── pages/          # Pages du site
└── styles/         # CSS global

cloudflare-worker/  # Proxy CORS pour OAuth
```

## License

MIT License - Yoan Bernabeu 2026
