
const KEY='filament_manager_v7_1';
const DEFAULTS={categories:['PLA','PETG','TPU','ABS','ASA','Andere'],types:{PLA:['Basic','Matte'],PETG:['Basic'],TPU:['95A'],ABS:['Basic'],ASA:['Basic'],Andere:[]},colors:[],brands:['Bambu Lab'],suppliers:['Bambu Lab']};
let state=load();
let currentView='dashboard',previousView='dashboard',stockMode='spools',stockSortMode='filament',editFilamentId=null,editSpoolId=null,editRefillId=null,activeLibraryKind='colors',editingLibraryValue=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random()}
function fresh(){return{appVersion:'7.2',catalog:[],spools:[],refills:[],orders:[],history:[],libraries:structuredClone(DEFAULTS)}}
function load(){try{return {...fresh(),...JSON.parse(localStorage.getItem(KEY)||'null')}}catch{return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function pushUnique(arr,v){v=String(v||'').trim();if(v&&!arr.some(x=>x.toLowerCase()===v.toLowerCase()))arr.push(v)}
function filament(id){return state.catalog.find(f=>f.id===id)}
function label(f){return f?`${f.category} · ${f.type} · ${f.color}`:''}
function nextNumber(prefix,list){const nums=list.map(x=>Number(String(x.number||'').replace(/\D/g,''))).filter(Number.isFinite);return prefix+String((nums.length?Math.max(...nums):0)+1).padStart(4,'0')}
function spoolStock(fid){return state.spools.filter(s=>s.status==='active'&&s.filamentId===fid).reduce((a,s)=>a+Number(s.level||0)/100,0)}
function refillCount(fid){return state.refills.filter(r=>r.filamentId===fid).length}
function totalStock(fid){return spoolStock(fid)+refillCount(fid)}
function openOrdered(fid){return state.orders.filter(o=>o.status!=='Geleverd').reduce((a,o)=>a+(o.filamentId===fid?Math.max(0,o.quantity-o.received):0),0)}
function toOrder(f){const total=totalStock(f.id);if(total>=Number(f.min))return 0;return Math.max(0,Math.ceil(Number(f.target)-total-openOrdered(f.id)))}
function log(message,filamentId=null){state.history.push({id:uid(),date:new Date().toISOString(),message,filamentId})}
function setView(view){currentView=view;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view))}
document.addEventListener('click',e=>{
  const viewBtn=e.target.closest('[data-view]');if(viewBtn){setView(viewBtn.dataset.view);return}
  const closeBtn=e.target.closest('[data-close]');if(closeBtn){$(closeBtn.dataset.close).close()}
});
cancelFilamentBtn.onclick=()=>filamentDialog.close();

