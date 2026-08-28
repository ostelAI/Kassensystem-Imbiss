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
- `manifest.json` – PWA-Manifest (Name, Icons, `display: standalone`)
- `icon-32.png`, `icon-180.png`, `icon-192.png`, `icon-512.png` – App-Icons,
  generiert aus dem vom Nutzer bereitgestellten Logo

Diese Dateien liegen zusammen im Root-Verzeichnis eines Netlify-Sites-Deploys
(kein Unterordner). `index.html` verlinkt Manifest und Icons per `<link>`-Tags
im `<head>`.

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
| `kasse:inventory` | `{[id]: {stock, target, threshold}}` – gilt für Produkte UND supplies. **`target` ("Soll") wird UI-seitig nicht mehr angezeigt/editiert (seit 2.0.1), nur noch `stock` ("Ist") und `threshold` ("Warnen ab")** |
| `kasse:daily-total` / `kasse:daily-sales` | Tagesumsatz / Tages-Verkaufszähler pro Produkt, resettet bei Tagesabschluss |
| `kasse:total-sales` | Verkaufszähler pro Produkt, **niemals zurückgesetzt** – bestimmt die Sortierung in der "Alle"-Ansicht (meistverkauft oben) |
| `kasse:day-history` | Archiv vergangener Tage (max. 60), entsteht bei jedem Tagesabschluss |
| `kasse:open-tabs` / `kasse:active-tab` | Mehrere gleichzeitig offene "Bons" (Tabs). `default`/"Schnellverkauf" ist immer vorhanden. **Gast-Tabs werden beim Bezahlen NICHT gelöscht** (seit 2.0.2) – nur die Artikel werden geleert, der Tab bleibt für Stammgäste bestehen. Löschen nur manuell über X + Bestätigungsdialog |
| `kasse:last-completed-order` | Snapshot der zuletzt abgeschlossenen Bestellung (egal welcher Tab), read-only einsehbar über eigenen blauen Tab-Chip "🕓 Letzte Bestellung", wird bei jeder neuen Zahlung überschrieben |

Export/Import ("⬇ Sichern" / "⬆ Wiederherstellen" in der Produktverwaltung)
sichert/liest **alle** obigen Keys als eine JSON-Datei.

## Feature-Überblick (Stand v2.0.2)
- **Dashboard**: Kategorie-Tabs oben, Produktraster. "Alle" sortiert nach
  Gesamt-Verkaufsranking (dauerhaft), einzelne Kategorien alphabetisch.
  Zeigt Foto statt Emoji, falls eins hinterlegt ist.
- **Bon** (rechts, dauerhaft sichtbar, kompakt): Tab-Leiste über dem Bon –
  Reihenfolge: 🔴 Schnellverkauf → 🔵 Letzte Bestellung (falls vorhanden) →
  Gäste. Gast-Chips pulsieren pink, sobald Artikel drin sind, werden nach
  Bezahlung wieder grau (Tab bleibt aber bestehen). "+ Gast" legt neuen
  benannten Tab an.
- **Kasse**: Zahlenblock, Schnellbeträge, automatische Rückgeldberechnung.
- **📦 Inventur**: Aufklappbare Kategorien (Klick-Zustand bleibt über
  Re-Renders erhalten – wichtiger Bugfix in 2.0.1), pro Produkt/Verbrauchs-
  material nur noch "Ist" + "Warnen ab". "+ Hinzufügen" für Wareneingang.
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
