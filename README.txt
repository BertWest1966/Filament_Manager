Filament Manager - versie 9.0

Basis
-----
Versie 9.0 is gebouwd op de stabiele versie 8.16.
De camera- en QR-scannerlogica van 8.16 is niet gewijzigd.

Nieuw: filamentverbruik / statistiek
------------------------------------
- Nieuwe pagina Meer → Statistiek.
- Overzicht per maand, kwartaal, jaar en totaal.
- Samenvatting van deze maand, dit kwartaal, dit jaar en totaal.
- Uitsplitsing per categorie, type en kleur.
- Verbruikslogboek met datum/tijd, spoel, filament en bron.
- Foute registraties kunnen uit het verbruikslogboek worden verwijderd.

Registratieregel
----------------
Elke expliciete actie waarbij een spoel op 100% wordt gezet telt als 1 rol.
Dit omvat onder andere:
- een volledig nieuwe spoel die op 100% wordt aangemaakt;
- een spoel die van een lager niveau naar 100% gaat;
- een refill die aan een spoel wordt gekoppeld (ook 100% → 100%);
- een QR-scan waarbij 100% wordt bevestigd;
- een handmatige/snellaag-aanpassing naar 100%.

Bij het opslaan van een bestaande spoel die al op 100% stond, vraagt de app
expliciet of dit als een nieuwe rol moet worden geregistreerd. Zo kan 100% → 100%
worden geteld zonder gewone wijzigingen aan een volle spoel automatisch dubbel te tellen.

Back-up
-------
De verbruiksregistraties zitten in dezelfde lokale gegevens en worden meegenomen
in de bestaande JSON-back-up en bij herstel.
