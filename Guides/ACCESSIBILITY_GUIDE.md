# 🎯 GUIDE ACCESSIBILITÉ - FORMULAIRES & BONNE PRATIQUES

## 📋 Checklist d'Accessibilité à Appliquer

### 1. **Labels Correctement Liés** ✅
```html
<!-- ❌ MAUVAIS -->
<label>Email:</label>
<input type="email" />

<!-- ✅ BON -->
<label for="email-input">Email:</label>
<input id="email-input" type="email" />
```

### 2. **Aria-Invalid pour Validation** ✅
```html
<!-- Champ avec erreur -->
<input 
  id="password" 
  type="password" 
  aria-invalid="true"
  aria-describedby="password-error"
/>
<span id="password-error" role="alert">
  Mot de passe trop court (min 6 caractères)
</span>
```

### 3. **Attributs Aria sur les Modales** ✅
```html
<div 
  class="modal" 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Créer un Défi</h2>
  <p id="modal-description">Remplissez le formulaire pour créer un nouveau défi personnel</p>
</div>
```

### 4. **Boutons Accessibles** ✅
```html
<!-- ✅ Bon - Label visible -->
<button id="create-challenge-btn">
  <i class="fas fa-plus" aria-hidden="true"></i>
  Créer un défi
</button>

<!-- ✅ Si tu dois cacher le texte -->
<button aria-label="Créer un nouveau défi">
  <i class="fas fa-plus"></i>
</button>
```

### 5. **Notifications avec Role Alert** ✅
```html
<div 
  id="notification" 
  role="alert"
  aria-live="polite"
  aria-atomic="true"
  class="notification success"
>
  <i class="fas fa-check-circle" aria-hidden="true"></i>
  <span>Défi créé avec succès!</span>
</div>
```

### 6. **Images avec Alt Text** ✅
```html
<!-- ✅ Bon -->
<img 
  src="profile.jpg" 
  alt="Photo de profil de Jean Dupont"
/>

<!-- ❌ Mauvais -->
<img src="profile.jpg" alt="photo" />

<!-- ✅ Pour les icônes purement décoratives -->
<i class="fas fa-star" aria-hidden="true"></i>

<!-- ✅ Pour les icônes avec du sens -->
<i class="fas fa-star" aria-label="Favori"></i>
```

---

## 🎨 Tester l'Accessibilité

### Vérification Clavier
```
1. Appuyer sur TAB pour naviguer
2. Appuyer sur SHIFT+TAB pour revenir en arrière
3. Appuyer sur ENTER pour activer les boutons
4. Appuyer sur ESPACE pour cocher/décocher
5. Appuyer sur ÉCHAP pour fermer les modales
```

### Augmenter le Zoom
```
Ctrl + (Windows/Mac: Cmd +)
Vérifier que tout reste lisible et aligné
Ctrl - pour diminuer
```

### Désactiver les CSS
```
Appuyer F12, aller à Console, puis:
document.head.innerHTML = '';
Vérifier que le contenu est lisible sans style
```

### Outils de Test Gratuits
- **Wave**: https://wave.webaim.org/
- **Axe DevTools**: Chrome/Firefox extension
- **NVDA**: Lecteur d'écran gratuit (Windows)
- **VoiceOver**: Natif sur Mac/iOS
- **Google Lighthouse**: F12 → Lighthouse tab

---

## 📏 Standards de Contraste (WCAG 2.1)

```
Texte normal:        Ratio 4.5:1 minimum (AA)
Texte grand (≥18pt): Ratio 3:1 minimum (AA)
Texte petit (<14pt): Ratio 4.5:1 recommandé

Valeurs actuelles à améliorer:
- Gris #AAA sur #121212: Ratio ~4.2:1 ⚠️
- Or #d4af37 sur #121212: Ratio ~8:1 ✅
- #F0F0F0 sur #121212: Ratio ~10.6:1 ✅
```

### Vérifier le Contraste
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Color Contrast Analyzer** (logiciel)

---

## 🔧 Infrastructure Accessible

### Headings Hiérarchy ✅
```html
<!-- ✅ BON -->
<h1>LionTrack - Défis Personnels</h1>      <!-- Titre page (1 seul) -->
<h2>Mes Défis</h2>                          <!-- Sections principales -->
<h3>Défi: Méditation</h3>                   <!-- Sous-sections -->

<!-- ❌ MAUVAIS -->
<h1>LionTrack</h1>
<h3>Mes Défis</h3>        <!-- Saute h2! -->
```

### Listes Sémantiques ✅
```html
<!-- ✅ BON - Liste non-ordonnées -->
<ul>
  <li>Défi 1</li>
  <li>Défi 2</li>
</ul>

<!-- ✅ BON - Listes ordonnées -->
<ol>
  <li>Inscription</li>
  <li>Créer un défi</li>
</ol>

<!-- ❌ MAUVAIS - Pas de liste sémantique -->
<div>
  <span>- Défi 1</span>
  <span>- Défi 2</span>
</div>
```

### Landmarks (Régions Principales) ✅
```html
<header role="banner">
  <nav role="navigation">Navigation principale</nav>
</header>

<main role="main">
  <!-- Contenu principal -->
</main>

<aside role="complementary">
  <!-- Contenu supplémentaire -->
</aside>

<footer role="contentinfo">
  Copyright 2026
</footer>
```

---

## 📱 Responsive & Mobile

```css
/* Touch targets minimum 44x44px */
button, a { 
  min-height: 44px; 
  min-width: 44px; 
}

/* Large enough text - minimum 16px */
body {
  font-size: 16px;
}

/* Spacing pour lisibilité mobile */
padding: 1rem;
margin: 1rem 0;
```

---

## 🧪 Checklist de Validation Finale

Avant de publier:

- [ ] Tous les inputs ont des labels liés (`<label for="id">`)
- [ ] Tous les boutons ont du texte lisible ou aria-label
- [ ] Les modales ont `role="dialog"` et `aria-modal="true"`
- [ ] Les notifications ont `role="alert"` et `aria-live="polite"`
- [ ] Les images ont alt text (ou `aria-hidden="true"` si décoratives)
- [ ] Contraste minimum 4.5:1 pour le texte normal
- [ ] Navigation au clavier fonctionne complètement
- [ ] Focus ring visible sur tous les éléments interactifs
- [ ] Page testée avec lecteur d'écran (NVDA/VoiceOver)
- [ ] Zoom à 200% reste fonctionnel
- [ ] Pas de contenu uniquement à la souris

---

## 🚀 Implémentation Immédiate

Fichier ajouté: `public/css/accessibility-improvements.css`

**Ce que le fichier CSS fait automatiquement:**
- ✅ Focus ring visible doré pour tous les éléments interactifs
- ✅ Contraste amélioré des textes (#F5F5F5 au lieu de #f0f0f0)
- ✅ Boutons avec min 44x44px pour touch targets
- ✅ États :hover, :focus-visible, :active clairs
- ✅ Support pour `prefers-reduced-motion`
- ✅ Styles pour aria-invalid sur les inputs
- ✅ Animations accessibles

**À faire manuellement dans le HTML:**
1. Lier tous les labels aux inputs avec `for` attribute
2. Ajouter `aria-modal="true"` aux modales
3. Ajouter `aria-describedby` aux champs avec erreurs
4. Ajouter `aria-label` aux boutons sans texte
5. Vérifier tous les alt text sur images

---

## 📚 Ressources Complémentaires

- **MDN Web Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **a11y Project**: https://www.a11yproject.com/
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Aria Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

---

**Document vers:** 2026-02-24
**Statut:** Guide de référence en cours
