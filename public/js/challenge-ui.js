/**
 * Module de gestion de l'interface utilisateur pour les défis personnels
 * Thème : Lion Mindset - Rouge sombre
 */

const ChallengeUI = (function() {
    // Variables privées
    let challenges = [];
    let chartInstance = null;
    const DEFAULT_AVATAR = 'https://cdn.icon-icons.com/icons2/1378/PNG/512/avatardefault_92824.png';
    let activeView = 'dashboard';
    const challengesViewState = {
        search: '',
        status: 'all',
        sort: 'recent',
        view: 'grid'
    };

    // Helpers utilisateur / stockage par utilisateur

    function getFocusableElements(container) {
        if (!container) return [];
        const selectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        return Array.from(container.querySelectorAll(selectors.join(',')))
            .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    }

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

    function setupModalAccessibility(modal, modalContent, titleEl, bodyEl, closeModal) {
        if (!modal) return () => {};

        if (modalContent) {
            modalContent.setAttribute('role', 'dialog');
            modalContent.setAttribute('aria-modal', 'true');
        }

        if (titleEl) {
            const titleId = titleEl.id || `modal-title-${Date.now()}`;
            titleEl.id = titleId;
            if (modalContent) {
                modalContent.setAttribute('aria-labelledby', titleId);
            }
        }

        if (bodyEl) {
            const bodyId = bodyEl.id || `modal-body-${Date.now()}`;
            bodyEl.id = bodyId;
            if (modalContent) {
                modalContent.setAttribute('aria-describedby', bodyId);
            }
        }

        const focusables = getFocusableElements(modalContent || modal);
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                if (typeof closeModal === 'function') {
                    closeModal();
                }
                return;
            }

            if (event.key !== 'Tab') return;

            if (!focusables.length) {
                event.preventDefault();
                return;
            }

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        modal.addEventListener('keydown', onKeyDown);

        if (first && typeof first.focus === 'function') {
            setTimeout(() => first.focus(), 0);
        }

        return () => {
            modal.removeEventListener('keydown', onKeyDown);
        };
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

    function getRatingsKey(user) {
        return getUserKey(user, 'challengeRatings');
    }

    function getChallengeRatings(user) {
        const key = getRatingsKey(user);
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch (error) {
            return {};
        }
    }

    function setChallengeRatings(user, ratings) {
        const key = getRatingsKey(user);
        localStorage.setItem(key, JSON.stringify(ratings));
    }

    function getDefaultRating() {
        return { difficulty: 3, speed: 3, creativity: 3 };
    }

    function getChallengeRating(ratings, challengeId) {
        const stored = ratings[challengeId];
        if (!stored) return getDefaultRating();
        return {
            difficulty: Number(stored.difficulty) || 3,
            speed: Number(stored.speed) || 3,
            creativity: Number(stored.creativity) || 3
        };
    }

    function formatDate(value) {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function getChallengeStatus(progress) {
        return progress === 100 ? 'completed' : 'active';
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

            const goChallengesBtn = event.target.closest('#go-challenges-btn');
            if (goChallengesBtn) {
                showChallengesTab();
                loadChallenges();
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
                // Utiliser la fonction de déconnexion d'AuthUI
                if (window.AuthUI && typeof AuthUI.handleLogout === 'function') {
                    AuthUI.handleLogout();
                } else {
                    // Fallback: nettoyer manuellement
                    localStorage.clear();
                    window.location.reload();
                }
            });
        }

        // Ajouter les gestionnaires d'événements pour le menu profil
        setupProfileMenu();
    }

    // Fonction dédiée pour configurer le menu profil (peut être rappelée)
    function setupProfileMenu() {
        // Nettoyer les anciens listeners en utilisant le clonage simple
        const profileDropdown = document.querySelector('.profile-dropdown');
        if (!profileDropdown) return;
        
        // Vérifier que tous les éléments requis existent
        const profileContainer = profileDropdown.querySelector('.profile-container');
        const dropdownMenu = profileDropdown.querySelector('.dropdown-menu');
        
        if (!profileContainer || !dropdownMenu) return;
        
        let timeoutId;
        
        // Ouvrir le menu au survol de la photo/info
        profileContainer.addEventListener('mouseenter', function() {
            if (timeoutId) clearTimeout(timeoutId);
            dropdownMenu.classList.add('active');
        });
        
        // Garder le menu ouvert lors du survol du menu
        dropdownMenu.addEventListener('mouseenter', function() {
            if (timeoutId) clearTimeout(timeoutId);
        });
        
        // Fermer le menu au départ de la souris
        profileDropdown.addEventListener('mouseleave', function() {
            timeoutId = setTimeout(() => {
                dropdownMenu.classList.remove('active');
            }, 200);
        });
        
        // Gérer les clics sur les éléments du menu
        const profileItem = dropdownMenu.querySelector('.profile-item');
        const settingsItem = dropdownMenu.querySelector('.settings-item');
        const logoutItem = dropdownMenu.querySelector('.logout');
        
        if (profileItem) {
            profileItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdownMenu.classList.remove('active');
                setTimeout(() => showProfileModal(), 100);
            });
        }
        
        if (settingsItem) {
            settingsItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdownMenu.classList.remove('active');
                setTimeout(() => showSettingsModal(), 100);
            });
        }
        
        if (logoutItem) {
            logoutItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.AuthUI && typeof AuthUI.handleLogout === 'function') {
                    AuthUI.handleLogout();
                }
            });
        }
    }

    // Les autres boutons dynamiques sont ajoutés lors de la création des cartes

    // Fonction générique pour créer la navbar
    function buildNavbar(activeLink = '#dashboard') {
        const currentUser = getStoredUser();
        const profilePhoto = getProfilePhoto(currentUser);
        const rewardStats = computeRewardStats();
        const getActiveClass = (href) => (href === activeLink ? ' active' : '');
        const rankSummary = window.RankSystem
            ? RankSystem.getScoreSummary(rewardStats)
            : {
                rank: { name: 'Capitaine', icon: 'https://cdn-icons-png.flaticon.com/512/9241/9241203.png' }
            };

        return `
        <div class="navbar">
            <div class="navbar-logo">
                <img src="https://cdn-icons-png.flaticon.com/512/3575/3575443.png" alt="LionTrack">
                <h3>LionTrack</h3>
            </div>
            
            <div class="navbar-links">
                <a href="#dashboard" class="navbar-link${getActiveClass('#dashboard')}"><i class="fas fa-tachometer-alt"></i> Tableau de bord</a>
                <a href="#challenges" class="navbar-link${getActiveClass('#challenges')}"><i class="fas fa-trophy"></i> Mes défis</a>
                <a href="#physique" class="navbar-link${getActiveClass('#physique')}"><i class="fas fa-dumbbell"></i> Physique</a>
                <a href="#forum" class="navbar-link${getActiveClass('#forum')}"><i class="fas fa-comments"></i> Forum</a>
                <a href="#achievements" class="navbar-link rewards-link${getActiveClass('#achievements')}"><i class="fas fa-medal"></i> Récompenses</a>
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
                                <img src="${rankSummary.rank.icon}" class="rank-insignia" alt="Grade">
                                <span>${rankSummary.rank.name}</span>
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
        `;
    }

    // Charger les défis de l'utilisateur
    async function loadChallenges(retryAttempted = false) {
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
            
            // Si le token est invalide ou expiré (401), rediriger vers la connexion
            if (response.status === 401) {
                if (!retryAttempted && window.AuthUI && typeof AuthUI.refreshAccessToken === 'function') {
                    const refreshed = await AuthUI.refreshAccessToken();
                    if (refreshed) {
                        return loadChallenges(true);
                    }
                }
                console.log('Token expiré ou invalide, redirection vers la connexion');
                if (window.AuthUI && typeof AuthUI.clearSession === 'function' && typeof AuthUI.showLoginUI === 'function') {
                    AuthUI.clearSession();
                    AuthUI.showLoginUI();
                    AuthUI.showNotification('error', 'Votre session a expiré. Veuillez vous reconnecter.');
                } else {
                    localStorage.clear();
                    window.location.reload();
                }
                return;
            }
            
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

    function getFilteredChallenges() {
        const searchTerm = challengesViewState.search.trim().toLowerCase();
        const statusFilter = challengesViewState.status;

        let filtered = challenges.filter(challenge => {
            const title = (challenge.title || '').toLowerCase();
            const description = (challenge.description || '').toLowerCase();
            const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);

            const progress = challenge.progress || 0;
            const status = getChallengeStatus(progress);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        const sortMode = challengesViewState.sort;
        filtered = filtered.slice().sort((a, b) => {
            const aProgress = a.progress || 0;
            const bProgress = b.progress || 0;

            if (sortMode === 'progress-desc') return bProgress - aProgress;
            if (sortMode === 'progress-asc') return aProgress - bProgress;
            if (sortMode === 'title-asc') return (a.title || '').localeCompare(b.title || '');
            if (sortMode === 'title-desc') return (b.title || '').localeCompare(a.title || '');

            const aDate = new Date(a.startDate || a.createdAt || 0).getTime();
            const bDate = new Date(b.startDate || b.createdAt || 0).getTime();
            return bDate - aDate;
        });

        return filtered;
    }

    function applyChallengeListView() {
        const challengeList = document.getElementById('challenge-list');
        if (!challengeList) return;

        const isList = challengesViewState.view === 'list';
        challengeList.classList.toggle('is-list', isList);
        challengeList.classList.toggle('is-grid', !isList);
    }

    function updateChallengeCount(filteredCount, totalCount) {
        const countEl = document.getElementById('challenge-count');
        if (!countEl) return;

        if (filteredCount === totalCount) {
            countEl.textContent = `${filteredCount} défi${filteredCount > 1 ? 's' : ''}`;
        } else {
            countEl.textContent = `${filteredCount} / ${totalCount} défis`;
        }
    }

    // Affiche les défis dans l'interface
    function renderChallenges() {
        const challengeList = document.getElementById('challenge-list');
        if (!challengeList) {
            if (activeView === 'challenges') {
                buildChallengesView();
            } else if (activeView === 'dashboard') {
                createChallengeSection();
            } else {
                return;
            }
            const retryList = document.getElementById('challenge-list');
            if (!retryList) return;
            return renderChallenges();
        }
        
        challengeList.innerHTML = '';

        applyChallengeListView();

        if (challenges.length === 0) {
            challengeList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flag fa-3x"></i>
                    <h3>Aucun défi pour le moment</h3>
                    <p>Créez votre premier défi pour commencer votre parcours de lion.</p>
                </div>
            `;
            updateChallengeCount(0, 0);
            return;
        }

        const filteredChallenges = getFilteredChallenges();
        updateChallengeCount(filteredChallenges.length, challenges.length);

        if (filteredChallenges.length === 0) {
            challengeList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search fa-3x"></i>
                    <h3>Aucun résultat</h3>
                    <p>Ajustez vos filtres pour retrouver vos défis.</p>
                </div>
            `;
            return;
        }

        filteredChallenges.forEach(challenge => {
            const challengeCard = createChallengeCard(challenge);
            challengeList.appendChild(challengeCard);
        });
    }

    // Remplacez la fonction createChallengeSection par cette nouvelle version

function createChallengeSection() {
    const challengeSection = document.getElementById('challenge-section');
    if (!challengeSection) return;

    const content = buildNavbar('#dashboard') + `

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
            <h3><i class="fas fa-bolt"></i> Actions rapides</h3>
            <div>
                <button id="go-challenges-btn" class="primary-btn">
                    <i class="fas fa-trophy"></i> Gérer mes défis
                </button>
                <a href="#achievements" class="ghost-btn">
                    <i class="fas fa-medal"></i> Voir récompenses
                </a>
            </div>
        </div>
    `;
    
    challengeSection.innerHTML = content;
    setActiveNavLink('#dashboard');
    
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

    function buildChallengesView() {
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;

        const content = buildNavbar('#challenges') + `

            <div class="page-header challenges-header">
                <div class="page-title">
                    <span class="eyebrow">Espace perso</span>
                    <h2>Mes défis</h2>
                    <p class="page-subtitle">Gérez vos objectifs, priorisez vos efforts et gardez le cap.</p>
                </div>
                <div class="header-actions">
                    <button id="create-challenge-btn" class="primary-btn">
                        <i class="fas fa-plus"></i> Nouveau défi
                    </button>
                    <button id="reload-challenges-btn" class="icon-btn" title="Actualiser">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <div class="challenge-summary">
                <div class="summary-card">
                    <span class="summary-label">Total</span>
                    <span class="summary-value" id="stat-total">0</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">Actifs</span>
                    <span class="summary-value" id="stat-active">0</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">Complétés</span>
                    <span class="summary-value" id="stat-completed">0</span>
                </div>
                <div class="summary-progress-card">
                    <div class="summary-progress-header">
                        <span class="summary-label">Progression moyenne</span>
                        <span class="summary-value" id="summary-progress-value">0%</span>
                    </div>
                    <div class="summary-progress-bar">
                        <div class="summary-progress-fill" id="summary-progress-bar"></div>
                    </div>
                </div>
            </div>

            <div class="challenge-toolbar">
                <div class="toolbar-group">
                    <div class="input-with-icon">
                        <i class="fas fa-search"></i>
                        <input id="challenge-search" type="text" placeholder="Rechercher un défi">
                    </div>
                    <select id="challenge-status-filter">
                        <option value="all">Tous les défis</option>
                        <option value="active">Actifs</option>
                        <option value="completed">Completes</option>
                    </select>
                </div>
                <div class="toolbar-group">
                    <select id="challenge-sort">
                        <option value="recent">Les plus recents</option>
                        <option value="progress-desc">Progression (desc)</option>
                        <option value="progress-asc">Progression (asc)</option>
                        <option value="title-asc">Titre (A-Z)</option>
                        <option value="title-desc">Titre (Z-A)</option>
                    </select>
                    <div class="view-toggle">
                        <button type="button" class="view-btn" data-view="grid" title="Vue grille">
                            <i class="fas fa-th-large"></i>
                        </button>
                        <button type="button" class="view-btn" data-view="list" title="Vue liste">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                    <button id="challenge-clear-filters" class="ghost-btn" type="button">
                        Réinitialiser
                    </button>
                </div>
            </div>

            <div class="challenge-list-info">
                <span id="challenge-count">0 défis</span>
                <span class="challenge-hint"><i class="fas fa-lightbulb"></i> Astuce: triez par progression pour attaquer les défis en retard.</span>
            </div>

            <div id="challenge-list" class="challenge-grid is-grid"></div>
        `;

        challengeSection.innerHTML = content;
        setActiveNavLink('#challenges');

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

        setupProfileMenu();
        setupEventListeners();
        setupChallengesToolbar();
        applyChallengeListView();
    }

    function setupChallengesToolbar() {
        const searchInput = document.getElementById('challenge-search');
        if (searchInput) {
            searchInput.value = challengesViewState.search;
            searchInput.addEventListener('input', (event) => {
                challengesViewState.search = event.target.value;
                renderChallenges();
            });
        }

        const statusFilter = document.getElementById('challenge-status-filter');
        if (statusFilter) {
            statusFilter.value = challengesViewState.status;
            statusFilter.addEventListener('change', (event) => {
                challengesViewState.status = event.target.value;
                renderChallenges();
            });
        }

        const sortSelect = document.getElementById('challenge-sort');
        if (sortSelect) {
            sortSelect.value = challengesViewState.sort;
            sortSelect.addEventListener('change', (event) => {
                challengesViewState.sort = event.target.value;
                renderChallenges();
            });
        }

        const viewButtons = document.querySelectorAll('.view-btn');
        if (viewButtons.length) {
            viewButtons.forEach(button => {
                const mode = button.getAttribute('data-view');
                if (mode === challengesViewState.view) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }

                button.addEventListener('click', () => {
                    challengesViewState.view = mode;
                    viewButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    applyChallengeListView();
                });
            });
        }

        const clearFiltersBtn = document.getElementById('challenge-clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                challengesViewState.search = '';
                challengesViewState.status = 'all';
                challengesViewState.sort = 'recent';
                challengesViewState.view = 'grid';

                if (searchInput) searchInput.value = '';
                if (statusFilter) statusFilter.value = 'all';
                if (sortSelect) sortSelect.value = 'recent';

                const viewButtonsReset = document.querySelectorAll('.view-btn');
                viewButtonsReset.forEach(btn => btn.classList.remove('active'));
                const gridButton = document.querySelector('.view-btn[data-view="grid"]');
                if (gridButton) gridButton.classList.add('active');

                applyChallengeListView();
                renderChallenges();
            });
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

        const status = getChallengeStatus(progress);
        const statusLabel = status === 'completed' ? 'Complété' : 'En cours';
        const statusClass = status === 'completed' ? 'status-completed' : 'status-active';
        const startDate = formatDate(challenge.startDate || challenge.createdAt);
        const endDate = formatDate(challenge.endDate);
        const dateLabel = startDate || 'Date non définie';
        const endLabel = endDate || 'Sans date cible';

        const currentUser = getStoredUser();
        const ratings = getChallengeRatings(currentUser);
        const storedRating = ratings[challenge._id];
        const rating = getChallengeRating(ratings, challenge._id);
        const ratingAverage = ((rating.difficulty + rating.speed + rating.creativity) / 3).toFixed(1);
        const ratingLabel = storedRating ? `${ratingAverage}/5` : 'Non evalue';
        
        card.innerHTML = `
            <div class="challenge-main">
                <div class="challenge-header">
                    <div class="challenge-title-group">
                        <h4 class="challenge-title">${challenge.title}</h4>
                        <span class="challenge-pill ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="challenge-card-actions">
                        <button class="icon-btn rate-btn" title="Evaluer">
                            <i class="fas fa-star"></i>
                        </button>
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
            </div>
            <div class="challenge-meta">
                <div class="challenge-meta-row">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${dateLabel}</span>
                </div>
                <div class="challenge-meta-row">
                    <i class="fas fa-flag-checkered"></i>
                    <span>${endLabel}</span>
                </div>
                <div class="challenge-meta-row">
                    <i class="fas fa-star"></i>
                    <span class="challenge-rating-value">${ratingLabel}</span>
                </div>
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

        const rateBtn = card.querySelector('.rate-btn');
        if (rateBtn) {
            rateBtn.addEventListener('click', () => openChallengeRatingModal(challenge, card));
        }
        
        return card;
    }

    function openChallengeRatingModal(challenge, card) {
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });

        const currentUser = getStoredUser();
        const ratings = getChallengeRatings(currentUser);
        const rating = getChallengeRating(ratings, challenge._id);

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-star"></i> Evaluation du defi</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Difficulte: <span id="rating-difficulty-value">${rating.difficulty}</span></label>
                        <input type="range" id="rating-difficulty" class="slider" min="1" max="5" step="1" value="${rating.difficulty}">
                    </div>
                    <div class="form-group">
                        <label>Rapidite: <span id="rating-speed-value">${rating.speed}</span></label>
                        <input type="range" id="rating-speed" class="slider" min="1" max="5" step="1" value="${rating.speed}">
                    </div>
                    <div class="form-group">
                        <label>Creativite: <span id="rating-creativity-value">${rating.creativity}</span></label>
                        <input type="range" id="rating-creativity" class="slider" min="1" max="5" step="1" value="${rating.creativity}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-rating" class="secondary-btn">Annuler</button>
                    <button id="save-rating" class="primary-btn">Enregistrer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        };

        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('#cancel-rating').addEventListener('click', closeModal);

        const difficultySlider = modal.querySelector('#rating-difficulty');
        const speedSlider = modal.querySelector('#rating-speed');
        const creativitySlider = modal.querySelector('#rating-creativity');

        const difficultyValue = modal.querySelector('#rating-difficulty-value');
        const speedValue = modal.querySelector('#rating-speed-value');
        const creativityValue = modal.querySelector('#rating-creativity-value');

        if (difficultySlider && difficultyValue) {
            difficultySlider.addEventListener('input', () => {
                difficultyValue.textContent = difficultySlider.value;
            });
        }

        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', () => {
                speedValue.textContent = speedSlider.value;
            });
        }

        if (creativitySlider && creativityValue) {
            creativitySlider.addEventListener('input', () => {
                creativityValue.textContent = creativitySlider.value;
            });
        }

        modal.querySelector('#save-rating').addEventListener('click', () => {
            const updated = {
                difficulty: Number(difficultySlider.value),
                speed: Number(speedSlider.value),
                creativity: Number(creativitySlider.value)
            };

            ratings[challenge._id] = updated;
            setChallengeRatings(currentUser, ratings);

            if (card) {
                const average = ((updated.difficulty + updated.speed + updated.creativity) / 3).toFixed(1);
                const label = card.querySelector('.challenge-rating-value');
                if (label) label.textContent = `${average}/5`;
            }

            if (window.AuthUI && AuthUI.showNotification) {
                AuthUI.showNotification('success', 'Evaluation enregistree');
            }

            refreshRewardSummary();
            updateStatistics();
            closeModal();
        });
    }

    function computeRewardStats() {
        const currentUser = getStoredUser();
        const ratings = getChallengeRatings(currentUser);
        const completedList = challenges.filter(challenge => (challenge.progress || 0) >= 100);
        const totals = { difficulty: 0, speed: 0, creativity: 0 };

        completedList.forEach(challenge => {
            const rating = getChallengeRating(ratings, challenge._id);
            totals.difficulty += rating.difficulty;
            totals.speed += rating.speed;
            totals.creativity += rating.creativity;
        });

        const count = completedList.length;
        const averages = {
            difficulty: count ? totals.difficulty / count : 0,
            speed: count ? totals.speed / count : 0,
            creativity: count ? totals.creativity / count : 0
        };
        const ratingAverage = count ? (averages.difficulty + averages.speed + averages.creativity) / 3 : 0;

        return {
            completedChallenges: count,
            ratingAverage,
            difficultyAverage: averages.difficulty,
            speedAverage: averages.speed,
            creativityAverage: averages.creativity,
            completedList,
            ratings
        };
    }

    function buildAchievementsList(stats) {
        const completed = stats.completedChallenges;
        const difficulty = stats.difficultyAverage || 0;
        const speed = stats.speedAverage || 0;
        const creativity = stats.creativityAverage || 0;
        const overall = stats.ratingAverage || 0;

        return [
            {
                title: 'Premier defi termine',
                description: 'Valider un premier succes pour entrer dans le systeme.',
                unlocked: completed >= 1
            },
            {
                title: 'Section d\'assaut',
                description: 'Completer 5 defis pour marquer le rythme.',
                unlocked: completed >= 5
            },
            {
                title: 'Peloton solide',
                description: 'Completer 10 defis avec constance.',
                unlocked: completed >= 10
            },
            {
                title: 'Execution eclair',
                description: 'Rapidite moyenne de 4/5 ou plus.',
                unlocked: speed >= 4 && completed >= 1
            },
            {
                title: 'Creativite remarquable',
                description: 'Creativite moyenne de 4/5 ou plus.',
                unlocked: creativity >= 4 && completed >= 1
            },
            {
                title: 'Mission a haute difficulte',
                description: 'Difficulte moyenne de 4/5 ou plus.',
                unlocked: difficulty >= 4 && completed >= 1
            },
            {
                title: 'Trinite d\'excellence',
                description: 'Atteindre 4.5/5 en moyenne globale.',
                unlocked: overall >= 4.5 && completed >= 1
            }
        ];
    }

    function getRewardInsight(stats) {
        if (!stats.completedChallenges) {
            return 'Terminez un premier defi pour lancer votre progression.';
        }

        if (stats.ratingAverage >= 4.5) {
            return 'Performance elite: vos defis sont executes avec precision.';
        }

        if (stats.ratingAverage >= 3.5) {
            return 'Bon rythme: visez une note plus elevee pour grimper.';
        }

        return 'Chaque evaluation compte. Ajustez vos defis pour monter en grade.';
    }

    function renderRankLadder(rankSummary) {
        if (!window.RankSystem) return;
        const ladder = document.getElementById('rank-ladder-list');
        if (!ladder) return;

        const rows = RankSystem.getRanks().map(rank => {
            const isActive = rankSummary.rank && rankSummary.rank.name === rank.name;
            const isUnlocked = rankSummary.score >= rank.minScore;
            const rowClass = `${isActive ? 'active' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`.trim();
            return `
                <div class="rank-row ${rowClass}">
                    <div class="rank-row-left">
                        <img src="${rank.icon}" class="rank-icon" alt="Grade">
                        <span>${rank.name}</span>
                    </div>
                    <span class="rank-score">${rank.minScore} pts</span>
                </div>
            `;
        }).join('');

        ladder.innerHTML = rows;
    }

    function refreshRewardSummary() {
        const rewardStats = computeRewardStats();
        const rankSummary = window.RankSystem
            ? RankSystem.getScoreSummary(rewardStats)
            : null;

        const scoreEl = document.getElementById('reward-score');
        if (scoreEl && rankSummary) {
            scoreEl.textContent = `${rankSummary.score} pts`;
        }

        const difficultyEl = document.getElementById('reward-difficulty');
        if (difficultyEl) difficultyEl.textContent = `${rewardStats.difficultyAverage.toFixed(1)}/5`;

        const speedEl = document.getElementById('reward-speed');
        if (speedEl) speedEl.textContent = `${rewardStats.speedAverage.toFixed(1)}/5`;

        const creativityEl = document.getElementById('reward-creativity');
        if (creativityEl) creativityEl.textContent = `${rewardStats.creativityAverage.toFixed(1)}/5`;

        const insightEl = document.getElementById('reward-insight');
        if (insightEl) insightEl.textContent = getRewardInsight(rewardStats);

        const rankNameEl = document.getElementById('reward-rank-name');
        if (rankNameEl && rankSummary) {
            rankNameEl.textContent = rankSummary.rank.name;
        }

        const rankSubEl = document.getElementById('reward-rank-sub');
        if (rankSubEl) {
            rankSubEl.textContent = `${rewardStats.completedChallenges} defis termines`;
        }

        const nextEl = document.getElementById('rank-next-label');
        if (nextEl && rankSummary) {
            nextEl.textContent = rankSummary.nextRank
                ? `Prochain grade: ${rankSummary.nextRank.name}`
                : 'Sommet atteint';
        }

        const progressFill = document.getElementById('rank-progress-fill');
        if (progressFill && rankSummary) {
            progressFill.style.width = `${rankSummary.progress}%`;
        }

        const achievementsGrid = document.querySelector('.achievement-grid');
        if (achievementsGrid) {
            const achievements = buildAchievementsList(rewardStats);
            achievementsGrid.innerHTML = achievements.map(item => {
                const statusClass = item.unlocked ? 'achievement-card unlocked' : 'achievement-card locked';
                const statusIcon = item.unlocked ? 'fa-medal' : 'fa-lock';
                return `
                    <div class="${statusClass}">
                        <div class="achievement-icon"><i class="fas ${statusIcon}"></i></div>
                        <div class="achievement-info">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (rankSummary) {
            renderRankLadder(rankSummary);
        }

        if (window.RankSystem) {
            RankSystem.updateRankDisplay(rewardStats);
        }
    }

    function attachRatingHandlers() {
        const ratingCards = document.querySelectorAll('.rating-card');
        if (!ratingCards.length) return;

        const currentUser = getStoredUser();
        const ratings = getChallengeRatings(currentUser);

        ratingCards.forEach(card => {
            const challengeId = card.dataset.challengeId;
            const sliders = card.querySelectorAll('.rating-slider');

            sliders.forEach(slider => {
                slider.addEventListener('input', () => {
                    const field = slider.dataset.field;
                    const value = Number(slider.value);
                    const rating = getChallengeRating(ratings, challengeId);

                    rating[field] = value;
                    ratings[challengeId] = rating;
                    setChallengeRatings(currentUser, ratings);

                    const valueEl = card.querySelector(`.rating-value[data-field="${field}"]`);
                    if (valueEl) valueEl.textContent = value;

                    const average = ((rating.difficulty + rating.speed + rating.creativity) / 3).toFixed(1);
                    const badge = card.querySelector('.rating-badge');
                    if (badge) badge.textContent = `${average}/5`;

                    refreshRewardSummary();
                });
            });
        });
    }

    // Met à jour les statistiques
    function updateStatistics() {
        if (challenges.length === 0) {
            const totalEl = document.getElementById('stat-total');
            const activeEl = document.getElementById('stat-active');
            const completedEl = document.getElementById('stat-completed');
            const progressEl = document.getElementById('stat-progress');
            const progressValueEl = document.getElementById('summary-progress-value');
            const progressBarEl = document.getElementById('summary-progress-bar');

            if (totalEl) totalEl.textContent = '0';
            if (activeEl) activeEl.textContent = '0';
            if (completedEl) completedEl.textContent = '0';
            if (progressEl) progressEl.textContent = '0%';
            if (progressValueEl) progressValueEl.textContent = '0%';
            if (progressBarEl) progressBarEl.style.width = '0%';
            return;
        }
        
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
        const totalEl = document.getElementById('stat-total');
        const activeEl = document.getElementById('stat-active');
        const completedEl = document.getElementById('stat-completed');
        const progressEl = document.getElementById('stat-progress');
        const progressValueEl = document.getElementById('summary-progress-value');
        const progressBarEl = document.getElementById('summary-progress-bar');

        if (totalEl) totalEl.textContent = totalChallenges;
        if (activeEl) activeEl.textContent = activeChallenges;
        if (completedEl) completedEl.textContent = completedChallenges;
        if (progressEl) progressEl.textContent = `${averageProgress}%`;
        if (progressValueEl) progressValueEl.textContent = `${averageProgress}%`;
        if (progressBarEl) progressBarEl.style.width = `${averageProgress}%`;
        
        const rewardStats = computeRewardStats();
        if (window.RankSystem) {
            RankSystem.updateRankDisplay(rewardStats);
        }
    }

    // Remplacez la fonction updateProgressChart par celle-ci pour déboguer
    function updateProgressChart() {
        if (!challenges.length) return;
        
        const ctx = document.getElementById('progress-chart');
        if (!ctx) return;

        if (chartInstance) {
            const currentCanvas = chartInstance.canvas;
            if (!currentCanvas || !document.body.contains(currentCanvas) || currentCanvas !== ctx) {
                chartInstance.destroy();
                chartInstance = null;
            }
        }
        
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
                                ticks: { color: '#f0f0f0' }
                            }
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
        // Fermer les modals existantes avant d'ouvrir une nouvelle
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });
        
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
    // Fermer les modals existantes avant d'ouvrir une nouvelle
    const existingModals = document.querySelectorAll('.modal');
    existingModals.forEach(modal => {
        document.body.removeChild(modal);
    });
    
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
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
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

                .challenge-title-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
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
                
                .challenge-card-actions {
                    display: flex;
                    gap: 5px;
                }

                .challenge-main {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .challenge-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 12px;
                    color: #aaa;
                    border-top: 1px solid #333;
                    padding-top: 12px;
                }

                .challenge-meta-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .challenge-pill {
                    font-size: 11px;
                    text-transform: uppercase;
                    padding: 4px 8px;
                    border-radius: 999px;
                    letter-spacing: 0.6px;
                    background: rgba(170, 0, 0, 0.2);
                    color: var(--accent-gold);
                }

                .challenge-pill.status-completed {
                    background: rgba(0, 170, 0, 0.2);
                    color: #8ee08e;
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

                .page-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .challenges-header {
                    margin: 20px 0 10px;
                    padding: 20px;
                    background: linear-gradient(120deg, rgba(136, 0, 0, 0.35), rgba(30, 30, 30, 0.9));
                    border-radius: 14px;
                    border: 1px solid rgba(212, 175, 55, 0.15);
                }

                .page-title h2 {
                    margin: 6px 0 8px;
                }

                .eyebrow {
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-size: 12px;
                    color: var(--accent-gold);
                }

                .page-subtitle {
                    color: #c7c7c7;
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .challenge-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 16px;
                    margin: 20px 0;
                }

                .summary-card,
                .summary-progress-card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
                }

                .summary-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #aaa;
                }

                .summary-value {
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--accent-gold);
                }

                .summary-progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .summary-progress-bar {
                    height: 10px;
                    background: #2b2b2b;
                    border-radius: 999px;
                    overflow: hidden;
                }

                .summary-progress-fill {
                    height: 100%;
                    width: 0;
                    background: linear-gradient(90deg, #aa0000, #d4af37);
                    transition: width 0.3s ease;
                }

                .challenge-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: wrap;
                    padding: 14px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .challenge-toolbar input,
                .challenge-toolbar select {
                    margin: 0;
                }

                .toolbar-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .input-with-icon {
                    position: relative;
                }

                .input-with-icon i {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #888;
                }

                .input-with-icon input {
                    padding-left: 36px;
                    min-width: 220px;
                }

                .view-toggle {
                    display: flex;
                    border-radius: 8px;
                    border: 1px solid #333;
                    overflow: hidden;
                    background: #1c1c1c;
                }

                .view-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    padding: 8px 10px;
                    cursor: pointer;
                }

                .view-btn.active {
                    background: rgba(170, 0, 0, 0.4);
                    color: #fff;
                }

                .ghost-btn {
                    background: transparent;
                    color: #ddd;
                    border: 1px solid #444;
                    padding: 8px 14px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                }

                .ghost-btn:hover {
                    border-color: var(--accent-gold);
                    color: var(--accent-gold);
                }

                .challenge-list-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 12px 0;
                    color: #aaa;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                .challenge-hint {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #888;
                    font-size: 13px;
                }

                .challenge-grid.is-list {
                    grid-template-columns: 1fr;
                }

                .challenge-grid.is-list .challenge-card {
                    display: flex;
                    flex-direction: row;
                    gap: 20px;
                    align-items: stretch;
                }

                .challenge-grid.is-list .challenge-main {
                    flex: 1;
                }

                .challenge-grid.is-list .challenge-meta {
                    min-width: 200px;
                    border-left: 1px solid #333;
                    border-top: none;
                    padding-left: 16px;
                    padding-top: 0;
                    justify-content: center;
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

                    .challenge-grid.is-list .challenge-card {
                        flex-direction: column;
                    }

                    .challenge-grid.is-list .challenge-meta {
                        border-left: none;
                        border-top: 1px solid #333;
                        padding-left: 0;
                        padding-top: 12px;
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
        // Fermer les modals existantes avant d'ouvrir une nouvelle
        if (document.querySelector('.modal')) {
            document.body.removeChild(document.querySelector('.modal'));
        }
        
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
        const previousFocus = document.activeElement;
        const bodyOverflow = document.body.style.overflow;
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
        
        let cleanupAccessibility = () => {};
        const closeModal = () => {
            cleanupAccessibility();
            document.body.style.overflow = bodyOverflow;
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus();
            }
        };

        document.body.appendChild(modal);

        document.body.style.overflow = 'hidden';

        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = modal.querySelector('.modal-header h3');
        const modalBody = modal.querySelector('.modal-body');
        cleanupAccessibility = setupModalAccessibility(
            modal,
            modalContent,
            modalTitle,
            modalBody,
            closeModal
        );
        
        // Gérer le changement de photo de profil
        const photoInput = modal.querySelector('#profile-photo-input');
        const changePhotoBtn = modal.querySelector('#change-photo-btn');
        const imagePreview = modal.querySelector('#profile-image-preview');

        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.setAttribute('aria-label', 'Fermer la fenetre de profil');
        }
        if (changePhotoBtn) {
            changePhotoBtn.setAttribute('aria-label', 'Changer la photo de profil');
        }
        
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
        
        modal.addEventListener('click', (evt) => {
            if (evt.target === modal) {
                closeModal();
            }
        });

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
            // Fermer les modals existantes avant d'ouvrir une nouvelle
        if (document.querySelector('.modal')) {
            document.body.removeChild(document.querySelector('.modal'));
        }
        
        const currentUser = getStoredUser();
    const modal = document.createElement('div');
    const previousFocus = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
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
    
    let cleanupAccessibility = () => {};
    const closeModal = () => {
        cleanupAccessibility();
        document.body.style.overflow = bodyOverflow;
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
    };

    document.body.appendChild(modal);

    document.body.style.overflow = 'hidden';

    const modalContent = modal.querySelector('.modal-content');
    const modalTitle = modal.querySelector('.modal-header h3');
    const modalBody = modal.querySelector('.modal-body');
    cleanupAccessibility = setupModalAccessibility(
        modal,
        modalContent,
        modalTitle,
        modalBody,
        closeModal
    );
    
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.setAttribute('aria-label', 'Fermer la fenetre des parametres');
    }

    modal.addEventListener('click', (evt) => {
        if (evt.target === modal) {
            closeModal();
        }
    });

    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('#cancel-settings').addEventListener('click', closeModal);
    
    modal.querySelector('#logout-btn-settings').addEventListener('click', () => {
        if (window.AuthUI && typeof AuthUI.handleLogout === 'function') {
            AuthUI.handleLogout();
        } else {
            localStorage.clear();
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
        // Fermer les modals existantes avant d'ouvrir une nouvelle
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });
        
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
            
            // Gérer l'affichage selon l'onglet
            const href = navLink.getAttribute('href');
            
            if (href === '#dashboard') {
                showDashboard();
            } else if (href === '#challenges') {
                showChallengesTab();
            } else if (href === '#achievements') {
                showAchievementsTab();
            } else if (href === '#physique') {
                showPhysiqueTab();
            } else if (href === '#forum') {
                showForumTab();
            }
        });
    }

    function setActiveNavLink(href) {
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.navbar-link[href="${href}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Afficher le tableau de bord (vue actuelle)
    function showDashboard() {
        activeView = 'dashboard';
        createChallengeSection();
        loadChallenges();
    }

    function showChallengesTab() {
        activeView = 'challenges';
        buildChallengesView();
        loadChallenges();
    }

    function showAchievementsTab() {
        activeView = 'achievements';
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;

        const currentUser = getStoredUser();
        const profilePhoto = getProfilePhoto(currentUser);
        const rewardStats = computeRewardStats();
        const rankSummary = window.RankSystem
            ? RankSystem.getScoreSummary(rewardStats)
            : {
                score: 0,
                rank: { name: 'Capitaine', icon: 'https://cdn-icons-png.flaticon.com/512/9241/9241203.png' },
                nextRank: null,
                progress: 0
            };

        const formattedDifficulty = rewardStats.difficultyAverage.toFixed(1);
        const formattedSpeed = rewardStats.speedAverage.toFixed(1);
        const formattedCreativity = rewardStats.creativityAverage.toFixed(1);

        const rankList = window.RankSystem ? RankSystem.getRanks() : [];
        const ladderRows = rankList.map(rank => {
            const isActive = rankSummary.rank && rankSummary.rank.name === rank.name;
            const isUnlocked = rankSummary.score >= rank.minScore;
            const rowClass = `${isActive ? 'active' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`.trim();
            return `
                <div class="rank-row ${rowClass}">
                    <div class="rank-row-left">
                        <img src="${rank.icon}" class="rank-icon" alt="Grade">
                        <span>${rank.name}</span>
                    </div>
                    <span class="rank-score">${rank.minScore} pts</span>
                </div>
            `;
        }).join('');

        const adminRoles = window.RankSystem && typeof RankSystem.getAdminRoles === 'function'
            ? RankSystem.getAdminRoles()
            : [];
        const adminRolesMarkup = adminRoles.map(role => {
            const isActive = rankSummary.adminRole && rankSummary.adminRole.id === role.id;
            return `
                <div class="admin-role-card ${isActive ? 'active' : 'inactive'}">
                    <div class="admin-role-badge"><i class="${role.icon}"></i></div>
                    <h4>${role.title}</h4>
                    <span class="admin-role-type">${role.type}</span>
                </div>
            `;
        }).join('');

        const achievements = buildAchievementsList(rewardStats);
        const achievementsMarkup = achievements.map(item => {
            const statusClass = item.unlocked ? 'achievement-card unlocked' : 'achievement-card locked';
            const statusIcon = item.unlocked ? 'fa-medal' : 'fa-lock';
            return `
                <div class="${statusClass}">
                    <div class="achievement-icon"><i class="fas ${statusIcon}"></i></div>
                    <div class="achievement-info">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                </div>
            `;
        }).join('');

        const ratingCards = rewardStats.completedList.map(challenge => {
            const rating = getChallengeRating(rewardStats.ratings, challenge._id);
            const average = ((rating.difficulty + rating.speed + rating.creativity) / 3).toFixed(1);
            const startDate = formatDate(challenge.startDate || challenge.createdAt) || 'Date inconnue';

            return `
                <div class="rating-card" data-challenge-id="${challenge._id}">
                    <div class="rating-header">
                        <div>
                            <h4>${challenge.title}</h4>
                            <span>${startDate}</span>
                        </div>
                        <div class="rating-badge">${average}/5</div>
                    </div>
                    <div class="rating-controls">
                        <label>Difficulte <span class="rating-value" data-field="difficulty">${rating.difficulty}</span></label>
                        <input class="rating-slider" type="range" min="1" max="5" step="1" value="${rating.difficulty}" data-field="difficulty">
                        <label>Rapidite <span class="rating-value" data-field="speed">${rating.speed}</span></label>
                        <input class="rating-slider" type="range" min="1" max="5" step="1" value="${rating.speed}" data-field="speed">
                        <label>Creativite <span class="rating-value" data-field="creativity">${rating.creativity}</span></label>
                        <input class="rating-slider" type="range" min="1" max="5" step="1" value="${rating.creativity}" data-field="creativity">
                    </div>
                </div>
            `;
        }).join('');

        const ratingSection = rewardStats.completedList.length
            ? ratingCards
            : `
                <div class="empty-state">
                    <i class="fas fa-flag fa-3x"></i>
                    <h3>Aucun défi terminé</h3>
                    <p>Terminez un défi pour débloquer l'évaluation et les récompenses.</p>
                </div>
            `;

        const content = buildNavbar('#achievements') + `

            <div class="page-header achievements-header">
                <div class="page-title">
                    <span class="eyebrow">Espace de prestige</span>
                    <h2>Récompenses & grades</h2>
                    <p class="page-subtitle">Évaluez vos défis et progressez dans la hiérarchie.</p>
                </div>
                <div class="header-actions">
                    <div class="reward-score">
                        <span class="summary-label">Score global</span>
                        <span class="summary-value" id="reward-score">${rankSummary.score} pts</span>
                    </div>
                </div>
            </div>

            <div class="reward-grid">
                <div class="reward-card highlight">
                    <span class="summary-label">Grade actuel</span>
                    <div class="reward-rank">
                        <img src="${rankSummary.rank.icon}" alt="Grade">
                        <div>
                            <h3 id="reward-rank-name">${rankSummary.rank.name}</h3>
                            <p id="reward-rank-sub">${rewardStats.completedChallenges} défis terminés</p>
                        </div>
                    </div>
                    <div class="rank-progress">
                        <div class="rank-progress-bar">
                            <div id="rank-progress-fill" style="width: ${rankSummary.progress}%"></div>
                        </div>
                        <span id="rank-next-label">${rankSummary.nextRank ? `Prochain grade: ${rankSummary.nextRank.name}` : 'Sommet atteint'}</span>
                    </div>
                </div>
                <div class="reward-card">
                    <span class="summary-label">Evaluation moyenne</span>
                    <div class="reward-metrics">
                        <div>
                            <span>Difficulte</span>
                            <strong id="reward-difficulty">${formattedDifficulty}/5</strong>
                        </div>
                        <div>
                            <span>Rapidite</span>
                            <strong id="reward-speed">${formattedSpeed}/5</strong>
                        </div>
                        <div>
                            <span>Creativite</span>
                            <strong id="reward-creativity">${formattedCreativity}/5</strong>
                        </div>
                    </div>
                </div>
                <div class="reward-card">
                    <span class="summary-label">Analyse rapide</span>
                    <p class="reward-insight" id="reward-insight">${getRewardInsight(rewardStats)}</p>
                </div>
            </div>

                ${adminRolesMarkup ? `
                <div class="admin-roles-section">
                    <div class="admin-roles-header">
                        <h3><i class="fas fa-crown"></i> Roles administratifs</h3>
                        <span class="admin-roles-note">Positions speciales de gestion.</span>
                    </div>
                    <div class="admin-roles-grid">
                        ${adminRolesMarkup}
                    </div>
                </div>
                ` : ''}

            <div class="rank-ladder">
                <div class="rank-ladder-header">
                    <h3><i class="fas fa-shield"></i> Grille des grades</h3>
                    <span class="rank-ladder-note">Basee sur difficulte, rapidite et creativite.</span>
                </div>
                <div class="rank-ladder-list" id="rank-ladder-list">
                    ${ladderRows}
                </div>
            </div>

            <div class="achievement-board">
                <div class="achievement-board-header">
                    <h3><i class="fas fa-medal"></i> Récompenses débloquées</h3>
                    <span>${rewardStats.completedChallenges} défis terminés</span>
                </div>
                <div class="achievement-grid">
                    ${achievementsMarkup}
                </div>
            </div>

            <div class="rating-section">
                <div class="rating-header-row">
                    <h3><i class="fas fa-clipboard-check"></i> Évaluation des défis</h3>
                    <span>Notez chaque defi termine pour affiner votre grade.</span>
                </div>
                <div class="rating-grid" id="rating-grid">
                    ${ratingSection}
                </div>
            </div>
        `;

        challengeSection.innerHTML = content;

        setActiveNavLink('#achievements');

        if (window.AuthUI && AuthUI.getCurrentUser()) {
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                const user = AuthUI.getCurrentUser();
                userDisplay.textContent = user.username || user.email;
            }
        }

        if (window.AuthUI && typeof AuthUI.setupEventListeners === 'function') {
            AuthUI.setupEventListeners();
        }

        setupProfileMenu();
        attachRatingHandlers();

        if (window.RankSystem) {
            RankSystem.updateRankDisplay(rewardStats);
        }
    }

    // Afficher l'onglet Physique
    function showPhysiqueTab() {
        activeView = 'physique';
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;
        
        const currentUser = getStoredUser();
        const profilePhoto = getProfilePhoto(currentUser);
        const rewardStats = computeRewardStats();
        const rankSummary = window.RankSystem
            ? RankSystem.getScoreSummary(rewardStats)
            : {
                rank: { name: 'Capitaine', icon: 'https://cdn-icons-png.flaticon.com/512/9241/9241203.png' }
            };

        const content = buildNavbar('#physique') + `

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
        setActiveNavLink('#physique');
        
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

        // Réattacher le menu profil (important pour les changements d'onglet)
        setupProfileMenu();

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

    // Calculer la tendance (pente) basée sur les derniers poids
    function calculateTrend(weights) {
        if (weights.length < 2) return 0;
        const n = weights.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        
        for (let i = 0; i < n; i++) {
            const x = i;
            const y = weights[i].weight;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }
        
        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    // Générer les données de prédiction
    function generatePredictionData(lastWeight, trend, days) {
        const predictions = [];
        let currentDate = new Date(lastWeight.date);
        let currentWeight = lastWeight.weight;
        
        for (let i = 1; i <= days; i++) {
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
            currentWeight += trend;
            
            predictions.push({
                date: new Date(currentDate),
                weight: currentWeight
            });
        }
        
        return predictions;
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

        // Calculer la tendance et générer les prédictions
        const recentWeights = weights.slice(-7);
        const trend = calculateTrend(recentWeights);
        const predictions = generatePredictionData(weights[weights.length - 1], trend, 7);
        
        // Préparer les labels et données de prédiction
        const predictionLabels = predictions.map(p => {
            const day = p.date.getDate().toString().padStart(2, '0');
            const month = (p.date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month}`;
        });
        const predictionValues = predictions.map(p => p.weight);
        
        // Créer les datasets avec null pour maintenir l'alignement
        const actualData = [...data, ...Array(7).fill(null)];
        const predictionData = [...Array(data.length).fill(null), predictions[0].weight, ...predictionValues];
        
        // Déterminer la couleur de prédiction
        const predictionColor = trend < 0 ? '#51cf66' : '#ff6b6b';
        const predictionBgColor = trend < 0 ? 'rgba(81, 207, 102, 0.1)' : 'rgba(255, 107, 107, 0.1)';

        window.weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...labels, ...predictionLabels],
                datasets: [
                    {
                        label: 'Poids (kg)',
                        data: actualData,
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
                    },
                    {
                        label: `Prédiction 7j (${trend < 0 ? '📉 Perte' : '📈 Gain'}: ${Math.abs(trend).toFixed(2)} kg/j)`,
                        data: predictionData,
                        borderColor: predictionColor,
                        backgroundColor: predictionBgColor,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: predictionColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1,
                        borderDash: [5, 5]
                    }
                ]
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
                                return context[0].label;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (value === null) return '';
                                return `${label}: ${value.toFixed(1)} kg`;
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
                    <div class="challenge-card-actions">
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
        // Fermer les modals existantes avant d'ouvrir une nouvelle
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });
        
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

    function showForumTab() {
        activeView = 'forum';
        const challengeSection = document.getElementById('challenge-section');
        if (!challengeSection) return;

        // Charger le contenu du forum depuis forum.js
        const content = buildNavbar('#forum') + `
            <div id="forum-app-container"></div>
        `;

        challengeSection.innerHTML = content;
        setActiveNavLink('#forum');

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

        setupProfileMenu();

        // Initialiser le Forum depuis le fichier forum.js
        if (window.ForumApp && typeof ForumApp.init === 'function') {
            const container = document.getElementById('forum-app-container');
            if (container) {
                ForumApp.init(container);
            }
        } else {
            console.warn('ForumApp non disponible. Vérifiez que forum.js est chargé.');
            const container = document.getElementById('forum-app-container');
            if (container) {
                container.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: var(--text-color);">
                        <p><i class="fas fa-exclamation-triangle" style="color: var(--light-red);"></i></p>
                        <p>Le forum n'est pas disponible. Forum.js doit être chargé.</p>
                    </div>
                `;
            }
        }
    }

    // Modal pour éditer une pesée
    function showEditWeightModal(weightId, currentWeight, currentDate, currentNote) {
        // Fermer les modals existantes avant d'ouvrir une nouvelle
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            document.body.removeChild(modal);
        });
        
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