function refreshDatalists(){
  categoryOptions.innerHTML=state.libraries.categories.map(v=>`<option value="${esc(v)}">`).join('');
  colorOptions.innerHTML=state.libraries.colors.map(v=>`<option value="${esc(v)}">`).join('');
  brandOptions.innerHTML=state.libraries.brands.map(v=>`<option value="${esc(v)}">`).join('');
  supplierOptions.innerHTML=state.libraries.suppliers.map(v=>`<option value="${esc(v)}">`).join('');
  const types=[];Object.values(state.libraries.types).forEach(a=>a.forEach(v=>pushUnique(types,v)));
  typeOptions.innerHTML=types.map(v=>`<option value="${esc(v)}">`).join('');
}
function fillFilamentSelect(el,selected=''){el.innerHTML=state.catalog.slice().sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl')).map(f=>`<option value="${f.id}" ${f.id===selected?'selected':''}>${esc(label(f))}</option>`).join('')}
function openFilament(id=null){editFilamentId=id;const f=filament(id);filamentTitle.textContent=f?'Filament wijzigen':'Nieuw filament';fCategory.value=f?.category||'PLA';fType.value=f?.type||'';fColor.value=f?.color||'';fBrand.value=f?.brand||'Bambu Lab';fSupplier.value=f?.supplier||'Bambu Lab';fMinimum.value=String(f?.min??1);fTarget.value=String(f?.target??2);fSupplierRef.value=f?.supplierRef||'';filamentDialog.showModal()}
newFilamentBtn.onclick=()=>openFilament();
filamentForm.onsubmit=e=>{e.preventDefault();const o={id:editFilamentId||uid(),category:fCategory.value.trim(),type:fType.value.trim(),color:fColor.value.trim(),brand:fBrand.value.trim(),supplier:fSupplier.value.trim(),min:Number(fMinimum.value),target:Number(fTarget.value),supplierRef:fSupplierRef.value.trim()};if(!o.category||!o.type||!o.color||!o.brand)return alert('Vul categorie, type, kleur en merk in.');pushUnique(state.libraries.categories,o.category);pushUnique(state.libraries.colors,o.color);pushUnique(state.libraries.brands,o.brand);pushUnique(state.libraries.suppliers,o.supplier);if(!state.libraries.types[o.category])state.libraries.types[o.category]=[];pushUnique(state.libraries.types[o.category],o.type);state.catalog=editFilamentId?state.catalog.map(f=>f.id===editFilamentId?o:f):[...state.catalog,o];log(`${label(o)} ${editFilamentId?'gewijzigd':'aangemaakt'}`,o.id);filamentDialog.close();save()}

function openSpool(id=null){if(!state.catalog.length)return alert('Maak eerst een filament aan.');editSpoolId=id;const s=state.spools.find(x=>x.id===id);spoolTitle.textContent=s?'Spoel wijzigen':'Nieuwe spoel';sNumber.value=s?.number||nextNumber('S',state.spools);fillFilamentSelect(sFilament,s?.filamentId||state.catalog[0].id);sLevel.value=String(s?.level??100);sStatus.value=s?.status||'active';spoolDialog.showModal()}
newSpoolBtn.onclick=()=>openSpool();
spoolForm.onsubmit=e=>{e.preventDefault();const o={id:editSpoolId||uid(),number:sNumber.value.trim().toUpperCase(),filamentId:sFilament.value,level:Number(sLevel.value),status:sStatus.value};state.spools=editSpoolId?state.spools.map(s=>s.id===editSpoolId?o:s):[...state.spools,o];log(`Spoel ${o.number} op ${o.level}%`,o.filamentId);spoolDialog.close();save()}

function openRefill(id=null){if(!state.catalog.length)return alert('Maak eerst een filament aan.');editRefillId=id;const r=state.refills.find(x=>x.id===id);refillTitle.textContent=r?'Refill wijzigen':'Nieuwe refill';rNumber.value=r?.number||nextNumber('R',state.refills);fillFilamentSelect(rFilament,r?.filamentId||state.catalog[0].id);refillDialog.showModal()}
newRefillBtn.onclick=()=>openRefill();
refillForm.onsubmit=e=>{e.preventDefault();const o={id:editRefillId||uid(),number:rNumber.value.trim().toUpperCase(),filamentId:rFilament.value};state.refills=editRefillId?state.refills.map(r=>r.id===editRefillId?o:r):[...state.refills,o];log(`Refill ${o.number} ${editRefillId?'gewijzigd':'aangemaakt'}`,o.filamentId);refillDialog.close();save()}

newOrderBtn.onclick=()=>{manualOrderPendingId=null;if(!state.catalog.length)return alert('Maak eerst een filament aan.');fillFilamentSelect(oFilament,state.catalog[0].id);oQuantity.value=1;oSupplier.value=filament(oFilament.value)?.supplier||'';orderDialog.showModal()}
oFilament.onchange=()=>oSupplier.value=filament(oFilament.value)?.supplier||'';
orderForm.onsubmit=e=>{e.preventDefault();state.orders.push({id:uid(),filamentId:oFilament.value,quantity:Number(oQuantity.value),received:0,supplier:oSupplier.value.trim(),status:'Besteld'});if(manualOrderPendingId){ensureManualOrderList();state.manualOrderList=state.manualOrderList.filter(x=>x.id!==manualOrderPendingId);manualOrderPendingId=null;}orderDialog.close();save()}

function renderDashboard(){sumSpools.textContent=state.spools.filter(s=>s.status==='active').length;sumRefills.textContent=state.refills.length;sumEmpty.textContent=state.spools.filter(s=>s.status==='active'&&Number(s.level)===0).length;sumLow.textContent=state.catalog.filter(f=>totalStock(f.id)<Number(f.min)).length;const q=dashboardSearch.value.toLowerCase(),grouped={};state.catalog.slice().sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl')).forEach(f=>{if(q&&!`${f.category} ${f.type} ${f.color}`.toLowerCase().includes(q))return;grouped[f.category]??={};grouped[f.category][f.type]??=[];const active=state.spools.filter(s=>s.status==='active'&&s.filamentId===f.id).sort((a,b)=>a.number.localeCompare(b.number,'nl',{numeric:true}));if(!active.length)grouped[f.category][f.type].push({f,spool:null});else active.forEach(s=>grouped[f.category][f.type].push({f,spool:s}))});dashboardList.innerHTML=Object.keys(grouped).map(c=>`<div class="category-group" data-category="${esc(c)}"><div class="category-title">${esc(c)}</div>${Object.keys(grouped[c]).map(t=>`<div class="type-title">${esc(t)}</div><table class="dashboard-table"><thead><tr><th>Kleur</th><th>Spoel</th><th>Hoeveelh.</th><th>Refill</th></tr></thead><tbody>${grouped[c][t].map(r=>`<tr data-category="${esc(c)}"><td onclick="openDetail('${r.f.id}')">${esc(r.f.color)}</td><td>${r.spool?`<button onclick="openSpool('${r.spool.id}')">${r.spool.number}</button>`:'—'}</td><td>${r.spool?`<button class="level-btn" onclick="quickLevel('${r.spool.id}')">${r.spool.level}%</button>`:'—'}</td><td>${refillCount(r.f.id)}</td></tr>`).join('')}</tbody></table>`).join('')}</div>`).join('')||'<div class="note">Nog geen filamenten.</div>'}
dashboardSearch.oninput=renderDashboard;
function quickLevel(id){const s=state.spools.find(x=>x.id===id);const v=prompt(`Hoeveelheid op ${s.number}: 0, 25, 50, 75 of 100`,s.level);if(v===null)return;const n=Number(v);if(![0,25,50,75,100].includes(n))return alert('Kies 0, 25, 50, 75 of 100.');s.level=n;log(`Spoel ${s.number} aangepast naar ${n}%`,s.filamentId);save()}

function renderCatalog(){const q=catalogSearch.value.toLowerCase();const items=state.catalog.filter(f=>!q||label(f).toLowerCase().includes(q)).sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl'));catalogList.innerHTML=items.map(f=>`<div class="item-row category-data-row" data-category="${esc(f.category)}"><div><strong>${esc(label(f))}</strong><div class="item-meta">${esc(f.brand)} · min ${f.min} · gewenst ${f.target}</div></div><div class="item-actions"><button onclick="openDetail('${f.id}')">Open</button><button onclick="openFilament('${f.id}')">Wijzig</button><button class="danger-button" onclick="deleteFilament('${f.id}')">Verwijderen</button></div></div>`).join('')||'<div class="note">Geen filamenten.</div>'}
catalogSearch.oninput=renderCatalog;
function sortStock(items){if(stockSortMode==='number-asc')return items.sort((a,b)=>a.number.localeCompare(b.number,'nl',{numeric:true}));if(stockSortMode==='number-desc')return items.sort((a,b)=>b.number.localeCompare(a.number,'nl',{numeric:true}));return items.sort((a,b)=>{const fa=filament(a.filamentId),fb=filament(b.filamentId);return fa.category.localeCompare(fb.category,'nl')||fa.type.localeCompare(fb.type,'nl')||fa.color.localeCompare(fb.color,'nl')})}

function removeStockItem(kind,id){
  const list=kind==='spool'?state.spools:state.refills;
  const item=list.find(x=>x.id===id);
  if(!item)return;

  const labelText=kind==='spool'?'Spoel':'Refill';
  if(!confirm(`${labelText} ${item.number} verwijderen uit voorraad?`))return;

  if(kind==='spool'){
    state.spools=state.spools.filter(x=>x.id!==id);
  }else{
    state.refills=state.refills.filter(x=>x.id!==id);
  }

  save();
}

function stockGroups(items){
  const groups={};
  items.forEach(x=>{
    const f=filament(x.filamentId); if(!f)return;
    const category=f.category||'Overig', type=f.type||'', color=f.color||'';
    groups[category]??={}; groups[category][type]??={}; groups[category][type][color]??=[];
    groups[category][type][color].push(x);
  });
  return groups;
}

function stockPageHtml(items,kind,query){
  const q=(query||'').trim().toLowerCase();
  const filtered=items.filter(x=>{
    const f=filament(x.filamentId);
    const hay=`${x.number||''} ${f?.category||''} ${f?.type||''} ${f?.color||''}`.toLowerCase();
    return !q||hay.includes(q);
  });

  const groups=stockGroups(filtered);
  const categories=Object.keys(groups).sort((a,b)=>a.localeCompare(b,'nl'));

  if(!categories.length){
    return `<div class="note">Geen ${kind==='spool'?'spoelen':'refills'} gevonden.</div>`;
  }

  return categories.map(category=>`
    <div class="dashboard-stock-group inventory-category" data-category="${esc(category)}">
      <div class="dashboard-stock-category">${esc(category)}</div>

      ${Object.keys(groups[category]).sort((a,b)=>a.localeCompare(b,'nl')).map(type=>`
        <div class="dashboard-stock-type">${esc(type)}</div>

        <div class="dashboard-stock-header ${kind==='refill'?'refill-header':''}">
          <div></div>
          <div>${kind==='spool'?'Spoel':'Refill'}</div>
          ${kind==='spool'?'<div>Hoeveelh.</div>':''}
          <div></div>
        </div>

        ${Object.keys(groups[category][type]).sort((a,b)=>a.localeCompare(b,'nl')).flatMap(color=>
          groups[category][type][color]
            .sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true}))
            .map((x,idx)=>`
              <div class="dashboard-stock-row ${kind==='refill'?'refill-row':''}">
                <div class="dashboard-stock-color">${esc(color)}</div>
                <div class="dashboard-stock-number"><strong>${esc(x.number)}</strong></div>
                ${kind==='spool'?`<div class="dashboard-stock-level"><span class="level-badge">${Number(x.level)||0}%</span></div>`:''}
                <div class="dashboard-stock-actions">
                  <input class="label-select" type="checkbox" data-kind="${kind}" data-id="${x.id}" aria-label="Selecteer ${esc(x.number)}">
                  <button onclick="openQr('${kind}','${x.id}')">QR</button>
                  ${kind==='spool'
                    ? `<button onclick="quickLevel('${x.id}')">Hoeveelheid</button><button onclick="openSpool('${x.id}')">Open</button>`
                    : `<button onclick="openRefill('${x.id}')">Open</button>`}
                  <button class="danger-button" onclick="removeStockItem('${kind}','${x.id}')">Verwijderen</button>
                </div>
              </div>
            `)
        ).join('')}
      `).join('')}
    </div>
  `).join('');
}

