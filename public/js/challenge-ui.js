/**
 * Module de gestion de l'interface utilisateur pour les défis personnels
 * Thème : Lion Mindset - Rouge sombre
 */

const ChallengeUI = (function() {
    // Variables privées
    let challenges = [];
    let chartInstance = null;
    const DEFAULT_AVATAR = 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png';

    // Helpers utilisateur / stockage par utilisateur
    function getStoredUser() {
        try {
            if (window.AuthUI && typeof AuthUI.getCurrentUser === 'function') {
                const u = AuthUI.getCurrentUser();
                if (u) return u;
            }
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    }

    function getUserKey(user, suffix) {
        const id = user?.id || user?._id || user?.email || 'guest';
        return `${suffix}:${id}`;
    }

    function getProfilePhoto(user) {
        const key = getUserKey(user, 'profilePhoto');
        return localStorage.getItem(key) || DEFAULT_AVATAR;
    }

    function setProfilePhoto(user, dataUrl) {
        const key = getUserKey(user, 'profilePhoto');
        localStorage.setItem(key, dataUrl);
    }

    function getUserBio(user) {
        const key = getUserKey(user, 'userBio');
        return localStorage.getItem(key) || '';
    }

    function setUserBio(user, bio) {
        const key = getUserKey(user, 'userBio');
        localStorage.setItem(key, bio);
    }

    // Fonction d'initialisation
    function init() {
        // Ajouter les styles CSS nécessaires
        initStyles();
        addModalStyles(); // Assurez-vous que les styles de modal sont ajoutés
        addChallengeStyles();

        console.log("ChallengeUI initialized");
        
        // Configuration des écouteurs d'événements - doit être appelé en premier
        setupEventListeners();

        // Essayer de charger les défis si l'utilisateur est connecté
        if (window.AuthUI && AuthUI.getToken()) {
            loadChallenges();
        }

        // Ajouter cet écouteur d'événement pour l'authentification
        document.addEventListener('userAuthenticated', function(e) {
            console.log('Événement d\'authentification détecté, chargement des défis...');
            loadChallenges();
        });
    }

    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        // Utiliser une délégation d'événements pour le bouton de création
        document.addEventListener('click', function(event) {
            // Vérifier si l'élément cliqué ou un de ses parents a l'ID create-challenge-btn
            const targetElement = event.target.closest('#create-challenge-btn');
            if (targetElement) {
                console.log("Bouton Créer un défi cliqué");
                createChallenge();
            }
        });

        // Bouton pour actualiser la liste des défis
        const reloadBtn = document.getElementById('reload-challenges-btn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', loadChallenges);
        }

        // Ajouter l'écouteur d'événement pour le bouton de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Si AuthUI est disponible, utiliser sa fonction de déconnexion
                if (window.AuthUI) {
                    AuthUI.getToken(); // S'assurer que le module est initialisé
                    // Trouver la fonction handleLogout dans le module AuthUI
                    const authModule = Object.values(window.AuthUI).find(
                        val => typeof val === 'function' && val.toString().includes('localStorage.removeItem')
                    );
                    if (authModule) {
                        authModule();
                        return;
                    }
                }
                
                // Sinon, implémenter une déconnexion basique
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        }

        // Ajouter des gestionnaires d'événements pour le menu déroulant
        const profileContainer = document.querySelector('.profile-container');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (profileContainer && dropdownMenu) {
            let timeoutId; // Variable pour stocker l'ID du timeout
            
            // Ouvrir le menu au survol
            profileContainer.addEventListener('mouseenter', function() {
                // Annuler tout timeout de fermeture en cours
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                dropdownMenu.classList.add('active');
            });
            
            // Gardez également le menu ouvert lorsque la souris est sur le menu
            dropdownMenu.addEventListener('mouseenter', function() {
                // Annuler tout timeout de fermeture en cours
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            });
            
            // Fermer le menu quand on quitte la zone, mais avec un délai
            const profileDropdown = document.querySelector('.profile-dropdown');
            if (profileDropdown) {
                profileDropdown.addEventListener('mouseleave', function() {
                    // Définir un délai avant de fermer le menu (800ms)
                    timeoutId = setTimeout(() => {
                        dropdownMenu.classList.remove('active');
                    }, 800); // Délai de 800ms
                });
            }
            
            // Gérer les clics sur les éléments du menu
            const profileItem = dropdownMenu.querySelector('.profile-item');
            const settingsItem = dropdownMenu.querySelector('.settings-item');
            const logoutItem = dropdownMenu.querySelector('.logout');
            
            if (profileItem) {
                profileItem.addEventListener('click', function() {
                    dropdownMenu.classList.remove('active');
                    showProfileModal();
                });
            }
            
            if (settingsItem) {
                settingsItem.addEventListener('click', function() {
                    dropdownMenu.classList.remove('active');
                    showSettingsModal();
                });
            }
            
            if (logoutItem) {
                logoutItem.addEventListener('click', function() {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                });
            }
        }

        // Les autres boutons dynamiques sont ajoutés lors de la création des cartes
    }

    // Charger les défis de l'utilisateur
    async function loadChallenges() {
        const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
        if (!token) {
            console.log("Aucun token trouvé, impossible de charger les défis");
            return;
        }
        
        try {
            console.log("Chargement des défis en cours...");
            showLoadingIndicator();
            
            // Utiliser le préfixe /api pour les requêtes au backend
            const response = await fetch('/api/challenges', {
                headers: { 
                    'Authorization': 'Bearer ' + token 
                }
            });
            
            console.log("Statut de la réponse:", response.status);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    throw new Error(`Erreur ${response.status}: ${response.statusText}`);
                }
                throw new Error(errorData.message || "Erreur lors de la récupération des défis");
            }
            
            challenges = await response.json();
            console.log("Défis chargés:", challenges);
            
            renderChallenges();
            updateStatistics();
            updateProgressChart();
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', `${challenges.length} défis chargés`);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des défis:", err);
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('error', err.message);
            }
        } finally {
            hideLoadingIndicator();
        }
    }

    // Affiche l'indicateur de chargement
    function showLoadingIndicator() {
        let loader = document.getElementById('loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loader';
            loader.innerHTML = `
                <div class="spinner">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </div>
                <div class="loader-text">Chargement des défis...</div>
            `;
            const challengeSection = document.getElementById('challenge-section');
            if (challengeSection) {
                challengeSection.appendChild(loader);
            }
        } else {
            loader.style.display = 'flex';
        }
    }

    // Cache l'indicateur de chargement
    function hideLoadingIndicator() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Affiche les défis dans l'interface
    function renderChallenges() {
        const challengeList = document.getElementById('challenge-list');
        if (!challengeList) {
            createChallengeSection();
            return;
        }
        
        challengeList.innerHTML = '';
        
        if (challenges.length === 0) {
            challengeList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flag fa-3x"></i>
                    <h3>Aucun défi pour le moment</h3>
                    <p>Créez votre premier défi pour commencer votre parcours de lion.</p>
                </div>
            `;
            return;
        }
        
        challenges.forEach(challenge => {
            const challengeCard = createChallengeCard(challenge);
            challengeList.appendChild(challengeCard);
        });
    }

    // Remplacez la fonction createChallengeSection par cette nouvelle version

function createChallengeSection() {
    const challengeSection = document.getElementById('challenge-section');
    if (!challengeSection) return;
    
    const currentUser = getStoredUser();
    const profilePhoto = getProfilePhoto(currentUser);

    const content = `
        <div class="navbar">
            <div class="navbar-logo">
                <img src="https://cdn-icons-png.flaticon.com/512/3575/3575443.png" alt="LionTrack">
                <h3>LionTrack</h3>
            </div>
            
            <div class="navbar-links">
                <a href="#dashboard" class="navbar-link active"><i class="fas fa-tachometer-alt"></i> Tableau de bord</a>
                <a href="#challenges" class="navbar-link"><i class="fas fa-trophy"></i> Mes défis</a>
                <a href="#achievements" class="navbar-link"><i class="fas fa-medal"></i> Récompenses</a>
                <a href="#physique" class="navbar-link"><i class="fas fa-dumbbell"></i> Physique</a>
            </div>
            
            <div class="navbar-profile">
                <div class="profile-dropdown">
                    <div class="profile-container">
                        <div class="profile-image">
                            <img src="${profilePhoto}" alt="Photo de profil">
                        </div>
                        <div class="profile-info">
                            <span class="profile-name" id="user-display"></span>
                            <div class="profile-rank">
                                <img src="https://cdn-icons-png.flaticon.com/512/9241/9241203.png" class="rank-insignia" alt="Grade">
                                <span>Capitaine</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dropdown-menu">
                        <div class="dropdown-item profile-item">
                            <i class="fas fa-user-circle"></i>
                            <span>Mon profil</span>
                        </div>
                        <div class="dropdown-item settings-item">
                            <i class="fas fa-cog"></i>
                            <span>Paramètres</span>
                        </div>
                        <div class="dropdown-item logout">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Déconnexion</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">Total Défis</div>
                <div class="stat-value" id="stat-total">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Défis Actifs</div>
                <div class="stat-value" id="stat-active">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Défis Complétés</div>
                <div class="stat-value" id="stat-completed">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Progression Moyenne</div>
                <div class="stat-value" id="stat-progress">0%</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3><i class="fas fa-chart-line"></i> Suivi de Progression</h3>
            <canvas id="progress-chart" height="250"></canvas>
        </div>
        
        <div class="challenge-actions">
            <h3><i class="fas fa-tasks"></i> Mes Défis</h3>
            <div>
                <button id="reload-challenges-btn" class="icon-btn" title="Actualiser">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button id="create-challenge-btn" class="primary-btn">
                    <i class="fas fa-plus"></i> Créer un Défi
                </button>
            </div>
        </div>
        
        <div id="challenge-list" class="challenge-grid"></div>
    `;
    
    challengeSection.innerHTML = content;
    
    // Réattacher tous les écouteurs d'événements
    setupEventListeners();

    // Réafficher le nom d'utilisateur
    if (window.AuthUI && AuthUI.getCurrentUser()) {
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            const currentUser = AuthUI.getCurrentUser();
            userDisplay.textContent = currentUser.username || currentUser.email;
        }
    }

    // Réattacher les écouteurs d'événements de AuthUI
    if (window.AuthUI && typeof AuthUI.setupEventListeners === 'function') {
        AuthUI.setupEventListeners();
    }
}

    // Crée une carte pour un défi
    function createChallengeCard(challenge) {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.dataset.id = challenge._id;
        
        const progress = challenge.progress || 0;
        let progressClass = 'progress-low';
        if (progress >= 70) progressClass = 'progress-high';
        else if (progress >= 30) progressClass = 'progress-medium';
        
        card.innerHTML = `
            <div class="challenge-header">
                <h4 class="challenge-title">${challenge.title}</h4>
                <div class="challenge-actions">
                    <button class="icon-btn edit-btn" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-btn" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <p class="challenge-description">${challenge.description || 'Pas de description'}</p>
            <div class="progress-container">
                <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
            </div>
            <div class="progress-info">
                <span class="progress-label">Progression: ${progress}%</span>
                <button class="update-progress-btn">
                    <i class="fas fa-chart-line"></i> Mettre à jour
                </button>
            </div>
            <div class="challenge-footer">
                <span class="challenge-date">
                    <i class="fas fa-calendar-alt"></i> 
                    ${new Date(challenge.startDate || Date.now()).toLocaleDateString()}
                </span>
                <span class="challenge-status">
                    ${progress === 100 ? '<i class="fas fa-trophy"></i> Complété' : '<i class="fas fa-hourglass-half"></i> En cours'}
                </span>
            </div>
        `;
        
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => editChallenge(challenge));
        }
        
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteChallenge(challenge._id));
        }
        
        const updateProgressBtn = card.querySelector('.update-progress-btn');
        if (updateProgressBtn) {
            updateProgressBtn.addEventListener('click', () => updateChallengeProgress(challenge._id, progress));
        }
        
        return card;
    }

    // Met à jour les statistiques
    function updateStatistics() {
        if (challenges.length === 0) return;
        
        const totalChallenges = challenges.length;
        let activeChallenges = 0;
        let completedChallenges = 0;
        let totalProgress = 0;
        
        challenges.forEach(challenge => {
            const progress = challenge.progress || 0;
            if (progress === 100) {
                completedChallenges++;
            } else {
                activeChallenges++;
            }
            totalProgress += progress;
        });
        
        const averageProgress = Math.round(totalProgress / totalChallenges);
        document.getElementById('stat-total').textContent = totalChallenges;
        document.getElementById('stat-active').textContent = activeChallenges;
        document.getElementById('stat-completed').textContent = completedChallenges;
        document.getElementById('stat-progress').textContent = `${averageProgress}%`;
        
        // Mettre à jour le grade de l'utilisateur
        if (window.RankSystem) {
            RankSystem.updateRankDisplay(completedChallenges);
        }
    }

    // Remplacez la fonction updateProgressChart par celle-ci pour déboguer
    function updateProgressChart() {
        if (!challenges.length) return;
        
        const ctx = document.getElementById('progress-chart');
        if (!ctx) return;
        
        try {
            // Au lieu de détruire et recréer le graphique à chaque fois
            if (chartInstance) {
                // Mettre à jour le graphique existant
                const labels = challenges.map(c => c.title);
                const data = challenges.map(c => c.progress || 0);
                const backgroundColors = data.map(progress => {
                    if (progress < 30) return 'rgba(170, 0, 0, 0.7)';
                    if (progress < 70) return 'rgba(212, 175, 55, 0.7)';
                    return 'rgba(0, 170, 0, 0.7)';
                });
                
                chartInstance.data.labels = labels;
                chartInstance.data.datasets[0].data = data;
                chartInstance.data.datasets[0].backgroundColor = backgroundColors;
                chartInstance.update();
            } else {
                // Créer un nouveau graphique seulement la première fois
                const labels = challenges.map(c => c.title);
                const data = challenges.map(c => c.progress || 0);
                const backgroundColors = data.map(progress => {
                    if (progress < 30) return 'rgba(170, 0, 0, 0.7)';
                    if (progress < 70) return 'rgba(212, 175, 55, 0.7)';
                    return 'rgba(0, 170, 0, 0.7)';
                });
                
                chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Progression des défis (%)',
                            data: data,
                            backgroundColor: backgroundColors,
                            borderWidth: 1,
                            borderColor: '#121212'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: '#f0f0f0' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#f0f0f0', maxRotation: 45, minRotation: 45 }
                            }
                        },
                        plugins: {
                            legend: { display: true, labels: { color: '#f0f0f0' } }
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Erreur lors de la création du graphique:", error);
        }
    }

    // Remplacez la fonction createChallenge() complète

async function createChallenge() {
    // Supprimer toute modale existante pour éviter les doublons
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
        document.body.removeChild(modal);
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-plus-circle"></i> Nouveau Défi</h3>
                <button type="button" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="new-challenge-form">
                    <div class="form-group">
                        <label for="challenge-title">Titre:</label>
                        <input type="text" id="challenge-title" placeholder="Ex: Méditer 10 minutes par jour" required>
                    </div>
                    <div class="form-group">
                        <label for="challenge-description">Description:</label>
                        <textarea id="challenge-description" placeholder="Décrivez votre défi en détail..." rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="challenge-category">Catégorie:</label>
                        <select id="challenge-category">
                            <option value="physique">Physique</option>
                            <option value="mental">Mental</option>
                            <option value="nutrition">Nutrition</option>
                            <option value="quotidien">Quotidien</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="challenge-deadline">Date limite (optionnel):</label>
                        <input type="date" id="challenge-deadline">
                    </div>
                    <div class="form-group">
                        <label for="challenge-initial-progress">Progression initiale: <span id="progress-value-display">0%</span></label>
                        <div class="progress-slider-container">
                            <input type="range" id="challenge-initial-progress" class="slider" min="0" max="100" value="0">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" id="cancel-create" class="secondary-btn">Annuler</button>
                <button type="button" id="save-challenge" class="primary-btn">Créer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mise à jour en temps réel de l'affichage de la progression
    const progressSlider = document.getElementById('challenge-initial-progress');
    const progressDisplay = document.getElementById('progress-value-display');
    
    if (progressSlider && progressDisplay) {
        progressSlider.addEventListener('input', function() {
            progressDisplay.textContent = this.value + '%';
        });
    }
    
    // Fermeture de la modale
    const closeModal = () => {
        if (document.querySelector('.modal')) {
            document.body.removeChild(document.querySelector('.modal'));
        }
    };
    
    // Gestionnaires d'événements
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    const cancelBtn = modal.querySelector('#cancel-create');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    const saveBtn = modal.querySelector('#save-challenge');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const title = document.getElementById('challenge-title').value;
            const description = document.getElementById('challenge-description').value;
            const category = document.getElementById('challenge-category').value;
            const deadline = document.getElementById('challenge-deadline').value;
            const initialProgress = parseInt(document.getElementById('challenge-initial-progress').value);
            
            if (!title) {
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', 'Le titre du défi est obligatoire');
                } else {
                    alert('Le titre du défi est obligatoire');
                }
                return;
            }
            
            try {
                // Afficher un indicateur de chargement sur le bouton
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Création...';
                saveBtn.disabled = true;
                
                const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
                
                // Faire la requête au serveur - utiliser la bonne URL avec préfixe /api
                const response = await fetch('/api/challenges', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        category,
                        deadline: deadline || null,
                        progress: initialProgress
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erreur lors de la création du défi');
                }
                
                // Ajouter le nouveau défi à la liste locale
                challenges.push(data.challenge);
                
                // Notifier l'utilisateur du succès
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', 'Défi créé avec succès!');
                } else {
                    alert('Défi créé avec succès!');
                }
                
                // Fermer la modale
                closeModal();
                
                // Recharger les défis pour mettre à jour l'interface
                await loadChallenges();
            } catch (error) {
                console.error('Erreur lors de la création du défi:', error);
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', error.message || 'Erreur lors de la création du défi');
                } else {
                    alert('Erreur: ' + (error.message || 'Erreur lors de la création du défi'));
                }
                
                // Restaurer le bouton
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    }
}

    // Fonction pour mettre à jour un défi existant
    async function editChallenge(challenge) {
        const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
        if (!token) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Modifier le Défi</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-title">Titre:</label>
                        <input type="text" id="edit-title" value="${challenge.title}">
                    </div>
                    <div class="form-group">
                        <label for="edit-description">Description:</label>
                        <textarea id="edit-description">${challenge.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-progress">Progression: <span id="edit-progress-value-display">${challenge.progress || 0}%</span></label>
                        <div class="progress-slider-container">
                            <input type="range" id="edit-progress" class="slider" min="0" max="100" value="${challenge.progress || 0}">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-edit" class="secondary-btn">Annuler</button>
                    <button id="save-edit" class="primary-btn">Enregistrer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Mise à jour en temps réel de l'affichage de la progression
        const progressSlider = document.getElementById('edit-progress');
        const progressDisplay = document.getElementById('edit-progress-value-display');
        
        progressSlider.addEventListener('input', function() {
            progressDisplay.textContent = this.value + '%';
        });
        
        const closeModal = () => document.body.removeChild(modal);
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-edit').addEventListener('click', closeModal);
        
        modal.querySelector('#save-edit').addEventListener('click', async () => {
            const title = document.getElementById('edit-title').value;
            const description = document.getElementById('edit-description').value;
            const progress = parseInt(document.getElementById('edit-progress').value) || 0;
            
            if (!title) {
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', 'Le titre du défi est obligatoire');
                }
                return;
            }
            
            const saveBtn = document.getElementById('save-edit');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
            saveBtn.disabled = true;
            
            try {
                const res = await fetch(`/api/challenges/${challenge._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, description, progress })
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Erreur lors de la mise à jour du défi');
                }
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', 'Défi mis à jour avec succès');
                }
                
                closeModal();
                await loadChallenges();
            } catch (err) {
                console.error('Erreur:', err);
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', err.message);
                }
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // Fonction pour supprimer un défi
    async function deleteChallenge(challengeId) {
        const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
        if (!token) return;
        
        const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce défi ?');
        if (!confirmed) return;
        
        try {
            const res = await fetch(`/api/challenges/${challengeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la suppression du défi');
            }
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Défi supprimé avec succès');
            }
            
            await loadChallenges();
        } catch (err) {
            console.error('Erreur:', err);
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('error', err.message);
            }
        }
    }

    // Modifiez la fonction updateChallengeProgress pour garantir la mise à jour en base de données

async function updateChallengeProgress(challengeId, currentProgress) {
    const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
    if (!token) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-chart-line"></i> Mettre à jour la progression</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="progress-slider-container">
                    <input type="range" id="progress-slider" min="0" max="100" value="${currentProgress}" class="slider">
                    <div class="progress-value">${currentProgress}%</div>
                </div>
                <div class="form-group">
                    <label for="progress-note">Note (optionnel):</label>
                    <textarea id="progress-note" placeholder="Décrivez votre progression..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cancel-progress" class="secondary-btn">Annuler</button>
                <button id="save-progress" class="primary-btn">Enregistrer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const slider = document.getElementById('progress-slider');
    const valueDisplay = modal.querySelector('.progress-value');
    slider.addEventListener('input', () => valueDisplay.textContent = `${slider.value}%`);
    
    const closeModal = () => {
        const modalElement = document.querySelector('.modal');
        if (modalElement) {
            document.body.removeChild(modalElement);
        }
    };
    
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('#cancel-progress').addEventListener('click', closeModal);
    
    modal.querySelector('#save-progress').addEventListener('click', async () => {
        const progress = parseInt(slider.value);
        const note = document.getElementById('progress-note').value;
        
        const saveBtn = document.getElementById('save-progress');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
        saveBtn.disabled = true;
        
        try {
            console.log('Mise à jour du défi:', challengeId, 'avec progression:', progress);
            
            const response = await fetch(`/api/challenges/${challengeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ progress, note })
            });
            
            console.log('Statut de la réponse:', response.status);
            
            const data = await response.json();
            console.log('Réponse du serveur:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la mise à jour de la progression');
            }
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Progression mise à jour avec succès');
                
                if (progress === 100) {
                    setTimeout(() => {
                        AuthUI.showNotification('success', '🏆 FÉLICITATIONS! Défi complété avec succès! 🏆');
                    }, 1000);
                }
            } else {
                alert('Progression mise à jour avec succès');
            }
            
            closeModal();
            await loadChallenges();
        } catch (err) {
            console.error('Erreur:', err);
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('error', err.message);
            } else {
                alert('Erreur: ' + err.message);
            }
            
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });
}

    // Ajouter les styles dynamiques pour les modals
    function addModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'modal-styles';
            styleEl.innerHTML = `
                .modal { 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background-color: rgba(0, 0, 0, 0.8); 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    z-index: 1000; 
                    animation: fadeIn 0.3s ease; 
                }
                .modal-content { 
                    background-color: #222; 
                    border-radius: 10px; 
                    width: 90%; 
                    max-width: 500px; 
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); 
                    animation: slideIn 0.3s ease; 
                    color: white;
                }
                .modal-header { 
                    padding: 15px 20px; 
                    border-bottom: 1px solid #333; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                }
                .modal-header h3 { 
                    margin: 0; 
                    color: #d4af37; 
                }
                .modal-body { 
                    padding: 20px; 
                }
                .modal-footer { 
                    padding: 15px 20px; 
                    border-top: 1px solid #333; 
                    display: flex; 
                    justify-content: flex-end; 
                    gap: 10px; 
                }
                .close-btn { 
                    background: none; 
                    border: none; 
                    font-size: 24px; 
                    color: white; 
                    cursor: pointer; 
                    padding: 0; 
                    margin: 0; 
                }
                .close-btn:hover { 
                    color: #aa0000; 
                }
                
                /* Reste des styles... */
            `;
            document.head.appendChild(styleEl);
        }
    }

    // Ajouter les styles CSS pour les cartes de défis et le tableau de bord
    function addChallengeStyles() {
        if (!document.getElementById('challenge-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'challenge-styles';
            styleEl.innerHTML = `
                .challenge-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .challenge-card {
                    background-color: var(--card-bg);
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    border-top: 3px solid var(--medium-red);
                }
                
                .challenge-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
                }
                
                .challenge-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }
                
                .challenge-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: var(--light-red);
                    margin: 0;
                }
                
                .challenge-description {
                    color: #ccc;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                
                .progress-container {
                    height: 10px;
                    background-color: #333;
                    border-radius: 5px;
                    overflow: hidden;
                    margin-bottom: 10px;
                }
                
                .progress-bar {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                
                .progress-low {
                    background: linear-gradient(90deg, #880000, #aa0000);
                }
                
                .progress-medium {
                    background: linear-gradient(90deg, #aa8800, #d4af37);
                }
                
                .progress-high {
                    background: linear-gradient(90deg, #007700, #00aa00);
                }
                
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .progress-label {
                    font-size: 14px;
                    color: #aaa;
                }
                
                .update-progress-btn {
                    font-size: 12px;
                    padding: 5px 10px;
                }
                
                .challenge-footer {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #aaa;
                }
                
                .challenge-actions {
                    display: flex;
                    gap: 5px;
                }
                
                .icon-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    cursor: pointer;
                    padding: 5px;
                    transition: color 0.3s ease;
                }
                
                .icon-btn:hover {
                    color: var(--accent-gold);
                }
                
                .icon-btn.delete-btn:hover {
                    color: #ff4444;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background-color: var(--card-bg);
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border-bottom: 3px solid var(--accent-gold);
                }
                
                .stat-title {
                    font-size: 14px;
                    color: #aaa;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                }
                
                .stat-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: var(--accent-gold);
                }
                
                .chart-container {
                    background-color: var(--card-bg);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 30px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                .challenge-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 30px;
                }
                
                .challenge-actions h3 {
                    margin: 0;
                }
                
                .create-challenge-form {
                    background-color: var(--card-bg);
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 30px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    border-left: 4px solid var(--accent-gold);
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #aaa;
                }
                
                .empty-state i {
                    color: var(--accent-gold);
                    margin-bottom: 20px;
                }
                
                .loader {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 30px;
                }
                
                .spinner {
                    font-size: 24px;
                    color: var(--accent-gold);
                    margin-bottom: 15px;
                }
                
                .loader-text {
                    color: #aaa;
                }
                
                .user-welcome {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                    
                    .challenge-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .user-welcome {
                        flex-direction: column;
                        gap: 15px;
                    }
                }
            `;
            document.head.appendChild(styleEl);
        }
    }

    // Ajouter les styles nécessaires au chargement
    function initStyles() {
        // Les styles sont maintenant chargés via les fichiers CSS
        // addModalStyles();
        // addChallengeStyles();
        console.log('Styles chargés via fichiers CSS externes');
    }

    // Fonction pour afficher la modal de profil
    function showProfileModal() {
        const currentUser = getStoredUser();
        const username = currentUser.username || 'Utilisateur';
        const email = currentUser.email || '';
        
        const profilePhoto = getProfilePhoto(currentUser);
        
        // Récupérer le grade actuel via RankSystem
        let currentRank = { name: 'Capitaine', icon: 'https://cdn-icons-png.flaticon.com/512/9241/9241203.png' };
        if (window.RankSystem && typeof RankSystem.getCurrentRank === 'function') {
            currentRank = RankSystem.getCurrentRank();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-user-circle"></i> Mon Profil</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profile-header">
                        <div class="profile-image-large">
                            <img src="${profilePhoto}" alt="Photo de profil" id="profile-image-preview">
                            <input type="file" id="profile-photo-input" accept="image/*" style="display: none;">
                            <button class="change-photo-btn" id="change-photo-btn"><i class="fas fa-camera"></i></button>
                        </div>
                        <div class="profile-details">
                            <div class="profile-rank-badge">
                                <img src="${currentRank.icon}" class="rank-insignia-large" alt="Grade">
                                <h4 class="rank-title">${currentRank.name}</h4>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-username">Nom d'utilisateur:</label>
                        <input type="text" id="profile-username" value="${username}">
                    </div>
                    <div class="form-group">
                        <label for="profile-email">Email:</label>
                        <input type="email" id="profile-email" value="${email}" disabled>
                    </div>
                    <div class="form-group">
                        <label for="profile-bio">Biographie:</label>
                        <textarea id="profile-bio" placeholder="Parlez-nous de vous...">${getUserBio(currentUser)}</textarea>
                    </div>
                    <div class="achievement-section">
                        <h4><i class="fas fa-medal"></i> Réalisations</h4>
                        <div class="achievements-grid">
                            <div class="achievement">
                                <i class="fas fa-trophy"></i>
                                <span>Premier Défi Complété</span>
                            </div>
                            <div class="achievement locked">
                                <i class="fas fa-lock"></i>
                                <span>10 Défis Complétés</span>
                            </div>
                            <div class="achievement locked">
                                <i class="fas fa-lock"></i>
                                <span>Mentalité de Lion</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-profile" class="secondary-btn">Annuler</button>
                    <button id="save-profile" class="primary-btn">Enregistrer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gérer le changement de photo de profil
        const photoInput = modal.querySelector('#profile-photo-input');
        const changePhotoBtn = modal.querySelector('#change-photo-btn');
        const imagePreview = modal.querySelector('#profile-image-preview');
        
        changePhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });
        
        photoInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imagePreview.src = event.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-profile').addEventListener('click', closeModal);
        
        // Sauvegarder les modifications
        modal.querySelector('#save-profile').addEventListener('click', async () => {
            const username = document.getElementById('profile-username').value;
            const bio = document.getElementById('profile-bio').value;
            const profilePhoto = imagePreview.src;
            
            setUserBio(currentUser, bio);
            setProfilePhoto(currentUser, profilePhoto);
            
            // Mettre à jour l'affichage de la photo dans la navbar
            const navbarProfileImage = document.querySelector('.profile-image img');
            if (navbarProfileImage) {
                navbarProfileImage.src = profilePhoto;
            }
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Profil mis à jour avec succès');
            }
            
            closeModal();
        });
    }

    // Remplacez la fonction showSettingsModal() complète

