FILAMENT MANAGER v7.5.41

BELANGRIJKSTE WIJZIGING: DATA BLIJFT BEWAARD BIJ OPNIEUW OPENEN

Probleem gevonden:
- In de vorige versie werd de legacy-opslagmigratie pas uitgevoerd nadat state=load() al was uitgevoerd.
- Daardoor kon de app bij het starten al een lege state gebruiken.

Oplossing:
1. Opslagmigratie wordt nu uitgevoerd VOORDAT de app de state laadt.
2. De bestaande localStorage-key blijft exact:
   filament_manager_v7_1
3. Er is een tweede permanente opslaglaag toegevoegd via IndexedDB.
4. Bij elke wijziging wordt de volledige state opgeslagen in:
   - localStorage
   - IndexedDB
5. Bij het opstarten:
   - eerst wordt localStorage gebruikt;
   - als die leeg is, probeert de app automatisch de IndexedDB-reservekopie te herstellen.
6. Na JSON-import wordt de geïmporteerde database meteen in beide opslagplaatsen opgeslagen.

Verder niet gewijzigd:
- mobiele menustructuur van v7.5.40a
- Spoelen / Refills
- Catalogus
- Bestellijst / Lopende bestellingen
- QR en print
- JSON export/import formaat

Controle:
- JavaScript-syntax gecontroleerd met node --check.
