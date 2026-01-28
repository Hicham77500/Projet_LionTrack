# 📱 Publication de LionTrack sur App Store et Google Play

## 🎯 Vue d'ensemble

Votre PWA fonctionne déjà parfaitement sur le web et est installable. Pour la publier sur les stores officiels, il existe plusieurs approches :

---

## 🚀 Option 1 : PWA Builder (Le plus simple) ⭐ RECOMMANDÉ

### Avantages
- ✅ Gratuit
- ✅ Génère automatiquement les packages pour iOS et Android
- ✅ Utilise votre PWA existante
- ✅ Pas besoin de coder
- ✅ Mises à jour automatiques depuis votre site

### Étapes

#### 1. Préparer votre site
```bash
# Déployer LionTrack en HTTPS (obligatoire)
# Exemples de services :
# - Vercel (gratuit, HTTPS auto)
# - Netlify (gratuit, HTTPS auto)
# - Heroku (gratuit, HTTPS avec addon)
# - Votre propre serveur avec Let's Encrypt
```

#### 2. Aller sur PWA Builder
1. Visitez https://www.pwabuilder.com/
2. Entrez l'URL de votre site déployé
3. Cliquez sur "Start"

#### 3. Télécharger les packages

**Pour Android :**
- Format : `.aab` (Android App Bundle)
- Prêt pour Google Play Store
- Signature automatique disponible

**Pour iOS :**
- Format : Package Xcode
- Nécessite un Mac pour la finalisation
- Ou utilisez un service de build cloud

#### 4. Publication

**Google Play Store :**
```
1. Créer un compte développeur ($25 unique)
   → https://play.google.com/console/signup

2. Créer une nouvelle application
3. Upload le fichier .aab
4. Remplir les informations :
   - Description (utiliser le contenu du README)
   - Screenshots (mobile et tablette)
   - Icône (utiliser icon-512x512.png)
   - Catégorie : Productivité

5. Soumettre pour révision (1-3 jours)
```

**Apple App Store :**
```
1. Compte développeur Apple ($99/an)
   → https://developer.apple.com/programs/

2. App Store Connect
   → https://appstoreconnect.apple.com/

3. Créer une nouvelle app
4. Upload via Xcode ou Transporter
5. Remplir les métadonnées
6. Soumettre pour révision (1-2 jours)
```

---

## 🔧 Option 2 : Capacitor (Plus de contrôle)

### Avantages
- ✅ Accès complet aux APIs natives
- ✅ Plugins pour caméra, notifications push, etc.
- ✅ Plus de flexibilité
- ❌ Nécessite des connaissances techniques

### Installation

```bash
cd "/Users/corsair/Documents/IPSSI/Projet IPSSI/Lion_track/Projet_LionTrack"

# Installer Capacitor
npm install @capacitor/core @capacitor/cli

# Initialiser
npx cap init LionTrack com.liontrack.app

# Ajouter les plateformes
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Copier les fichiers web
npx cap copy

# Ouvrir dans Android Studio
npx cap open android

# Ouvrir dans Xcode (Mac uniquement)
npx cap open ios
```

### Configuration

Créez `capacitor.config.json` :
```json
{
  "appId": "com.liontrack.app",
  "appName": "LionTrack",
  "webDir": "public",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
```

### Build et publication

**Android :**
```bash
# Ouvrir dans Android Studio
npx cap open android

# Dans Android Studio :
# 1. Build → Generate Signed Bundle / APK
# 2. Choisir "Android App Bundle"
# 3. Créer/utiliser une clé de signature
# 4. Build → le .aab est dans app/release/
```

**iOS :**
```bash
# Ouvrir dans Xcode (Mac requis)
npx cap open ios

# Dans Xcode :
# 1. Sélectionner Generic iOS Device
# 2. Product → Archive
# 3. Distribute App → App Store Connect
# 4. Upload
```

---

