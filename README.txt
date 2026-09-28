Filament Manager - versie 10.8.2
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

Versie 10.8.2 gebruikt voor compatibiliteit dezelfde lokale opslagsleutel als de werkende 10.0-build:
filament_manager_v10_0

Wijziging in 10.8.2
-----------------
- Dashboardweergave op iPhone compacter gemaakt.
- Hoeveelheid op de spoel gebruikt een smallere keuzeknop.
- Aantal beschikbare refills staat duidelijk in een compacte badge.
- Firebase-synchronisatie en opslaglogica zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- Tekst in de hoeveelheidknop op het dashboard kleiner gemaakt.
- De compacte breedte van de knop blijft behouden.
- Refill-badge, Firebase en synchronisatielogica zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- Hoeveelheidselector compacter gemaakt op Mac én iPhone.
- Lettergrootte verlaagd naar 12 px op desktop en 11 px op mobiel.
- Native browseropmaak van de selector uitgeschakeld zodat de ingestelde lettergrootte effectief wordt toegepast.
- Eigen compacte pijltjes toegevoegd.
- Firebase, gegevens en synchronisatie zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- Op spoel-etiketten worden categorie en type afgedrukt in de categoriekleur.
- Dezelfde kleuren als op het dashboard worden gebruikt:
  PLA blauw, PETG groen, TPU paars, ASA oranje, ABS rood, PA/Nylon petrol en PC paars.
- Kleur, leverancier, referentie, spoelnummer en QR-code blijven zwart.
- Refill-etiketten blijven ongewijzigd.
- Firebase en synchronisatie zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- Op spoel-etiketten worden nu categorie + type, kleur, leverancier, referentie en het woord "spoel" in de categoriekleur afgedrukt.
- QR-code en groot spoelnummer blijven zwart voor maximale leesbaarheid en scanbaarheid.
- Refill-etiketten blijven ongewijzigd.
- Firebase en synchronisatie zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- De categoriekleur op etiketten wordt nu ook toegepast op refill-etiketten.
- Op zowel spoel- als refill-etiketten staan categorie + type, kleur, leverancier, referentie en het woord "spoel"/"refill" in de categoriekleur.
- QR-code en groot nummer blijven zwart voor leesbaarheid en scanbaarheid.
- Firebase en synchronisatie zijn niet gewijzigd.

Wijziging in 10.8.2
-----------------
- Nieuwe gevulde spoelen worden geblokkeerd wanneer hetzelfde filament al op een andere actieve, niet-lege spoel aanwezig is.
- Een lege bestaande spoel kan niet opnieuw gevuld worden wanneer hetzelfde filament nog op een andere actieve, niet-lege spoel zit.
- Deze controle geldt voor handmatig niveau wijzigen, detailweergave, QR-niveauaanpassing en het koppelen van een refill.
- Bij blokkering toont de app op welk spoelnummer het filament al aanwezig is.
- Bestaande dubbele situaties worden niet automatisch gewijzigd en kunnen worden opgebruikt.
- Bestaande dubbele spoelen blijven normaal bewerkbaar zolang ze niet van leeg naar gevuld gaan of van filament veranderen.
- Refillvoorraad mag nog steeds meerdere refills van hetzelfde filament bevatten.
- Firebase en synchronisatie zijn niet gewijzigd.

Correctie 10.8.2
----------------
- De duplicatencontrole werkt nu volledig lokaal.
- Bij een nieuwe spoel of bij het wijzigen van het filament van een bestaande spoel wordt gecontroleerd of hetzelfde filament nog op een andere niet-lege actieve spoel staat.
- Dit geldt ook als de doelspoel zelf leeg is en op 0% staat.
- Refill koppelen en een lege spoel opnieuw vullen worden eveneens geblokkeerd wanneer hetzelfde filament al op een andere niet-lege actieve spoel aanwezig is.
- Firebase is hiervoor niet nodig en is niet aangepast.

Correctie 10.8.2
----------------
- De controle vergelijkt nu de echte filamentidentiteit in plaats van alleen het interne filament-ID.
- Identiteit = categorie + type + kleur + merk + leverancier + leveranciersreferentie.
- Daardoor wordt hetzelfde filament ook herkend wanneer het dubbel in de catalogus voorkomt met verschillende interne IDs.
- In het spoelvenster wordt een verboden filamentkeuze meteen gemeld en teruggedraaid.
- De controle bij Opslaan blijft als tweede beveiliging actief.
- Werkt volledig lokaal; Firebase is hiervoor niet nodig.
