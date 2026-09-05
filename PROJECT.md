# Imbiss Kasse – Projekt-Übergabe

## Was das ist
Kassensystem (POS) für einen Imbiss-Stand, gebaut für den privaten Gebrauch.
Eine einzige eigenständige `index.html`-Datei (Vanilla JS, kein Build-Prozess,
kein Framework, kein Backend). Läuft komplett im Browser, Daten liegen in
`localStorage`. Deployed als statische Seite auf Netlify.

**Aktuelle Version: 2.0.2** (Versionsnummer steht klein neben dem Titel
"🌭 Imbiss Kasse" oben links, `const APP_VERSION` im `<script>`).

## Dateien in diesem Ordner
- `index.html` – die komplette App (HTML+CSS+JS in einer Datei)
- `sw.js` – Service Worker, macht die App offline-fähig (siehe unten)
- `manifest.json` – PWA-Manifest (Name, Icons, `display: standalone`)
- `icon-32.png`, `icon-180.png`, `icon-192.png`, `icon-512.png` – App-Icons,
  generiert aus dem vom Nutzer bereitgestellten Logo

Diese Dateien liegen zusammen im Root-Verzeichnis eines Netlify-Sites-Deploys
(kein Unterordner). `index.html` verlinkt Manifest und Icons per `<link>`-Tags
im `<head>` und meldet am Ende des `<script>`-Blocks den Service Worker an.

**`sw.js` muss beim Deploy mit hochgeladen werden** – fehlt die Datei, ist die
App wieder nur online lauffähig (die App selbst läuft weiter, nur ohne
Offline-Reserve).

## Offline-Fähigkeit (seit dieser Fassung)
Der Service Worker legt die Programmdateien (`index.html`, `manifest.json`,
Icons) in einem Browser-Cache ab. Fällt am Stand das Netz aus, startet die
Kasse trotzdem.

- **Kassendaten sind davon nicht betroffen.** Der Service Worker speichert
  ausschließlich Dateien, kein `localStorage`. Er kann Daten weder lesen
  noch löschen.
- **Updates kommen weiterhin automatisch an.** Die `index.html` wird bei
  vorhandenem Netz immer zuerst frisch geladen (network-first, 2,5 s
  Zeitlimit). Nur wenn das Netz fehlt oder zu langsam ist, springt die
  gespeicherte Fassung ein. Neues Deploy hochladen → beim nächsten Öffnen da.
- **Cache-Namen** stehen in `sw.js` (`CACHE_APP`, `CACHE_FONTS`) und sind
  bewusst von `APP_VERSION` entkoppelt, damit ein Versionssprung der App
  nicht an den Cache gekoppelt ist. Wenn sich die Dateiliste ändert oder ein
  Cache-Reset nötig wird: Zahl am Ende des Cache-Namens hochzählen.
- **Google Fonts** kommen weiterhin vom CDN, werden aber mitgecacht. Ohne
  Netz und ohne Cache greifen die Ersatzschriften – die App bleibt bedienbar,
  sieht nur anders aus.
- **`navigator.storage.persist()`** wird beim Start angefragt. Ohne diese
  Kennzeichnung darf der Browser den `localStorage` bei knappem Gerätespeicher
  von sich aus leeren. Der Browser kann die Anfrage ablehnen; bei einer
  installierten PWA wird sie in der Regel gewährt.

## Wie es deployed ist
- Netlify, manuelles Deploy (ZIP-Upload über app.netlify.com/drop), eigener
  Site-Name gesetzt
- Auf dem Windows-Tablet am Stand über Chrome/Edge als PWA
  installiert ("An Start anheften") – läuft dort im App-Fenster ohne
  Adressleiste
- Updates: einfach neue Datei(en) erneut auf dieselbe Netlify-Site hochladen,
  Tablet lädt beim nächsten Öffnen automatisch die neue Version nach
  (kein Neuinstallieren nötig)

## Datenhaltung (wichtig!)
**Alles liegt in `localStorage`, nichts in der Datei selbst.** Das heißt:
Datei/Version austauschen = Daten bleiben erhalten, solange Origin
(Netlify-URL) gleich bleibt. Keys (alle unter dem Präfix `kasse:`):

