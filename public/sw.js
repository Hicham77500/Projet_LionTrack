// Service Worker pour LionTrack PWA
const CACHE_NAME = 'liontrack-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/lion-theme.css',
  '/css/challenge-styles.css',
  '/css/modal-styles.css',
  '/css/navbar.css',
  '/js/auth-ui.js',
  '/js/challenge-ui.js',
  '/js/chart-manager.js',
  '/js/rank-system.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', err);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation en cours...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur le cache
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers l'API (on veut toujours les données fraîches)
  if (event.request.url.includes('/challenges') || 
      event.request.url.includes('/auth') ||
      event.request.url.includes('/users')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cloner la réponse car elle ne peut être consommée qu'une fois
        const responseToCache = response.clone();
        
        // Mettre en cache la nouvelle réponse
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // En cas d'échec du réseau, utiliser le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si la ressource n'est pas dans le cache et qu'on est offline
            // Retourner une page offline personnalisée pour les navigations
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Gérer les messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification de mise à jour
self.addEventListener('controllerchange', () => {
  console.log('[Service Worker] Nouveau service worker activé');
});