function stockNumberPageHtml(items,kind,query,mode){
  const q=(query||'').trim().toLowerCase();
  const filtered=items.filter(x=>{
    const f=filament(x.filamentId);
    const hay=`${x.number||''} ${f?.category||''} ${f?.type||''} ${f?.color||''}`.toLowerCase();
    return !q||hay.includes(q);
  });

  const sorted=[...filtered].sort((a,b)=>{
    const cmp=String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true});
    return mode==='number-desc'?-cmp:cmp;
  });

  if(!sorted.length){
    return `<div class="note">Geen ${kind==='spool'?'spoelen':'refills'} gevonden.</div>`;
  }

  return sorted.map(x=>{
    const f=filament(x.filamentId);
    const category=f?.category||'';
    const type=f?.type||'';
    const color=f?.color||'';
    return `
      <div class="number-stock-row category-data-row" data-category="${esc(category)}">
        <div class="number-stock-info">
          <strong class="number-stock-number">${esc(x.number)}</strong>
          <div class="number-stock-filament">${esc(category)} · ${esc(type)} · ${esc(color)}</div>
          ${kind==='spool'?`<div class="number-stock-level">${Number(x.level)||0}%</div>`:''}
        </div>
        <div class="number-stock-actions">
          <input class="label-select" type="checkbox" data-kind="${kind}" data-id="${x.id}" aria-label="Selecteer ${esc(x.number)}">
          <button onclick="openQr('${kind}','${x.id}')">QR</button>
          ${kind==='spool'
            ? `<button onclick="quickLevel('${x.id}')">Hoeveelheid</button><button onclick="openSpool('${x.id}')">Open</button>`
            : `<button onclick="openRefill('${x.id}')">Open</button>`}
          <button class="danger-button" onclick="removeStockItem('${kind}','${x.id}')">Verwijderen</button>
        </div>
      </div>`;
  }).join('');
}

function renderSpools(){
  const mode=document.getElementById('spoolSort')?.value||'filament';
  spoolList.innerHTML=mode==='filament'
    ? stockPageHtml(state.spools,'spool',spoolSearch?.value||'')
    : stockNumberPageHtml(state.spools,'spool',spoolSearch?.value||'',mode);
}

function renderRefills(){
  const mode=document.getElementById('refillSort')?.value||'filament';
  refillList.innerHTML=mode==='filament'
    ? stockPageHtml(state.refills,'refill',refillSearch?.value||'')
    : stockNumberPageHtml(state.refills,'refill',refillSearch?.value||'',mode);
}
document.querySelectorAll('[data-stock-mode]').forEach(b=>b.onclick=()=>{stockMode=b.dataset.stockMode;renderStock()});
stockSearch.oninput=renderStock;
document.getElementById('stockSort').onchange=e=>{stockSortMode=e.target.value;renderStock()};


let manualOrderPendingId=null;

const manualOrderAddBtnEl=$('manualOrderAddBtn');
const manualOrderDialogEl=$('manualOrderDialog');
const manualOrderFormEl=$('manualOrderForm');
const manualOrderFilamentEl=$('manualOrderFilament');
const manualOrderQtyEl=$('manualOrderQty');

function ensureManualOrderList(){
  if(!Array.isArray(state.manualOrderList))state.manualOrderList=[];
}

manualOrderAddBtnEl.onclick=()=>{
  if(!state.catalog.length)return alert('Maak eerst een filament aan.');
  ensureManualOrderList();
  fillFilamentSelect(manualOrderFilamentEl,state.catalog[0].id);
  manualOrderQtyEl.value='1';
  manualOrderDialogEl.showModal();
};

manualOrderFormEl.onsubmit=e=>{
  e.preventDefault();
  ensureManualOrderList();

  const filamentId=manualOrderFilamentEl.value;
  const quantity=Math.max(1,Math.floor(Number(manualOrderQtyEl.value)||1));
  if(!filamentId)return;

  const existing=state.manualOrderList.find(x=>x.filamentId===filamentId);
  if(existing){
    existing.quantity=Number(existing.quantity||0)+quantity;
  }else{
    state.manualOrderList.push({id:uid(),filamentId,quantity});
  }

  manualOrderDialogEl.close();
  save();
};

