# 🔄 Instructions de Mise à Jour Azure - LionTrack

## ✅ Modifications Effectuées

### 1. Mise à jour Node.js vers 22 LTS
- **package.json** : Node >= 22.0.0 (au lieu de 18.0.0)
- **GitHub Actions** : Node 22.x (au lieu de 20.x)

### 2. Correction GitHub Actions
- Suppression du paramètre `slot-name: 'Production'` qui causait l'erreur 404

## 📋 Actions à Effectuer sur Azure Portal

### Étape 1 : Mettre à jour le Runtime Node.js

1. Connectez-vous au [Portail Azure](https://portal.azure.com)
2. Accédez à votre App Service **LionTrack**
3. Dans le menu de gauche, allez dans **Configuration** > **General settings**
4. Changez **Stack** : 
   - De : `Node 20-lts`
   - Vers : `Node 22-lts`
5. Cliquez sur **Save** en haut
6. Cliquez sur **Continue** pour confirmer

### Étape 2 : Nettoyer le Tableau de Bord Azure

L'erreur 404 que vous avez vue concernait un ancien slot. Pour nettoyer :

1. Allez sur le **Tableau de bord** Azure
2. Trouvez la vignette épinglée qui fait référence à `fxerefd7gneqfqac`
3. Faites un clic droit > **Détacher du tableau de bord**
4. Épinglez à nouveau votre App Service actuel si nécessaire

### Étape 3 : Déclencher un Nouveau Déploiement

Deux options :

**Option A - Via GitHub (Recommandé)** :
```bash
git add .
git commit -m "chore: update to Node 22 LTS"
git push origin main
```

**Option B - Via Azure Portal** :
1. Allez dans **Centre de déploiement**
2. Cliquez sur **Sync** pour synchroniser avec GitHub
3. Vérifiez les **Journaux de déploiement**

## 🔍 Vérification

Après le déploiement, vérifiez :

1. **URL de l'application** : https://liontrack-fxerefd7gneqfqac.francecentral-01.azurewebsites.net
2. **Runtime** doit afficher "Aucun problème détecté"
3. **GitHub Actions** : Vérifiez que le workflow se termine avec succès

## 📊 Informations Actuelles

- **Resource Group** : LionTrackMindset_group
- **Subscription ID** : ef865a19-2360-401b-822e-5fcee276b077
- **Region** : France Central
- **Plan** : ASP-LionTrackMindsetgroup-bbbd (B1)
- **GitHub Repo** : https://github.com/Hicham77500/Projet_LionTrack

## ⚠️ Notes Importantes

- **Node 22 LTS** est supporté jusqu'à **avril 2027** (vs Node 20 jusqu'à avril 2026)
- Le slot de déploiement a été retiré de la configuration pour éviter les erreurs
- Assurez-vous que votre secret GitHub `AZURE_WEBAPP_PUBLISH_PROFILE` est toujours valide

## 🆘 En Cas de Problème

Si le déploiement échoue :

1. Vérifiez les logs GitHub Actions
2. Consultez les **Logs de diagnostic** Azure :
   - App Service > **Log stream**
   - App Service > **Diagnose and solve problems**

3. Vérifiez que toutes les variables d'environnement sont configurées dans Azure :
   - **Configuration** > **Application settings**

---

**Date de mise à jour** : 25 février 2026
**Version Node.js** : 22 LTS
**Status EOL** : ✅ Sécurisé jusqu'en 2027
