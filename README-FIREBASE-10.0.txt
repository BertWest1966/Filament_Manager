Filament Manager 10.0 - Firebase
================================

FIREBASE DATABASE RULES
-----------------------
Plaats in Firebase Console -> Realtime Database -> Rules:

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

EERSTE INGEBRUIKNAME
--------------------
1. Publiceer de inhoud van deze map op de GitHub Pages-site.
2. Open de site EERST op de Mac waar de correcte 9.0.1-gegevens aanwezig zijn.
3. Ga naar Meer -> Firebase synchronisatie.
4. Meld aan met het Firebase e-mailadres en wachtwoord.
5. Als het Firebase-pad nog leeg is, worden de lokale 10.0-gegevens automatisch als startdata geupload.
6. Controleer filamenten, spoelen, refills, bestellingen en statistieken.
7. Open daarna dezelfde site op de iPhone en meld aan.
8. Test een kleine wijziging op Mac en daarna een kleine wijziging op iPhone.

LOKALE OPSLAG
--------------
Versie 10.0 gebruikt: filament_manager_v10_0
Bronnen voor eenmalige lokale migratie:
- filament_manager_firebase_test_v9_0_1 (indien aanwezig)
- filament_manager_v7_1 (stabiele 9.0.1-gegevens)

De brongegevens worden niet overschreven.
