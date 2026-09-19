Filament Manager - versie 8.10

Correctie Scan-knop bij refill
------------------------------
- De QR-code die de decoder zichtbaar als refill herkent, wordt apart vastgelegd.
- De Scan-knop gebruikt in de refillfase rechtstreeks die vastgelegde R-code.
- De Scan-knop is daardoor niet meer afhankelijk van een tijdelijke latestQrCode-waarde.
- Na de spoelscan wordt de bevestigde spoelcode gewist voordat de refillscan start.
- Na succesvolle verwerking van de refill wordt de bevestigde code opnieuw gewist.

Camera, QR-parser, aparte scannersessies en overige functies blijven verder ongewijzigd.
