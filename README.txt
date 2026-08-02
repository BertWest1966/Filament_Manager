FILAMENT MANAGER v5.7 MOBILE FIRST

Deze versie is primair ontworpen voor iPhone.

Nieuw:
- Mobiele navigatie met Dashboard, Voorraad, Scannen, Bestellijst en Meer.
- Grotere aanraakknoppen en invoervelden.
- PWA-manifest en app-iconen.
- Service worker voor offline caching van de app.
- Installatiehulp voor iPhone.
- Eenvoudig overdrachtsbestand voor de latere dedicated iPhone.
- Bestaande functies voor voorraad, bestellingen, QR en stickers blijven aanwezig.

BELANGRIJK VOOR TESTEN OP IPHONE:
Een PWA en camera werken niet betrouwbaar wanneer je alleen index.html uit de Bestanden-app opent.
De map moet via HTTPS worden aangeboden. Dat kan later via:
- een eenvoudige tijdelijke hosting;
- GitHub Pages;
- of de Synology NAS.

Overzetten naar de dedicated iPhone:
1. Exporteer het overdrachtsbestand op de test-iPhone.
2. Installeer de PWA op de dedicated iPhone.
3. Importeer het JSON-bestand.
