// Si vous avez un fichier main.js, ajoutez ce code, sinon ajoutez-le à la fin de challenge-ui.js

document.addEventListener('DOMContentLoaded', function() {
    if (window.ChallengeUI && typeof ChallengeUI.init === 'function') {
        ChallengeUI.init();
    }
});