Filament Manager - versie 8.7

QR-scan spoelwissel / refill koppelen
-------------------------------------
- Spoel en refill worden niet meer in dezelfde doorlopende scannersessie gelezen.
- Na een succesvolle spoelscan wordt de Html5Qrcode-scanner volledig gestopt en gewist.
- Daarna wordt een nieuwe scannersessie gestart voor de refill.
- De refillstap begint dus met een schone camera/scannerstatus.
- De bestaande meldingen 'Scan spoel', 'Scan refill' en de succesmeldingen blijven behouden.
- De QR-code wordt nog steeds alleen verwerkt wanneer op Scan wordt gedrukt.

Verder zijn de functies van v8.6 ongewijzigd.
