/**
 * Forum Module - Gestion complète du forum
 * Inclut: chargement, recherche, création, modération, authentification
 */

const ForumApp = {
  // État
  state: {
    subjects: [],
    categories: [],
    currentUser: null,
    currentPage: 1,
    itemsPerPage: 10,
    currentSort: 'recent',
    currentView: 'list',
    searchQuery: '',
    selectedCategory: 'all',
    isLoading: false,
    error: null,
  },

  // Configuration API
  api: {
    baseURL: '',
    endpoints: {
      subjects: '/api/forum/subjects',
      categories: '/api/forum/categories',
      trending: '/api/forum/trending',
      auth: '/api/auth',
      user: '/api/user/profile',
    },
  },

  /**
   * Initialisation
   */
  init(containerElement) {
    // Si un conteneur est fourni, générer le HTML du forum
    if (containerElement) {
      this.initInContainer(containerElement);
    } else {
      // Initialisation normale (standalone)
      this.cacheElements();
      this.attachEventListeners();
      this.loadUserProfile();
      this.loadForum();
    }
  },

  /**
   * Initialise le forum dans un conteneur spécifique
   */
  initInContainer(container) {
    // Générer le HTML du forum
    const forumHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px; padding: 20px;">
        <!-- Header simplifié -->
        <div style="display: flex; gap: 15px; align-items: center; padding: 15px; background: var(--card-bg); border-radius: 8px; border-left: 3px solid var(--accent-gold);">
          <div style="flex: 1;">
            <h3 style="margin: 0; color: var(--accent-gold);"><i class="fas fa-comments"></i> Forum LionTrack</h3>
            <p style="margin: 5px 0 0 0; color: var(--text-color); opacity: 0.8; font-size: 0.9em;">Discutez et partagez vos progrès</p>
          </div>
          <div style="flex: 1;">
            <input 
              type="search" 
              class="search-input" 
              id="searchInput" 
              placeholder="Rechercher des sujets..."
              aria-label="Rechercher des sujets"
              style="width: 100%; padding: 8px 12px; background: var(--dark-bg); border: 1px solid var(--accent-gold); border-radius: 4px; color: var(--text-color);"
            >
          </div>
        </div>

        <!-- Contenu principal -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
          <!-- États -->
          <div class="state-container">
            <!-- Loading -->
            <div class="state loading-state" id="loadingState">
              <div class="spinner"></div>
              <p>Chargement des sujets...</p>
            </div>

            <!-- Erreur -->
            <div class="state error-state hidden" id="errorState">
              <i class="fas fa-exclamation-triangle"></i>
              <p id="errorMessage">Une erreur s'est produite</p>
              <button class="retry-btn" id="retryBtn">Réessayer</button>
            </div>

            <!-- Pas de résultats -->
            <div class="state no-results-state hidden" id="noResultsState">
              <i class="fas fa-inbox"></i>
              <p>Aucun sujet trouvé</p>
              <p class="empty-hint">Soyez le premier à créer un sujet !</p>
            </div>

            <!-- Liste de sujets -->
            <div class="subjects-list" id="subjectsList" role="list">
              <!-- Sujets chargés dynamiquement -->
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" id="pagination">
            <button class="pagination-btn" id="prevPage" disabled>
              <i class="fas fa-chevron-left"></i> Précédent
            </button>
            <span class="page-info" id="pageInfo">Page 1</span>
            <button class="pagination-btn" id="nextPage">
              Suivant <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Formulaire nouveau sujet (Floating) -->
      <div class="new-subject-fab" id="newSubjectFab" role="button" tabindex="0" aria-label="Nouveau sujet">
        <i class="fas fa-plus"></i>
      </div>

      <!-- Modal nouveau sujet -->
      <div class="modal hidden" id="newSubjectModal">
        <div class="modal-overlay" id="modalOverlay"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nouveau sujet</h2>
            <button class="modal-close" id="modalClose" aria-label="Fermer">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form class="new-subject-form" id="newSubjectForm">
            <div class="form-group">
              <label for="subjectCategory">Catégorie *</label>
              <select id="subjectCategory" required>
                <option value="">Choisir une catégorie...</option>
              </select>
            </div>

            <div class="form-group">
              <label for="subjectTitle">Titre du sujet *</label>
              <input 
                type="text" 
                id="subjectTitle" 
                placeholder="Un titre clair et descriptif..."
                maxlength="200"
                required
              >
              <small id="titleCounter">0/200</small>
            </div>

            <div class="form-group">
              <label for="subjectMessage">Message *</label>
              <textarea 
                id="subjectMessage"
                placeholder="Décrivez votre sujet..."
                rows="6"
                maxlength="5000"
                required
              ></textarea>
              <small id="messageCounter">0/5000</small>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" id="subjectNotifications">
                Recevoir les notifications de ce sujet
              </label>
            </div>

            <div class="form-actions">
              <button type="reset" class="btn-secondary">Annuler</button>
              <button type="submit" class="btn-primary">Publier le sujet</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal détails sujet -->
      <div class="modal hidden" id="subjectDetailModal">
        <div class="modal-overlay" id="detailModalOverlay"></div>
        <div class="modal-content modal-detail">
          <div class="modal-header">
            <h2 id="detailTitle"></h2>
            <button class="modal-close" id="detailModalClose" aria-label="Fermer">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body" id="detailContent">
            <!-- Contenu du sujet -->
          </div>

          <div class="modal-actions" id="detailModalActions">
            <!-- Actions modérateur si applicable -->
          </div>
        </div>
      </div>

      <!-- Notifications toast -->
      <div class="notifications-container" id="notificationsContainer"></div>
    `;

    // Injecter le HTML dans le conteneur
    container.innerHTML = forumHTML;

    // Initialiser normalement après l'injection
    this.cacheElements();
    this.attachEventListeners();
    this.loadUserProfile();
    this.loadForum();
  },

  /**
   * Cache tous les éléments DOM
   */
  cacheElements() {
    this.DOM = {
      // Header
      searchInput: document.getElementById('searchInput'),
      notificationsBtn: document.getElementById('notificationsBtn'),
      notificationBadge: document.getElementById('notificationBadge'),
      profileContainer: document.getElementById('profileContainer'),
      profileAvatar: document.getElementById('profileAvatar'),
      profileName: document.getElementById('profileName'),
      profileGrade: document.getElementById('profileGrade'),
      profileDropdown: document.getElementById('profileDropdown'),
      logoutBtn: document.getElementById('logoutBtn'),
      sidebarToggle: document.getElementById('sidebarToggle'),

      // Sidebar
      forumSidebar: document.getElementById('forumSidebar'),
      sidebarClose: document.getElementById('sidebarClose'),
      categoriesList: document.getElementById('categoriesList'),
      trendingList: document.getElementById('trendingList'),

      // Main
      subjectsList: document.getElementById('subjectsList'),
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      noResultsState: document.getElementById('noResultsState'),
      errorMessage: document.getElementById('errorMessage'),
      retryBtn: document.getElementById('retryBtn'),
      viewBtns: document.querySelectorAll('.view-btn'),
      filterBtns: document.querySelectorAll('.filter-btn'),
      categoryItems: document.querySelectorAll('.category-item'),

      // Pagination
      pagination: document.getElementById('pagination'),
      prevPage: document.getElementById('prevPage'),
      nextPage: document.getElementById('nextPage'),
      pageInfo: document.getElementById('pageInfo'),

      // FAB & Modal
      newSubjectFab: document.getElementById('newSubjectFab'),
      newSubjectModal: document.getElementById('newSubjectModal'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalClose: document.getElementById('modalClose'),
      newSubjectForm: document.getElementById('newSubjectForm'),
      subjectCategory: document.getElementById('subjectCategory'),
      subjectTitle: document.getElementById('subjectTitle'),
      subjectMessage: document.getElementById('subjectMessage'),
      subjectNotifications: document.getElementById('subjectNotifications'),
      titleCounter: document.getElementById('titleCounter'),
      messageCounter: document.getElementById('messageCounter'),

      // Detail Modal
      subjectDetailModal: document.getElementById('subjectDetailModal'),
      detailModalOverlay: document.getElementById('detailModalOverlay'),
      detailModalClose: document.getElementById('detailModalClose'),
      detailTitle: document.getElementById('detailTitle'),
      detailContent: document.getElementById('detailContent'),
      detailModalActions: document.getElementById('detailModalActions'),

      // Notifications
      notificationsContainer: document.getElementById('notificationsContainer'),
    };
  },

  /**
   * Attache les event listeners
   */
  attachEventListeners() {
    // Sidebar
    this.DOM.sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
    this.DOM.sidebarClose?.addEventListener('click', () => this.closeSidebar());
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.forum-sidebar') && this.DOM.sidebarToggle && e.target !== this.DOM.sidebarToggle) {
        this.closeSidebar();
      }
    });

    // Profile dropdown
    this.DOM.profileContainer?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleProfileDropdown();
    });
    document.addEventListener('click', () => this.closeProfileDropdown());
    this.DOM.logoutBtn?.addEventListener('click', () => this.logout());

    // Search
    this.DOM.searchInput?.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value;
      this.state.currentPage = 1;
      this.filterAndDisplaySubjects();
    });

    // View controls
    this.DOM.viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.view-btn').classList.add('active');
        this.state.currentView = e.target.closest('.view-btn').dataset.view;
        this.displaySubjects();
      });
    });

    // Filtres
    this.DOM.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.closest('.filter-btn').classList.add('active');
        this.state.currentSort = e.target.closest('.filter-btn').dataset.sort;
        this.state.currentPage = 1;
        this.filterAndDisplaySubjects();
      });
    });

    // Catégories
    document.addEventListener('click', (e) => {
      if (e.target.closest('.category-item')) {
        e.preventDefault();
        document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        e.target.closest('.category-item').classList.add('active');
        this.state.selectedCategory = e.target.closest('.category-item').dataset.category;
        this.state.currentPage = 1;
        this.filterAndDisplaySubjects();
      }
    });

    // New subject FAB
    this.DOM.newSubjectFab?.addEventListener('click', () => this.openNewSubjectModal());

    // Modal
    this.DOM.modalClose?.addEventListener('click', () => this.closeNewSubjectModal());
    this.DOM.modalOverlay?.addEventListener('click', () => this.closeNewSubjectModal());
    this.DOM.detailModalClose?.addEventListener('click', () => this.closeDetailModal());
    this.DOM.detailModalOverlay?.addEventListener('click', () => this.closeDetailModal());

    // Form
    this.DOM.subjectTitle?.addEventListener('input', (e) => {
      this.DOM.titleCounter.textContent = `${e.target.value.length}/200`;
    });

    this.DOM.subjectMessage?.addEventListener('input', (e) => {
      this.DOM.messageCounter.textContent = `${e.target.value.length}/5000`;
    });

    this.DOM.newSubjectForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createNewSubject();
    });

    // Retry
    this.DOM.retryBtn?.addEventListener('click', () => this.loadForum());

    // Pagination
    this.DOM.prevPage?.addEventListener('click', () => this.previousPage());
    this.DOM.nextPage?.addEventListener('click', () => this.nextPage());
  },

  /**
   * Charge le profil utilisateur
   */
  async loadUserProfile() {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.status === 401) {
        this.redirectToLogin();
        return;
      }

      if (response.ok) {
        const user = await response.json();
        this.state.currentUser = user;
        this.updateProfileUI(user);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  },

  /**
   * Met à jour l'UI du profil
   */
  updateProfileUI(user) {
    if (this.DOM.profileName) this.DOM.profileName.textContent = user.username;
    if (this.DOM.profileAvatar) {
      this.DOM.profileAvatar.src = user.profileImage || 'https://via.placeholder.com/32?text=USER';
    }
    if (this.DOM.profileGrade) {
      this.DOM.profileGrade.textContent = this.getGradeName(user.role);
      this.DOM.profileGrade.className = `grade-badge grade-${this.getGradeClass(user.role)}`;
    }
  },

  /**
   * Charge le forum (sujets et catégories)
   */
  async loadForum() {
    this.setState({ isLoading: true, error: null });
    this.showLoadingState();

    try {
      // Paralléliser les requêtes
      const [subjectsRes, categoriesRes] = await Promise.all([
        fetch(this.api.endpoints.subjects),
        fetch(this.api.endpoints.categories),
      ]);

      if (!subjectsRes.ok || !categoriesRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const subjects = await subjectsRes.json();
      const categories = await categoriesRes.json();

      this.setState({
        subjects: subjects || [],
        categories: categories || [],
        isLoading: false,
      });

      this.populateCategories();
      this.loadTrendingSubjects();
      this.filterAndDisplaySubjects();
    } catch (error) {
      console.error('Erreur forum:', error);
      this.setState({
        error: 'Erreur lors du chargement du forum',
        isLoading: false,
      });
      this.showErrorState(error.message);
    }
  },

  /**
   * Peuple les catégories en sidebar
   */
  populateCategories() {
    const listHTML = this.state.categories
      .map(
        (cat) => `
      <li>
        <a href="#" class="category-item" data-category="${cat.id}">
          <i class="fas fa-folder"></i> ${cat.name}
          <span class="category-count">${cat.count || 0}</span>
        </a>
      </li>
    `
      )
      .join('');

    if (this.DOM.categoriesList) {
      this.DOM.categoriesList.innerHTML = `
        <li>
          <a href="#" class="category-item active" data-category="all">
            <i class="fas fa-star"></i> Tous les sujets
            <span class="category-count">${this.state.subjects.length}</span>
          </a>
        </li>
        ${listHTML}
      `;
    }

    // Peuple le select du form
    const selectHTML = this.state.categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join('');

    if (this.DOM.subjectCategory) {
      this.DOM.subjectCategory.innerHTML = `<option value="">Choisir une catégorie...</option>${selectHTML}`;
    }
  },

  /**
   * Charge les sujets tendances
   */
  async loadTrendingSubjects() {
    try {
      // Simule les top sujets (les 5 plus consultés)
      const trending = this.state.subjects
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

      const trendingHTML = trending
        .map(
          (subject) => `
        <div class="trending-item" data-subject-id="${subject.id}">
          <h4 class="trending-title">${subject.title}</h4>
          <div class="trending-stat">
            <i class="fas fa-eye"></i> ${subject.views || 0} vues
          </div>
        </div>
      `
        )
        .join('');

      if (this.DOM.trendingList) {
        this.DOM.trendingList.innerHTML = trendingHTML || '<p style="padding: 10px; color: rgba(240,240,240,0.6);">Aucun sujet encore</p>';
      }

      // Event listeners pour trending items
      document.querySelectorAll('.trending-item').forEach((item) => {
        item.addEventListener('click', () => {
          const subjectId = item.dataset.subjectId;
          const subject = this.state.subjects.find((s) => s.id === subjectId);
          if (subject) this.openDetailModal(subject);
        });
      });
    } catch (error) {
      console.error('Erreur tendances:', error);
    }
  },

  /**
   * Filtre et affiche les sujets
   */
  filterAndDisplaySubjects() {
    let filtered = [...this.state.subjects];

    // Filtre par recherche
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.excerpt.toLowerCase().includes(query) ||
          s.author?.username?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (this.state.selectedCategory !== 'all') {
      filtered = filtered.filter((s) => s.categoryId === this.state.selectedCategory);
    }

    // Filtre par sort
    filtered = this.sortSubjects(filtered, this.state.currentSort);

    // Affiche le bon état
    if (filtered.length === 0) {
      this.showNoResultsState();
      return;
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / this.state.itemsPerPage);
    const start = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const paginatedSubjects = filtered.slice(start, start + this.state.itemsPerPage);

    this.displaySubjects(paginatedSubjects, totalPages);
  },

  /**
   * Trie les sujets
   */
  sortSubjects(subjects, sortType) {
    const sorted = [...subjects];

    switch (sortType) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      case 'popular':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));

      case 'unanswered':
        return sorted.sort((a, b) => (a.replies || 0) - (b.replies || 0));

      default:
        return sorted;
    }
  },

  /**
   * Affiche les sujets
   */
  displaySubjects(subjects = this.state.subjects, totalPages = 1) {
    const listHTML = subjects
      .map((subject) => this.createSubjectItemHTML(subject))
      .join('');

    if (this.DOM.subjectsList) {
      this.DOM.subjectsList.className = `subjects-list ${this.state.currentView}`;
      this.DOM.subjectsList.innerHTML = listHTML;

      // Event listeners
      document.querySelectorAll('.subject-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.action-btn')) {
            const subjectId = item.dataset.subjectId;
            const subject = this.state.subjects.find((s) => s.id === subjectId);
            if (subject) this.openDetailModal(subject);
          }
        });
      });
    }

    // Actions modérateur
    document.querySelectorAll('.action-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subjectId = btn.closest('.subject-item').dataset.subjectId;
        const action = btn.dataset.action;
        this.handleModeratorAction(subjectId, action);
      });
    });

    this.updatePagination(totalPages);
    this.hideLoadingState();
  },

  /**
   * Crée le HTML d'un sujet
   */
  createSubjectItemHTML(subject) {
    const isMod = this.isUserModerator();
    const isAuthor = this.state.currentUser?.id === subject.author?.id;
    const userAvatar = subject.author?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(subject.author?.username || 'User') + '&background=880000&color=fff';

    return `
      <div class="subject-item ${subject.pinned ? 'pinned' : ''}" data-subject-id="${subject.id}" role="listitem">
        <div class="subject-avatar-col">
          <img src="${userAvatar}" 
               alt="Avatar de ${subject.author?.username}" 
               class="subject-avatar"
               onerror="this.src='https://ui-avatars.com/api/?name=User&background=880000&color=fff'">
        </div>

        <div class="subject-content">
          <div class="subject-header">
            <h3 class="subject-title">
              ${subject.pinned ? '<i class="fas fa-thumbtack pinned-icon"></i>' : ''}
              ${subject.locked ? '<i class="fas fa-lock locked-icon"></i>' : ''}
              ${this.escapeHtml(subject.title)}
            </h3>
            <span class="category-badge">
              <i class="fas fa-folder-open"></i>
              ${this.getCategoryName(subject.categoryId)}
            </span>
          </div>

          <div class="subject-meta">
            <div class="author-info">
              <span class="author-name">${subject.author?.username || 'Anonyme'}</span>
              <span class="grade-badge grade-${this.getGradeClass(subject.author?.role)}">
                ${this.getGradeName(subject.author?.role)}
              </span>
            </div>
            <span class="subject-date">${new Date(subject.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>

          <p class="subject-excerpt">${this.escapeHtml(subject.excerpt)}</p>

          <div class="subject-footer">
            <div class="subject-stat">
              <i class="fas fa-heart"></i>
              <span>${subject.likes || 0}</span>
            </div>
            <div class="subject-stat">
              <i class="fas fa-eye"></i>
              <span>${subject.views || 0}</span>
            </div>
            <div class="subject-stat">
              <i class="fas fa-comments"></i>
              <span>${subject.replies || 0}</span>
            </div>
            <div class="last-activity">
              <span>Dernier message</span><br>
              <span class="time-ago">${this.timeAgo(subject.lastActivityAt || subject.createdAt)}</span>
            </div>
          </div>
        </div>

        <div class="subject-actions">
          ${subject.pinned ? '<button class="action-btn unpinned" data-action="unpin" title="Désépingler"><i class="fas fa-thumbtack"></i></button>' : 
            isMod ? '<button class="action-btn pin" data-action="pin" title="Épingler"><i class="fas fa-thumbtack"></i></button>' : ''}
          ${isMod || isAuthor ? '<button class="action-btn delete" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>' : ''}
          ${isMod ? `<button class="action-btn ${subject.locked ? 'unlock' : 'lock'}" data-action="${subject.locked ? 'unlock' : 'lock'}" title="${subject.locked ? 'Déverrouiller' : 'Verrouiller'}"><i class="fas fa-${subject.locked ? 'lock-open' : 'lock'}"></i></button>` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Gère les actions modérateur
   */
  async handleModeratorAction(subjectId, action) {
    if (!this.isUserModerator() && action !== 'delete') return;

    const subject = this.state.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    try {
      const endpoint = `${this.api.endpoints.subjects}/${subjectId}/${action}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Action échouée');

      // Met à jour l'état local
      switch (action) {
        case 'pin':
          subject.pinned = true;
          break;
        case 'unpin':
          subject.pinned = false;
          break;
        case 'lock':
          subject.locked = true;
          break;
        case 'unlock':
          subject.locked = false;
          break;
        case 'delete':
          this.state.subjects = this.state.subjects.filter((s) => s.id !== subjectId);
          break;
      }

      this.showNotification('success', `Action effectuée avec succès`);
      this.filterAndDisplaySubjects();
    } catch (error) {
      console.error('Erreur action modérateur:', error);
      this.showNotification('error', 'Erreur lors de l\'action');
    }
  },

  /**
   * Ouvre le modal de nouveau sujet
   */
  openNewSubjectModal() {
    if (!this.state.currentUser) {
      this.showNotification('error', 'Veuillez vous connecter pour créer un sujet');
      return;
    }
    if (this.DOM.newSubjectModal) {
      this.DOM.newSubjectModal.classList.remove('hidden');
      this.DOM.subjectTitle?.focus();
    }
  },

  /**
   * Ferme le modal de nouveau sujet
   */
  closeNewSubjectModal() {
    if (this.DOM.newSubjectModal) {
      this.DOM.newSubjectModal.classList.add('hidden');
      this.DOM.newSubjectForm?.reset();
      if (this.DOM.titleCounter) this.DOM.titleCounter.textContent = '0/200';
      if (this.DOM.messageCounter) this.DOM.messageCounter.textContent = '0/5000';
    }
  },

  /**
   * Crée un nouveau sujet
   */
  async createNewSubject() {
    const title = this.DOM.subjectTitle?.value.trim();
    const message = this.DOM.subjectMessage?.value.trim();
    const categoryId = this.DOM.subjectCategory?.value;

    if (!title || !message || !categoryId) {
      this.showNotification('error', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch(this.api.endpoints.subjects, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          excerpt: message.substring(0, 200),
          message,
          categoryId,
          subscribeToNotifications: this.DOM.subjectNotifications?.checked || false,
        }),
      });

      if (!response.ok) throw new Error('Erreur création sujet');

      const newSubject = await response.json();
      this.state.subjects.unshift(newSubject);

      this.showNotification('success', 'Sujet créé avec succès !');
      this.closeNewSubjectModal();
      this.state.currentPage = 1;
      this.filterAndDisplaySubjects();
    } catch (error) {
      console.error('Erreur création sujet:', error);
      this.showNotification('error', 'Erreur lors de la création du sujet');
    }
  },

  /**
   * Ouvre le modal de détail d'un sujet
   */
  openDetailModal(subject) {
    if (this.DOM.detailTitle) this.DOM.detailTitle.textContent = subject.title;

    // Charger les réponses
    this.loadReplies(subject.id).then(replies => {
      const userAvatar = subject.author?.profileImage || this.state.currentUser?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(subject.author?.username || 'User') + '&background=880000&color=fff';
      
      const content = `
        <div class="subject-detail">
          <div class="detail-meta">
            <div class="detail-author">
              <img src="${userAvatar}" alt="Avatar de ${subject.author?.username}" class="detail-avatar">
              <div>
                <div class="detail-author-name">${subject.author?.username || 'Utilisateur'}</div>
                <span class="grade-badge grade-${this.getGradeClass(subject.author?.role)}">
                  ${this.getGradeName(subject.author?.role)}
                </span>
                <div class="detail-date">
                  <i class="fas fa-calendar"></i> ${new Date(subject.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div class="detail-stats">
              <div class="stat-item"><i class="fas fa-eye"></i> <span>${subject.views || 0}</span> vues</div>
              <div class="stat-item"><i class="fas fa-comments"></i> <span>${(replies?.length || 0)}</span> réponses</div>
            </div>
          </div>

          <div class="detail-body">
            <p>${this.escapeHtml(subject.message || subject.excerpt)}</p>
          </div>

          ${subject.tags && subject.tags.length > 0 ? `
          <div class="detail-tags">
            ${subject.tags.map((tag) => `<span class="tag">#${tag}</span>`).join('')}
          </div>
          ` : ''}

          <!-- Interactions principales du post -->
          <div class="post-interactions">
            <button class="interaction-btn like-btn ${subject.likedByCurrentUser ? 'liked' : ''}" onclick="ForumApp.toggleSubjectLike('${subject.id}')" title="J'aime">
              <i class="fas fa-heart"></i>
              <span class="interaction-count">${subject.likes || 0}</span>
              <span class="interaction-label">J'aime</span>
            </button>
            <button class="interaction-btn comment-btn" onclick="document.getElementById('newReplyContent')?.focus()" title="Répondre">
              <i class="fas fa-comment"></i>
              <span class="interaction-count">${(replies?.length || 0)}</span>
              <span class="interaction-label">Répondre</span>
            </button>
            <button class="interaction-btn bookmark-btn ${subject.bookmarked ? 'bookmarked' : ''}" onclick="ForumApp.toggleBookmark('${subject.id}')" title="Ajouter aux favoris">
              <i class="fas fa-bookmark"></i>
              <span class="interaction-label">Favoris</span>
            </button>
            <button class="interaction-btn share-btn" onclick="ForumApp.shareSubject('${subject.id}')" title="Partager">
              <i class="fas fa-share-alt"></i>
              <span class="interaction-label">Partager</span>
            </button>
          </div>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);">

          <div class="replies-section">
            <h4 style="color: var(--accent-gold); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-comments"></i> ${replies?.length || 0} Réponses
            </h4>
            
            ${replies && replies.length > 0 ? replies.map(reply => {
              const replyAvatar = reply.author?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(reply.author?.username || 'User') + '&background=880000&color=fff';
              return `
              <div class="reply-item" data-reply-id="${reply.id}">
                <div class="reply-author">
                  <img src="${replyAvatar}" alt="Avatar de ${reply.author?.username}" class="reply-avatar">
                  <div class="reply-author-info">
                    <span class="reply-author-name">${reply.author?.username || 'Utilisateur'}</span>
                    <span class="grade-badge grade-${this.getGradeClass(reply.author?.role)}">
                      ${this.getGradeName(reply.author?.role)}
                    </span>
                  </div>
                  <span class="reply-date">${this.timeAgo(reply.createdAt)}</span>
                </div>
                <div class="reply-content">${this.escapeHtml(reply.content)}</div>
                <div class="reply-actions">
                  <button class="reply-action-btn like-btn ${reply.likedByCurrentUser ? 'liked' : ''}" onclick="ForumApp.toggleLike('${reply.id}', '${reply.author?.id || ''}')">
                    <i class="fas fa-heart"></i> <span>${reply.likes || 0}</span>
                  </button>
                  <button class="reply-action-btn helpful-btn ${reply.markedAsHelpful ? 'helpful' : ''}" onclick="ForumApp.markAsHelpful('${reply.id}', '${reply.author?.id || ''}')">
                    <i class="fas fa-check-circle"></i> Utile <span>(${reply.helpfulCount || 0})</span>
                  </button>
                  ${this.state.currentUser?.id === reply.author?.id || this.isUserModerator() ? `
                  <button class="reply-action-btn delete-btn" onclick="ForumApp.deleteReply('${reply.id}', '${subject.id}')">
                    <i class="fas fa-trash"></i> Supprimer
                  </button>
                  ` : ''}
                </div>
              </div>
            `}).join('') : '<div class="no-replies"><i class="fas fa-comments"></i><p>Aucune réponse pour le moment</p><p class="hint">Soyez le premier à partager votre expérience !</p></div>'}

            <div class="new-reply-form">
              <h5 style="color: var(--text-color); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-reply"></i> Votre réponse
              </h5>
              <div class="reply-input-container">
                <img src="${this.state.currentUser?.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.state.currentUser?.username || 'You') + '&background=880000&color=fff'}" alt="Votre avatar" class="reply-user-avatar">
                <textarea id="newReplyContent" placeholder="Partagez votre expérience, donnez des conseils..." rows="4"></textarea>
              </div>
              <button class="btn-primary submit-reply-btn" onclick="ForumApp.submitReply('${subject.id}')">
                <i class="fas fa-paper-plane"></i> Envoyer la réponse
              </button>
            </div>
          </div>
        </div>
      `;

      if (this.DOM.detailContent) this.DOM.detailContent.innerHTML = content;
    });

    // Actions modérateur
    const actions = `
      ${this.isUserModerator() || this.state.currentUser?.id === subject.author?.id ? 
        `<button class="btn-secondary" onclick="ForumApp.handleModeratorAction('${subject.id}', 'delete')">
          <i class="fas fa-trash"></i> Supprimer
        </button>` : ''}
    `;

    if (this.DOM.detailModalActions) this.DOM.detailModalActions.innerHTML = actions;

    if (this.DOM.subjectDetailModal) {
      this.DOM.subjectDetailModal.classList.remove('hidden');
      this.DOM.subjectDetailModal.dataset.subjectId = subject.id; // Sauvegarder l'ID
    }

    // Incrémente les vues
    subject.views = (subject.views || 0) + 1;
  },

  /**
   * Ferme le modal de détail
   */
  closeDetailModal() {
    if (this.DOM.subjectDetailModal) {
      this.DOM.subjectDetailModal.classList.add('hidden');
    }
  },

  /**
   * Navigation vers la page du sujet
   */
  goToSubjectPage(subjectId) {
    // Redirection vers la page détail du sujet
    window.location.href = `subject.html?id=${subjectId}`;
  },

  /**
   * Affiche l'état de chargement
   */
  showLoadingState() {
    this.DOM.loadingState?.classList.remove('hidden');
    this.DOM.errorState?.classList.add('hidden');
    this.DOM.noResultsState?.classList.add('hidden');
    if (this.DOM.subjectsList) this.DOM.subjectsList.innerHTML = '';
  },

  /**
   * Cache l'état de chargement
   */
  hideLoadingState() {
    this.DOM.loadingState?.classList.add('hidden');
    this.DOM.errorState?.classList.add('hidden');
    this.DOM.noResultsState?.classList.add('hidden');
  },

  /**
   * Affiche l'état d'erreur
   */
  showErrorState(message) {
    this.DOM.loadingState?.classList.add('hidden');
    this.DOM.noResultsState?.classList.add('hidden');
    this.DOM.errorState?.classList.remove('hidden');
    if (this.DOM.errorMessage) this.DOM.errorMessage.textContent = message;
    if (this.DOM.subjectsList) this.DOM.subjectsList.innerHTML = '';
  },

  /**
   * Affiche l'état pas de résultats
   */
  showNoResultsState() {
    this.DOM.loadingState?.classList.add('hidden');
    this.DOM.errorState?.classList.add('hidden');
    this.DOM.noResultsState?.classList.remove('hidden');
    if (this.DOM.subjectsList) this.DOM.subjectsList.innerHTML = '';
  },

  /**
   * Met à jour la pagination
   */
  updatePagination(totalPages) {
    if (this.DOM.pageInfo) {
      this.DOM.pageInfo.textContent = `Page ${this.state.currentPage}/${totalPages}`;
    }

    if (this.DOM.prevPage) {
      this.DOM.prevPage.disabled = this.state.currentPage === 1;
    }

    if (this.DOM.nextPage) {
      this.DOM.nextPage.disabled = this.state.currentPage === totalPages;
    }
  },

  /**
   * Page précédente
   */
  previousPage() {
    if (this.state.currentPage > 1) {
      this.state.currentPage--;
      this.filterAndDisplaySubjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  /**
   * Page suivante
   */
  nextPage() {
    const totalPages = Math.ceil(
      this.state.subjects.filter((s) => this.matchesFilters(s)).length / this.state.itemsPerPage
    );
    if (this.state.currentPage < totalPages) {
      this.state.currentPage++;
      this.filterAndDisplaySubjects();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  /**
   * Toggle sidebar mobile
   */
  toggleSidebar() {
    if (this.DOM.forumSidebar) {
      this.DOM.forumSidebar.classList.toggle('active');
    }
  },

  /**
   * Ferme la sidebar
   */
  closeSidebar() {
    if (this.DOM.forumSidebar) {
      this.DOM.forumSidebar.classList.remove('active');
    }
  },

  /**
   * Toggle profile dropdown
   */
  toggleProfileDropdown() {
    if (this.DOM.profileDropdown) {
      this.DOM.profileDropdown.classList.toggle('active');
    }
  },

  /**
   * Ferme le profile dropdown
   */
  closeProfileDropdown() {
    if (this.DOM.profileDropdown) {
      this.DOM.profileDropdown.classList.remove('active');
    }
  },

  /**
   * Déconnexion
   */
  async logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  },

  /**
   * Affiche une notification toast
   */
  showNotification(type, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    if (this.DOM.notificationsContainer) {
      this.DOM.notificationsContainer.appendChild(toast);
    }

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Vérifie si l'utilisateur est modérateur
   */
  isUserModerator() {
    return this.state.currentUser?.role === 'moderator' || this.state.currentUser?.role === 'admin';
  },

  /**
   * Récupère le nom du grade
   */
  getGradeName(role) {
    const grades = {
      user: 'USER',
      moderator: 'MODÉRATEUR',
      admin: 'ADMIN',
    };
    return grades[role] || 'USER';
  },

  /**
   * Récupère la classe CSS du grade
   */
  getGradeClass(role) {
    return role === 'moderator' ? 'mod' : role === 'admin' ? 'admin' : 'user';
  },

  /**
   * Récupère le nom de la catégorie
   */
  getCategoryName(categoryId) {
    const category = this.state.categories.find((c) => c.id === categoryId);
    return category?.name || 'Non catégorisé';
  },

  /**
   * Vérifie si un sujet correspond aux filtres
   */
  matchesFilters(subject) {
    const matchesSearch =
      !this.state.searchQuery ||
      subject.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
      subject.excerpt.toLowerCase().includes(this.state.searchQuery.toLowerCase());

    const matchesCategory =
      this.state.selectedCategory === 'all' || subject.categoryId === this.state.selectedCategory;

    return matchesSearch && matchesCategory;
  },

  /**
   * Échappe les caractères HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Formate "il y a X temps"
   */
  timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;

    return new Date(date).toLocaleDateString('fr-FR');
  },

  /**
   * Met à jour l'état et trigger re-render
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
  },

  /**
   * Redirection vers la connexion
   */
  redirectToLogin() {
    window.location.href = 'index.html?login=true';
  },

  /**
   * Charger les réponses d'un sujet
   */
  async loadReplies(subjectId) {
    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/subjects/${subjectId}/replies`, {
        headers: this.getAuthHeaders(),
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
      return [];
    }
  },

  /**
   * Soumettre une réponse
   */
  async submitReply(subjectId) {
    const content = document.getElementById('newReplyContent')?.value;
    if (!content || !content.trim()) {
      this.showNotification('Veuillez écrire une réponse', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/subjects/${subjectId}/replies`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        this.showNotification('Réponse ajoutée avec succès !', 'success');
        // Recharger la modal
        const subject = this.state.subjects.find(s => s.id === subjectId);
        if (subject) {
          subject.replies = (subject.replies || 0) + 1;
          this.openDetailModal(subject);
        }
      } else {
        this.showNotification('Erreur lors de l\'ajout de la réponse', 'error');
      }
    } catch (error) {
      console.error('Erreur soumission réponse:', error);
      this.showNotification('Erreur lors de l\'ajout de la réponse', 'error');
    }
  },

  /**
   * Toggle like sur une réponse
   */
  async toggleLike(replyId, authorId) {
    if (!this.state.currentUser) {
      this.showNotification('Veuillez vous connecter pour liker', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/replies/${replyId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.liked ? '❤️ Like ajouté' : 'Like retiré', 'success');
        // Recharger la vue
        const currentSubjectId = this.DOM.subjectDetailModal?.dataset?.subjectId;
        if (currentSubjectId) {
          const subject = this.state.subjects.find(s => s.id === currentSubjectId);
          if (subject) this.openDetailModal(subject);
        }
      }
    } catch (error) {
      console.error('Erreur toggle like:', error);
    }
  },

  /**
   * Toggle like sur un sujet
   */
  async toggleSubjectLike(subjectId) {
    if (!this.state.currentUser) {
      this.showNotification('Veuillez vous connecter pour liker', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/subjects/${subjectId}/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const subject = this.state.subjects.find(s => s.id === subjectId);
        if (subject) {
          subject.likes = data.likes;
          subject.likedByCurrentUser = data.liked;
          this.showNotification(data.liked ? '❤️ J\'aime ajouté' : 'J\'aime retiré', 'success');
          this.openDetailModal(subject);
        }
      }
    } catch (error) {
      console.error('Erreur toggle subject like:', error);
      this.showNotification('Erreur lors de l\'ajout du like', 'error');
    }
  },

  /**
   * Toggle bookmark (favoris)
   */
  async toggleBookmark(subjectId) {
    if (!this.state.currentUser) {
      this.showNotification('Veuillez vous connecter pour ajouter aux favoris', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/subjects/${subjectId}/bookmark`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const subject = this.state.subjects.find(s => s.id === subjectId);
        if (subject) {
          subject.bookmarked = data.bookmarked;
          this.showNotification(data.bookmarked ? '🔖 Ajouté aux favoris' : 'Retiré des favoris', 'success');
          this.openDetailModal(subject);
        }
      }
    } catch (error) {
      console.error('Erreur toggle bookmark:', error);
      this.showNotification('Erreur lors de l\'ajout aux favoris', 'error');
    }
  },

  /**
   * Partager un sujet
   */
  async shareSubject(subjectId) {
    const subject = this.state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const shareUrl = `${window.location.origin}/forum.html?subject=${subjectId}`;
    const shareText = `Découvrez ce sujet sur LionTrack : ${subject.title}`;

    // Si Web Share API est disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject.title,
          text: shareText,
          url: shareUrl,
        });
        this.showNotification('✅ Partagé avec succès', 'success');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Erreur partage:', error);
        }
      }
    } else {
      // Copier dans le presse-papier
      try {
        await navigator.clipboard.writeText(shareUrl);
        this.showNotification('🔗 Lien copié dans le presse-papier', 'success');
      } catch (error) {
        console.error('Erreur copie:', error);
        this.showNotification('Impossible de copier le lien', 'error');
      }
    }
  },

  /**
   * Marquer comme utile
   */
  async markAsHelpful(replyId, authorId) {
    if (!this.state.currentUser) {
      this.showNotification('Veuillez vous connecter', 'error');
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/replies/${replyId}/helpful`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.helpful ? '✅ Marqué comme utile' : 'Marquage retiré', 'success');
        // Recharger la vue
        const currentSubjectId = this.DOM.subjectDetailModal?.dataset?.subjectId;
        if (currentSubjectId) {
          const subject = this.state.subjects.find(s => s.id === currentSubjectId);
          if (subject) this.openDetailModal(subject);
        }
      }
    } catch (error) {
      console.error('Erreur mark helpful:', error);
      this.showNotification('Erreur lors du marquage', 'error');
    }
  },

  /**
   * Supprimer une réponse
   */
  async deleteReply(replyId, subjectId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
      return;
    }

    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        this.showNotification('🗑️ Réponse supprimée', 'success');
        // Recharger la vue
        const subject = this.state.subjects.find(s => s.id === subjectId);
        if (subject) {
          subject.replies = Math.max(0, (subject.replies || 1) - 1);
          this.openDetailModal(subject);
        }
      } else {
        this.showNotification('Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur suppression réponse:', error);
      this.showNotification('Erreur lors de la suppression', 'error');
    }
  },

  /**
   * Récupère les headers d'authentification
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Marquer une réponse comme utile (aide à monter en grade)
   */
  async markAsHelpful(replyId, authorId) {
    try {
      const response = await fetch(`${this.api.baseURL}/api/forum/replies/${replyId}/helpful`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ authorId }),
      });

      if (response.ok) {
        const data = await response.json();
        this.showNotification(`✅ Conseil marqué utile ! ${data.author} gagne ${data.pointsEarned} points d'XP`, 'success');
        // Recharger la vue
        const currentSubjectId = this.DOM.subjectDetailModal?.dataset?.subjectId;
        if (currentSubjectId) {
          const subject = this.state.subjects.find(s => s.id === currentSubjectId);
          if (subject) this.openDetailModal(subject);
        }
      }
    } catch (error) {
      console.error('Erreur mark helpful:', error);
    }
  },
};

// Exposer ForumApp globalement pour qu'il soit accessible depuis d'autres scripts
window.ForumApp = ForumApp;

// Initialise l'app quand le DOM est prêt (uniquement si c'est une page standalone)
document.addEventListener('DOMContentLoaded', () => {
  // Ne réinitialiser que si on est sur la page forum.html standalone
  // et que les éléments du DOM existent
  if (document.getElementById('forumSidebar') && typeof ForumApp !== 'undefined') {
    ForumApp.init();
  }
});
