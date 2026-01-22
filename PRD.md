# PRD - MicroBlog

## Vue d'ensemble

**Projet** : MicroBlog
**Repository** : `YoanBernabeu/MicroBlog`
**URL de production** : `yoanbernabeu.github.io/microblog`
**Stack technique** : Astro + Tailwind CSS + GitHub Pages + GitHub Actions
**Langue** : Anglais uniquement (interface et contenu)

### Concept

MicroBlog est un générateur de site statique de micro-blogging personnel. Il permet de publier des posts courts (style Twitter/X) sans système de likes ni de réponses. Le contenu est stocké en Markdown dans un repository Git, avec un mini-CMS intégré qui commit directement les modifications.

---

## Fonctionnalités

### 1. Posts (Micro-articles)

| Caractéristique | Spécification |
|-----------------|---------------|
| Longueur max | 280 caractères |
| Emoji | Supportés |
| Images | 4 maximum par post, stockées dans le repo |
| Liens | Premier lien uniquement : récupération automatique des métadonnées OG (titre, description, image) |
| YouTube | Embed automatique pour les liens YouTube (prioritaire sur OG si lien YouTube détecté) |
| Hashtags | Inline dans le texte (style Twitter), cliquables |
| Vidéos natives | Non supportées (uniquement YouTube via lien) |

#### Structure d'un fichier post

- **Nom du fichier** : timestamp ISO (`2026-01-22T14-30-00.md`)
- **Format** : Markdown standard (pas de MDX)
- **Frontmatter** :
  ```yaml
  ---
  status: published | draft | scheduled
  publishedAt: 2026-01-22T14:30:00Z
  images:
    - src: /images/posts/2026-01-22T14-30-00/image1.jpg
      alt: "Description optionnelle"
    - src: /images/posts/2026-01-22T14-30-00/image2.jpg
  ---
  ```

### 2. Gestion des images

#### Formats et limites

