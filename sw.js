const CACHE_NAME = 'agendamento-rg-v2'; // Mudei a versão para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  // Adicione ícones se quiser garantir que carreguem offline
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo SW a ativar imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  // Limpa caches antigos (v1) para garantir que ninguém use a versão velha
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Apagando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Controla a página imediatamente
});

self.addEventListener('fetch', event => {
  // ESTRATÉGIA: Network First (Tenta rede, falha para cache)
  // Ideal para apps que atualizam frequentemente
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for válida, clonamos e atualizamos o cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta pegar do cache
        return caches.match(event.request);
      })
  );
});