function removeManualOrderItem(id){
  ensureManualOrderList();
  state.manualOrderList=state.manualOrderList.filter(x=>x.id!==id);
  save();
}

function createManualOrderFor(entryId,fid,qty){
  manualOrderPendingId=entryId;
  fillFilamentSelect(oFilament,fid);
  oQuantity.value=qty;
  oSupplier.value=filament(fid)?.supplier||'';
  orderDialog.showModal();
}

function renderOrderList(){
  ensureManualOrderList();
  const q=orderListSearch.value.toLowerCase();

  const automatic=state.catalog
    .map(f=>({kind:'auto',f,needed:toOrder(f)}))
    .filter(x=>x.needed>0&&(!q||label(x.f).toLowerCase().includes(q)));

  const manual=state.manualOrderList
    .map(entry=>({kind:'manual',entry,f:filament(entry.filamentId),needed:Number(entry.quantity||0)}))
    .filter(x=>x.f&&x.needed>0&&(!q||label(x.f).toLowerCase().includes(q)));

  const items=[...automatic,...manual].sort((a,b)=>
    a.f.category.localeCompare(b.f.category,'nl')||
    a.f.type.localeCompare(b.f.type,'nl')||
    a.f.color.localeCompare(b.f.color,'nl')||
    a.kind.localeCompare(b.kind,'nl')
  );

  orderList.innerHTML=items.map(x=>{
    if(x.kind==='manual'){
      return `<div class="item-row category-data-row" data-category="${esc(x.f.category)}">
        <div>
          <strong>${esc(label(x.f))}</strong>
          <div class="item-meta">Leverancier: ${esc(x.f.supplier||'—')} · Ref.: ${esc(x.f.supplierRef||'—')}<br>Handmatig toegevoegd · Aantal: ${x.needed}</div>
        </div>
        <div class="item-actions">
          <button onclick="createManualOrderFor('${x.entry.id}','${x.f.id}',${x.needed})">Bestellen</button>
          <button class="danger-button" onclick="removeManualOrderItem('${x.entry.id}')">Verwijderen</button>
        </div>
      </div>`;
    }

    return `<div class="item-row category-data-row" data-category="${esc(x.f.category)}">
      <div>
        <strong>${esc(label(x.f))}</strong>
        <div class="item-meta">Leverancier: ${esc(x.f.supplier||'—')} · Ref.: ${esc(x.f.supplierRef||'—')}<br>Nog bestellen: ${x.needed}</div>
      </div>
      <div class="item-actions"><button onclick="createOrderFor('${x.f.id}',${x.needed})">Bestellen</button></div>
    </div>`;
  }).join('')||'<div class="note">Niets te bestellen.</div>';
}
orderListSearch.oninput=renderOrderList;
function createOrderFor(fid,qty){manualOrderPendingId=null;fillFilamentSelect(oFilament,fid);oQuantity.value=qty;oSupplier.value=filament(fid)?.supplier||'';orderDialog.showModal()}
function renderOrders(){
  const q=ordersSearch.value.toLowerCase();
  const openOrders=state.orders.filter(o=>{
    const fullyDelivered=o.received>=o.quantity || o.status==='Geleverd';
    if(fullyDelivered)return false;
    return !q || o.supplier.toLowerCase().includes(q);
  });

  ordersList.innerHTML=openOrders.map(o=>`<div class="item-row"><div><strong>${esc(label(filament(o.filamentId)))}</strong><div class="item-meta">${esc(o.supplier)} · ${o.received}/${o.quantity} ontvangen</div></div><div class="item-actions">${o.received<o.quantity?`<button onclick="receiveOrder('${o.id}')">Ontvangen</button>`:''}</div></div>`).join('')||'<div class="note">Geen openstaande bestellingen.</div>';
}
ordersSearch.oninput=renderOrders;
function receiveOrder(id){const o=state.orders.find(x=>x.id===id);const open=o.quantity-o.received;const n=Number(prompt(`Aantal ontvangen (max ${open})`,open));if(!n||n<1||n>open)return;o.received+=n;for(let i=0;i<n;i++)state.refills.push({id:uid(),number:nextNumber('R',state.refills),filamentId:o.filamentId});if(o.received===o.quantity)o.status='Geleverd';save()}


function deleteFilament(id){
  const f=filament(id);
  if(!f)return;

  const spoolCount=state.spools.filter(s=>s.filamentId===id).length;
  const refillCount=state.refills.filter(r=>r.filamentId===id).length;

  if(spoolCount>0 || refillCount>0){
    const parts=[];
    if(spoolCount>0)parts.push(`${spoolCount} spoel${spoolCount===1?'':'en'}`);
    if(refillCount>0)parts.push(`${refillCount} refill${refillCount===1?'':'s'}`);

    alert(`Dit filament kan niet verwijderd worden.\n\nHet wordt nog gebruikt door ${parts.join(' en ')}.`);
    return;
  }

  const confirmed=confirm(`Filament verwijderen?\n\n${label(f)}\n\nDe kleur blijft beschikbaar in de bibliotheek.`);
  if(!confirmed)return;

  state.catalog=state.catalog.filter(item=>item.id!==id);
  log(`${label(f)} verwijderd`,id);
  save();

  if(typeof showAppToast==='function'){
    showAppToast(`✓ ${label(f)} is verwijderd.`);
  }else{
    alert(`${label(f)} is verwijderd.`);
  }
}

function openDetail(id){previousView=currentView;currentView='detail';const f=filament(id);detailContent.innerHTML=`<div class="panel"><h2>${esc(label(f))}</h2><div class="summary-grid"><div class="summary-card"><span>Op spoel</span><strong>${Math.round(spoolStock(f.id)*100)}%</strong></div><div class="summary-card"><span>Refills</span><strong>${refillCount(f.id)}</strong></div><div class="summary-card"><span>Minimum</span><strong>${f.min}</strong></div><div class="summary-card"><span>Gewenst</span><strong>${f.target}</strong></div></div></div>`;setView('detail')}
backFromDetail.onclick=()=>setView(previousView);


let qrScanner=null;
let qrScannerRunning=false;
let refillLinkMode='manual';
let refillScanPhase=null;

function parseQrCode(value){
  const text=String(value||'').trim();
  const parts=text.split(':');
  return parts.length===3 && parts[0]==='filament-manager'
    ? parts[2].toUpperCase()
    : text.toUpperCase();
}