## 📦 Option 3 : Cordova (Ancienne méthode)

```bash
# Installer Cordova
npm install -g cordova

# Créer le projet
cordova create liontrack-mobile com.liontrack.app LionTrack

# Copier vos fichiers
cp -r public/* liontrack-mobile/www/

# Ajouter les plateformes
cd liontrack-mobile
cordova platform add android
cordova platform add ios

# Build
cordova build android --release
cordova build ios --release
```

---

## 🎨 Préparer les assets

### Screenshots requis

**Android (Google Play) :**
- Téléphone : 1080x1920 (min 2 screenshots)
- Tablette 7" : 1200x1920
- Tablette 10" : 1600x2560

**iOS (App Store) :**
- iPhone 6.7" : 1290x2796
- iPhone 6.5" : 1284x2778
- iPhone 5.5" : 1242x2208
- iPad Pro 12.9" : 2048x2732

### Icône de l'app

Déjà prête ! `public/images/icon-512x512.png`
- Assurez-vous qu'elle fait bien 512x512
- Sans transparence pour iOS
- Avec transparence OK pour Android

### Bannière promo (optionnel)

**Google Play :**
- 1024x500 pixels
- Format : PNG ou JPG

---

## 📝 Informations à préparer

### Description courte (80 caractères max)
```
Suivez vos défis personnels et atteignez vos objectifs avec LionTrack
```

### Description complète
```
🦁 LionTrack - Votre Coach Personnel de Défis

Transformez vos ambitions en réalisations concrètes avec LionTrack, l'application qui vous aide à suivre et accomplir tous vos défis personnels.

✨ FONCTIONNALITÉS PRINCIPALES :
• Créez des défis personnalisés illimités
• Suivez votre progression en temps réel
• Visualisez vos statistiques avec des graphiques
• Système de grades et récompenses motivants
• Interface élégante avec thème Lion
• Synchronisation automatique
• Fonctionne hors ligne

🎯 PARFAIT POUR :
• Objectifs fitness et santé
• Apprentissage de nouvelles compétences
• Projets personnels
• Habitudes quotidiennes
• Défis professionnels

🏆 SYSTÈME DE MOTIVATION :
Gagnez des grades au fur et à mesure de vos accomplissements. 
De Recrue à Général, chaque défi complété vous rapproche de la victoire !

📊 SUIVI VISUEL :
• Graphiques de progression
• Statistiques détaillées
• Tableau de bord complet
• Historique de vos réussites

💪 Rejoignez des milliers d'utilisateurs qui atteignent leurs objectifs avec LionTrack !

Téléchargez maintenant et commencez votre première victoire aujourd'hui !
```

### Mots-clés (pour recherche)
```
défi, objectif, motivation, productivité, suivi, progression, 
habitudes, coaching, développement personnel, challenge
```

### Catégories
- **Primary :** Productivité
- **Secondary :** Style de vie / Auto-amélioration

### Politique de confidentialité (OBLIGATOIRE)

Créez une page sur votre site, par exemple :
`https://votre-domaine.com/privacy-policy.html`

Template minimal :
```html
<!DOCTYPE html>
<html>
<head>
  <title>Politique de Confidentialité - LionTrack</title>
</head>
<body>
  <h1>Politique de Confidentialité</h1>
  <p>Dernière mise à jour : [DATE]</p>
  
  <h2>Données collectées</h2>
  <p>LionTrack collecte uniquement :</p>
  <ul>
    <li>Adresse email (pour authentification)</li>
    <li>Nom d'utilisateur</li>
    <li>Données des défis créés par l'utilisateur</li>
  </ul>
  
  <h2>Utilisation des données</h2>
  <p>Les données sont utilisées uniquement pour :</p>
  <ul>
    <li>Permettre l'authentification</li>
    <li>Sauvegarder vos défis</li>
    <li>Synchroniser vos données entre appareils</li>
  </ul>
  
  <h2>Stockage</h2>
  <p>Les données sont stockées de manière sécurisée sur nos serveurs.</p>
  <p>Nous ne vendons ni ne partageons vos données avec des tiers.</p>
  
  <h2>Suppression</h2>
  <p>Vous pouvez supprimer votre compte à tout moment depuis les paramètres.</p>
  
  <h2>Contact</h2>
  <p>Pour toute question : contact@liontrack.com</p>
</body>
</html>
```

