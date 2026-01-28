# Guide d'installation PWA pour LionTrack

## 📱 Transformez LionTrack en Application Mobile

### ✅ Fonctionnalités PWA implémentées

1. **Service Worker** (`/public/sw.js`)
   - Mise en cache des ressources
   - Fonctionnement hors ligne
   - Mises à jour automatiques

2. **Manifest** (`/public/manifest.json`)
   - Configuration de l'application
   - Icônes et couleurs
   - Mode standalone

3. **Interface responsive**
   - Modales ajustées pour tous les écrans
   - Compatible 100% zoom
   - Support mobile optimisé

### 🎨 Génération des icônes

#### Option 1 : Avec ImageMagick (Recommandé)
```bash
cd public/images
./generate-icons.sh
```

#### Option 2 : En ligne
1. Visitez https://realfavicongenerator.net/
2. Uploadez votre logo (512x512 recommandé)
3. Téléchargez les icônes générées
4. Placez-les dans `public/images/`

#### Option 3 : Utiliser le SVG temporaire
Le fichier `icon-base.svg` contient une icône temporaire.
Convertissez-le avec :
```bash
# Si ImageMagick est installé
brew install imagemagick
cd public/images
./generate-icons.sh
```

### 📲 Installation sur différentes plateformes

#### Chrome/Edge (Bureau)
1. Ouvrez l'application dans Chrome
2. Cliquez sur l'icône ➕ dans la barre d'adresse
3. Cliquez sur "Installer"

#### Chrome (Android)
1. Ouvrez l'application dans Chrome
2. Menu (⋮) → "Installer l'application"
3. Ou bannière automatique en bas de l'écran

#### Safari (iOS)
1. Ouvrez l'application dans Safari
2. Tapez le bouton Partager 📤
3. "Sur l'écran d'accueil"
4. "Ajouter"

### 🔧 Configuration serveur

#### Pour Node.js/Express (déjà configuré)
Le fichier `server.js` doit servir les fichiers statiques correctement :

```javascript
app.use(express.static('public'));

// S'assurer que le manifest et le SW sont servis avec les bons headers
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(__dirname + '/public/manifest.json');
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(__dirname + '/public/sw.js');
});
```

#### Pour Apache (.htaccess)
```apache
# Autoriser le Service Worker
<Files "sw.js">
  Header set Service-Worker-Allowed "/"
  Header set Content-Type "application/javascript"
</Files>

# Cache pour le manifest
<Files "manifest.json">
  Header set Content-Type "application/manifest+json"
</Files>
```

#### Pour Nginx
```nginx
location /sw.js {
  add_header Service-Worker-Allowed "/";
  add_header Content-Type "application/javascript";
}

location /manifest.json {
  add_header Content-Type "application/manifest+json";
}
```

### 🧪 Test de la PWA

1. **Ouvrir Chrome DevTools** (F12)
2. Aller dans l'onglet **Application**
3. Vérifier :
   - ✅ Manifest (section Manifest)
   - ✅ Service Worker (section Service Workers)
   - ✅ Cache Storage (section Cache)

4. **Test Lighthouse**
   - DevTools → Lighthouse
   - Sélectionner "Progressive Web App"
   - Générer le rapport
   - Score cible : 90+

### 🚀 Déploiement

#### HTTPS requis
Les PWA nécessitent HTTPS (sauf localhost).
Utilisez :
- Let's Encrypt (gratuit)
- Cloudflare SSL
- Hébergement avec SSL inclus

#### Checklist finale
- [ ] HTTPS activé
- [ ] Service Worker enregistré
- [ ] Manifest accessible
- [ ] Icônes générées
- [ ] Test sur mobile
- [ ] Test installation
- [ ] Test mode hors ligne

### 🎯 Améliorations futures

1. **Notifications Push**
   ```javascript
   // Demander la permission
   Notification.requestPermission().then(permission => {
     if (permission === 'granted') {
       // Enregistrer pour les notifications
     }
   });
   ```

2. **Synchronisation en arrière-plan**
   ```javascript
   // Dans le Service Worker
   self.addEventListener('sync', event => {
     if (event.tag === 'sync-challenges') {
       event.waitUntil(syncChallenges());
     }
   });
   ```

3. **Partage natif**
   ```javascript
   if (navigator.share) {
     navigator.share({
       title: 'Mon défi',
       text: 'Regardez ma progression!',
       url: window.location.href
     });
   }
   ```

### 📝 Notes importantes

- Le Service Worker est mis en cache, utilisez Ctrl+Shift+R pour forcer le rechargement
- En développement, cochez "Update on reload" dans DevTools
- Les modifications du SW nécessitent un changement de version dans le cache
- Testez toujours sur de vrais appareils mobiles

### 🐛 Dépannage

**Le SW ne s'enregistre pas ?**
- Vérifiez la console (erreurs JavaScript)
- Vérifiez que sw.js est accessible
- Vérifiez HTTPS (sauf localhost)

**Les icônes ne s'affichent pas ?**
- Vérifiez les chemins dans manifest.json
- Vérifiez que les fichiers existent
- Générez-les avec le script

**L'installation n'est pas proposée ?**
- Vérifiez le score Lighthouse PWA
- Manifest et SW doivent être valides
- Attendez ~30 secondes après le chargement

### 📚 Ressources

- [MDN - Progressive Web Apps](https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps)
- [web.dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
