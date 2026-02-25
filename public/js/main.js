// Intercepteur global pour détecter les erreurs 401 et rediriger vers la connexion
(function() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .then(response => {
                // Si la réponse est 401 (non autorisé), nettoyer la session et rediriger
                if (response.status === 401) {
                    console.warn('Session expirée (401), redirection vers la connexion');
                    if (window.AuthUI && typeof AuthUI.clearSession === 'function' && typeof AuthUI.showLoginUI === 'function') {
                        AuthUI.clearSession();
                        AuthUI.showLoginUI();
                        if (typeof AuthUI.showNotification === 'function') {
                            AuthUI.showNotification('error', 'Votre session a expiré. Veuillez vous reconnecter.');
                        }
                    } else {
                        localStorage.clear();
                        window.location.reload();
                    }
                }
                return response;
            });
    };
})();

// Si vous avez un fichier main.js, ajoutez ce code, sinon ajoutez-le à la fin de challenge-ui.js

document.addEventListener('DOMContentLoaded', function() {
    if (window.ChallengeUI && typeof ChallengeUI.init === 'function') {
        ChallengeUI.init();
    }
});