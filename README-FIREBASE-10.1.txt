Filament Manager 10.1 - Firebase synchronisatie
================================================

NORMALE WERKING
---------------
1. Open Filament Manager 10.1.
2. Meld eenmaal aan met het Firebase-account als daarom wordt gevraagd.
3. De aanmeldsessie wordt lokaal onthouden.
4. Firebase-gegevens worden automatisch geladen.
5. Elke wijziging wordt automatisch gesynchroniseerd.
6. Mac en iPhone ontvangen wijzigingen van elkaar zonder handmatige import.

DATABASE RULES
--------------
Firebase Console -> Realtime Database -> Rules:

{
  "rules": {
    "users": {
      "EOsNru7BilUx9GguaBk0QxxY9oo1": {
        ".read": "auth != null && auth.uid === 'EOsNru7BilUx9GguaBk0QxxY9oo1'",
        ".write": "auth != null && auth.uid === 'EOsNru7BilUx9GguaBk0QxxY9oo1'"
      }
    }
  }
}

DATABASEPAD
-----------
users/EOsNru7BilUx9GguaBk0QxxY9oo1/filamentManager/state

LOKALE OPSLAG
--------------
Filament Manager 10.1 gebruikt voor compatibiliteit:
filament_manager_v10_0

De lokale opslag werkt als cache/noodkopie wanneer Firebase tijdelijk niet bereikbaar is.

BACK-UP
-------
De JSON back-upfunctie blijft onafhankelijk van Firebase beschikbaar.
Maak regelmatig een JSON back-up als extra veiligheidskopie.

CLOUD HERSTELLEN VANAF LOKALE KOPIE
-----------------------------------
Onder Meer -> Firebase synchronisatie staat de knop:
"Cloud herstellen vanaf lokale kopie".

Gebruik deze alleen wanneer de Firebase-gegevens bewust moeten worden vervangen door de lokale gegevens op het huidige apparaat.
De app vraagt altijd om bevestiging voordat de cloudgegevens worden overschreven.

NIEUW APPARAAT
--------------
Open dezelfde Filament Manager 10.1-site en meld aan met hetzelfde Firebase-account.
De bestaande cloudgegevens worden automatisch geladen.