function showSettingsModal() {
            const currentUser = getStoredUser();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> Paramètres</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>Apparence</h4>
                    <div class="form-group">
                        <label>Thème:</label>
                        <select id="theme-selector">
                            <option value="dark-red" selected>Lion Rouge (par défaut)</option>
                            <option value="dark-blue">Lion Bleu</option>
                            <option value="dark-gold">Lion Or</option>
                        </select>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Informations personnelles</h4>
                    <div class="form-group">
                        <label for="settings-username">Nom d'utilisateur:</label>
                        <input type="text" id="settings-username" value="${currentUser.username || ''}">
                    </div>
                    <div class="form-group">
                        <label for="settings-email">Email:</label>
                        <input type="email" id="settings-email" value="${currentUser.email || ''}" disabled>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>Sécurité</h4>
                    <div class="form-group">
                        <button id="change-password-btn" class="secondary-btn">
                            <i class="fas fa-key"></i> Changer mot de passe
                        </button>
                    </div>
                </div>
                <div class="settings-section danger-zone">
                    <h4>Zone de danger</h4>
                    <div class="form-group">
                        <button id="logout-btn-settings" class="danger-btn">
                            <i class="fas fa-sign-out-alt"></i> Se déconnecter
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cancel-settings" class="secondary-btn">Annuler</button>
                <button id="save-settings" class="primary-btn">Enregistrer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        if (document.querySelector('.modal')) {
            document.body.removeChild(document.querySelector('.modal'));
        }
    };
    
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('#cancel-settings').addEventListener('click', closeModal);
    
    modal.querySelector('#logout-btn-settings').addEventListener('click', () => {
        if (window.AuthUI && typeof AuthUI.handleLogout === 'function') {
            AuthUI.handleLogout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
        closeModal();
    });
    
    modal.querySelector('#save-settings').addEventListener('click', async () => {
        const saveBtn = document.getElementById('save-settings');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enregistrement...';
        saveBtn.disabled = true;
        
        try {
            const username = document.getElementById('settings-username').value;
            
            // Mettre à jour dans la base de données
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            if (!token) throw new Error('Vous devez être connecté pour modifier vos paramètres');
            
            console.log("Mise à jour du nom d'utilisateur:", username);
            
            // Utiliser le préfixe /api pour la route utilisateur
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username })
            });
            
            console.log("Statut de la réponse:", response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
            }
            
            const data = await response.json();
            console.log("Réponse du serveur:", data);
            
            // Mettre à jour l'affichage
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.textContent = username;
            }
            
            // Mettre à jour dans localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.username = username;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Mettre à jour currentUser dans le module AuthUI
            if (window.AuthUI && typeof AuthUI.updateCurrentUser === 'function') {
                AuthUI.updateCurrentUser({ ...currentUser, username });
            }
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Paramètres enregistrés avec succès');
            } else {
                alert('Paramètres enregistrés avec succès');
            }
            
            closeModal();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('error', error.message || 'Erreur lors de la sauvegarde des paramètres');
            } else {
                alert('Erreur: ' + (error.message || 'Erreur lors de la sauvegarde des paramètres'));
            }
            
            // Restaurer le bouton
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    });
}

    // Fonction pour afficher la modal de changement de mot de passe
    function showChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Changer de mot de passe</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="current-password">Mot de passe actuel:</label>
                        <input type="password" id="current-password">
                    </div>
                    <div class="form-group">
                        <label for="new-password">Nouveau mot de passe:</label>
                        <input type="password" id="new-password">
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Confirmer le mot de passe:</label>
                        <input type="password" id="confirm-password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-password" class="secondary-btn">Annuler</button>
                    <button id="save-password" class="primary-btn">Enregistrer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-password').addEventListener('click', closeModal);
        
        modal.querySelector('#save-password').addEventListener('click', () => {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', 'Tous les champs sont obligatoires');
                }
                return;
            }
            
            if (newPassword !== confirmPassword) {
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', 'Les mots de passe ne correspondent pas');
                }
                return;
            }
            
            // Ici, vous pourriez ajouter une requête API pour changer le mot de passe
            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Mot de passe modifié avec succès');
            }
            
            closeModal();
        });
    }

    // Fonction pour afficher une notification élégante
    function showNotification(message, type = 'success') {
        // Supprimer les notifications existantes
        const existingNotif = document.querySelector('.lion-notification');
        if (existingNotif) {
            existingNotif.remove();
        }

        const notification = document.createElement('div');
        notification.className = `lion-notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        const bgColor = type === 'success' ? '#51cf66' : '#ff6b6b';
        
        notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            font-size: 16px;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Ajouter les animations CSS pour les notifications
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Fonction pour gérer la navigation entre les onglets
    function setupTabNavigation() {
        document.addEventListener('click', function(e) {
            const navLink = e.target.closest('.navbar-link');
            if (!navLink) return;
            
            e.preventDefault();
            
            // Retirer la classe active de tous les onglets
            document.querySelectorAll('.navbar-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Ajouter la classe active à l'onglet cliqué
            navLink.classList.add('active');
            
            // Gérer l'affichage selon l'onglet
            const href = navLink.getAttribute('href');
            
            if (href === '#dashboard') {
                showDashboard();
            } else if (href === '#physique') {
                showPhysiqueTab();
            }
            // Les autres onglets seront implémentés plus tard
        });
    }

    // Afficher le tableau de bord (vue actuelle)
    function showDashboard() {
        createChallengeSection();
        loadChallenges();
    }

    // Afficher l'onglet Physique
    function showPhysiqueTab() {
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;
        
        const currentUser = getStoredUser();
        const profilePhoto = getProfilePhoto(currentUser);

        const content = `
            <div class="navbar">
                <div class="navbar-logo">
                    <img src="https://cdn-icons-png.flaticon.com/512/3575/3575443.png" alt="LionTrack">
                    <h3>LionTrack</h3>
                </div>
                
                <div class="navbar-links">
                    <a href="#dashboard" class="navbar-link"><i class="fas fa-tachometer-alt"></i> Tableau de bord</a>
                    <a href="#challenges" class="navbar-link"><i class="fas fa-trophy"></i> Mes défis</a>
                    <a href="#achievements" class="navbar-link"><i class="fas fa-medal"></i> Récompenses</a>
                    <a href="#physique" class="navbar-link active"><i class="fas fa-dumbbell"></i> Physique</a>
                </div>
                
                <div class="navbar-profile">
                    <div class="profile-dropdown">
                        <div class="profile-container">
                            <div class="profile-image">
                                <img src="${profilePhoto}" alt="Photo de profil">
                            </div>
                            <div class="profile-info">
                                <span class="profile-name" id="user-display"></span>
                                <div class="profile-rank">
                                    <img src="https://cdn-icons-png.flaticon.com/512/9241/9241203.png" class="rank-insignia" alt="Grade">
                                    <span>Capitaine</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="dropdown-menu">
                            <div class="dropdown-item profile-item">
                                <i class="fas fa-user-circle"></i>
                                <span>Mon profil</span>
                            </div>
                            <div class="dropdown-item settings-item">
                                <i class="fas fa-cog"></i>
                                <span>Paramètres</span>
                            </div>
                            <div class="dropdown-item logout">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Déconnexion</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Poids Actuel</div>
                    <div class="stat-value" id="weight-current">-- kg</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Variation 7 jours</div>
                    <div class="stat-value" id="weight-7days">-- kg</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Variation 30 jours</div>
                    <div class="stat-value" id="weight-30days">-- kg</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Total Pesées</div>
                    <div class="stat-value" id="weight-total">0</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3><i class="fas fa-weight"></i> Évolution du Poids</h3>
                <canvas id="weight-chart" height="300"></canvas>
            </div>
            
            <div class="challenge-actions">
                <h3><i class="fas fa-clipboard-list"></i> Mes Pesées</h3>
                <div>
                    <button id="reload-weight-btn" class="icon-btn" title="Actualiser">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button id="add-weight-btn" class="primary-btn">
                        <i class="fas fa-plus"></i> Ajouter une Pesée
                    </button>
                </div>
            </div>
            
            <div id="weight-list" class="challenge-grid"></div>
        `;
        
        challengeSection.innerHTML = content;
        
        // Réafficher le nom d'utilisateur
        if (window.AuthUI && AuthUI.getCurrentUser()) {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                const currentUser = AuthUI.getCurrentUser();
                userDisplay.textContent = currentUser.username || currentUser.email;
            }
        }

        // Réattacher les écouteurs d'événements de AuthUI
        if (window.AuthUI && typeof AuthUI.setupEventListeners === 'function') {
            AuthUI.setupEventListeners();
        }

        // Charger les données de poids
        loadWeightData();
        
        // Écouteurs d'événements pour l'onglet physique
        document.getElementById('add-weight-btn').addEventListener('click', showAddWeightModal);
        document.getElementById('reload-weight-btn').addEventListener('click', loadWeightData);
    }

    // Charger les données de poids
    async function loadWeightData() {
        try {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            
            if (!token) {
                console.error('Aucun token d\'authentification');
                return;
            }

            // Charger toutes les pesées
            const response = await fetch('/api/weight', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des pesées');
            }

            const weights = await response.json();
            
            // Charger les statistiques
            const statsResponse = await fetch('/api/weight/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            let stats = null;
            if (statsResponse.ok) {
                stats = await statsResponse.json();
                updateWeightStats(stats);
            }

            // Afficher le graphique
            displayWeightChart(weights);
            
            // Afficher la liste des pesées
            displayWeightList(weights);

        } catch (error) {
            console.error('Erreur:', error);
        }
    }

    // Mettre à jour les statistiques
    function updateWeightStats(stats) {
        document.getElementById('weight-current').textContent = `${stats.current.toFixed(1)} kg`;
        
        const change7 = stats.change7Days;
        const change30 = stats.change30Days;
        
        document.getElementById('weight-7days').innerHTML = formatWeightChange(change7);
        document.getElementById('weight-30days').innerHTML = formatWeightChange(change30);
        document.getElementById('weight-total').textContent = stats.totalEntries;
    }

    // Formater le changement de poids
    function formatWeightChange(change) {
        if (change === 0) return '0 kg';
        const sign = change > 0 ? '+' : '';
        const color = change > 0 ? '#ff6b6b' : '#51cf66';
        return `<span style="color: ${color}">${sign}${change.toFixed(1)} kg</span>`;
    }

    // Afficher le graphique de poids
    function displayWeightChart(weights) {
        const canvas = document.getElementById('weight-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Détruire le graphique existant si présent
        if (window.weightChartInstance) {
            window.weightChartInstance.destroy();
        }

        if (weights.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#999';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée disponible', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Trier par date croissante
        weights.sort((a, b) => new Date(a.date) - new Date(b.date));

        const labels = weights.map(w => {
            const date = new Date(w.date);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
        });
        const data = weights.map(w => w.weight);

        window.weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Poids (kg)',
                    data: data,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ff6b6b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 20
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffd700',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffd700',
                        bodyColor: '#fff',
                        borderColor: '#ff6b6b',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                const index = context[0].dataIndex;
                                const date = new Date(weights[index].date);
                                return date.toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                            },
                            label: function(context) {
                                return `Poids: ${context.parsed.y.toFixed(1)} kg`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Poids (kg)',
                            color: '#ffd700',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#ffd700',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value.toFixed(1) + ' kg';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 215, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#ffd700',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#ffd700',
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        grid: {
                            color: 'rgba(255, 215, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Afficher la liste des pesées
    function displayWeightList(weights) {
        const weightList = document.getElementById('weight-list');
        if (!weightList) return;

        weightList.innerHTML = '';

        if (weights.length === 0) {
            weightList.innerHTML = `
                <div class="no-challenges">
                    <i class="fas fa-weight fa-3x"></i>
                    <h3>Aucune pesée enregistrée</h3>
                    <p>Commencez à suivre votre poids en ajoutant votre première pesée.</p>
                </div>
            `;
            return;
        }

        // Trier par date décroissante
        weights.sort((a, b) => new Date(b.date) - new Date(a.date));

        weights.forEach(weight => {
            const card = document.createElement('div');
            card.className = 'challenge-card';
            card.innerHTML = `
                <div class="challenge-header">
                    <h4 class="challenge-title">${weight.weight.toFixed(1)} kg</h4>
                    <div class="challenge-actions">
                        <button class="icon-btn edit-weight-btn" data-id="${weight._id}" data-weight="${weight.weight}" data-date="${weight.date}" data-note="${weight.note || ''}" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn delete-weight-btn" data-id="${weight._id}" title="Supprimer">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                ${weight.note ? `<p class="challenge-description">${weight.note}</p>` : ''}
                <div class="challenge-footer">
                    <span class="challenge-date">
                        <i class="fas fa-calendar-alt"></i> 
                        ${new Date(weight.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            `;
            weightList.appendChild(card);
        });

        // Ajouter les écouteurs pour l'édition
        document.querySelectorAll('.edit-weight-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const weightId = this.getAttribute('data-id');
                const weightValue = parseFloat(this.getAttribute('data-weight'));
                const date = this.getAttribute('data-date');
                const note = this.getAttribute('data-note');
                showEditWeightModal(weightId, weightValue, date, note);
            });
        });

        // Ajouter les écouteurs pour la suppression
        document.querySelectorAll('.delete-weight-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const weightId = this.getAttribute('data-id');
                deleteWeight(weightId);
            });
        });
    }

    // Modal pour ajouter une pesée
    function showAddWeightModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-weight"></i> Ajouter une Pesée</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="add-weight-form">
                    <div class="form-group">
                        <label for="weight-input">Poids (kg) *</label>
                        <input type="number" id="weight-input" step="0.1" min="0" max="500" required>
                    </div>
                    <div class="form-group">
                        <label for="weight-date">Date</label>
                        <input type="date" id="weight-date" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label for="weight-note">Note (optionnel)</label>
                        <textarea id="weight-note" placeholder="Ex: Matin à jeun, après sport..." rows="3"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="secondary-btn cancel-btn">Annuler</button>
                        <button type="submit" class="primary-btn">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Fermer la modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Soumettre le formulaire
        modal.querySelector('#add-weight-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const weightValue = parseFloat(document.getElementById('weight-input').value);
            const date = document.getElementById('weight-date').value;
            const note = document.getElementById('weight-note').value;

            try {
                const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');

                const response = await fetch('/api/weight', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        weight: weightValue,
                        date: date,
                        note: note
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de l\'ajout de la pesée');
                }

                modal.remove();
                loadWeightData(); // Recharger les données
                
                // Afficher une notification de succès
                showNotification('Pesée enregistrée avec succès !', 'success');

            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de l\'ajout de la pesée', 'error');
            }
        });
    }

    // Modal pour éditer une pesée
    function showEditWeightModal(weightId, currentWeight, currentDate, currentNote) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Formater la date pour l'input
        const formattedDate = new Date(currentDate).toISOString().split('T')[0];
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Modifier la Pesée</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="edit-weight-form">
                    <div class="form-group">
                        <label for="edit-weight-input">Poids (kg) *</label>
                        <input type="number" id="edit-weight-input" step="0.1" min="0" max="500" value="${currentWeight}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-weight-date">Date</label>
                        <input type="date" id="edit-weight-date" value="${formattedDate}">
                    </div>
                    <div class="form-group">
                        <label for="edit-weight-note">Note (optionnel)</label>
                        <textarea id="edit-weight-note" placeholder="Ex: Matin à jeun, après sport..." rows="3">${currentNote}</textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="secondary-btn cancel-btn">Annuler</button>
                        <button type="submit" class="primary-btn">Enregistrer</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Fermer la modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Soumettre le formulaire
        modal.querySelector('#edit-weight-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const weightValue = parseFloat(document.getElementById('edit-weight-input').value);
            const date = document.getElementById('edit-weight-date').value;
            const note = document.getElementById('edit-weight-note').value;

            try {
                const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');

                const response = await fetch(`/api/weight/${weightId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        weight: weightValue,
                        date: date,
                        note: note
                    })
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la modification de la pesée');
                }

                modal.remove();
                loadWeightData(); // Recharger les données
                
                // Afficher une notification de succès
                showNotification('Pesée modifiée avec succès !', 'success');

            } catch (error) {
                console.error('Erreur:', error);
                showNotification('Erreur lors de la modification de la pesée', 'error');
            }
        });
    }

    // Supprimer une pesée
    async function deleteWeight(weightId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette pesée ?')) {
            return;
        }

        try {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');

            const response = await fetch(`/api/weight/${weightId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }

            loadWeightData(); // Recharger les données
            showNotification('Pesée supprimée avec succès !', 'success');

        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression de la pesée', 'error');
        }
    }

    // API publique du module
    return {
        init,
        loadChallenges,
        createChallenge,
        updateChallengeProgress,
        editChallenge,
        deleteChallenge,
        showSettingsModal,           // Ajout à l'API publique
        showProfileModal,            // Ajout à l'API publique
        showChangePasswordModal,     // Ajout à l'API publique
        showPhysiqueTab,             // Ajout de la fonction publique
        setupTabNavigation           // Ajout de la navigation
    };
})();

// Initialiser l'UI des défis au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    ChallengeUI.init();
    ChallengeUI.setupTabNavigation(); // Activer la navigation par onglets
    if (window.chartManager) {
        // Intégration possible avec le module chart-manager.js
    }
});