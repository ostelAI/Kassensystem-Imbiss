# Imbiss Kasse

Eine kleine Kassenhilfe für einen Imbiss-Stand: Produkte antippen, Bon füllen,
Rückgeld ausrechnen, Lagerbestand im Blick behalten. Gebaut für die Bedienung
auf einem Windows-Tablet mit den Fingern — große Tippziele, wenig Text.

Sie ersetzt keine registrierkassenpflichtige Kasse und ist nicht dafür gedacht.
Sie hilft beim Preisenachschlagen, beim schnellen Kassieren und erinnert daran,
was nachbestellt werden muss.

---

## Was drin steckt

- **Eine einzige Datei.** `index.html` enthält HTML, CSS und JavaScript. Kein
  Build-Schritt, kein Framework, keine Abhängigkeiten, kein Server.
- **Läuft offline.** Ein Service Worker hält die Programmdateien vor. Fällt am
  Stand das Netz aus, startet die Kasse trotzdem.
- **Kein Backend.** Alle Daten liegen im `localStorage` des Browsers auf dem
  Gerät. Nichts wird irgendwohin übertragen.

## Funktionen

| | |
|---|---|
| **Verkauf** | Produktraster nach Kategorien, meistverkaufte oben. Bon rechts, dauerhaft sichtbar. |
| **Mehrere Bons** | Neben dem Schnellverkauf beliebig viele benannte Gast-Bons gleichzeitig offen. Bleiben nach dem Bezahlen bestehen. |
| **Kasse** | Zifferblock, Schnellbeträge, automatisches Rückgeld. |
| **Inventur** | Bestand je Produkt und Verbrauchsmaterial, Schwellwert für Warnungen, Wareneingang buchen. |
| **Einkaufsliste** | Entsteht automatisch aus allem, was den Schwellwert erreicht hat. |
| **Auswertung** | Tagesumsatz, Tagesranking, Wochenverlauf mit rund einem Jahr Historie. |
| **PIN** | Alle Ansichten mit Umsatzbezug sind hinter einer PIN. |
| **Sichern** | Vollständiger Export und Import als JSON-Datei. |

## Dateien

```
index.html      die komplette App
sw.js           Service Worker (Offline-Betrieb)
manifest.json   PWA-Manifest
icon-*.png      App-Symbole
PROJECT.md      technische Notizen: Datenhaltung, Entscheidungen, Fallstricke
```

`PROJECT.md` ist die ausführliche Fassung — dort steht, warum welche Entscheidung
so getroffen wurde und worauf man bei Änderungen achten muss.

---

## Lokal starten

Ein Doppelklick auf `index.html` reicht **nicht**: Service Worker und PWA-Manifest
brauchen `http://` oder `https://`, unter `file://` bleiben sie aus. Die App
selbst läuft zwar, aber ohne Offline-Reserve.

Deshalb einen kleinen Webserver im Projektordner starten:

```bash
py -3 -m http.server 8765
```

Danach `http://localhost:8765/` im Browser öffnen.

## Veröffentlichen

Die App ist eine statische Seite — es wird nichts gebaut. Alle Dateien müssen im
selben Verzeichnis liegen, `sw.js` inbegriffen. Fehlt sie, läuft die App weiter,
aber nur mit Netz.

Bei **GitHub Pages**: Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
Alle Pfade in der App sind relativ, sie funktioniert deshalb auch in einem
Unterverzeichnis wie `/Kassensystem-Imbiss/`.

Updates kommen von selbst an: Die Seite wird bei vorhandenem Netz immer zuerst
frisch geladen, der Zwischenspeicher springt nur ein, wenn kein Netz da ist.

---

## Daten — das Wichtigste

**Alle Daten hängen an der Adresse.** `localStorage` gehört zur Origin, also zur
konkreten URL. Läuft die App unter einer anderen Adresse, sieht sie die alten
Daten nicht. Gelöscht ist dabei nichts, nur unerreichbar.

Daraus folgt:

- Datei austauschen unter **derselben** Adresse → Daten bleiben erhalten.
- **Andere** Adresse → Daten müssen mitgenommen werden.

### Sichern

In der App: **Produkte verwalten → ⬇ Sichern**. Das schreibt eine JSON-Datei mit
allem: Produkte, Kategorien, Verbrauchsmaterial, Lagerbestand, Tagesumsatz,
Verkaufszähler, Wochenverlauf, offene Bons und die PIN-Prüfsumme.

Regelmäßig machen. Es ist die einzige Kopie außerhalb des Geräts.

### Umziehen auf eine neue Adresse

Die Reihenfolge ist wichtig:

1. Auf der **alten** Adresse **⬇ Sichern**, Datei wegspeichern
2. Neue Adresse einrichten und aufrufen
3. Dort **⬆ Wiederherstellen** mit der Datei
4. Nachsehen: Produkte, Preise, Lagerbestand, Wochenverlauf vollständig?
5. Erst dann als App installieren („An Start anheften")
6. **Das alte Symbol vom Startmenü entfernen**

Schritt 6 wird leicht übersehen und macht im Betrieb echten Ärger: Bleiben beide
Symbole liegen, existieren zwei Kassen mit **getrennten Datenbeständen**
nebeneinander, und beide sehen gleich aus. Wer im Stress das falsche öffnet,
bucht einen halben Tag in eine Kasse, die niemand mehr ansieht.

---

## PIN

Alles mit Umsatzbezug liegt hinter einer vierstelligen PIN: der Betrag in der
Kopfzeile (sonst `•••`), Tagesranking, Wochenverlauf und der Tagesabschluss.
Verkaufen, Bons und Inventur bleiben frei bedienbar.

Die PIN wird beim ersten Zugriff festgelegt. Danach bleibt es zwei Minuten
entsperrt, dann verdeckt sich der Betrag von selbst wieder. Vergessen? →
**Produkte verwalten → 🔒 PIN zurücksetzen**.

**Was das leistet:** Schutz gegen Blicke über die Schulter — Kunden am Tresen,
Aushilfen, Bekannte. **Was es nicht leistet:** Schutz gegen jemanden, der das
Gerät in der Hand hat und sich auskennt. Die Daten liegen im Browser des Geräts
und sind dort einsehbar. Der beiläufige Schutz war der Zweck.

---

## Mitarbeiten

Änderungen an `index.html` brauchen keinen Build — Datei speichern, Seite neu
laden. Vor größeren Eingriffen lohnt ein Blick in `PROJECT.md`; dort stehen die
Fallstricke, die man sonst zweimal entdeckt.

Zwei Regeln, die sich bewährt haben:

- **Neue Daten gehören in Export und Import.** Sonst gehen sie beim nächsten
  Adresswechsel verloren.
- **Die Versionsnummer** (`APP_VERSION` in `index.html`) wird nur bewusst
  erhöht, nicht bei jeder Änderung.
