FILAMENT MANAGER v7.5.45

Gebaseerd op v7.5.44.

HERSTEL AFDRUKKEN / DATA
De regressie vanaf v7.5.7 is teruggedraaid.

Voorraad Spoelen (A4) en Voorraad Refills (A4):
- blijven volledig afdrukbaar;
- openen opnieuw het ingebouwde afdrukvoorbeeld in dezelfde index.html;
- de app navigeert hiervoor niet meer naar een aparte HTML-pagina;
- na sluiten van het afdrukvoorbeeld blijft de hoofdapp geladen.

Dit gebruikt de FMPrint-module die al in de app aanwezig was en die in v7.5.6 voor deze functie werd gebruikt.

BEHOUDEN
- localStorage key: filament_manager_v7_1
- JSON import/export
- stickerafdrukken
- sorteren Spoelen/Refills
- mobiele layout v7.5.43
- QR, catalogus en bestellingen

OPMERKING
De losse bestanden voorraad-spoelen.html en voorraad-refills.html blijven in het pakket aanwezig, maar de app gebruikt ze niet meer voor de twee knoppen onder Meer → Afdrukken.

CONTROLE
- JavaScript-syntax gecontroleerd met node --check.
- FMPrint.show('spools') en FMPrint.show('refills') aanwezig.
