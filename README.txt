FILAMENT MANAGER v7.5.13 — LOKALE NAS-SYNCHRONISATIE

Nieuw:
- Standaard NAS API: http://192.168.0.191:3000/data
- Bij opstarten probeert de app de centrale JSON op de NAS te laden.
- Als de NAS nog leeg is, worden de bestaande lokale gegevens als eerste centrale versie opgeslagen.
- Na elke wijziging wordt eerst lokaal opgeslagen en daarna automatisch naar de NAS geschreven.
- localStorage blijft als lokale reserve/fallback bestaan.
- Als de NAS niet bereikbaar is, blijft de app lokaal bruikbaar.
- Bij HTTP 409 conflict wordt niets automatisch overschreven.
- Onder Meer > NAS-synchronisatie staat de verbindingsstatus en knop Nu synchroniseren.

Gebruik:
- Werkt wanneer het toestel de NAS kan bereiken via het lokale netwerk/wifi.
- Voor gebruik via internet is later HTTPS/reverse proxy nodig.
