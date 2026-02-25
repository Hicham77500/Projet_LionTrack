# 📋 Forum LionTrack - Guide Complet

## 📌 Vue d'ensemble

Composant Forum complet et responsive pour LionTrack PWA. Inclut :
- ✅ Menu latéral avec catégories et sujets tendances
- ✅ Liste/grille de sujets avec auteur, stats, extrait
- ✅ Barre haute : recherche, notifications, profil
- ✅ Actions modérateur : épingler, verrouiller, supprimer
- ✅ Formulaire nouveau sujet (modal + FAB)
- ✅ États complets : loading, erreur, pas de résultats
- ✅ Design mobile-first cohérent avec le thème
- ✅ Badges de grade colorés (user/mod/admin)

## 📁 Fichiers créés

```
public/
├── forum.html              # Page HTML principale du forum
├── css/
│   └── forum-styles.css   # Styles mobile-first + responsive
├── js/
│   ├── forum.js           # Logique complète (ES6, modulaire)
│   └── forum-mock.js      # Mock data pour développement
```

## 🚀 Démarrage rapide

### 1. Intégration basique (Développement)

```html
<!-- Dans votre index.html ou fichier de navigation -->
<a href="forum.html">Forum</a>

<!-- Pour tester avec données mock -->
<script src="js/forum-mock.js"></script>
<script src="js/forum.js"></script>
```

### 2. Lien vers le forum depuis le menu

Ajoutez dans votre [navbar.css](../css/navbar.css) ou navigation :

```html
<a href="forum.html" class="nav-link">
  <i class="fas fa-comments"></i> Forum
</a>
```

### 3. Accès depuis la page d'accueil

Ajoutez un bouton dans [index.html](../index.html) :

```html
<div class="home-section">
  <h2>Communauté</h2>
  <a href="forum.html" class="btn-section">
    <i class="fas fa-comments"></i> Rejoindre le Forum
  </a>
</div>
```

## 🔌 Endpoints API requis

Le forum attend les endpoints suivants (à implémenter côté backend) :

### Récupération

```javascript
GET /api/forum/subjects
// Réponse : Array<{
//   id, title, excerpt, message, categoryId,
//   author: { id, username, profileImage, role },
//   views, replies, createdAt, lastActivityAt,
//   pinned, locked, tags
// }>

GET /api/forum/categories
// Réponse : Array<{ id, name, count, icon }>

GET /api/auth/me
// Réponse : { id, username, email, profileImage, role }
```

### Création / Modification

```javascript
POST /api/forum/subjects
// Body : { title, excerpt, message, categoryId, subscribeToNotifications }
// Réponse : nouvau sujet créé

POST /api/forum/subjects/{id}/pin | unpin | lock | unlock | delete
// Headers : Authorization: Bearer {token}
// Réponse : { success: true }
```

## ⚙️ Configuration

Les endpoints API peuvent être configurés dans `forum.js` :

```javascript
ForumApp.api = {
  baseURL: 'https://votre-api.com', // Optionnel
  endpoints: {
    subjects: '/api/forum/subjects',
    categories: '/api/forum/categories',
    auth: '/api/auth',
    user: '/api/user/profile',
  },
};
```

## 🎨 Thème et Couleurs

Le forum utilise les variables CSS globales de LionTrack :

```css
:root {
  --dark-red: #880000;      /* Primary */
  --medium-red: #aa0000;    /* Hover */
  --light-red: #cc0000;     /* Accent */
  --dark-bg: #121212;       /* Background */
  --card-bg: #1e1e1e;       /* Cards */
  --text-color: #f0f0f0;    /* Text */
  --accent-gold: #d4af37;   /* Highlights */

  /* Badges de grade */
  --user-badge: #4a90e2;    /* BLUE */
  --mod-badge: #ff9500;     /* ORANGE */
  --admin-badge: #cc0000;   /* RED */
}
```

Grade badges automatiquement assortis selon le `role` utilisateur.

## 📱 Responsive Design

- **Mobile (< 768px)** : Sidebar fixe cachée, FAB sticky
- **Tablet (768px - 1200px)** : Sidebar visible, liste 1 colonne
- **Desktop (> 1200px)** : Sidebar + grille 2 colonnes, animations

Breakpoints dans `forum-styles.css` ligne ~600+

## 🧪 Mode développement (Mock data)

Pour tester sans backend :

```html
<script src="js/forum-mock.js"></script> <!-- Avant forum.js -->
<script src="js/forum.js"></script>
```

Le mock inclut :
- 6 sujets d'exemple
- 4 catégories
- Utilisateur courant simulé
- Gestion complète des actions (pin, delete, etc.)

⚠️ **À retirer en production !**