function handleScannedCode(value){
  const code=parseQrCode(value);
  const spool=state.spools.find(x=>String(x.number).toUpperCase()===code);
  const refill=state.refills.find(x=>String(x.number).toUpperCase()===code);

  if(refillLinkMode==='scan' && refillScanPhase){
    if(refillScanPhase==='spool'){
      if(!spool){
        fillModeStatus.textContent='Dit is geen geldige spoel. Scan de QR-code van de te wisselen spoel.';
        setTimeout(()=>startQrScanner(),250);
        return;
      }
      quickFillSpool.value=spool.number;
      refillScanPhase='refill';
      fillModeStatus.textContent=`Spoel ${spool.number} gekozen (${Number(spool.level)||0}%). Scan nu de QR-code van de refill.`;
      scannerStatus.textContent=`Spoel ${spool.number} gekozen. Scan nu een refill.`;
      setTimeout(()=>startQrScanner(),250);
      return;
    }

    if(refillScanPhase==='refill'){
      if(!refill){
        fillModeStatus.textContent='Dit is geen geldige refill. Scan de QR-code van de refill.';
        setTimeout(()=>startQrScanner(),250);
        return;
      }
      quickFillRefill.value=refill.number;
      refillScanPhase=null;
      fillModeStatus.textContent=`Spoel ${quickFillSpool.value} en refill ${refill.number} gekozen. Tik op Koppelen om te bevestigen.`;
      scannerStatus.textContent=`Refill ${refill.number} gekozen. Tik op Koppelen.`;
      return;
    }
  }

  if(spool){
    setView('voorraad');
    openSpool(spool.id);
    return;
  }

  if(refill){
    setView('voorraad');
    openRefill(refill.id);
    return;
  }

  scannerStatus.textContent=`Code ${code} niet gevonden.`;
  alert('Code niet gevonden.');
}

async function startQrScanner(){
  if(qrScannerRunning)return;

  if(typeof Html5Qrcode==='undefined'){
    scannerStatus.textContent='De scannerbibliotheek kon niet geladen worden. Controleer de internetverbinding.';
    return;
  }

  try{
    qrReader.classList.remove('hidden');
    qrScanner=new Html5Qrcode('qrReader');

    scannerStatus.textContent='Camera wordt geopend...';

    await qrScanner.start(
      {facingMode:'environment'},
      {
        fps:10,
        aspectRatio:1.0,
        qrbox:(width,height)=>{
          const size=Math.floor(Math.min(width,height)*0.72);
          return {width:size,height:size};
        }
      },
      async decodedText=>{
        await stopQrScanner();
        handleScannedCode(decodedText);
      },
      ()=>{}
    );

    qrScannerRunning=true;
    scannerStatus.textContent='Camera actief. Richt de QR-code binnen het kader.';
  }catch(error){
    qrScannerRunning=false;
    qrReader.classList.add('hidden');
    scannerStatus.textContent='Camera kon niet worden geopend. Controleer cameratoegang in Safari.';
  }
}

async function stopQrScanner(){
  if(qrScanner){
    try{
      if(qrScannerRunning)await qrScanner.stop();
      await qrScanner.clear();
    }catch{}
  }

  qrScanner=null;
  qrScannerRunning=false;
  qrReader.classList.add('hidden');
  scannerStatus.textContent='Scanner gestopt.';
}

startScannerBtn.onclick=startQrScanner;
stopScannerBtn.onclick=stopQrScanner;

manualScanBtn.onclick=()=>{const code=parseQrCode(manualScanCode.value);const s=state.spools.find(x=>x.number===code);if(s){setView('voorraad');openSpool(s.id);return}const r=state.refills.find(x=>x.number===code);if(r){setView('voorraad');openRefill(r.id);return}alert('Code niet gevonden.')}
function setRefillLinkMode(mode){
  refillLinkMode=mode;
  refillScanPhase=null;
  fillManualModeBtn.classList.toggle('active',mode==='manual');
  fillScanModeBtn.classList.toggle('active',mode==='scan');
  fillStartScanBtn.classList.toggle('hidden',mode!=='scan');
  quickFillSpool.readOnly=mode==='scan';
  quickFillRefill.readOnly=mode==='scan';

  if(mode==='manual'){
    fillModeStatus.textContent='Vul de spoel en refill manueel in.';
  }else{
    quickFillSpool.value='';
    quickFillRefill.value='';
    fillModeStatus.textContent='Tik op Start scan. Scan eerst de te wisselen spoel en daarna de refill.';
  }
}

fillManualModeBtn.onclick=()=>setRefillLinkMode('manual');
fillScanModeBtn.onclick=()=>setRefillLinkMode('scan');

fillStartScanBtn.onclick=async()=>{
  quickFillSpool.value='';
  quickFillRefill.value='';
  refillScanPhase='spool';
  fillModeStatus.textContent='Scan de QR-code van de te wisselen spoel.';
  scannerStatus.textContent='Scan de QR-code van de te wisselen spoel.';
  await startQrScanner();
};

quickFillBtn.onclick=()=>{
  const s=state.spools.find(x=>x.number===quickFillSpool.value.trim().toUpperCase());
  const r=state.refills.find(x=>x.number===quickFillRefill.value.trim().toUpperCase());
  if(!s||!r)return alert('Spoel of refill niet gevonden.');

  const spoolFilament=filament(s.filamentId);
  const refillFilament=filament(r.filamentId);
  if(!spoolFilament||!refillFilament)return alert('Filamentgegevens van spoel of refill ontbreken.');

  if(s.filamentId!==r.filamentId){
    alert(
      `Verkeerde refill.\n\n`+
      `Spoel ${s.number}: ${label(spoolFilament)}\n`+
      `Refill ${r.number}: ${label(refillFilament)}\n\n`+
      `De refill moet exact hetzelfde filament zijn als het filament op de spoel.\n`+
      `Gebruik voor een ander filament een nieuw spoelnummer.`
    );
    return;
  }

  if(Number(s.level)!==0){
    const ok=confirm(`Spoel ${s.number} staat nog op ${Number(s.level)||0}%. Toch deze refill koppelen?`);
    if(!ok)return;
  }

  s.filamentId=r.filamentId;
  s.level=100;
  state.refills=state.refills.filter(x=>x.id!==r.id);
  log(`Refill ${r.number} gekoppeld aan ${s.number}`,s.filamentId);
  quickFillSpool.value='';
  quickFillRefill.value='';
  refillScanPhase=null;
  save();
  fillModeStatus.textContent=refillLinkMode==='scan'
    ? 'Koppeling voltooid. Tik op Start scan voor een volgende wissel.'
    : 'Koppeling voltooid. Vul de volgende spoel en refill manueel in.';
  showAppToast(`✓ Spoel ${s.number} is succesvol aangevuld met refill ${r.number}.`);
}

