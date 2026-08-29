FILAMENT MANAGER v7.5.44

Gebaseerd op v7.5.43.

BELANGRIJKSTE HERSTEL
De gegevensopslag is teruggebracht naar de oorspronkelijke, eenvoudige en eerder werkende methode uit v7.5.38a:

  const KEY='filament_manager_v7_1';
  function load(){...localStorage.getItem(KEY)...}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}

Verwijderd uit de opslaglaag:
- automatische opslagmigratie uit latere versies
- IndexedDB reservekopie/herstel uit v7.5.41
- asynchrone restorePersistentState bij opstarten

De JSON-import blijft de teruggezette gegevens direct opslaan onder dezelfde localStorage-key.

NIET GEWIJZIGD
- Afdrukken blijft volledig aanwezig.
- Voorraad Spoelen (A4) blijft aanwezig.
- Voorraad Refills (A4) blijft aanwezig.
- Stickerafdrukken blijft aanwezig.
- Sorteren op categorie/type/kleur en nummer blijft aanwezig.
- Mobiele layout van v7.5.43 blijft aanwezig.
- QR, catalogus, bestellingen en overige functies blijven aanwezig.

CONTROLES
- JavaScript-syntax: node --check
- localStorage-key exact behouden: filament_manager_v7_1
- ensureManualOrderList aanwezig
- normalizeBackupData aanwezig
- voorraad-spoelen.html ongewijzigd
- voorraad-refills.html ongewijzigd
- print-tools.js ongewijzigd