| Key | Inhalt |
|---|---|
| `kasse:products` | Array `{id, name, price, category, emoji, image?}` – `image` ist optional ein Data-URL (Foto statt Icon, via Mediathek/Kamera ausgewählt, clientseitig auf ~220px verkleinert) |
| `kasse:categories` | Array von Kategorienamen, frei erweiterbar/löschbar |
| `kasse:supplies` | Verbrauchsmaterial (nicht verkäuflich), `{id, name, emoji}` |
| `kasse:inventory` | `{[id]: {stock, target, threshold}}` – gilt für Produkte UND supplies. `target` ("Soll") ist **tot**: seit 2.0.1 nicht mehr editierbar, seither auch nirgends mehr gelesen. Das Feld bleibt nur im Objekt, damit alte Sicherungsdateien weiter einlesbar sind. Gepflegt werden `stock` ("Ist") und `threshold` ("Warnen ab"). **`threshold: null` = für diesen Artikel nicht warnen, `threshold: 0` = warnen, sobald nichts mehr da ist.** |
| `kasse:schwelle-migriert-v1` | Merker, dass die einmalige Schwellwert-Umstellung gelaufen ist (siehe unten). Nicht löschen. |
| `kasse:daily-total` / `kasse:daily-sales` | Tagesumsatz / Tages-Verkaufszähler pro Produkt, resettet bei Tagesabschluss |
| `kasse:total-sales` | Verkaufszähler pro Produkt, **niemals zurückgesetzt** – bestimmt die Sortierung in der "Alle"-Ansicht (meistverkauft oben) |
| `kasse:day-history` | Archiv vergangener Tage (max. 60), entsteht bei jedem Tagesabschluss |
| `kasse:open-tabs` / `kasse:active-tab` | Mehrere gleichzeitig offene "Bons" (Tabs). `default`/"Schnellverkauf" ist immer vorhanden. **Gast-Tabs werden beim Bezahlen NICHT gelöscht** (seit 2.0.2) – nur die Artikel werden geleert, der Tab bleibt für Stammgäste bestehen. Löschen nur manuell über X + Bestätigungsdialog |
| `kasse:last-completed-order` | Snapshot der zuletzt abgeschlossenen Bestellung (egal welcher Tab), read-only einsehbar über eigenen blauen Tab-Chip "🕓 Letzte Bestellung", wird bei jeder neuen Zahlung überschrieben |

Export/Import ("⬇ Sichern" / "⬆ Wiederherstellen" in der Produktverwaltung)
sichert/liest **alle** obigen Keys als eine JSON-Datei. Die Datei enthält
zusätzlich das Feld `schwelleMigriert` – siehe nächster Abschnitt. Wer neue
Daten einführt, muss sie hier mit aufnehmen, sonst gehen sie bei einem
Adresswechsel verloren.

**Der Export ist zugleich der Umzugsweg.** Weil alle Daten am `localStorage`
und damit an der URL hängen, ist "⬇ Sichern" auf der alten und
"⬆ Wiederherstellen" auf der neuen Adresse der einzige Weg, den Datenbestand
mitzunehmen.

## Schwellwerte ("Warnen ab") – Bedeutungsänderung
Früher galt `threshold: 0` als "nicht gesetzt", weil 0 zugleich der automatisch
vergebene Startwert war. Folge: Wer "Warnen ab 0" eintrug, bekam **nie** eine
Warnung. Jetzt gilt:

- **Feld leer** (`null`) → für diesen Artikel wird nicht gewarnt (Platzhalter "aus")
- **0 eingetragen** → Warnung, sobald der Bestand auf 0 fällt
- **Zahl eingetragen** → Warnung, sobald der Bestand diese Zahl erreicht

Damit auf bestehenden Geräten nicht schlagartig für jedes je verkaufte Produkt
eine Warnung erscheint, stellt `schwellenwerteUmstellen()` beim ersten Start
alle vorhandenen Nullen einmalig auf `null` und setzt
`kasse:schwelle-migriert-v1`. Bewusst gesetzte Schwellwerte > 0 bleiben
unangetastet. Die Umstellung läuft genau einmal – danach zählt eine
eingetragene 0 wieder als echter Schwellwert.

