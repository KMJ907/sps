const CACHE_NAME = "sps-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(CACHE_NAME)
        .then(cache =>
          cache.addAll(APP_SHELL)
        )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(keys =>
          Promise.all(
            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )
          )
        )

    );

    self.clients.claim();

  }
);


self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !== "GET"
    ) {
      return;
    }


    event.respondWith(

      caches.match(
        event.request
      )
        .then(cached => {

          if (cached) {
            return cached;
          }


          return fetch(
            event.request
          )
            .then(response => {

              if (
                !response ||
                response.status !== 200
              ) {
                return response;
              }


              const clone =
                response.clone();


              caches.open(
                CACHE_NAME
              )
                .then(cache =>
                  cache.put(
                    event.request,
                    clone
                  )
                );


              return response;

            })
            .catch(() =>
              caches.match(
                "./index.html"
              )
            );

        })

    );

  }
);


/*
 * 알림 클릭 시 SPS를 열도록 처리
 */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification.close();


    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })
        .then(clientList => {

          for (
            const client of clientList
          ) {

            if (
              "focus" in client
            ) {

              return client.focus();

            }

          }


          if (
            clients.openWindow
          ) {

            return clients.openWindow(
              "./"
            );

          }

        })

    );

  }
);