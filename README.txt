FILAMENT MANAGER v7.5.13 — NAS-SYNCHRONISATIE BASIS

Nieuw:
- Centrale JSON-koppeling met de Node.js Filament API.
- Standaard API: http://192.168.0.191:3000/data
- Bij opstarten wordt de NAS gecontroleerd.
- Een lege NAS wordt automatisch geïnitialiseerd met de bestaande lokale gegevens.
- Bij elke wijziging wordt eerst lokaal opgeslagen en daarna naar de NAS gesynchroniseerd.
- localStorage blijft altijd als lokale reserve/fallback bestaan.
- Bij netwerkuitval blijft de app lokaal bruikbaar.
- Bij een conflict wordt de NAS NIET automatisch overschreven.
- Onder Meer > NAS-synchronisatie staat status, API-adres en een knop Nu synchroniseren.

BELANGRIJK:
GitHub Pages draait via HTTPS. Moderne browsers blokkeren een fetch van HTTPS naar
http://192.168.0.191:3000 als mixed content. De synchronisatiecode is klaar, maar voor
gebruik vanuit de GitHub Pages-app moet de NAS-API als HTTPS-adres beschikbaar worden
gemaakt (bijvoorbeeld via Synology Reverse Proxy + certificaat).

De bestaande functionaliteit en lokale opslag blijven behouden.
