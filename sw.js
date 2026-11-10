/* Casa en orden · service worker: permite instalar la app y abrirla sin conexión.
   Si cambias index.html, sube también este archivo cambiando el número de VERSION. */
const VERSION = "casa-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Los datos y el inicio de sesión de Firebase van siempre directos a la red
  if (/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/.test(url.href)) return;
  // La propia app: primero la red (para recibir mejoras), si no hay conexión, la copia guardada
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  // Librerías y tipografías: la copia guardada, y si no está, la red
  if (/gstatic\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); return r; })));
  }
});
