
(() => {
  'use strict';

  const STORAGE_KEYS = [
    'filament_manager_v7_1',
    'filament_manager',
    'filament_manager_state'
  ];

  const getState = () => {
    for (const key of STORAGE_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.catalog)) return parsed;
      } catch (_) {}
    }
    return {catalog: [], spools: [], refills: []};
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  const rowsFor = kind => {
    const state = getState();
    const catalogById = new Map((state.catalog || []).map(item => [item.id, item]));
    const source = kind === 'spools' ? (state.spools || []) : (state.refills || []);

    return source.map(item => {
      const filament = catalogById.get(item.filamentId) || {};
      return {
        category: filament.category || '',
        type: filament.type || '',
        color: filament.color || '',
        number: item.number || ''
      };
    }).sort((a, b) =>
      a.category.localeCompare(b.category, 'nl') ||
      a.type.localeCompare(b.type, 'nl') ||
      a.color.localeCompare(b.color, 'nl') ||
      a.number.localeCompare(b.number, 'nl', {numeric: true})
    );
  };

  const showPreview = kind => {
    const rows = rowsFor(kind);
    const title = kind === 'spools' ? 'Voorraad Spoelen' : 'Voorraad Refills';
    const overlay = document.getElementById('inventoryPrintOverlay');
    const preview = document.getElementById('inventoryPrintPreview');
    const titleElement = document.getElementById('inventoryPrintTitle');

    if (!overlay || !preview || !titleElement) {
      alert('Het afdrukvoorbeeld ontbreekt in deze versie.');
      return;
    }

    titleElement.textContent = title;
    preview.innerHTML = `
      <h1>Filament Manager – ${title}</h1>
      <div class="print-meta">
        <span>Afdrukdatum: ${escapeHtml(new Date().toLocaleString('nl-BE'))}</span>
        <span>Aantal: ${rows.length}</span>
      </div>
      <table>
        <thead>
          <tr><th>Categorie</th><th>Type</th><th>Kleur</th><th>Nummer</th></tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map(row => `
            <tr>
              <td>${escapeHtml(row.category)}</td>
              <td>${escapeHtml(row.type)}</td>
              <td>${escapeHtml(row.color)}</td>
              <td>${escapeHtml(row.number)}</td>
            </tr>`).join('') : '<tr><td colspan="4">Geen gegevens gevonden.</td></tr>'}
        </tbody>
      </table>
      <div class="print-footer">
        <span>${title}</span>
        <span>Totaal: ${rows.length}</span>
      </div>`;

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const hidePreview = () => {
    const overlay = document.getElementById('inventoryPrintOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
  };

  document.addEventListener('DOMContentLoaded', () => {
    const spoolButton = document.getElementById('printSpoolInventoryBtn');
    const refillButton = document.getElementById('printRefillInventoryBtn');
    const closeButton = document.getElementById('closeInventoryPrintBtn');
    const printButton = document.getElementById('confirmInventoryPrintBtn');

    if (spoolButton) {
      spoolButton.onclick = event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        showPreview('spools');
      };
    }

    if (refillButton) {
      refillButton.onclick = event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        showPreview('refills');
      };
    }

    if (closeButton) closeButton.onclick = hidePreview;
    if (printButton) printButton.onclick = () => window.print();
  });
})();
