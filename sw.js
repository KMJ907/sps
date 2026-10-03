const CACHE_NAME = "sps-v4";

const APP_SHELL = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./json/manifest.json",
    "./image/icon-192.png"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(
                            APP_SHELL
                        )
                )
        );

        self.skipWaiting();
    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(names =>
                    Promise.all(
                        names
                            .filter(
                                name =>
                                    name !==
                                    CACHE_NAME
                            )
                            .map(
                                name =>
                                    caches.delete(
                                        name
                                    )
                            )
                    )
                )
        );

        self.clients.claim();
    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
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
                        response.status !== 200 ||
                        response.type ===
                            "opaque"
                    ) {
                        return response;
                    }

                    const clone =
                        response.clone();

                    caches.open(
                        CACHE_NAME
                    )
                    .then(
                        cache =>
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


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const targetURL =
            new URL(
                "./?showToday=true",
                self.location.origin +
                self.registration.scope
            ).href;

        event.waitUntil(

            self.clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(
                    clientList => {

                        for (
                            const client
                            of clientList
                        ) {

                            if (
                                "focus" in client
                            ) {

                                client.navigate(
                                    targetURL
                                );

                                return client.focus();
                            }
                        }

                        if (
                            self.clients.openWindow
                        ) {

                            return self.clients.openWindow(
                                targetURL
                            );
                        }

                    }
                )
        );
    }
);