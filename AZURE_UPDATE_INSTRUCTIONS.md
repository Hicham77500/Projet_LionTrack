# ⚙️ Configuration Azure - LionTrack

## 🚨 URGENT : Variables d'environnement manquantes

Ton app tourne dans le vide car **les variables d'environnement ne sont pas configurées sur Azure**.

### 📋 Variables à ajouter

Va sur le portail Azure et configure ces variables :

**1. Accède à la configuration :**
- Portail Azure → **LionTrack** (App Service)
- Menu de gauche → **Configuration**
- Onglet **Application settings**

**2. Clique sur "New application setting" et ajoute :**

| Nom | Valeur |
|-----|--------|
| `MONGODB_URI` | `mongodb+srv://hguendouz77500_db_user:rSeEonEwIxvvu6YT@cluster0.2ycytk4.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | `S5q9kISVWfJ+j+/r/dt+6MfRdCmAERsgziIaI0Xppm4=` |
| `NODE_ENV` | `production` |

**3. Sauvegarde :**
- Clique sur **Save** en haut
- L'app va redémarrer automatiquement

**4. Vérifie :**
- Attends 1-2 minutes
- Ouvre : https://liontrack-fxerefd7gneqfqac.francecentral-01.azurewebsites.net
- Tu devrais voir : "Bienvenue sur l'API Défis Personnels"

---

## 🔍 Pourquoi ça ne marchait pas ?

Les logs Azure montraient :
```
📌 Port: 4001                    ❌ Devrait être 8080 (port Azure)
MongoDB: localhost:3000          ❌ Devrait être MongoDB Atlas
```

**Cause :** Le fichier `.env` est ignoré par Git (`.gitignore`) donc n'est **pas déployé sur Azure**.

**Solution :** Configurer les variables directement dans Azure Portal.

---

## ✅ Ce qui a été corrigé dans le code

1. ✅ `server.js` : Utilise `process.env.PORT` (port dynamique Azure)
2. ✅ `.env` local : Retiré `PORT=4001` qui écrasait le port
3. ✅ Workflow GitHub Actions : Deploy automatique sur push

---

## 📊 Vérifier les logs Azure

Si ça ne marche toujours pas :

1. **App Service LionTrack** → **Log stream**
2. Tu devrais voir :
```
✅ Connecté à MongoDB Atlas
✅ Serveur en écoute sur le port 8080
```

---

**Date** : 25 février 2026  
**Status** : ⚠️ En attente configuration Azure Portal
