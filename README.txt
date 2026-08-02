FILAMENT MANAGER v6.3.4 — CACHEHERSTEL

Deze versie lost twee oorzaken op:

1. Annuleren
- De knop sluit het venster rechtstreeks.
- De werking is niet meer afhankelijk van een later geladen event-handler.

2. Kleuren
- White, Black, Wit en Zwart worden permanent uit het kleurkeuzescherm gefilterd.
- Ook wanneer oude testgegevens deze kleuren opnieuw aan de bibliotheek toevoegen.

3. Updates
- app.js en app.css hebben een versienummer in de URL.
- De service worker gebruikt netwerk-eerst.
- Oude caches worden verwijderd.

NA UPLOAD NAAR GITHUB:
1. Open de website in Safari, niet eerst via het beginschermicoon.
2. Controleer dat bovenaan Versie 6.3.4 staat.
3. Verwijder het oude beginschermicoon.
4. Zet de website opnieuw op het beginscherm.
Dit is eenmalig nodig om de hardnekkige oude PWA-cache kwijt te raken.