function libraryValues(kind){if(kind==='types'){const a=[];Object.values(state.libraries.types).forEach(v=>v.forEach(x=>pushUnique(a,x)));return a}return state.libraries[kind]||[]}
function usage(kind,v){return state.catalog.filter(f=>kind==='colors'?f.color===v:kind==='types'?f.type===v:kind==='brands'?f.brand===v:kind==='suppliers'?f.supplier===v:f.category===v).length}
function renderLibraries(){document.querySelectorAll('[data-library-kind]').forEach(b=>b.classList.toggle('active',b.dataset.libraryKind===activeLibraryKind));const q=librarySearch.value.toLowerCase(),vals=libraryValues(activeLibraryKind).filter(v=>!q||v.toLowerCase().includes(q)).sort((a,b)=>a.localeCompare(b,'nl'));libraryManagerList.innerHTML=vals.map(v=>`<div class="library-row ${activeLibraryKind==='categories'?'category-data-row':''}" ${activeLibraryKind==='categories'?`data-category="${esc(v)}"`:''}><div><strong>${esc(v)}</strong><div class="item-meta">${usage(activeLibraryKind,v)} filament(en)</div></div><div class="item-actions"><button onclick="editLibrary('${encodeURIComponent(v)}')">Wijzig</button><button onclick="deleteLibrary('${encodeURIComponent(v)}')">Verwijder</button></div></div>`).join('')||'<div class="note">Geen waarden.</div>'}
document.querySelectorAll('[data-library-kind]').forEach(b=>b.onclick=()=>{activeLibraryKind=b.dataset.libraryKind;renderLibraries()});librarySearch.oninput=renderLibraries;
addLibraryValueBtn.onclick=()=>{editingLibraryValue=null;libraryTitle.textContent='Nieuwe waarde';libraryValueInput.value='';libraryDialog.showModal()}
function editLibrary(v){editingLibraryValue=decodeURIComponent(v);libraryTitle.textContent='Waarde wijzigen';libraryValueInput.value=editingLibraryValue;libraryDialog.showModal()}
function replaceEverywhere(kind,oldV,newV){state.catalog.forEach(f=>{if(kind==='colors'&&f.color===oldV)f.color=newV;if(kind==='types'&&f.type===oldV)f.type=newV;if(kind==='brands'&&f.brand===oldV)f.brand=newV;if(kind==='suppliers'&&f.supplier===oldV)f.supplier=newV;if(kind==='categories'&&f.category===oldV)f.category=newV})}
libraryForm.onsubmit=e=>{e.preventDefault();const v=libraryValueInput.value.trim();if(!v)return;if(editingLibraryValue){replaceEverywhere(activeLibraryKind,editingLibraryValue,v);const arr=libraryValues(activeLibraryKind);if(activeLibraryKind==='types'){Object.keys(state.libraries.types).forEach(c=>state.libraries.types[c]=state.libraries.types[c].map(x=>x===editingLibraryValue?v:x))}else state.libraries[activeLibraryKind]=arr.map(x=>x===editingLibraryValue?v:x)}else{if(activeLibraryKind==='types'){state.libraries.types.Andere??=[];pushUnique(state.libraries.types.Andere,v)}else pushUnique(state.libraries[activeLibraryKind],v)}libraryDialog.close();save()}
function deleteLibrary(v){v=decodeURIComponent(v);if(usage(activeLibraryKind,v)>0)return alert('Deze waarde wordt nog gebruikt. Hernoem ze eerst.');if(activeLibraryKind==='types')Object.keys(state.libraries.types).forEach(c=>state.libraries.types[c]=state.libraries.types[c].filter(x=>x!==v));else state.libraries[activeLibraryKind]=state.libraries[activeLibraryKind].filter(x=>x!==v);save()}

function renderLog(){const q=logSearch.value.toLowerCase();logList.innerHTML=state.history.slice().reverse().filter(h=>!q||h.message.toLowerCase().includes(q)).map(h=>`<div class="item-row"><div><strong>${new Date(h.date).toLocaleString('nl-BE')}</strong><div class="item-meta">${esc(h.message)}</div></div></div>`).join('')||'<div class="note">Geen logboekregels.</div>'}
logSearch.oninput=renderLog;

