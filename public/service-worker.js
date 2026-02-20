// Service Worker para PWA - Funcionalidade Offline
// Este arquivo cuida do cache de arquivos e permite usar offline

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `vistoria-app-${CACHE_VERSION}`;

// Arquivos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Fazer cache de arquivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cache criado');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Alguns arquivos não puderam ser cacheados:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('vistoria-app-')) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Estratégia Network First com Fallback para Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições para domínios externos
  if (url.origin !== location.origin) {
    return;
  }

  // Para requisições GET, usar Network First
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache bem-sucedido
          if (response.ok) {
            const cache_copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cache_copy);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline ou erro na rede, usar cache
          return caches.match(request).then((cached) => {
            return cached || cacheOfflineResponse();
          });
        })
    );
  }
});

// Página offline fallback
function cacheOfflineResponse() {
  return new Response(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><h1>Sem conexão</h1><p>Você está offline. Alguns recursos podem não estar disponíveis.</p></body></html>',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html; charset=utf-8',
      }),
    }
  );
}

// Sync em background (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Aqui você pode enviar dados pendentes para o servidor
    console.log('Service Worker: Sincronizando dados...');
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
  }
}