| Paramètre | Valeur |
|-----------|--------|
| Formats acceptés | JPG, PNG, WebP, GIF (animés inclus) |
| Taille max upload | 10 Mo par image |
| Nombre max par post | 4 images |
| Alt text | Optionnel (champ facultatif dans l'éditeur) |

#### Compression et optimisation

**À l'upload (côté navigateur) :**
- Compression automatique avant envoi
- Réduction de la taille fichier tout en préservant une qualité acceptable

**Au build (Astro) :**
- Génération d'images responsives (srcset) pour différentes tailles d'écran
- Formats modernes (WebP/AVIF) générés automatiquement
- Lazy loading natif

#### Gestion dans l'éditeur

- Drag & drop dans la zone d'édition
- Ctrl+V / Cmd+V pour coller depuis le presse-papier
- Réorganisation possible (drag & drop pour changer l'ordre)
- Suppression individuelle d'une image
- Ajout d'alt text optionnel par image

### 3. Recherche full-text

| Caractéristique | Spécification |
|-----------------|---------------|
| Type | Recherche côté client (statique) |
| Index | Généré au moment du build |
| Raccourci clavier | `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) |
| Interface | Modal/palette de commande style Spotlight |
| Contenu indexé | Texte des posts + hashtags |
| Résultats | Affichage en temps réel pendant la frappe |

L'index de recherche est un fichier JSON généré au build et chargé côté client. Utilisation d'une librairie légère type **Fuse.js** ou **MiniSearch** pour la recherche fuzzy.

### 4. Pages du site

| Page | URL | Description |
|------|-----|-------------|
| Feed principal | `/` | Scroll infini, posts du plus récent au plus ancien |
| Post individuel | `/post/[timestamp]` | Page dédiée à un post unique |
| Tag | `/tag/[nom]` | Liste des posts avec ce hashtag |
| Index des tags | `/tags` | Liste de tous les hashtags utilisés |
| Admin | `/admin` | Interface de gestion (protégée) |

### 5. Header / Profil

Affiché en haut du site, configuration modifiable via le CMS :

- **Avatar** : image de profil
- **Nom / Pseudo** : texte libre
- **Bio** : courte description
- **Liens réseaux sociaux** :
  - Twitter/X
  - GitHub
  - LinkedIn
  - Mastodon
  - Bluesky
  - YouTube
  - Liens personnalisés (URL + label)

#### Fichier de configuration

```yaml
# config.yml
profile:
  name: "Yoan Bernabeu"
  bio: "Développeur passionné..."
  avatar: "/images/avatar.jpg"

socialLinks:
  twitter: "https://twitter.com/..."
  github: "https://github.com/YoanBernabeu"
  linkedin: "https://linkedin.com/in/..."
  mastodon: "https://mastodon.social/@..."
  bluesky: "https://bsky.app/profile/..."
  youtube: "https://youtube.com/@..."

customLinks:
  - label: "Mon site"
    url: "https://example.com"
```

### 6. Affichage & UX

#### Thème
- **Light et Dark** disponibles
- Style tech, épuré, pas surchargé
- Favicon par défaut Astro (personnalisable plus tard)

#### Dates
- **< 48h** : format relatif ("il y a 2h", "il y a 1 jour")
- **≥ 48h** : format absolu ("22 janvier 2026")

#### Scroll infini
- Chargement initial : suffisant pour remplir la zone visible + légèrement en dessous
- Chargement progressif au scroll

### 7. Admin (`/admin`)

#### Authentification
- Login via GitHub OAuth
- Accès réservé au **propriétaire du repo** uniquement
- Pas de système multi-utilisateurs

#### Dashboard
Vue claire et séparée des posts par statut :
- **Publiés** : posts en ligne
- **Brouillons** : posts non publiés
- **Programmés** : posts avec date de publication future

#### Éditeur de post

| Fonctionnalité | Détail |
|----------------|--------|
| Champ texte | 280 caractères max, compteur visible, emoji supportés |
| Images | Drag & drop + Ctrl+V (coller), max 4, réordonnables |
| Gestion images | Ajout, suppression, réorganisation, alt text optionnel |
| Preview images | Affichage des images ajoutées avec miniatures |
| Preview liens | Affichage des métadonnées OG du premier lien détecté |
| Statut | Publier / Brouillon / Programmer |
| Date programmée | Sélecteur date/heure si "Programmer" |
| Publication | Bouton direct, pas de confirmation, commit immédiat |

#### Actions sur les posts existants
- **Éditer** : modification du texte, ajout/suppression/réorganisation d'images, génère un nouveau commit
- **Supprimer** : possible avec confirmation

#### Édition du profil
- Modification du `config.yml` via interface
- Même logique : sauvegarde = commit

### 8. SEO & Métadonnées

Génération automatique :
- **Meta tags** : title, description
- **Open Graph** : og:title, og:description, og:image, og:url
- **Twitter Cards** : twitter:card, twitter:title, etc.
- **Sitemap** : `sitemap.xml`
- **Flux RSS** : unique, global (`/rss.xml`)

### 9. Accessibilité (a11y)

| Critère | Implémentation |
|---------|----------------|
| Navigation clavier | Complète sur tout le site, incluant modal de recherche |
| Alt text images | Supporté (optionnel), fallback vide si non renseigné |
| Contraste | Suffisant pour WCAG AA sur les deux thèmes |
| ARIA | Labels sur modal recherche, scroll infini, boutons |
| Focus visible | Indicateur de focus clair sur tous les éléments interactifs |
| Skip to content | Lien pour sauter au contenu principal |

### 10. Responsive & Mobile

#### Site public (visiteurs)
- **Mobile-first** : design adaptatif pour toutes les tailles d'écran
- **Recherche sur mobile** : bouton de recherche visible (en plus de Cmd+K)
- **Images** : affichage adapté (grille responsive)
- **Scroll infini** : fonctionne au touch

#### Admin
- **Desktop-first** : optimisé pour desktop
- **Utilisable sur tablette** : fonctionnel mais non prioritaire
- **Mobile** : fonctionnel pour éditions rapides (non optimisé)

### 11. Gestion des erreurs

| Situation | Comportement |
|-----------|--------------|
| Échec de commit | Message d'erreur clair + bouton retry |
| Échec auth GitHub | Message explicatif + lien pour réessayer |
| Lien OG inaccessible | Affichage de l'URL seule (fallback gracieux) |
| Image upload échoué | Message d'erreur + possibilité de réessayer |
| Page 404 | Page d'erreur stylée avec lien vers l'accueil |
| Quota GitHub dépassé | Message d'erreur explicatif |

### 12. États de chargement

| Élément | Indicateur |
|---------|------------|
| Scroll infini | Skeleton loader pour les posts en chargement |
| Fetch métadonnées OG | Spinner + placeholder pendant le chargement |
| Upload image | Barre de progression |
| Commit en cours | Spinner sur le bouton + désactivation des actions |
| Recherche | Indicateur de chargement si index non encore chargé |

---

## Architecture technique

### Stack

| Composant | Technologie |
|-----------|-------------|
| Framework | Astro |
| Styling | Tailwind CSS |
| Hébergement | GitHub Pages |
| CI/CD | GitHub Actions |
| Auth | GitHub OAuth |
| Stockage | Fichiers Markdown + images dans le repo |

### Structure du repo

```
MicroBlog/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Build & deploy sur push
├── public/
│   └── images/
│       ├── avatar.jpg
│       └── posts/
│           └── [timestamp]/
│               └── image1.jpg
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   │   ├── index.astro         # Feed principal
│   │   ├── post/
│   │   │   └── [timestamp].astro
│   │   ├── tag/
│   │   │   └── [tag].astro
│   │   ├── tags.astro          # Index des tags
│   │   └── admin/
│   │       └── index.astro     # Interface admin
│   └── content/
│       └── posts/
│           └── *.md            # Posts en Markdown
├── config.yml                  # Configuration profil
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

### GitHub Actions

#### Workflow de déploiement (`deploy.yml`)

Déclenché sur :
- Push sur `main`
- **Cron toutes les 30 minutes** (`*/30 * * * *`) pour publier les posts programmés
- Workflow dispatch manuel

Étapes :
1. Checkout du repo
2. Installation des dépendances
3. Build Astro (ne génère que les posts dont `publishedAt ≤ now`)
4. Déploiement sur GitHub Pages (uniquement si le contenu a changé)

### Gestion des posts programmés

Les posts programmés sont stockés avec `status: scheduled` et une date future dans `publishedAt`.

Lors du build :
- Seuls les posts avec `status: published` **OU** (`status: scheduled` ET `publishedAt ≤ date actuelle`) sont générés

Le cron toutes les 30 minutes assure que les posts programmés sont publiés avec un délai maximum de 30 minutes après l'heure prévue.

---

## Contraintes & Limites

- **Pas de likes** : pas de système d'interaction
- **Pas de commentaires/réponses** : publication uniquement
- **Pas de page "À propos"** : juste le header avec bio
- **Pas de boutons de partage** : URL copiable manuellement
- **Single user** : un seul auteur autorisé (propriétaire du repo)
- **Précision des posts programmés** : délai max de 30 min par rapport à l'heure prévue

---

## Futures évolutions possibles (hors scope v1)

- Support d'autres embeds (Spotify, Vimeo, CodePen...)
- Export des données
- Thèmes personnalisables
- Statistiques de lecture (analytics)

---

## Résumé des user stories

### Visiteur

- [ ] Je peux voir le feed de posts en scroll infini
- [ ] Je peux cliquer sur un post pour voir sa page dédiée
- [ ] Je peux cliquer sur un hashtag pour voir les posts associés
- [ ] Je peux voir la liste de tous les hashtags
- [ ] Je peux voir le profil de l'auteur (avatar, nom, bio, liens)
- [ ] Je peux switcher entre thème light et dark
- [ ] Je peux m'abonner au flux RSS
- [ ] Je peux ouvrir la recherche avec `Cmd+K` / `Ctrl+K`
- [ ] Je peux rechercher des posts par texte ou hashtag
- [ ] Je peux naviguer entièrement au clavier
- [ ] Je peux utiliser le site sur mobile de manière fluide

### Auteur (admin)

- [ ] Je peux me connecter via GitHub
- [ ] Je peux voir la liste de mes posts (publiés, brouillons, programmés) clairement séparés
- [ ] Je peux créer un nouveau post avec emoji
- [ ] Je peux ajouter des images par drag & drop ou Ctrl+V
- [ ] Je peux réorganiser les images d'un post
- [ ] Je peux supprimer une image d'un post
- [ ] Je peux ajouter un alt text optionnel à chaque image
- [ ] Je peux prévisualiser les images et le premier lien OG
- [ ] Je peux publier immédiatement un post
- [ ] Je peux sauvegarder un brouillon
- [ ] Je peux programmer un post pour une date future
- [ ] Je peux éditer un post existant (texte et images)
- [ ] Je peux supprimer un post (avec confirmation)
- [ ] Je peux modifier mon profil (nom, bio, avatar, liens)
- [ ] Je vois un feedback clair en cas d'erreur (commit, upload, etc.)
- [ ] Je vois des indicateurs de chargement pendant les opérations
