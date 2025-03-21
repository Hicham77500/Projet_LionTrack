/**
 * Gestionnaire des visualisations avec Chart.js
 */
class ChartManager {
    constructor() {
      this.progressChart = null;
    }
  
    /**
     * Initialise le graphique de progression
     * @param {string} canvasId - L'ID du canvas pour le graphique
     * @param {Array} challenges - Les données des défis
     */
    initProgressChart(canvasId, challenges) {
      const ctx = document.getElementById(canvasId).getContext('2d');
      
      // Détruire le graphique existant s'il y en a un
      if (this.progressChart) this.progressChart.destroy();
      
      // Limiter le nombre de défis affichés dans le graphique
      const MAX_CHART_ITEMS = 8;
      let displayChallenges = [...challenges];
      
      if (challenges.length > MAX_CHART_ITEMS) {
          // Trier par progression pour garder les plus significatifs
          displayChallenges = challenges
              .sort((a, b) => (b.progress || 0) - (a.progress || 0))
              .slice(0, MAX_CHART_ITEMS);
      }
      
      // Organiser les données pour le graphique
      const labels = displayChallenges.map(ch => ch.title);
      const data = displayChallenges.map(ch => ch.progress || 0);
      const colors = displayChallenges.map(ch => {
        const progress = ch.progress || 0;
        if (progress < 30) return '#aa0000'; // rouge pour faible progression
        if (progress < 70) return '#d4af37'; // or pour progression moyenne
        return '#00aa00'; // vert pour bonne progression
      });
      
      // Créer le nouveau graphique
      this.progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Progression (%)',
            data: data,
            backgroundColor: colors,
            borderColor: '#121212',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#f0f0f0'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: '#f0f0f0'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#f0f0f0'
              }
            }
          }
        }
      });
    }
  
    /**
     * Met à jour les statistiques sur le dashboard
     * @param {Array} challenges - Les données des défis
     */
    updateStats(challenges) {
      const totalChallenges = challenges.length;
      let completedChallenges = 0;
      let totalProgress = 0;
      
      challenges.forEach(ch => {
        if (ch.progress === 100) completedChallenges++;
        totalProgress += ch.progress || 0;
      });
      
      const avgProgress = totalChallenges > 0 ? Math.round(totalProgress / totalChallenges) : 0;
      
      document.getElementById('total-challenges').textContent = totalChallenges;
      document.getElementById('completed-challenges').textContent = completedChallenges;
      document.getElementById('avg-progress').textContent = avgProgress + '%';
    }
  }
  
  // Exporter l'instance pour une utilisation globale
  window.chartManager = new ChartManager();