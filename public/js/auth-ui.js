/**
 * Module de gestion de l'interface utilisateur pour l'authentification
 * Thème : Lion Mindset - Rouge sombre
 */

// Module pattern pour éviter les variables globales
const AuthUI = (function() {
    // Variables privées
    let token = null;
    let currentUser = null;
    
    // Citations motivantes pour le thème Lion Mindset
    const motivationalQuotes = [
        "Un lion ne se soucie pas de l'opinion des moutons.",
        "La différence entre le possible et l'impossible se trouve dans ta détermination.",
        "La force ne vient pas des capacités physiques mais d'une volonté indomptable.",
        "Le courage n'est pas l'absence de peur, mais la capacité de la vaincre.",
        "Les obstacles sont ces choses effrayantes que l'on voit lorsqu'on détourne les yeux de son objectif."
    ];

    // Fonction pour initialiser l'UI d'authentification
    function init() {
        // Vérifier si un token est stocké dans le localStorage
        checkExistingAuth();
        
        // Ajouter les écouteurs d'événements pour les boutons d'authentification
        setupEventListeners();
        
        // Afficher une citation motivante aléatoire
        showRandomQuote();
    }

    // Vérifier l'authentification existante
    function checkExistingAuth() {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
            token = storedToken;
            currentUser = JSON.parse(storedUser);
            showAuthenticatedUI();
        } else {
            showLoginUI();
        }
    }

    // Affiche une citation motivante aléatoire
    function showRandomQuote() {
        const quoteElem = document.querySelector('.motivational-quote');
        if (quoteElem) {
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            quoteElem.textContent = randomQuote;
        }
    }

    // Configure les écouteurs d'événements
    function setupEventListeners() {
        // Bouton d'inscription
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', handleRegister);
        }
        
        // Bouton de connexion
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }
        
        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Basculer entre formulaires de connexion et d'inscription
        const switchToRegisterLink = document.getElementById('switch-to-register');
        if (switchToRegisterLink) {
            switchToRegisterLink.addEventListener('click', function(e) {
                e.preventDefault();
                toggleForms('register');
            });
        }
        
        const switchToLoginLink = document.getElementById('switch-to-login');
        if (switchToLoginLink) {
            switchToLoginLink.addEventListener('click', function(e) {
                e.preventDefault();
                toggleForms('login');
            });
        }
    }

    // Bascule entre les formulaires de connexion et d'inscription
    function toggleForms(formToShow) {
        const registerSection = document.getElementById('register-section');
        const authSection = document.getElementById('auth-section');
        
        if (formToShow === 'register') {
            registerSection.classList.remove('hidden');
            authSection.classList.add('hidden');
        } else {
            registerSection.classList.add('hidden');
            authSection.classList.remove('hidden');
        }
    }

    // Gère le processus d'inscription
    async function handleRegister() {
        // Animation du bouton pour montrer le chargement
        const registerBtn = document.getElementById('register-btn');
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription en cours...';
        registerBtn.disabled = true;

        try {
            const email = document.getElementById('reg-email').value;
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            
            // Validation des champs
            if (!email || !username || !password) {
                throw new Error("Tous les champs sont obligatoires");
            }
            
            if (password.length < 6) {
                throw new Error("Le mot de passe doit contenir au moins 6 caractères");
            }
            
            // Appel API pour l'inscription
            const res = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Erreur lors de l'inscription");
            }
            
            // Notification de succès avec animation
            showNotification('success', "Inscription réussie ! Vous pouvez maintenant vous connecter.");
            
            // Réinitialiser les champs du formulaire
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-password').value = '';
            
            // Basculer vers le formulaire de connexion
            toggleForms('login');
        } catch (err) {
            showNotification('error', err.message);
        } finally {
            // Restaurer le bouton
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }

    // Gère le processus de connexion
    async function handleLogin() {
        // Animation du bouton pour montrer le chargement
        const loginBtn = document.getElementById('login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        loginBtn.disabled = true;

        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Validation des champs
            if (!email || !password) {
                throw new Error("Email et mot de passe sont requis");
            }
            
            // Appel API pour la connexion
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.message || "Erreur de connexion");
            }
            
            // Stocker le token et les infos utilisateur
            token = data.token;
            currentUser = data.user || { email };
            
            // Sauvegarder dans localStorage pour persistance
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Afficher l'interface authentifiée
            showAuthenticatedUI();
            
            // Charger les défis de l'utilisateur
            if (window.ChallengeUI && typeof window.ChallengeUI.loadChallenges === 'function') {
                window.ChallengeUI.loadChallenges(token);
            }
        } catch (err) {
            showNotification('error', err.message);
        } finally {
            // Restaurer le bouton
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    // Gère le processus de déconnexion
    function handleLogout() {
        // Supprimer le token et les infos utilisateur
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        
        // Rediriger vers la page de connexion
        const authSection = document.getElementById('auth-section');
        const challengeSection = document.getElementById('challenge-section');
        
        if (authSection) authSection.classList.remove('hidden');
        if (challengeSection) challengeSection.classList.add('hidden');
        
        // Réinitialiser le formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.reset();
        
        // Afficher une notification
        showNotification('success', 'Vous avez été déconnecté avec succès');
        
        // Restaurer l'animation d'entrée
        if (authSection) {
            authSection.style.animation = 'fadeIn 0.5s ease-out forwards';
        }
    }

    // Remplacer la fonction showAuthenticatedUI par celle-ci:
    function showAuthenticatedUI() {
        const authSection = document.getElementById('auth-section');
        const registerSection = document.getElementById('register-section');
        const challengeSection = document.getElementById('challenge-section');
        
        if (authSection) authSection.classList.add('hidden');
        if (registerSection) registerSection.classList.add('hidden');
        if (challengeSection) challengeSection.classList.remove('hidden');
        
        // Récupérer l'élément d'affichage utilisateur
        const userDisplay = document.getElementById('user-display');
        
        if (userDisplay && currentUser) {
            // Mettre à jour le texte du nom d'utilisateur
            userDisplay.textContent = currentUser.username || currentUser.email;
            
            // Créer le conteneur parent s'il n'existe pas déjà
            let dropdownContainer = userDisplay.closest('.user-dropdown-container');
            if (!dropdownContainer) {
                // Créer le conteneur dropdown et encapsuler le user-display
                dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'user-dropdown-container';
                userDisplay.parentNode.insertBefore(dropdownContainer, userDisplay);
                dropdownContainer.appendChild(userDisplay);
                
                // Créer le menu dropdown
                const dropdownMenu = document.createElement('div');
                dropdownMenu.className = 'user-dropdown-menu';
                dropdownMenu.innerHTML = `
                    <div class="dropdown-item settings-item">
                        <i class="fas fa-cog"></i>
                        <span>Paramètres</span>
                    </div>
                    <div class="dropdown-item logout-item">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Déconnexion</span>
                    </div>
                `;
                dropdownContainer.appendChild(dropdownMenu);
                
                // Ajouter les événements
                dropdownContainer.addEventListener('mouseenter', function() {
                    dropdownMenu.classList.add('show');
                });
                
                dropdownContainer.addEventListener('mouseleave', function() {
                    dropdownMenu.classList.remove('show');
                });
                
                // Configurer les actions des boutons
                dropdownMenu.querySelector('.settings-item').addEventListener('click', function() {
                    if (window.ChallengeUI && typeof ChallengeUI.showSettingsModal === 'function') {
                        ChallengeUI.showSettingsModal();
                    }
                    dropdownMenu.classList.remove('show');
                });
                
                dropdownMenu.querySelector('.logout-item').addEventListener('click', handleLogout);
            }
        }
        
        // Animation d'entrée pour la section challenge
        if (challengeSection) {
            challengeSection.style.animation = 'slideIn 0.5s ease-out forwards';
        }
    }

    // Ajoutez cette nouvelle fonction pour gérer les événements du menu
    function setupUserDropdownEvents(dropdown) {
        const profileContainer = dropdown.querySelector('.profile-container');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        const profileItem = dropdown.querySelector('.profile-item');
        const settingsItem = dropdown.querySelector('.settings-item');
        const logoutItem = dropdown.querySelector('.logout');
        
        // Ouvrir le menu au survol
        profileContainer.addEventListener('mouseenter', () => {
            dropdownMenu.classList.add('active');
        });
        
        // Fermer le menu quand on quitte la zone
        dropdown.addEventListener('mouseleave', () => {
            dropdownMenu.classList.remove('active');
        });
        
        // Événement pour afficher le profil
        profileItem.addEventListener('click', () => {
            dropdownMenu.classList.remove('active');
            if (window.ChallengeUI && typeof ChallengeUI.showProfileModal === 'function') {
                ChallengeUI.showProfileModal();
            }
        });
        
        // Événement pour afficher les paramètres
        settingsItem.addEventListener('click', () => {
            dropdownMenu.classList.remove('active');
            if (window.ChallengeUI && typeof ChallengeUI.showSettingsModal === 'function') {
                ChallengeUI.showSettingsModal();
            }
        });
        
        // Événement pour la déconnexion
        logoutItem.addEventListener('click', () => {
            handleLogout();
        });
    }

    // Affiche l'interface de connexion pour les utilisateurs non authentifiés
    function showLoginUI() {
        const authSection = document.getElementById('auth-section');
        const registerSection = document.getElementById('register-section');
        const challengeSection = document.getElementById('challenge-section');
        
        if (authSection) authSection.classList.remove('hidden');
        if (registerSection) registerSection.classList.add('hidden');
        if (challengeSection) challengeSection.classList.add('hidden');
    }

    // Affiche une notification stylisée
    function showNotification(type, message) {
        // Créer un élément de notification s'il n'existe pas déjà
        let notification = document.getElementById('notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }
        
        // Définir la classe en fonction du type
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Afficher la notification
        notification.style.display = 'block';
        notification.style.animation = 'fadeInOut 5s forwards';
        
        // Masquer après 5 secondes
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    // Fonction pour obtenir le token (pour les autres modules)
    function getToken() {
        return token;
    }

    // Fonction pour obtenir l'utilisateur courant (pour les autres modules)
    function getCurrentUser() {
        return currentUser;
    }

    // API publique du module
    return {
        init,
        getToken,
        getCurrentUser,
        showNotification
    };
})();

// Exporter le module pour une utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthUI;
} else {
    window.AuthUI = AuthUI;
}

// Initialiser l'UI d'authentification au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    AuthUI.init();
});