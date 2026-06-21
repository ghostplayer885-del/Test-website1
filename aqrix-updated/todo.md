# Aqrix 2v2 Tournament Website - TODO

## Phase 1: Projektstruktur & Datenbank
- [x] Projektcode aus ZIP übertragen
- [x] Datenbank-Schema mit Teams und Email-Verification-Codes Tabellen erstellen
- [x] Drizzle-Migrationen generieren und ausführen

## Phase 2: Backend-Logik
- [x] Admin-Authentifizierung mit Email-Verifizierung implementieren
- [x] Team-Verwaltung (Create, Read, Update, Delete)
- [x] Rate Limiting für Team-Registrierung und Admin-Login
- [x] tRPC Procedures für alle Backend-Operationen

## Phase 3: Frontend - Layout & Navigation
- [x] Lila Gaming-Theme in index.css implementieren (Farben, Animationen, Orbitron-Font)
- [x] Layout-Komponente mit Header und Navigation
- [x] Mobile Menu implementieren
- [x] Footer mit Social-Media-Links

## Phase 4: Frontend - Öffentliche Seiten
- [x] Homepage mit Hero-Section, Countdown, Team-Zähler und Preisstruktur
- [x] Registrierungsseite mit Formular und Validierung
- [x] Regeln-Seite mit Turnierregeln und Anforderungen
- [x] Turnierbaum (Bracket)-Seite

## Phase 5: Frontend - Admin-Panel
- [x] Admin-Login mit Email-Verifizierung
- [x] Team-Verwaltung Dashboard
- [x] Such- und Filterfunktion nach Status
- [x] Team-Verifizierung und Ablehnung
- [x] Player Namen formatiert: "Player 1: [Name]", "Player 2: [Name]"
- [x] Discord & Twitch Icons wie oben links (echte Icons)
- [x] TikTok Logo verbessert

## Phase 6: Tests & Validierung
- [x] Unit Tests für Admin-Authentifizierung
- [x] Unit Tests für Team-Verwaltung
- [x] Integration Tests
- [x] Alle Tests bestanden

## Phase 7: Finale Optimierung
- [x] Performance-Optimierung
- [x] Responsive Design validieren
- [x] Browser-Kompatibilität prüfen
- [x] Checkpoint erstellen


## Phase 8: Tournament-System
- [x] Test mit vollen Teams: Teams erstellen und Capacity-Balken testen
- [x] TOURNAMENT LIVE Animation: Vollständige Logik mit Zustand
- [x] Timer-Logik: 48h Countdown, Live-Zustand, Reset-Logik
- [x] Admin Timer-Management: Backend tRPC Procedures implementieren
- [x] Admin Timer UI: Start Tournament und Reset Timer Buttons verbinden
- [x] Bracket-Seite mit Team-Anzeige implementieren
- [x] Admin Ergebnis-Eingabe im Bracket implementieren
- [x] Bracket-Navigation und Weiterleitung testen
- [x] Gesamtsystem testen
