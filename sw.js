/* Service Worker für die Imbiss Kasse
   -----------------------------------
   Aufgabe: Die App-Dateien lokal auf dem Tablet vorhalten, damit die Kasse
   auch startet, wenn kein Netz da ist (Hotspot weg, Netlify kurz nicht
   erreichbar).

   WICHTIG: Hier werden ausschließlich Programmdateien zwischengespeichert.
   Die Kassendaten (Produkte, Umsätze, Lagerbestand, offene Bons) liegen im
   localStorage des Browsers und werden vom Service Worker nicht angefasst –
   weder gelesen noch gelöscht.

   Update-Verhalten: Die index.html wird bei vorhandenem Netz IMMER zuerst
   frisch geladen (network-first). Ein neues Deploy auf Netlify kommt also
   wie bisher beim nächsten Öffnen automatisch an. Nur wenn das Netz fehlt
   oder zu langsam ist, springt die gespeicherte Fassung ein. */

const CACHE_APP   = "imbiss-kasse-app-v1";
const CACHE_FONTS = "imbiss-kasse-fonts-v1";
const AKTUELLE_CACHES = [CACHE_APP, CACHE_FONTS];

/* Dateien, die für den Start der App nötig sind. */
const APP_DATEIEN = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-32.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

/* Wie lange auf das Netz gewartet wird, bevor die gespeicherte Fassung
   genommen wird. Am Stand zählt jede Sekunde – lieber schnell aus dem
   Cache starten als in eine lange Zeitüberschreitung laufen. */
const NETZ_TIMEOUT_MS = 2500;

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    /* Bewusst einzeln statt addAll: Fehlt eine Datei (z. B. ein Icon wurde
       nicht mit hochgeladen), soll trotzdem alles Übrige gespeichert werden.
       addAll würde bei einem einzigen Fehler komplett abbrechen. */
    await Promise.allSettled(
      APP_DATEIEN.map(pfad => cache.add(new Request(pfad, {cache: "reload"})))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(
      namen.filter(n => n.startsWith("imbiss-kasse-") && !AKTUELLE_CACHES.includes(n))
           .map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

/* Netz abfragen, aber nicht ewig warten. */
function holeMitTimeout(request, ms){
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Zeitüberschreitung")), ms);
    fetch(request).then(
      antwort => { clearTimeout(timer); resolve(antwort); },
      fehler  => { clearTimeout(timer); reject(fehler); }
    );
  });
}

/* index.html: erst Netz (damit Updates ankommen), sonst Cache. */
async function seiteLaden(request){
  const cache = await caches.open(CACHE_APP);
  try{
    const antwort = await holeMitTimeout(request, NETZ_TIMEOUT_MS);
    if(antwort && antwort.ok) cache.put("./index.html", antwort.clone());
    return antwort;
  }catch(e){
    const gespeichert = await cache.match("./index.html") || await cache.match("./");
    if(gespeichert) return gespeichert;
    throw e;
  }
}

/* Icons, Manifest: erst Cache (schnell), im Hintergrund nichts weiter. */
async function dateiLaden(request){
  const cache = await caches.open(CACHE_APP);
  const gespeichert = await cache.match(request);
  if(gespeichert) return gespeichert;
  const antwort = await fetch(request);
  if(antwort && antwort.ok) cache.put(request, antwort.clone());
  return antwort;
}

/* Google Fonts: aus dem Cache liefern und nebenbei auffrischen.
   Ist nichts gespeichert und kein Netz da, greifen die Ersatzschriften
   aus dem CSS – die App bleibt bedienbar, sieht nur anders aus. */
async function schriftLaden(request){
  const cache = await caches.open(CACHE_FONTS);
  const gespeichert = await cache.match(request);
  const ausDemNetz = fetch(request).then(antwort => {
    if(antwort && (antwort.ok || antwort.type === "opaque")) cache.put(request, antwort.clone());
    return antwort;
  }).catch(() => null);
  return gespeichert || ausDemNetz;
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  const url = new URL(request.url);

  if(request.mode === "navigate"){
    event.respondWith(seiteLaden(request));
    return;
  }
  if(url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    event.respondWith(schriftLaden(request));
    return;
  }
  if(url.origin === self.location.origin){
    event.respondWith(dateiLaden(request));
  }
});
