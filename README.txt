Filament Manager - versie 8.11

Spoelwissel / refill koppelen opnieuw opgebouwd
-----------------------------------------------
De scanflow gebruikt nu twee volledig afzonderlijke stappen:

1. Scan spoel
   - aparte scanner/dialoog
   - spoelnummer wordt opgeslagen
   - scanner en dialoog worden volledig gesloten

2. Scan refill
   - nieuw dialoog
   - volledig nieuwe scannersessie
   - refillnummer wordt opgeslagen
   - scanner wordt gesloten
   - spoel + refill worden in het formulier ingevuld

De oude gedeelde refill-scanfase wordt niet meer gebruikt voor deze koppelflow.
Camera- en QR-parserfuncties voor andere onderdelen blijven behouden.
Overige functies van v8.10 zijn ongewijzigd.
