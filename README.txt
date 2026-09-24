Filament Manager - versie 10.4
================================

Status
------
Stabiele Firebase-versie, gebaseerd op versie 9.0.1.

Nieuw in 10.1
-------------
- Firebase Authentication met e-mail/wachtwoord.
- Firebase Realtime Database als gedeelde gegevensbron.
- Automatisch laden van gegevens bij openen.
- Automatische realtime synchronisatie tussen Mac en iPhone.
- Aanmeldsessie wordt op het apparaat onthouden.
- Lokale opslag blijft beschikbaar als cache en noodkopie.
- JSON back-up en herstel blijven beschikbaar.
- Bestaande 9.0.1-gegevens kunnen bij de eerste ingebruikname worden overgenomen.

Ongewijzigd uit 9.0.1
----------------------
- Verbruiksregistratie.
- Statistieken per maand, kwartaal, jaar en totaal.
- QR-scanner en camera.
- Voorraad-, bestel-, catalogus- en bibliotheekfuncties.
- Stickerafmetingen 50 x 70 mm.

Normale werking
---------------
Na aanmelden worden gegevens automatisch uit Firebase geladen.
Wijzigingen op Mac of iPhone worden automatisch naar Firebase geschreven en op het andere apparaat bijgewerkt.
Handmatig importeren of exporteren is niet nodig voor de dagelijkse synchronisatie.

Back-up
-------
De bestaande JSON back-upfunctie blijft behouden en wordt aanbevolen als extra onafhankelijke back-up.

Hersteloptie
------------
Onder Meer -> Firebase synchronisatie staat:
"Cloud herstellen vanaf lokale kopie".

Gebruik deze knop alleen als herstelactie. De lokale gegevens van het huidige apparaat overschrijven dan de gegevens in Firebase.

Firebase
--------
Toegestane UID:
EOsNru7BilUx9GguaBk0QxxY9oo1

Databasepad:
users/EOsNru7BilUx9GguaBk0QxxY9oo1/filamentManager/state

Versie 10.4 gebruikt voor compatibiliteit dezelfde lokale opslagsleutel als de werkende 10.0-build:
filament_manager_v10_0

Wijziging in 10.4
-----------------
- Dashboardweergave op iPhone compacter gemaakt.
- Hoeveelheid op de spoel gebruikt een smallere keuzeknop.
- Aantal beschikbare refills staat duidelijk in een compacte badge.
- Firebase-synchronisatie en opslaglogica zijn niet gewijzigd.

Wijziging in 10.4
-----------------
- Tekst in de hoeveelheidknop op het dashboard kleiner gemaakt.
- De compacte breedte van de knop blijft behouden.
- Refill-badge, Firebase en synchronisatielogica zijn niet gewijzigd.

Wijziging in 10.4
-----------------
- Hoeveelheidselector compacter gemaakt op Mac én iPhone.
- Lettergrootte verlaagd naar 12 px op desktop en 11 px op mobiel.
- Native browseropmaak van de selector uitgeschakeld zodat de ingestelde lettergrootte effectief wordt toegepast.
- Eigen compacte pijltjes toegevoegd.
- Firebase, gegevens en synchronisatie zijn niet gewijzigd.
