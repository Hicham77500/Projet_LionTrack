/**
 * Module de gestion de l'interface utilisateur pour les défis personnels
 * Thème : Lion Mindset - Rouge sombre
 */

if (typeof ChallengeUI === 'undefined') {
    const ChallengeUI = (function() {
        // Variables privées
        let challenges = [];
        let chartInstance = null;

        // Fonction d'initialisation
        function init() {
            // Ajouter les styles CSS nécessaires
            initStyles();

            // Essayer de charger les défis si l'utilisateur est connecté
            if (window.AuthUI && AuthUI.getToken()) {
                loadChallenges();
            }

            // Configuration des écouteurs d'événements
            setupEventListeners();
        }

        // Configuration des écouteurs d'événements
        function setupEventListeners() {
            // Bouton pour actualiser la liste des défis
            const reloadBtn = document.getElementById('reload-challenges-btn');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', loadChallenges);
            }

            // Bouton pour créer un nouveau défi
            const createBtn = document.getElementById('create-challenge-btn');
            if (createBtn) {
                createBtn.addEventListener('click', createChallenge);
            }
            
            // Ajouter l'écouteur d'événement pour le bouton de déconnexion
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    if (window.AuthUI) {
                        AuthUI.getToken(); // S'assurer que le module est initialisé
                        const authModule = Object.values(window.AuthUI).find(
                            val => typeof val === 'function' && val.toString().includes('localStorage.removeItem')
                        );
                        if (authModule) {
                            authModule();
                            return;
                        }
                    }
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
                
                profileContainer.addEventListener('mouseenter', function() {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                    dropdownMenu.classList.add('active');
                });
                
                dropdownMenu.addEventListener('mouseenter', function() {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = null;
                    }
                });
                
                const profileDropdown = document.querySelector('.profile-dropdown');
                if (profileDropdown) {
                    profileDropdown.addEventListener('mouseleave', function() {
                        timeoutId = setTimeout(() => {
                            dropdownMenu.classList.remove('active');
                        }, 800); // Délai de 800ms
                    });
                }
                
                // Reste du code existant pour les clics
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
        }

        // Charger les défis de l'utilisateur
        async function loadChallenges() {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            
            if (!token) {
                console.log("Aucun token trouvé, impossible de charger les défis");
                return;
            }
            
            try {
                showLoadingIndicator();
                
                const res = await fetch('/challenges', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                
                if (!res.ok) {
                    throw new Error("Erreur lors de la récupération des défis");
                }
                
                challenges = await res.json();
                
                renderChallenges();
                updateStatistics();
                updateProgressChart();
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', `${challenges.length} défis chargés`);
                }
            } catch (err) {
                console.error("Erreur:", err);
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

        // Crée la section des défis si elle n'existe pas
        function createChallengeSection() {
            const challengeSection = document.getElementById('challenge-section');
            if (!challengeSection) return;
            
            const content = `
                <div class="navbar">
                    <div class="navbar-logo">
                        <img src="https://cdn-icons-png.flaticon.com/512/3575/3575443.png" alt="Lion Mindset">
                        <h3>Lion Mindset</h3>
                    </div>
                    <div class="navbar-links">
                        <a href="#dashboard" class="navbar-link active"><i class="fas fa-tachometer-alt"></i> Tableau de bord</a>
                        <a href="#challenges" class="navbar-link"><i class="fas fa-trophy"></i> Mes défis</a>
                        <a href="#achievements" class="navbar-link"><i class="fas fa-medal"></i> Récompenses</a>
                    </div>
                    <div class="navbar-profile">
                        <div class="profile-dropdown">
                            <div class="profile-container">
                                <div class="profile-image">
                                    <img src="${localStorage.getItem('profilePhoto') || 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png'}" alt="Photo de profil">
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
                    <button id="reload-challenges-btn" class="icon-btn" title="Actualiser">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div id="challenge-list" class="challenge-grid"></div>
                <div class="create-challenge-form">
                    <h3><i class="fas fa-plus-circle"></i> Nouveau Défi</h3>
                    <div class="form-group">
                        <label for="challenge-title">Titre:</label>
                        <input type="text" id="challenge-title" placeholder="Nommez votre défi">
                    </div>
                    <div class="form-group">
                        <label for="challenge-description">Description:</label>
                        <textarea id="challenge-description" placeholder="Décrivez votre défi"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="challenge-progress">Progression initiale (%):</label>
                        <input type="number" id="challenge-progress" min="0" max="100" value="0">
                    </div>
                    <button id="create-challenge-btn" class="primary-btn">
                        <i class="fas fa-plus"></i> Créer le Défi
                    </button>
                </div>
            `;
            
            challengeSection.innerHTML = content;
            setupEventListeners();

            if (window.AuthUI && AuthUI.getCurrentUser()) {
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    const currentUser = AuthUI.getCurrentUser();
                    userDisplay.textContent = currentUser.username || currentUser.email;
                }
            }

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
            
            if (window.RankSystem) {
                RankSystem.updateRankDisplay(completedChallenges);
            }
        }

        // Met à jour le graphique de progression
        function updateProgressChart() {
            if (!challenges.length) return;
            
            const ctx = document.getElementById('progress-chart');
            if (!ctx) return;
            
            try {
                if (chartInstance) {
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

        // Crée un nouveau défi
        async function createChallenge() {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            if (!token) return;
            
            const title = document.getElementById('challenge-title').value;
            const description = document.getElementById('challenge-description').value;
            const progress = parseInt(document.getElementById('challenge-progress').value) || 0;
            
            if (!title) {
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', 'Le titre du défi est obligatoire');
                }
                return;
            }
            
            const createBtn = document.getElementById('create-challenge-btn');
            const originalText = createBtn.innerHTML;
            createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
            createBtn.disabled = true;
            
            try {
                const res = await fetch('/challenges', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ title, description, progress })
                });
                
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Erreur lors de la création du défi');
                }
                
                const data = await res.json();
                
                document.getElementById('challenge-title').value = '';
                document.getElementById('challenge-description').value = '';
                document.getElementById('challenge-progress').value = '0';
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', 'Défi créé avec succès');
                }
                
                await loadChallenges();
            } catch (err) {
                console.error('Erreur:', err);
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('error', err.message);
                }
            } finally {
                createBtn.innerHTML = originalText;
                createBtn.disabled = false;
            }
        }

        // Met à jour un défi existant
        async function editChallenge(challenge) {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            if (!token) return;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Modifier le Défi</h3>
                        <button class="close-btn">×</button>
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
                            <label for="edit-progress">Progression (%):</label>
                            <input type="number" id="edit-progress" min="0" max="100" value="${challenge.progress || 0}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-edit" class="secondary-btn">Annuler</button>
                        <button id="save-edit" class="primary-btn">Enregistrer</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const closeModal = () => {
                document.body.removeChild(modal);
            };
            
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
                    const res = await fetch(`/challenges/${challenge._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
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

        // Supprime un défi
        async function deleteChallenge(challengeId) {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            if (!token) return;
            
            const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce défi ?');
            if (!confirmed) return;
            
            try {
                const res = await fetch(`/challenges/${challengeId}`, {
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

        // Met à jour la progression d'un défi
        async function updateChallengeProgress(challengeId, currentProgress) {
            const token = window.AuthUI ? AuthUI.getToken() : localStorage.getItem('token');
            if (!token) return;
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-line"></i> Mettre à jour la progression</h3>
                        <button class="close-btn">×</button>
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
            slider.addEventListener('input', () => {
                valueDisplay.textContent = `${slider.value}%`;
            });
            
            const closeModal = () => {
                document.body.removeChild(modal);
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
                    const res = await fetch(`/challenges/${challengeId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ progress, note })
                    });
                    
                    if (!res.ok) {
                        const error = await res.json();
                        throw new Error(error.message || 'Erreur lors de la mise à jour de la progression');
                    }
                    
                    if (window.AuthUI && AuthUI.showNotification) {
                        AuthUI.showNotification('success', 'Progression mise à jour avec succès');
                    }
                    
                    if (progress === 100) {
                        if (window.AuthUI && AuthUI.showNotification) {
                            setTimeout(() => {
                                AuthUI.showNotification('success', '🏆 FÉLICITATIONS! Défi complété avec succès! 🏆');
                            }, 1000);
                        }
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

        // Ajoute les styles pour les modals
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
                        background-color: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        animation: fadeIn 0.3s ease;
                    }
                    .modal-content {
                        background-color: var(--card-bg);
                        border-radius: 10px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                        animation: slideIn 0.3s ease;
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
                        color: var(--accent-gold);
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
                        color: var(--text-color);
                        cursor: pointer;
                        padding: 0;
                        margin: 0;
                    }
                    .close-btn:hover {
                        color: var(--light-red);
                    }
                    .slider {
                        width: 100%;
                        height: 15px;
                        background: #333;
                        border-radius: 10px;
                        -webkit-appearance: none;
                        outline: none;
                    }
                    .slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                        background: var(--light-red);
                        cursor: pointer;
                    }
                    .slider::-moz-range-thumb {
                        width: 25px;
                        height: 25px;
                        border-radius: 50%;
                        background: var(--light-red);
                        cursor: pointer;
                    }
                    .progress-slider-container {
                        margin-bottom: 20px;
                    }
                    .progress-value {
                        text-align: center;
                        font-size: 24px;
                        color: var(--accent-gold);
                        margin-top: 10px;
                    }
                    .secondary-btn {
                        background-color: #333;
                    }
                    .secondary-btn:hover {
                        background-color: #444;
                    }
                    .primary-btn {
                        background-color: var(--medium-red);
                    }
                    .primary-btn:hover {
                        background-color: var(--light-red);
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideIn {
                        from { transform: translateY(-50px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(styleEl);
            }
        }

        // Ajoute les styles pour les cartes et le tableau de bord
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
                    @media (max-width: 768px) {
                        .stats-grid {
                            grid-template-columns: 1fr 1fr;
                        }
                        .challenge-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                `;
                document.head.appendChild(styleEl);
            }
        }

        // Initialise les styles
        function initStyles() {
            console.log('Styles chargés via fichiers CSS externes');
        }

        // Affiche la modal de profil
        function showProfileModal() {
            const currentUser = window.AuthUI ? AuthUI.getCurrentUser() : JSON.parse(localStorage.getItem('user')) || {};
            const username = currentUser.username || 'Utilisateur';
            const email = currentUser.email || '';
            const profilePhoto = localStorage.getItem('profilePhoto') || 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png';
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
                        <button class="close-btn">×</button>
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
                            <textarea id="profile-bio" placeholder="Parlez-nous de vous...">${localStorage.getItem('userBio') || ''}</textarea>
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
            
            modal.querySelector('#save-profile').addEventListener('click', async () => {
                const username = document.getElementById('profile-username').value;
                const bio = document.getElementById('profile-bio').value;
                const profilePhoto = imagePreview.src;
                
                localStorage.setItem('userBio', bio);
                localStorage.setItem('profilePhoto', profilePhoto);
                
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

        // Affiche la modal des paramètres
        function showSettingsModal() {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-cog"></i> Paramètres</h3>
                        <button class="close-btn">×</button>
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
                                <input type="text" id="settings-username" value="${AuthUI.getCurrentUser().username || ''}">
                            </div>
                            <div class="form-group">
                                <label for="settings-email">Email:</label>
                                <input type="email" id="settings-email" value="${AuthUI.getCurrentUser().email || ''}" disabled>
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
                document.body.removeChild(modal);
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
            
            modal.querySelector('#save-settings').addEventListener('click', () => {
                const username = document.getElementById('settings-username').value;
                
                const userDisplay = document.getElementById('user-display');
                if (userDisplay) userDisplay.textContent = username;
                
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.username = username;
                localStorage.setItem('user', JSON.stringify(user));
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', 'Paramètres enregistrés');
                }
                
                closeModal();
            });
        }

        // Affiche la modal de changement de mot de passe
        function showChangePasswordModal() {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-key"></i> Changer de mot de passe</h3>
                        <button class="close-btn">×</button>
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
                
                if (window.AuthUI && AuthUI.showNotification) {
                    AuthUI.showNotification('success', 'Mot de passe modifié avec succès');
                }
                
                closeModal();
            });
        }

        // API publique du module
        return {
            init,
            loadChallenges,
            createChallenge,
            updateChallengeProgress,
            editChallenge,
            deleteChallenge,
            showSettingsModal,
            showProfileModal,
            showChangePasswordModal
        };
    })();
}

// Initialisation au chargement du document
document.addEventListener('DOMContentLoaded', () => {
    ChallengeUI.init();
    
    // Signaler que ChallengeUI est chargé
    const event = new CustomEvent('ChallengeUILoaded');
    window.dispatchEvent(event);
    
    if (window.chartManager) {
        // Intégration possible avec chart-manager.js
    }
});