## 🔐 Authentification

Le forum vérifie l'authentification via `localStorage.getItem('token')`.

Pour la déconnexion, le token est supprimé et l'utilisateur redirigé vers `index.html`.

```javascript
// Logout automatique si token expiré (401)
```

## ⚡ Fonctionnalités principales

### Menu latéral (Desktop)
- Catégories avec compteur
- Sujets tendances (top 5 par vues)
- Filtres : Récent, Populaire, Sans réponse

### Contenu central
- Liste/Grille de sujets
- Recherche en temps réel
- Pagination (10 par page)
- États : loading, erreur, pas de résultats

### Actions modérateur (role: 'moderator' | 'admin')
- 📌 Épingler / Désépingler les sujets
- 🔒 Verrouiller / Déverrouiller (autorise/bloque replies)
- 🗑️ Supprimer les sujets

### Formulaire nouveau sujet
- Modal avec validations
- Compteurs de caractères (titre 200, message 5000)
- Subscribe to notifications
- FAB (Floating Action Button) fixe en bas-droit

## 🎯 États et UX

```
Loading → Données chargées
       ↓
    Pas de résultats (no subjects)
       ↓
    Erreur (API fail) → [Retry]
       ↓
    Affichage sujets (list/grid view)
```

Toasts notifications : success, error, warning, info

## 🔧 Personnalisation

### Ajouter une nouvelle catégorie
```javascript
mockData.categories.push({
  id: 'new-id',
  name: 'Ma catégorie',
  count: 0,
  icon: 'folder', // Font Awesome icon
});
```

### Modifier les textes
Tous les textes sont en français. Pour multilingue, créez un fichier `i18n/forum-fr.json`.

### Modifier les items par page
```javascript
ForumApp.state.itemsPerPage = 15;
```

### Activer les animations
Déjà incluses via `@keyframes` dans CSS. À personnaliser :

```css
animation: fadeIn 0.3s ease-out;
```

## 📊 Structure des données

### Sujet (Subject)
```javascript
{
  id: string,
  title: string,
  excerpt: string (preview),
  message: string (contenu complet),
  categoryId: string,
  author: {
    id: string,
    username: string,
    profileImage: URL,
    role: 'user' | 'moderator' | 'admin'
  },
  views: number,
  replies: number,
  createdAt: ISO8601,
  lastActivityAt: ISO8601,
  pinned: boolean,
  locked: boolean,
  tags: string[]
}
```

### Catégorie
```javascript
{
  id: string,
  name: string,
  count: number,
  icon: string (Font Awesome)
}
```

## 🐛 Troubleshooting

**Q: Le forum n'affiche rien en prod**
- Vérifiez les endpoints API dans la console
- Vérifiez le token d'authentification
- Utilisez `forum-mock.js` pour tester

**Q: Sidebar ne s'ouvre pas sur mobile**
- Vérifiez la classe `.active` sur `#forumSidebar`
- Testez `ForumApp.toggleSidebar()`

**Q: Actions modérateur ne marchent pas**
- Vérifiez que `role === 'moderator' || 'admin'`
- Vérifiez les endpoints `/pin`, `/delete`, etc.

**Q: Overflow de texte en grille**
- Ajustez `max-width` dans `.modal-content`
- Testez avec différentes tailles d'écran

## 🎓 Exemples d'intégration

### Lien depuis les défis
```javascript
// Dans challenge-ui.js
function openForumChallengeDiscussion(challengeId) {
  window.open(`forum.html?challenge=${challengeId}`, '_blank');
}
```

### Notification depuis le forum
```javascript
// Dans forum.js custom
ForumApp.showNotification('info', 'Nouveau sujet dans votre catégorie!');
```

### Synchroniser l'utilisateur
```javascript
// Récupérer l'utilisateur depuis AuthUI
const user = AuthUI.getCurrentUser();
ForumApp.state.currentUser = user;
ForumApp.updateProfileUI(user);
```

## 📈 Améliorations futures

- [ ] Système de réponses (comments/threads)
- [ ] Système de votes (like/dislike)
- [ ] Modération avancée (signalement, bannissement)
- [ ] Notifications temps réel (WebSocket)
- [ ] Mentions d'utilisateurs (@user)
- [ ] Markdown support dans les messages
- [ ] Pièces jointes / images
- [ ] Système de réputation

## 📄 Licence

Fait partie du projet LionTrack. Voir [LICENSE](../../LICENSE)

## 👨‍💻 Support

Pour des questions ou bugs, créez un issue dans le forum lui-même ! 😉

---

**Dernière mise à jour :** 25 février 2026
**Version :** 1.0.0
**Statut :** ✅ Production-ready
