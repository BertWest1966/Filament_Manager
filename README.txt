FILAMENT MANAGER v7.5.47

Schone herbouw vanaf v7.5.38a.

De volledige opslagbasis is bewust die van v7.5.38a:
- localStorage-key filament_manager_v7_1
- originele load()
- originele save()
- originele JSON import/export
- GEEN migrateLegacyStorage
- GEEN IndexedDB-herstelcode
- GEEN restorePersistentState

Alleen latere UI-functies zijn teruggezet:
- mobiel menu met Spoelen en Refills
- sortering op categorie/type/kleur of nummer
- compacte mobiele navigatie
- mobiele Spoelen-regel met kleur, resterend percentage en spoelnummer

Afdrukfuncties en JSON-back-up blijven behouden vanuit de werkende basis.
