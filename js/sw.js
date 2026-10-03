const CACHE_NAME = 'sps-cache-v1';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js'
];


// ==========================================
// 설치
// ==========================================

self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache => {

          return cache.addAll(
            APP_FILES
          );

        })

    );


    self.skipWaiting();

  }
);


// ==========================================
// 활성화
// ==========================================

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(cacheNames => {

          return Promise.all(

            cacheNames
              .filter(
                cacheName =>
                  cacheName !== CACHE_NAME
              )
              .map(
                cacheName =>
                  caches.delete(
                    cacheName
                  )
              )

          );

        })

    );


    self.clients.claim();

  }
);


// ==========================================
// 네트워크 / 캐시 처리
// ==========================================

self.addEventListener(
  'fetch',
  event => {

    // GET 요청만 처리
    if (
      event.request.method !== 'GET'
    ) {
      return;
    }


    event.respondWith(

      fetch(event.request)

        .then(response => {

          // 정상 응답은 캐시에 저장
          const responseClone =
            response.clone();


          caches
            .open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                responseClone
              );

            });


          return response;

        })

        .catch(() => {

          // 인터넷이 안 되면 캐시 사용
          return caches.match(
            event.request
          );

        })

    );

  }
);