**Beim Import gilt dasselbe, und zwar unabhängig vom Merker des Geräts.** Eine
Sicherungsdatei ohne das Feld `schwelleMigriert` stammt aus einer Fassung vor
dieser Änderung; ihre Nullen werden beim Einlesen auf `null` gestellt
(`altnullenAufNichtGesetzt()`). Ohne diese Sonderbehandlung ginge der Umzug auf
eine neue Adresse schief: Dort läuft die Umstellung beim ersten Start ins Leere
und setzt den Merker – die danach importierten Altdaten würden also nicht mehr
umgestellt und lösten für fast jedes Produkt eine Warnung aus. Nach jedem Import
gilt die Umstellung als erledigt.

## Datenprüfung (`datensatzPruefen`)
Alles, was aus dem `localStorage` oder aus einer Sicherungsdatei kommt, gilt als
unbekannt und wird durch `datensatzPruefen()` normalisiert, bevor die App damit
arbeitet. Die Funktion läuft an **zwei** Stellen:

- **beim Start** (`init()`) – dadurch heilt ein bereits gespeicherter Schaden von
  selbst aus, statt die App dauerhaft unbenutzbar zu lassen
- **beim Import** – dort wird geprüft, **bevor** gespeichert wird

Früher wurde beim Import zuerst gespeichert und danach angezeigt. Eine Datei mit
einem Produkt ohne Preis brachte damit `fmt(undefined)` zum Absturz, das Raster
blieb leer, und weil "Produkte verwalten" an derselben Stelle abstürzte, kam man
an den Import nicht mehr heran – auch nach einem Neustart nicht.

Regeln: Produkte brauchen Name und eine Zahl als Preis (0 ist erlaubt), sonst
werden sie übersprungen und im Bestätigungsdialog gemeldet. Kennungen müssen
`[A-Za-z0-9_-]{1,64}` erfüllen, weil sie in `onclick`-Attributen landen; passt
eine Kennung nicht, bekommt der Eintrag eine neue. Schlüssel in `inventory`,
`dailySales` und `totalSales` werden dagegen **verworfen** statt umbenannt – eine
neue Kennung zeigt auf kein Produkt und käme bei jedem Start erneut hinzu.
Bilder nur als `data:image/…;base64`, Icons höchstens vier Zeichen. Bons ohne
`items` bekommen ein leeres Objekt, statt beim Zeichnen abzustürzen.

**Wichtig:** Echte Daten dürfen dabei nicht verändert werden. `"Sonstiges"` wird
nur angelegt, wenn wirklich ein Produkt dorthin zurückfällt.

## Sicherheit: Werte aus Daten im HTML
`escapeHtml()` ersetzt auch `"` und `'` – vorher nur `& < >`, wodurch
Attributwerte wie `src="…"` ungeschützt waren.

Für `onclick`-Attribute reicht Escaping grundsätzlich **nicht**: Der Browser
wandelt Entitäten im Attribut zurück, bevor der JavaScript-Teil gelesen wird. Ein
`&#39;` wird also wieder zu `'` und bricht die Zeichenkette auf. Deshalb steht
dort nie ein vom Benutzer bestimmter Text:

- `deleteCategory(index)` bekommt die **Position**, nicht den Kategorienamen
- alle anderen Handler bekommen Kennungen, die die Datenprüfung auf ein
  unverfängliches Zeichenrepertoire begrenzt hat

## Feature-Überblick (Stand v2.0.2)
- **Dashboard**: Kategorie-Tabs oben, Produktraster. "Alle" sortiert nach
  Gesamt-Verkaufsranking, einzelne Kategorien alphabetisch. Die Reihenfolge
  wird bewusst **nur zu festen Zeitpunkten** neu bestimmt (`rangfolge` /
  `rangfolgeNeuBestimmen()`): beim Start, beim Tagesabschluss und wenn sich
  der Produktbestand ändert. Früher wurde nach jedem Verkauf neu sortiert –
  dadurch verschoben sich die Kacheln mitten im Betrieb unter dem Finger.
  Zeigt Foto statt Emoji, falls eins hinterlegt ist.