createBackupBtn.onclick=()=>{
  try{
    const backup={
      backupFormat:'filament-manager',
      backupVersion:1,
      exportedAt:new Date().toISOString(),
      appVersion:'7.2.2',
      data:state
    };
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    const url=URL.createObjectURL(blob);
    a.href=url;
    a.download=`FilamentManager_Backup_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    backupStatus.textContent='Back-up gemaakt.';
  }catch(error){
    backupStatus.textContent='Back-up maken mislukt.';
    alert(`Back-up maken mislukt: ${error.message}`);
  }
}
function normalizeBackupData(raw){
  const source=raw?.backupFormat==='filament-manager' && raw?.data ? raw.data : raw;

  if(!source || typeof source!=='object' || Array.isArray(source)){
    throw new Error('Het bestand bevat geen Filament Manager-gegevens.');
  }

  const normalized={
    ...fresh(),
    ...source,
    catalog:Array.isArray(source.catalog)?source.catalog:[],
    spools:Array.isArray(source.spools)?source.spools:[],
    refills:Array.isArray(source.refills)?source.refills:[],
    orders:Array.isArray(source.orders)?source.orders:[],
    history:Array.isArray(source.history)?source.history:[],
    libraries:{
      ...structuredClone(DEFAULTS),
      ...(source.libraries||{}),
      types:{
        ...structuredClone(DEFAULTS.types),
        ...((source.libraries||{}).types||{})
      }
    }
  };

  // Oude enkelvoudige bestellingen en ontbrekende velden veilig aanvullen.
  normalized.spools=normalized.spools.map(s=>({
    ...s,
    status:s.status||'active',
    level:Number(s.level??100)
  }));

  normalized.orders=normalized.orders.map(o=>({
    ...o,
    quantity:Number(o.quantity??1),
    received:Number(o.received??0),
    status:o.status||'Besteld'
  }));

  return normalized;
}

restoreBackupInput.onchange=async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file)return;

  const lines=[];
  const add=line=>{
    lines.push(line);
    if(window.backupDiagnosis)backupDiagnosis.textContent=lines.join('\n');
  };

  add(`Bestandsnaam: ${file.name}`);
  add(`Bestandsgrootte: ${file.size} bytes`);
  add(`Bestandstype: ${file.type||'(onbekend)'}`);
  add(`Laatst gewijzigd: ${file.lastModified?new Date(file.lastModified).toLocaleString('nl-BE'):'onbekend'}`);

  let text='';
  try{
    text=await file.text();
    add(`Tekens ingelezen: ${text.length}`);
    add(`Begint met: ${JSON.stringify(text.slice(0,100))}`);
    add(`Eindigt met: ${JSON.stringify(text.slice(-100))}`);
    add(`Begint met "{": ${text.trimStart().startsWith('{')?'ja':'nee'}`);
    add(`Eindigt met "}": ${text.trimEnd().endsWith('}')?'ja':'nee'}`);
  }catch(error){
    add(`Fout bij lezen: ${error.name}: ${error.message}`);
    backupStatus.textContent='Bestand kon niet volledig worden gelezen.';
    alert(`Bestand lezen mislukt:\n${error.message}`);
    return;
  }

  let parsed;
  try{
    parsed=JSON.parse(text);
    add('JSON.parse: geslaagd');
  }catch(error){
    add('JSON.parse: MISLUKT');
    add(`Parserfout: ${error.name}: ${error.message}`);
    if(/EOF|end of JSON|unterminated/i.test(error.message)){
      add('Interpretatie: het ingelezen bestand lijkt afgebroken of onvolledig.');
    }
    backupStatus.textContent='JSON kon niet worden geparseerd.';
    alert(`JSON parse-fout:\n${error.message}\n\nOpen Meer → Back-up → Importdiagnose voor details.`);
    return;
  }

  let restored;
  try{
    restored=normalizeBackupData(parsed);
    add('Back-upstructuur: herkend');
    add(`Filamenten: ${restored.catalog.length}`);
    add(`Spoelen: ${restored.spools.length}`);
    add(`Refills: ${restored.refills.length}`);
    add(`Bestellingen: ${restored.orders.length}`);
    add(`Historiekregels: ${restored.history.length}`);
  }catch(error){
    add('Structuurcontrole: MISLUKT');
    add(`Fout: ${error.name}: ${error.message}`);
    backupStatus.textContent='Back-upstructuur niet herkend.';
    alert(`Back-up niet herkend:\n${error.message}`);
    return;
  }

  const summary=`${restored.catalog.length} filamenten, ${restored.spools.length} spoelen en ${restored.refills.length} refills`;
  if(!confirm(`Deze back-up bevat ${summary}.\n\nHuidige gegevens vervangen?`)){
    add('Import door gebruiker geannuleerd.');
    backupStatus.textContent='Herstel geannuleerd.';
    return;
  }

  const previousState=state;
  try{
    state=restored;
    localStorage.setItem(KEY,JSON.stringify(state));
    renderAll();
    add('Opslaan in browser: geslaagd');
    add('Schermen opnieuw opbouwen: geslaagd');
    backupStatus.textContent=`Back-up teruggezet: ${summary}.`;
    alert('Back-up succesvol teruggezet.');
  }catch(error){
    add('Verwerken/opslag: MISLUKT');
    add(`Fout: ${error.name}: ${error.message}`);
    state=previousState;
    localStorage.setItem(KEY,JSON.stringify(state));
    try{renderAll()}catch{}
    backupStatus.textContent='Terugzetten mislukt; oude gegevens zijn behouden.';
    alert(`De JSON is geldig, maar verwerken mislukte:\n${error.message}`);
  }
}

globalSearch.oninput=()=>{const q=globalSearch.value.toLowerCase();if(!q){globalResults.classList.add('hidden');return}const rows=[];state.catalog.forEach(f=>{if(label(f).toLowerCase().includes(q))rows.push({t:label(f),m:'Filament',a:()=>openDetail(f.id)})});state.spools.forEach(s=>{if(s.number.toLowerCase().includes(q))rows.push({t:s.number,m:'Spoel',a:()=>openSpool(s.id)})});state.refills.forEach(r=>{if(r.number.toLowerCase().includes(q))rows.push({t:r.number,m:'Refill',a:()=>openRefill(r.id)})});globalResults.innerHTML=rows.map((r,i)=>`<div class="search-result" data-i="${i}"><strong>${esc(r.t)}</strong><div class="item-meta">${r.m}</div></div>`).join('')||'<div class="search-result">Geen resultaten</div>';globalResults.classList.remove('hidden');globalResults.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>rows[Number(x.dataset.i)].a())}


function qrPayload(kind,number){return `filament-manager:${kind}:${number}`}
function qrImageUrl(kind,number){return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(qrPayload(kind,number))}`}
function getQrItem(kind,id){return kind==='spoel'?state.spools.find(x=>x.id===id):state.refills.find(x=>x.id===id)}
function openQr(kind,id){
  const item=getQrItem(kind,id);if(!item)return;
  const f=filament(item.filamentId);
  qrDialogTitle.textContent=`QR-sticker ${item.number}`;
  qrImage.src=qrImageUrl(kind,item.number);
  qrNumber.textContent=item.number;
  qrType.textContent=f?`${f.category} ${f.type}`:'';
  qrColor.textContent=f?.color||'';
  qrSupplier.textContent=f?.supplier||f?.brand||'';
  qrReference.textContent=f?.supplierRef?`Ref. ${f.supplierRef}`:'';
  qrKind.textContent=kind;
  qrDialog.showModal();
}

function labelHtml(i){
  return `<div class="label">
    <img src="${qrImageUrl(i.kind,i.number)}" alt="QR">
    <div class="number">${esc(i.number)}</div>
    <div class="divider"></div>
    <div class="main">${esc(i.category)} ${esc(i.type)}</div>
    <div class="line">${esc(i.color)}</div>
    <div class="line">${esc(i.supplier)}</div>
    <div class="small">${i.reference?`Ref. ${esc(i.reference)}`:''}</div>
    <div class="kind">${esc(i.kind)}</div>
  </div>`;
}

function openLabelPrintWindow(items,format='a4'){
  const win=window.open('','_blank');
  if(!win){
    alert('Sta pop-ups toe om stickers af te drukken.');
    return;
  }

  const html=items.map(labelHtml).join('');

  win.document.write(`<!doctype html>
  <html lang="nl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Filamentstickers</title>
    <style>
      *{box-sizing:border-box}
      @page{size:A4 portrait;margin:10mm}
      html,body{margin:0;padding:0;background:#fff}
      body{
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
        color:#000;
      }
      .sheet{
        display:grid;
        grid-template-columns:55mm 55mm 55mm;
        grid-auto-rows:90mm;
        gap:0;
        width:165mm;
        align-items:start;
        justify-content:start;
      }
      .label{
        box-sizing:border-box;
        width:55mm;
        min-width:55mm;
        max-width:55mm;
        height:90mm;
        min-height:90mm;
        max-height:90mm;
        padding:3mm;
        border:1px solid #000;
        border-radius:2mm;
        background:#fff;
        color:#000;
        overflow:hidden;
        break-inside:avoid;
        page-break-inside:avoid;
        text-align:center;
      }
      .label img{
        display:block;
        width:43mm;
        height:43mm;
        margin:0 auto 2mm;
      }
      .number{
        font-size:22pt;
        font-weight:900;
        letter-spacing:.8mm;
        line-height:1;
      }
      .divider{
        border-top:1px solid #000;
        margin:2mm 0;
      }
      .main{
        font-size:10pt;
        font-weight:800;
        line-height:1.1;
      }
      .line{
        font-size:8.5pt;
        font-weight:700;
        line-height:1.15;
        margin-top:.7mm;
      }
      .small{
        font-size:7pt;
        line-height:1.1;
        margin-top:.6mm;
        min-height:2.5mm;
      }
      .kind{
        font-size:7.5pt;
        font-weight:900;
        text-transform:uppercase;
        margin-top:1mm;
      }
      @media screen{
        body{padding:10mm;background:#eee}
        .sheet{background:#fff;min-height:277mm}
      }
      @media print{
        body{background:#fff}
        .sheet{margin:0;padding:0}
      }
    </style>
  </head>
  <body>
    <div class="sheet">${html}</div>
    <script>
      window.onload=()=>{
        const images=[...document.images];
        Promise.all(images.map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r})))
          .then(()=>{
            setTimeout(()=>{
              window.print();
              // iPhone/iPad Safari geeft niet altijd een bruikbaar afterprint-event.
              // Zodra het printvenster opnieuw zichtbaar wordt, sluiten we het.
              const closeWhenBack=()=>{
                setTimeout(()=>{ try{ window.close(); }catch(e){} },150);
              };
              window.addEventListener('afterprint',closeWhenBack,{once:true});
              document.addEventListener('visibilitychange',()=>{
                if(document.visibilityState==='visible')closeWhenBack();
              },{once:true});
              window.addEventListener('focus',closeWhenBack,{once:true});
            },250);
          });
      };
    <\/script>
  </body>
  </html>`);
  win.document.close();
}

printQrBtn.onclick=()=>{
  const kind=qrKind.textContent.trim().toLowerCase();
  const number=qrNumber.textContent.trim();
  const raw=kind==='spoel'
    ?state.spools.find(x=>x.number===number)
    :state.refills.find(x=>x.number===number);

  if(!raw)return alert('Stickergegevens niet gevonden.');
  openLabelPrintWindow([printableLabel({...raw,kind})],'a4');
};

function printableLabel(item){
  const f=filament(item.filamentId);
  return {
    kind:item.kind,
    number:item.number,
    category:f?.category||'',
    type:f?.type||'',
    color:f?.color||'',
    supplier:f?.supplier||f?.brand||'',
    reference:f?.supplierRef||''
  };
}

printSelectedLabelsBtn.onclick=()=>{
  const selected=[...document.querySelectorAll('.label-select:checked')].map(el=>{
    const raw=getQrItem(el.dataset.kind,el.dataset.id);
    return raw?printableLabel({...raw,kind:el.dataset.kind}):null;
  }).filter(Boolean);

  if(!selected.length)return alert('Selecteer eerst minstens één spoel of refill.');
  openLabelPrintWindow(selected,'a4');
};

function renderAll(){refreshDatalists();renderDashboard();renderCatalog();renderSpools();renderRefills();renderOrderList();renderOrders();renderLibraries();renderLog()}
spoolSearch.oninput=renderSpools;
refillSearch.oninput=renderRefills;
const spoolSortEl=document.getElementById('spoolSort');
const refillSortEl=document.getElementById('refillSort');
if(spoolSortEl)spoolSortEl.onchange=renderSpools;
if(refillSortEl)refillSortEl.onchange=renderRefills;

if(window.printSelectedRefillLabelsBtn){
  printSelectedRefillLabelsBtn.onclick=()=>printSelectedLabelsBtn.click();
}

renderAll();

if(window.copyDiagnosisBtn){
  copyDiagnosisBtn.onclick=async()=>{
    const text=backupDiagnosis?.textContent||'';
    try{
      await navigator.clipboard.writeText(text);
      alert('Diagnose gekopieerd.');
    }catch{
      const area=document.createElement('textarea');
      area.value=text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      alert('Diagnose gekopieerd.');
    }
  };
}

let appToastTimer=null;
function showAppToast(message){
  const toast=document.getElementById('appToast');
  if(!toast)return;
  clearTimeout(appToastTimer);
  toast.textContent=message;
  toast.classList.add('show');
  appToastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
}


function categoryColor(category){
  const key=String(category||'').trim().toUpperCase();
  const map={
    PLA:'var(--cat-pla)',
    PETG:'var(--cat-petg)',
    TPU:'var(--cat-tpu)',
    ASA:'var(--cat-asa)',
    ABS:'var(--cat-abs)',
    PA:'var(--cat-pa)',
    NYLON:'var(--cat-pa)',
    PC:'var(--cat-pc)'
  };
  return map[key]||'var(--cat-default)';
}

function applyCategoryColors(){
  document.querySelectorAll('[data-category]').forEach(el=>{
    const color=categoryColor(el.dataset.category);
    el.style.setProperty('--cat-color',color);
  });

  /* losse categorietitels, indien een scherm geen wrapper gebruikt */
  document.querySelectorAll('.category-title,.category-heading').forEach(el=>{
    if(el.closest('[data-category]'))return;
    el.style.setProperty('--cat-color',categoryColor(el.textContent.trim()));
    el.classList.add('category-accent');
  });
}

document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(applyCategoryColors));

const categoryColorObserver=new MutationObserver(()=>requestAnimationFrame(applyCategoryColors));
document.addEventListener('DOMContentLoaded',()=>{
  categoryColorObserver.observe(document.body,{childList:true,subtree:true});
});
