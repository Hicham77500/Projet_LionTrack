# LionTrack - Application de Suivi des Défis Personnels

## 📋 À propos du projet

**Lion Mindset** est une application web motivante qui vous aide à suivre vos défis personnels et à développer une mentalité de champion. Avec une interface moderne et intuitive, vous pouvez créer des défis personnalisés, suivre votre progression et célébrer vos réussites.

## ✨ Fonctionnalités

- 🔐 Authentification sécurisée (inscription/connexion)
- 🏆 Création et gestion de défis personnels
- 📊 Tableau de bord avec statistiques et graphiques
- 📈 Suivi visuel de progression
- 🎯 Catégorisation des défis (physique, mental, nutrition, etc.)
- 🎖️ Système de rangs et récompenses
- 🎨 Thème Lion Mindset (Rouge sombre)

## 🛠️ Prérequis

Avant d'installer le projet, assurez-vous d'avoir:

- [Node.js](https://nodejs.org/) (v14 ou plus)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 ou plus)
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)
- Un navigateur web moderne (Chrome, Firefox, Edge, Safari)

## 🚀 Installation

Suivez ces étapes pour installer et configurer le projet sur votre machine:

1. **Clonez le dépôt**
   \`\`\`bash
   git clone https://github.com/votre-username/Projet_LionTrack.git
   cd Projet_LionTrack
   \`\`\`

2. **Installez les dépendances**
   \`\`\`bash
   npm install
   \`\`\`

3. **Créez un fichier \`.env\` à la racine du projet**
   \`\`\`
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/liontrack
   JWT_SECRET=votre_clé_secrète_très_complexe
   \`\`\`

4. **Initialisez la base de données**
   \`\`\`bash
   # Assurez-vous que MongoDB est en cours d'exécution
   npm run seed
   \`\`\`

## ⚙️ Configuration

### Configuration de la base de données

Le projet utilise MongoDB comme base de données. Assurez-vous qu'elle est accessible à l'adresse spécifiée dans votre fichier \`.env\`.

### Configuration de l'authentification

L'application utilise JWT (JSON Web Tokens) pour l'authentification. Une clé secrète est nécessaire dans le fichier \`.env\` pour signer les tokens.

## 🏃‍♂️ Démarrage

Pour lancer l'application en mode développement:

\`\`\`bash
npm run dev
\`\`\`

Pour lancer l'application en mode production:

\`\`\`bash
npm start
\`\`\`

L'application sera accessible à l'adresse: \`http://localhost:3000\`

## 📁 Structure du projet

\`\`\`
Projet_LionTrack/
├── app/                # Logique principale de l'application
│   ├── middlewares/    # Middlewares Express (authJwt, etc.)
│   └── models/         # Modèles de données Mongoose
├── public/             # Fichiers statiques
│   ├── css/            # Feuilles de style
│   ├── js/             # Scripts frontend
│   └── images/         # Images
├── services/           # Services backend
│   ├── auth/           # Service d'authentification
│   ├── challenge/      # Service de gestion des défis
│   └── user/           # Service de gestion des utilisateurs
├── .env                # Variables d'environnement
├── server.js           # Point d'entrée du serveur
└── package.json        # Dépendances et scripts
\`\`\`

## 💻 Utilisation

1. **Inscription / Connexion**
   - Créez un compte ou connectez-vous avec un compte existant
   
2. **Créer un défi**
   - Cliquez sur "Créer un défi"
   - Remplissez le titre, la description, la catégorie et la progression initiale
   - Validez en cliquant sur "Créer"
   
3. **Gérer vos défis**
   - Visualisez tous vos défis sur votre tableau de bord
   - Mettez à jour la progression en cliquant sur "Mettre à jour"
   - Modifiez ou supprimez un défi via les icônes correspondantes
   
4. **Consulter vos statistiques**
   - Visualisez votre progression globale sur le tableau de bord
   - Suivez l'évolution de vos défis via le graphique

## 🔧 Dépannage

### Problèmes courants

1. **Erreur de connexion à MongoDB**
   - Vérifiez que MongoDB est bien lancé
   - Vérifiez l'URL de connexion dans votre fichier \`.env\`

2. **Erreur lors de l'authentification**
   - Assurez-vous d'avoir une clé JWT_SECRET valide
   - Vérifiez les logs du serveur pour plus de détails

3. **Interface utilisateur ne se charge pas correctement**
   - Videz le cache de votre navigateur
   - Assurez-vous d'utiliser un navigateur récent

## 📞 Support et contribution

Pour toute question ou problème, veuillez ouvrir une issue sur le dépôt GitHub ou me contacter.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

© 2025 Lion Mindset. Tous droits réservés.