---

## 🚦 Checklist avant soumission

### Technique
- [ ] Site déployé en HTTPS
- [ ] PWA score Lighthouse > 90
- [ ] Service Worker fonctionne
- [ ] Manifest.json valide
- [ ] Icônes générées (toutes les tailles)
- [ ] Testé sur Android réel
- [ ] Testé sur iOS réel
- [ ] Pas d'erreurs console

### Assets
- [ ] Screenshots téléphone (min 2)
- [ ] Screenshots tablette (optionnel)
- [ ] Icône 512x512
- [ ] Bannière promo (optionnel)
- [ ] Vidéo démo (optionnel)

### Légal
- [ ] Politique de confidentialité en ligne
- [ ] Conditions d'utilisation (optionnel)
- [ ] Compte développeur créé
- [ ] Paiement effectué ($25 Google, $99 Apple)

### Contenu
- [ ] Description complète
- [ ] Description courte
- [ ] Mots-clés définis
- [ ] Catégorie choisie
- [ ] Classification d'âge (Tout public)
- [ ] Coordonnées de contact

---

## 💡 Recommandation finale

### Pour démarrer rapidement :

**1. Déploiement web (MAINTENANT)**
```bash
# Option facile : Vercel (gratuit)
npm install -g vercel
vercel

# Ou Netlify
npm install -g netlify-cli
netlify deploy --prod
```

**2. Google Play Store (2-3 heures)**
- Utiliser PWA Builder
- Plus simple, moins cher ($25 unique)
- Révision plus rapide

**3. Apple App Store (plus tard)**
- Nécessite un Mac
- Plus cher ($99/an)
- Processus de révision plus strict

### Ordre recommandé :
1. ✅ PWA sur le web (DÉJÀ FAIT)
2. 🌐 Déployer en HTTPS (Vercel/Netlify)
3. 🤖 Google Play avec PWA Builder
4. 🍎 App Store (si succès sur Android)

---

## 📞 Support et ressources

### Documentation officielle
- PWA Builder : https://docs.pwabuilder.com/
- Google Play : https://developer.android.com/distribute
- App Store : https://developer.apple.com/app-store/
- Capacitor : https://capacitorjs.com/docs

### Services de build cloud (sans Mac)
- Codemagic : https://codemagic.io/
- Bitrise : https://www.bitrise.io/
- App Center : https://appcenter.ms/

### Coûts estimés
| Service | Coût | Fréquence |
|---------|------|-----------|
| Compte Google Play | $25 | Une fois |
| Compte Apple Developer | $99 | Par an |
| Hébergement HTTPS | $0 | Gratuit (Vercel/Netlify) |
| PWA Builder | $0 | Gratuit |
| Certificats SSL | $0 | Gratuit (Let's Encrypt) |

**Total minimum : $25** (pour Google Play uniquement)

---

## 🎉 Prochaine étape immédiate

**Pour publier sur Google Play dès maintenant :**

```bash
# 1. Déployer le site
cd "/Users/corsair/Documents/IPSSI/Projet IPSSI/Lion_track/Projet_LionTrack"
vercel

# 2. Noter l'URL (ex: liontrack.vercel.app)

# 3. Aller sur https://www.pwabuilder.com/

# 4. Entrer votre URL

# 5. Télécharger le package Android

# 6. Créer compte Google Play

# 7. Upload et publier !
```

**Questions ?** N'hésitez pas à demander de l'aide pour n'importe quelle étape !