- **Bon** (rechts, dauerhaft sichtbar, kompakt): Tab-Leiste über dem Bon –
  Reihenfolge: 🔴 Schnellverkauf → 🔵 Letzte Bestellung (falls vorhanden) →
  Gäste. Gast-Chips pulsieren pink, sobald Artikel drin sind, werden nach
  Bezahlung wieder grau (Tab bleibt aber bestehen). "+ Gast" legt neuen
  benannten Tab an.
- **Kasse**: Zahlenblock, Schnellbeträge, automatische Rückgeldberechnung.
- **📦 Inventur**: Aufklappbare Kategorien (Klick-Zustand bleibt über
  Re-Renders erhalten – wichtiger Bugfix in 2.0.1), pro Produkt/Verbrauchs-
  material nur noch "Ist" + "Warnen ab". Eingaben aktualisieren nur noch die
  **betroffene Zeile** (`aktualisiereLagerZeile()`), nicht mehr das ganze
  Fenster – sonst sprang die Liste bei jeder Eingabe an den Anfang und der
  Fokus ging verloren. Gleiches Prinzip auf der Einkaufsliste: eine
  abgearbeitete Zeile wird herausgenommen statt die Liste neu aufzubauen. "+ Hinzufügen" für Wareneingang.
  Verbrauchsmaterial (z. B. Frittierfett) in eigenem Abschnitt, nicht
  verkäuflich, wird nicht automatisch abgezogen.
- **🛒 Einkaufsliste**: automatisch aus Inventur generiert, alles unter
  Schwellwert, gruppiert nach Kategorie. Button pulsiert stark/auffällig
  (weißer Rand, starker Scale-Puls), sobald etwas nachbestellt werden muss.
- **🏆 Tagesranking** / **📅 Wochenverlauf**: Tagesabschluss archiviert Tag
  automatisch, Verlauf einsehbar und pro Tag aufklappbar.
- **Produktverwaltung**: nach Kategorie gruppiert, Foto-Upload (Mediathek/
  Kamera, wird clientseitig via Canvas verkleinert auf JPEG q0.78), Icon-
  Fallback (60+ Emoji-Auswahl), freie Kategorienverwaltung, Löschen nur mit
  Bestätigungsdialog.
- **⬇ Sichern / ⬆ Wiederherstellen**: vollständiger JSON-Export/Import,
  siehe Tabelle oben.
- **Vollbild-Button** (⛶) über die Fullscreen-API.

## Bekannte offene Wünsche (noch NICHT umgesetzt)
- Kein "Was ist neu"-Hinweis/Badge in der App bei neuer Version – wurde
  besprochen, aber explizit noch nicht gebaut (Nutzer wollte das erst
  perspektivisch, "noch nix einfügen").

## Wichtige Konventionen, die bisher eingehalten wurden
- **Sprache**: Alles auf Deutsch (UI-Texte, Kommentare im Code, Commit-
  artige Zusammenfassungen an den Nutzer).
- **Versionsnummer**: Wird nur auf explizite Anweisung des Nutzers erhöht/
  geändert – nicht automatisch bei jeder Änderung. Format zuletzt
  `MAJOR.MINOR.PATCH` (z. B. 2.0.2). Klein neben dem Titel anzeigen,
  Dateiname enthält ebenfalls die Version (z. B. `imbiss-kasse-v2.0.2.html`
  als Referenz – im Netlify-Deploy heißt sie aber `index.html`).
- **Datensicherheit hat hohe Priorität**: Nutzer ist sehr besorgt, dass bei
  Updates keine Daten verloren gehen. Jede neue Funktion, die Daten
  einführt, sollte in Export/Import mit aufgenommen werden.
- **Kein Server/Backend**: bewusst so gewählt (Netlify Free, keine
  Kosten). Bitte keine Server-Komponente vorschlagen, ohne zu fragen.
- **Zielgruppe der Bedienung**: eine Person am Imbiss-Stand auf einem
  Windows-Tablet, Touch-Bedienung, große Buttons, wenig Text.
