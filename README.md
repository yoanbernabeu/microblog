# MicroBlog

Un générateur de site statique de micro-blogging personnel construit avec Astro et Tailwind CSS.

## Fonctionnalités

- Posts de 280 caractères avec images (max 4)
- Hashtags cliquables
- Thème clair/sombre
- Recherche intégrée (Cmd+K)
- Flux RSS
- Interface admin pour gérer les posts
- Déploiement automatique sur GitHub Pages

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Configuration

1. Copiez `.env.example` vers `.env`
2. Configurez votre repository GitHub : `PUBLIC_GITHUB_REPO=username/repo`
3. Personnalisez `src/config.yml` avec vos informations

## Déploiement

Le site se déploie automatiquement sur GitHub Pages à chaque push sur `main`.

Les posts programmés sont publiés toutes les 30 minutes via GitHub Actions.

## Structure

```
src/
├── components/     # Composants Astro
├── content/posts/  # Posts Markdown
├── layouts/        # Layouts de page
├── lib/           # Utilitaires TypeScript
├── pages/         # Pages du site
└── styles/        # CSS global
```

## License

MIT
