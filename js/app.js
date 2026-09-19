
const KEY='filament_manager_v10_0';
const SOURCE_KEYS=['filament_manager_firebase_test_v9_0_1','filament_manager_v7_1'];
const SYNC_DIRTY_KEY='filament_manager_v10_0_dirty_v1';
const DEFAULTS={categories:['PLA','PETG','TPU','ABS','ASA','Andere'],types:{PLA:['Basic','Matte'],PETG:['Basic'],TPU:['95A'],ABS:['Basic'],ASA:['Basic'],Andere:[]},colors:[],brands:['Bambu Lab'],suppliers:['Bambu Lab']};
let state=load();
if(!Array.isArray(state.rollUsage))state.rollUsage=[];
state.appVersion='10.1';
let currentView='dashboard',previousView='dashboard',stockMode='spools',stockSortMode='filament',editFilamentId=null,editSpoolId=null,editRefillId=null,activeLibraryKind='colors',editingLibraryValue=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random()}
function fresh(){return{appVersion:'10.1',catalog:[],spools:[],refills:[],orders:[],history:[],rollUsage:[],libraries:structuredClone(DEFAULTS)}}
function load(){
  try{
    const own=localStorage.getItem(KEY);
    if(own)return {...fresh(),...JSON.parse(own)};
    // Eerste start van versie 10.1: maak een kopie van de bestaande lokale gegevens.
    // Voor compatibiliteit wordt eerst een eerdere migratiekopie bekeken, daarna de 9.0.1-opslag.
    // De brongegevens zelf worden nooit overschreven.
    for(const sourceKey of SOURCE_KEYS){
      const source=localStorage.getItem(sourceKey);
      if(source){
        const copied={...fresh(),...JSON.parse(source),appVersion:'10.1'};
        localStorage.setItem(KEY,JSON.stringify(copied));
        return copied;
      }
    }
  }catch(error){console.warn('Lokale gegevens konden niet worden geladen.',error)}
  return fresh();
}
function persistLocalState(){localStorage.setItem(KEY,JSON.stringify(state))}
function markSyncDirty(){localStorage.setItem(SYNC_DIRTY_KEY,'1')}
function clearSyncDirty(){localStorage.removeItem(SYNC_DIRTY_KEY)}
function isSyncDirty(){return localStorage.getItem(SYNC_DIRTY_KEY)==='1'}
function save(){persistLocalState();markSyncDirty();renderAll();queueFirebaseWrite()}
function pushUnique(arr,v){v=String(v||'').trim();if(v&&!arr.some(x=>x.toLowerCase()===v.toLowerCase()))arr.push(v)}
function filament(id){return state.catalog.find(f=>f.id===id)}
function label(f){return f?`${f.category} · ${f.type} · ${f.color}`:''}

function filamentColorCss(name){
  const n=String(name||'').toLowerCase().trim();
  const rules=[
    [['jade white','ivory','cream','white','wit'],'#f4f1e8'],
    [['black','zwart'],'#111111'],
    [['gray','grey','grijs'],'#8b9198'],
    [['silver','zilver'],'#b8bec5'],
    [['red dark','dark red','bordeaux','burgundy'],'#7f1d1d'],
    [['scarlet','red','rood'],'#dc2626'],
    [['orange','oranje'],'#f97316'],
    [['yellow','geel'],'#facc15'],
    [['lime'],'#84cc16'],
    [['green','groen'],'#16a34a'],
    [['teal','turquoise'],'#0d9488'],
    [['cyan'],'#06b6d4'],
    [['marine blue','navy'],'#1e3a8a'],
    [['blue','blauw'],'#2563eb'],
    [['purple','paars','violet'],'#7c3aed'],
    [['magenta','fuchsia'],'#d946ef'],
    [['pink','roze'],'#ec4899'],
    [['brown','bruin'],'#92400e'],
    [['beige','tan','khaki'],'#c4a574'],
    [['gold','goud'],'#c99a20']
  ];
  for(const [keys,color] of rules) if(keys.some(k=>n.includes(k))) return color;
  return '#94a3b8';
}
function colorDotHtml(color){
  const c=filamentColorCss(color);
  return `<span class="filament-color-dot" style="--filament-color:${c}" aria-hidden="true"></span>`;
}
function filamentLabelHtml(f){
  return f?`${esc(f.category)} · ${esc(f.type)} · ${colorDotHtml(f.color)}${esc(f.color)}`:'';
}
function colorNameHtml(color){return `${colorDotHtml(color)}${esc(color)}`;}
function nextNumber(prefix,list){const nums=list.map(x=>Number(String(x.number||'').replace(/\D/g,''))).filter(Number.isFinite);return prefix+String((nums.length?Math.max(...nums):0)+1).padStart(4,'0')}
function spoolStock(fid){return state.spools.filter(s=>s.status==='active'&&s.filamentId===fid).reduce((a,s)=>a+Number(s.level||0)/100,0)}
function refillCount(fid){return state.refills.filter(r=>r.filamentId===fid).length}
function totalStock(fid){return spoolStock(fid)+refillCount(fid)}
function openOrdered(fid){return state.orders.filter(o=>o.status!=='Geleverd').reduce((a,o)=>a+(o.filamentId===fid?Math.max(0,o.quantity-o.received):0),0)}
function toOrder(f){const total=totalStock(f.id);if(total>=Number(f.min))return 0;return Math.max(0,Math.ceil(Number(f.target)-total-openOrdered(f.id)))}
function log(message,filamentId=null){state.history.push({id:uid(),date:new Date().toISOString(),message,filamentId})}
function recordRollUsage(spool,source='100% ingesteld',refillNumber=''){
  if(!spool)return;
  if(!Array.isArray(state.rollUsage))state.rollUsage=[];
  const f=filament(spool.filamentId);
  if(!f)return;
  state.rollUsage.push({
    id:uid(),
    date:new Date().toISOString(),
    spoolId:spool.id,
    spoolNumber:spool.number,
    filamentId:f.id,
    category:f.category||'',
    type:f.type||'',
    color:f.color||'',
    brand:f.brand||'',
    source,
    refillNumber:refillNumber||''
  });
}
function usageCountBetween(start,end){
  return (state.rollUsage||[]).filter(x=>{
    const d=new Date(x.date);
    return !Number.isNaN(d.getTime()) && (!start||d>=start) && (!end||d<end);
  }).length;
}

function setView(view){
  currentView=view;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view));
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  document.querySelector('.global-search')?.classList.toggle('hidden',view==='spoelen'||view==='refills');
  if(view==='statistiek' && typeof renderStatistics==='function')renderStatistics();
}
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
spoolForm.onsubmit=e=>{
  e.preventDefault();
  const previous=editSpoolId?state.spools.find(s=>s.id===editSpoolId):null;
  const o={id:editSpoolId||uid(),number:sNumber.value.trim().toUpperCase(),filamentId:sFilament.value,level:Number(sLevel.value),status:sStatus.value};
  state.spools=editSpoolId?state.spools.map(s=>s.id===editSpoolId?o:s):[...state.spools,o];
  if(Number(o.level)===100){
    if(!previous){
      recordRollUsage(o,'Nieuwe spoel');
    }else if(Number(previous.level)!==100){
      recordRollUsage(o,'Spoel naar 100%');
    }else if(confirm(`Spoel ${o.number} stond al op 100%.\n\nWil je dit registreren als een nieuwe rol op deze spoel?`)){
      recordRollUsage(o,'Nieuwe rol op bestaande spoel');
    }
  }
  log(`Spoel ${o.number} op ${o.level}%`,o.filamentId);
  spoolDialog.close();
  save();
}

function openRefill(id=null){if(!state.catalog.length)return alert('Maak eerst een filament aan.');editRefillId=id;const r=state.refills.find(x=>x.id===id);refillTitle.textContent=r?'Refill wijzigen':'Nieuwe refill';rNumber.value=r?.number||nextNumber('R',state.refills);fillFilamentSelect(rFilament,r?.filamentId||state.catalog[0].id);refillDialog.showModal()}
newRefillBtn.onclick=()=>openRefill();
refillForm.onsubmit=e=>{e.preventDefault();const o={id:editRefillId||uid(),number:rNumber.value.trim().toUpperCase(),filamentId:rFilament.value};state.refills=editRefillId?state.refills.map(r=>r.id===editRefillId?o:r):[...state.refills,o];log(`Refill ${o.number} ${editRefillId?'gewijzigd':'aangemaakt'}`,o.filamentId);refillDialog.close();save()}

newOrderBtn.onclick=()=>{manualOrderPendingId=null;if(!state.catalog.length)return alert('Maak eerst een filament aan.');fillFilamentSelect(oFilament,state.catalog[0].id);oQuantity.value=1;oSupplier.value=filament(oFilament.value)?.supplier||'';orderDialog.showModal()}
oFilament.onchange=()=>oSupplier.value=filament(oFilament.value)?.supplier||'';
orderForm.onsubmit=e=>{e.preventDefault();state.orders.push({id:uid(),filamentId:oFilament.value,quantity:Number(oQuantity.value),received:0,supplier:oSupplier.value.trim(),status:'Besteld'});if(manualOrderPendingId){ensureManualOrderList();state.manualOrderList=state.manualOrderList.filter(x=>x.id!==manualOrderPendingId);manualOrderPendingId=null;}orderDialog.close();save()}

function setDashboardLevel(id,value){
  const s=state.spools.find(x=>x.id===id);
  if(!s)return;
  const allowed=[100,75,50,25,0];
  const level=Number(value);
  if(!allowed.includes(level))return;
  s.level=level;
  if(level===100)recordRollUsage(s,'Dashboard naar 100%');
  save();
}

function renderDashboard(){
  sumSpools.textContent=state.spools.filter(s=>s.status==='active').length;
  sumRefills.textContent=state.refills.length;
  sumEmpty.textContent=state.spools.filter(s=>s.status==='active'&&Number(s.level)===0).length;
  sumLow.textContent=state.catalog.filter(f=>totalStock(f.id)<Number(f.min)).length;

  const q=dashboardSearch.value.toLowerCase(),grouped={};
  state.catalog.slice()
    .sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl'))
    .forEach(f=>{
      if(q&&!`${f.category} ${f.type} ${f.color}`.toLowerCase().includes(q))return;
      grouped[f.category]??={};
      grouped[f.category][f.type]??=[];
      const active=state.spools
        .filter(s=>s.status==='active'&&s.filamentId===f.id)
        .sort((a,b)=>a.number.localeCompare(b.number,'nl',{numeric:true}));
      if(!active.length)grouped[f.category][f.type].push({f,spool:null});
      else active.forEach(s=>grouped[f.category][f.type].push({f,spool:s}));
    });

  dashboardList.innerHTML=Object.keys(grouped).map(c=>`
    <div class="category-group dashboard-hierarchy" data-category="${esc(c)}">
      <div class="category-title">${esc(c)}</div>
      ${Object.keys(grouped[c]).map(t=>`
        <div class="type-title">${esc(t)}</div>
        <table class="dashboard-table dashboard-hierarchy-table">
          <thead>
            <tr>
              <th></th>
              <th>Spoel</th>
              <th>Hoeveelh.</th>
              <th>Refill</th>
            </tr>
          </thead>
          <tbody>
            ${grouped[c][t].map(r=>`
              <tr data-category="${esc(c)}">
                <td class="dashboard-color-name" onclick="openDetail('${r.f.id}')">${colorNameHtml(r.f.color)}</td>
                <td>${r.spool?`<button onclick="openSpool('${r.spool.id}')">${r.spool.number}</button>`:'—'}</td>
                <td>${r.spool?`<select class="dashboard-level-select" onchange="setDashboardLevel('${r.spool.id}',this.value)" aria-label="Resterend filament ${r.spool.number}">
                  ${[100,75,50,25,0].map(v=>`<option value="${v}" ${Number(r.spool.level)===v?'selected':''}>${v}%</option>`).join('')}
                </select>`:'—'}</td>
                <td>${refillCount(r.f.id)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('')}
    </div>
  `).join('')||'<div class="note">Nog geen filamenten.</div>';
}
dashboardSearch.oninput=renderDashboard;
function quickLevel(id){const s=state.spools.find(x=>x.id===id);const v=prompt(`Hoeveelheid op ${s.number}: 0, 25, 50, 75 of 100`,s.level);if(v===null)return;const n=Number(v);if(![0,25,50,75,100].includes(n))return alert('Kies 0, 25, 50, 75 of 100.');s.level=n;if(n===100)recordRollUsage(s,'Snelle aanpassing naar 100%');log(`Spoel ${s.number} aangepast naar ${n}%`,s.filamentId);save()}

function renderCatalog(){const q=catalogSearch.value.toLowerCase();const items=state.catalog.filter(f=>!q||label(f).toLowerCase().includes(q)).sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl'));catalogList.innerHTML=items.map(f=>`<div class="item-row category-data-row" data-category="${esc(f.category)}"><div><strong>${filamentLabelHtml(f)}</strong><div class="item-meta">${esc(f.brand)} · min ${f.min} · gewenst ${f.target}</div></div><div class="item-actions"><button onclick="openDetail('${f.id}')">Open</button><button onclick="openFilament('${f.id}')">Wijzig</button><button class="danger-button" onclick="deleteFilament('${f.id}')">Verwijderen</button></div></div>`).join('')||'<div class="note">Geen filamenten.</div>'}
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

function renderStock(){
  document.querySelectorAll('[data-stock-mode]').forEach(b=>b.classList.toggle('active',b.dataset.stockMode===stockMode));
  const q=stockSearch.value.toLowerCase();
  const items=sortStock((stockMode==='spools'?state.spools:state.refills).filter(x=>{
    const f=filament(x.filamentId);
    return !q||`${x.number} ${label(f)}`.toLowerCase().includes(q);
  }));
  stockList.innerHTML=items.map(x=>{
    const f=filament(x.filamentId);
    const kind=stockMode==='spools'?'spoel':'refill';
    return `<div class="item-row category-data-row" data-category="${esc(f.category)}"><div><strong>${filamentLabelHtml(f)}</strong><div class="item-meta">${x.number} · ${stockMode==='spools'?x.level+'%':'Refill'}</div></div><div class="item-actions"><input class="label-select" type="checkbox" data-kind="${kind}" data-id="${x.id}" aria-label="Selecteer ${x.number}"><button onclick="${stockMode==='spools'?`openSpool('${x.id}')`:`openRefill('${x.id}')`}">Wijzig</button><button onclick="openQr('${kind}','${x.id}')">QR</button><button class="danger-button" onclick="removeStockItem('${stockMode==='spools'?'spool':'refill'}','${x.id}')">Verwijderen</button></div></div>`;
  }).join('')||'<div class="note">Geen voorraad.</div>';
}
document.querySelectorAll('[data-stock-mode]').forEach(b=>b.onclick=()=>{stockMode=b.dataset.stockMode;renderStock()});
stockSearch.oninput=renderStock;
document.getElementById('stockSort').onchange=e=>{stockSortMode=e.target.value;renderStock()};



const COLLAPSE_KEY='filament_manager_v10_0_collapsed_v1';

function loadSeparateCollapseState(){
  try{
    const raw=JSON.parse(localStorage.getItem(COLLAPSE_KEY)||'{}');
    return {
      spool:{categories:{...(raw.spool?.categories||{})},types:{...(raw.spool?.types||{})}},
      refill:{categories:{...(raw.refill?.categories||{})},types:{...(raw.refill?.types||{})}}
    };
  }catch{
    return {
      spool:{categories:{},types:{}},
      refill:{categories:{},types:{}}
    };
  }
}

const separateCollapseState=loadSeparateCollapseState();

function saveSeparateCollapseState(){
  localStorage.setItem(COLLAPSE_KEY,JSON.stringify(separateCollapseState));
}

function separateTypeKey(category,type){
  return `${category}|||${type}`;
}

function isSeparateCategoryCollapsed(kind,category){
  return separateCollapseState[kind]?.categories?.[category]===true;
}

function isSeparateTypeCollapsed(kind,category,type){
  return separateCollapseState[kind]?.types?.[separateTypeKey(category,type)]===true;
}

function toggleSeparateCategory(kind,category){
  const bucket=separateCollapseState[kind];
  if(!bucket)return;
  bucket.categories[category]=!isSeparateCategoryCollapsed(kind,category);
  saveSeparateCollapseState();
  kind==='spool'?renderSpoolScreen():renderRefillScreen();
}

function toggleSeparateType(kind,category,type){
  const bucket=separateCollapseState[kind];
  if(!bucket)return;
  const key=separateTypeKey(category,type);
  bucket.types[key]=!isSeparateTypeCollapsed(kind,category,type);
  saveSeparateCollapseState();
  kind==='spool'?renderSpoolScreen():renderRefillScreen();
}

function groupStockForSeparateScreen(items,query,sortMode='filament'){
  const q=(query||'').trim().toLowerCase();
  const filtered=items.filter(x=>{
    const f=filament(x.filamentId);
    if(!f)return false;
    const hay=`${x.number||''} ${f.category||''} ${f.type||''} ${f.color||''}`.toLowerCase();
    return !q||hay.includes(q);
  });

  filtered.sort((a,b)=>{
    const fa=filament(a.filamentId),fb=filament(b.filamentId);
    if(sortMode==='number-asc'){
      return String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true});
    }
    if(sortMode==='number-desc'){
      return String(b.number||'').localeCompare(String(a.number||''),'nl',{numeric:true});
    }
    return (fa?.category||'').localeCompare(fb?.category||'','nl')
      ||(fa?.type||'').localeCompare(fb?.type||'','nl')
      ||(fa?.color||'').localeCompare(fb?.color||'','nl')
      ||String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true});
  });

  const grouped={};
  filtered.forEach(x=>{
    const f=filament(x.filamentId);
    grouped[f.category]??={};
    grouped[f.category][f.type]??={};
    grouped[f.category][f.type][f.color]??=[];
    grouped[f.category][f.type][f.color].push(x);
  });

  return {grouped,filtered};
}

function separateStockScreenHtml(items,kind,query,sortMode='filament'){
  const {grouped,filtered}=groupStockForSeparateScreen(items,query,sortMode);

  if(!filtered.length){
    return `<div class="note">Geen ${kind==='spool'?'spoelen':'refills'} gevonden.</div>`;
  }

  if(sortMode==='number-asc'||sortMode==='number-desc'){
    return `
      <table class="dashboard-table separate-dashboard-table separate-flat-table">
        <thead>
          <tr>
            <th class="select-col"></th>
            <th>Kleur</th>
            <th>${kind==='spool'?'Spoel':'Refill'}</th>
            ${kind==='spool'?'<th>Hoeveelh.</th>':''}
            <th>Acties</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(x=>{
            const f=filament(x.filamentId);
            return `
              <tr class="category-data-row compact-stock-row" data-category="${esc(f.category)}">
                <td class="select-col"><input class="label-select separate-label-select" type="checkbox" data-kind="${kind==='spool'?'spoel':'refill'}" data-id="${x.id}" aria-label="Selecteer ${esc(x.number)}"></td>
                <td class="separate-stock-color">${esc(f.category)} · ${esc(f.type)} · ${colorNameHtml(f.color)}</td>
                <td><strong>${esc(x.number)}</strong></td>
                ${kind==='spool'?`<td>${Number(x.level)||0}%</td>`:''}
                <td class="compact-actions">
                  <button onclick="${kind==='spool'?`openSpool('${x.id}')`:`openRefill('${x.id}')`}">Wijzig</button>
                  <button class="danger-button" onclick="removeStockItem('${kind}','${x.id}')">Verwijderen</button>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  const categories=Object.keys(grouped).sort((a,b)=>a.localeCompare(b,'nl'));

  return categories.map(category=>{
    const categoryItems=Object.values(grouped[category]).flatMap(typeGroup=>Object.values(typeGroup).flat());
    const categoryCollapsed=isSeparateCategoryCollapsed(kind,category);

    return `
      <div class="category-group separate-stock-category collapsible-stock-category" data-category="${esc(category)}">
        <button type="button"
          class="category-title collapsible-heading category-collapse-button"
          onclick="toggleSeparateCategory('${kind}','${esc(category)}')"
          aria-expanded="${categoryCollapsed?'false':'true'}">
          <span class="collapse-label"><span class="collapse-arrow">${categoryCollapsed?'›':'⌄'}</span>${esc(category)}</span>
          <span class="collapse-count">${categoryItems.length} ${kind==='spool'?(categoryItems.length===1?'spoel':'spoelen'):(categoryItems.length===1?'refill':'refills')}</span>
        </button>

        ${categoryCollapsed?'':Object.keys(grouped[category]).sort((a,b)=>a.localeCompare(b,'nl')).map(type=>{
          const typeItems=Object.values(grouped[category][type]).flat();
          const typeCollapsed=isSeparateTypeCollapsed(kind,category,type);

          return `
            <div class="collapsible-type-block">
              <button type="button"
                class="type-title collapsible-heading type-collapse-button"
                onclick="toggleSeparateType('${kind}','${esc(category)}','${esc(type)}')"
                aria-expanded="${typeCollapsed?'false':'true'}">
                <span class="collapse-label"><span class="collapse-arrow">${typeCollapsed?'›':'⌄'}</span>${esc(type)}</span>
                <span class="collapse-count">${typeItems.length} ${kind==='spool'?(typeItems.length===1?'spoel':'spoelen'):(typeItems.length===1?'refill':'refills')}</span>
              </button>

              ${typeCollapsed?'':`
                <table class="dashboard-table separate-dashboard-table">
                  <thead>
                    <tr>
                      <th class="select-col"></th>
                      <th>Kleur</th>
                      <th>${kind==='spool'?'Spoel':'Refill'}</th>
                      ${kind==='spool'?'<th>Hoeveelh.</th>':''}
                      <th>Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.keys(grouped[category][type]).sort((a,b)=>a.localeCompare(b,'nl')).flatMap(color=>
                      grouped[category][type][color]
                        .sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true}))
                        .map(x=>`
                          <tr class="category-data-row compact-stock-row" data-category="${esc(category)}">
                            <td class="select-col"><input class="label-select separate-label-select" type="checkbox" data-kind="${kind==='spool'?'spoel':'refill'}" data-id="${x.id}" aria-label="Selecteer ${esc(x.number)}"></td>
                            <td class="separate-stock-color">${colorNameHtml(color)}</td>
                            <td><strong>${esc(x.number)}</strong></td>
                            ${kind==='spool'?`<td>${Number(x.level)||0}%</td>`:''}
                            <td class="compact-actions">
                              <button onclick="${kind==='spool'?`openSpool('${x.id}')`:`openRefill('${x.id}')`}">Wijzig</button>
                              <button class="danger-button" onclick="removeStockItem('${kind}','${x.id}')">Verwijderen</button>
                            </td>
                          </tr>
                        `)
                    ).join('')}
                  </tbody>
                </table>
              `}
            </div>`;
        }).join('')}
      </div>`;
  }).join('');
}
function renderSpoolScreen(){
  const el=document.getElementById('spoolScreenList');
  if(!el)return;
  const search=document.getElementById('spoolScreenSearch');
  el.innerHTML=separateStockScreenHtml(
    state.spools.filter(s=>s.status==='active'),
    'spool',
    search?.value||'',
    document.getElementById('spoolScreenSort')?.value||'filament'
  );
}

function renderRefillScreen(){
  const el=document.getElementById('refillScreenList');
  if(!el)return;
  const search=document.getElementById('refillScreenSearch');
  el.innerHTML=separateStockScreenHtml(
    state.refills,
    'refill',
    search?.value||'',
    document.getElementById('refillScreenSort')?.value||'filament'
  );
}


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
          <strong>${filamentLabelHtml(x.f)}</strong>
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
        <strong>${filamentLabelHtml(x.f)}</strong>
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

  ordersList.innerHTML=openOrders.map(o=>`<div class="item-row"><div><strong>${filamentLabelHtml(filament(o.filamentId))}</strong><div class="item-meta">${esc(o.supplier)} · ${o.received}/${o.quantity} ontvangen</div></div><div class="item-actions">${o.received<o.quantity?`<button onclick="receiveOrder('${o.id}')">Ontvangen</button>`:''}</div></div>`).join('')||'<div class="note">Geen openstaande bestellingen.</div>';
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

function openDetail(id){
  previousView=currentView;
  currentView='detail';
  const f=filament(id);
  if(!f)return;
  const spools=state.spools.filter(s=>s.filamentId===id).sort((a,b)=>a.number.localeCompare(b.number,'nl',{numeric:true}));
  const refills=state.refills.filter(r=>r.filamentId===id).sort((a,b)=>a.number.localeCompare(b.number,'nl',{numeric:true}));
  detailContent.innerHTML=`
    <div class="panel filament-detail-card">
      <h2>${filamentLabelHtml(f)}</h2>
      <div class="summary-grid">
        <div class="summary-card"><span>Op spoel</span><strong>${Math.round(spoolStock(f.id)*100)}%</strong></div>
        <div class="summary-card"><span>Refills</span><strong>${refillCount(f.id)}</strong></div>
        <label class="summary-card editable-summary"><span>Minimum</span>
          <select id="detailMinimum">${[0,.25,.5,.75,1,1.5,2,3,4].map(v=>`<option value="${v}" ${Number(f.min)===v?'selected':''}>${String(v).replace('.',',')}</option>`).join('')}</select>
        </label>
        <label class="summary-card editable-summary"><span>Gewenst</span>
          <select id="detailTarget">${[1,2,3,4,5].map(v=>`<option value="${v}" ${Number(f.target)===v?'selected':''}>${v}</option>`).join('')}</select>
        </label>
      </div>
      <div class="detail-section">
        <h3>Spoelen</h3>
        ${spools.length?spools.map(s=>`<div class="detail-stock-row"><strong>${esc(s.number)}</strong><span>${colorNameHtml(f.color)}</span><select onchange="setDetailSpoolLevel('${s.id}',this.value)">${[100,75,50,25,0].map(v=>`<option value="${v}" ${Number(s.level)===v?'selected':''}>${v}%</option>`).join('')}</select></div>`).join(''):'<div class="note">Geen spoelen.</div>'}
      </div>
      <div class="detail-section">
        <h3>Refills</h3>
        ${refills.length?refills.map(r=>`<div class="detail-stock-row"><strong>${esc(r.number)}</strong><span>${colorNameHtml(f.color)}</span></div>`).join(''):'<div class="note">Geen refills.</div>'}
      </div>
      <div class="dialog-actions"><button class="primary" type="button" onclick="saveDetailFilament('${f.id}')">Opslaan</button></div>
    </div>`;
  setView('detail');
}
function setDetailSpoolLevel(id,value){
  const s=state.spools.find(x=>x.id===id);
  if(!s)return;
  const v=Number(value);
  if(![100,75,50,25,0].includes(v))return;
  s.level=v;
  if(v===100){
    recordRollUsage(s,'Detail naar 100%');
    log(`Spoel ${s.number} aangepast naar 100%`,s.filamentId);
    persistLocalState();
    markSyncDirty();
    queueFirebaseWrite();
  }
}
function saveDetailFilament(id){
  const f=filament(id);
  if(!f)return;
  f.min=Number(document.getElementById('detailMinimum')?.value??f.min);
  f.target=Number(document.getElementById('detailTarget')?.value??f.target);
  log(`${label(f)} voorraadinstellingen gewijzigd`,f.id);
  save();
  openDetail(id);
}
backFromDetail.onclick=()=>setView(previousView);


let qrScanner=null;
let qrScannerRunning=false;
let latestQrCode='';
let scanContext=null;
let refillLinkMode='manual';
let refillScanPhase=null;
let dashboardScannedSpoolId=null;
let confirmedQrCode='';
let refillLinkSpoolNumber='';
let scanPairConfirmed=false;
const confirmScannedPairBtn=document.getElementById('confirmScannedPairBtn');
const rescanPairBtn=document.getElementById('rescanPairBtn');

function resetScanPairConfirmation(clearValues=false){
  scanPairConfirmed=false;
  confirmScannedPairBtn.classList.add('hidden');
  rescanPairBtn.classList.add('hidden');
  if(refillLinkMode==='scan') quickFillBtn.disabled=true;
  if(clearValues){
    quickFillSpool.value='';
    quickFillRefill.value='';
    refillLinkSpoolNumber='';
  }
}

function showScanPairConfirmation(){
  if(refillLinkMode!=='scan')return;
  const spoolNumber=quickFillSpool.value.trim().toUpperCase();
  const refillNumber=quickFillRefill.value.trim().toUpperCase();
  if(!spoolNumber || !refillNumber)return;
  scanPairConfirmed=false;
  quickFillBtn.disabled=true;
  confirmScannedPairBtn.classList.remove('hidden');
  rescanPairBtn.classList.remove('hidden');
  fillModeStatus.textContent=`Controleer de scan: spoel ${spoolNumber} + refill ${refillNumber}. Tik op Scan bevestigen als dit klopt.`;
}


function parseQrCode(value){
  const text=String(value||'').trim();
  const upper=text.toUpperCase();
  const numberMatch=upper.match(/(?:^|[^A-Z0-9])([SR]\d{1,})(?=$|[^A-Z0-9])/);
  if(numberMatch) return numberMatch[1];
  const parts=text.split(':').map(part=>part.trim()).filter(Boolean);
  if(parts.length>=3 && parts[0].toLowerCase()==='filament-manager'){
    return String(parts[parts.length-1]).trim().toUpperCase();
  }
  return upper;
}

function findSpoolByQr(value){
  const code=parseQrCode(value);
  return state.spools.find(x=>String(x.number||'').trim().toUpperCase()===code) || null;
}

function findRefillByQr(value){
  const code=parseQrCode(value);
  return state.refills.find(x=>String(x.number||'').trim().toUpperCase()===code) || null;
}

async function openScanDialog(context){
  scanContext=context;
  latestQrCode='';
  confirmedQrCode='';
  scanConfirmation.classList.add('hidden');
  scanConfirmation.textContent='';

  if(context==='refill-link-spool'){
    scanDialogTitle.textContent='Spoel scannen';
    scanInstruction.innerHTML='<strong>Scan spoel</strong><span>Richt de camera op de QR-code van de spoel en druk op Scan.</span>';
    scannerStatus.textContent='Camera wordt geopend voor de spoel...';
  }else if(context==='refill-link-refill'){
    scanDialogTitle.textContent='Refill scannen';
    scanInstruction.innerHTML='<strong>Scan refill</strong><span>Richt de camera op de QR-code van de refill en druk op Scan.</span>';
    scannerStatus.textContent='Camera wordt geopend voor de refill...';
  }else{
    scanDialogTitle.textContent='Spoel scannen';
    scanInstruction.innerHTML='<strong>Scan spoel</strong><span>Richt de camera op de QR-code van de spoel en druk op Scan.</span>';
    scannerStatus.textContent='Camera wordt geopend...';
  }

  if(scanCaptureBtn){
    scanCaptureBtn.style.display=(context==='refill-link-spool' || context==='refill-link-refill')?'none':'';
    scanCaptureBtn.disabled=false;
  }
  scanDialog.showModal();
  await startQrScanner();
}

async function startQrScanner(){
  if(qrScannerRunning)return;
  const reader=document.getElementById('qrReader');
  if(reader) reader.innerHTML='';
  if(typeof Html5Qrcode==='undefined'){
    scannerStatus.textContent='De scannerbibliotheek kon niet geladen worden. Controleer de internetverbinding.';
    return;
  }
  try{
    qrScanner=new Html5Qrcode('qrReader');
    await qrScanner.start(
      {facingMode:'environment'},
      {fps:10,aspectRatio:1.0,qrbox:(width,height)=>{const size=Math.floor(Math.min(width,height)*0.72);return {width:size,height:size};}},
      decodedText=>{
        const code=parseQrCode(decodedText);
        latestQrCode=decodedText;
        confirmedQrCode=code;

        if(scanContext==='refill-link-spool'){
          const spool=findSpoolByQr(code);
          if(!spool){
            scannerStatus.textContent=`${code} gelezen, maar dit is geen geldige spoel.`;
            return;
          }
          if(scanCaptureBtn.disabled)return;
          scanCaptureBtn.disabled=true;
          quickFillSpool.value=spool.number;
          refillLinkSpoolNumber=spool.number;
          scanConfirmation.textContent=`✓ Spoel ${spool.number} succesvol gescand`;
          scanConfirmation.classList.remove('hidden');
          scannerStatus.textContent=`Spoel ${spool.number} herkend. Refillscanner wordt geopend...`;
          fillModeStatus.textContent=`Spoel ${spool.number} gescand. Scan nu de refill.`;

          // Automatisch verwerken; geen tweede druk op Scan.
          setTimeout(async()=>{
            await closeScanDialog();
            await new Promise(resolve=>setTimeout(resolve,250));
            scanCaptureBtn.disabled=false;
            await openScanDialog('refill-link-refill');
          },350);
          return;
        }

        if(scanContext==='refill-link-refill'){
          const refill=findRefillByQr(code);
          if(!refill){
            scannerStatus.textContent=`${code} gelezen, maar deze refill staat niet in de voorraad.`;
            return;
          }
          if(scanCaptureBtn.disabled)return;
          scanCaptureBtn.disabled=true;

          quickFillSpool.value=refillLinkSpoolNumber;
          quickFillRefill.value=refill.number;
          quickFillSpool.dispatchEvent(new Event('input',{bubbles:true}));
          quickFillSpool.dispatchEvent(new Event('change',{bubbles:true}));
          quickFillRefill.dispatchEvent(new Event('input',{bubbles:true}));
          quickFillRefill.dispatchEvent(new Event('change',{bubbles:true}));

          scanConfirmation.innerHTML=`✓ Spoel ${esc(refillLinkSpoolNumber)} succesvol gescand<br>✓ Refill ${esc(refill.number)} succesvol gescand`;
          scanConfirmation.classList.remove('hidden');
          scannerStatus.textContent=`Refill ${refill.number} herkend.`;
          fillModeStatus.textContent=`Spoel ${refillLinkSpoolNumber} en refill ${refill.number} succesvol gescand. Tik op Koppelen om te bevestigen.`;

          setTimeout(async()=>{
            await closeScanDialog();
            quickFillSpool.value=refillLinkSpoolNumber;
            quickFillRefill.value=refill.number;
            scanCaptureBtn.disabled=false;
          },450);
          return;
        }

        // Andere scannerfuncties blijven handmatig via Scan werken.
        scannerStatus.textContent=`QR-code spoel ${code} in beeld. Druk op Scan.`;
      },
      ()=>{}
    );
    qrScannerRunning=true;
    scannerStatus.textContent='Camera actief. Richt de QR-code binnen het kader en tik daarna op Scan.';
  }catch(error){
    qrScannerRunning=false;
    scannerStatus.textContent='Camera kon niet worden geopend. Controleer cameratoegang in Safari.';
  }
}

async function stopQrScanner(){
  const scanner=qrScanner;
  qrScanner=null;
  if(scanner){
    try{
      if(qrScannerRunning)await scanner.stop();
    }catch{}
    try{
      await scanner.clear();
    }catch{}
  }
  qrScannerRunning=false;
  latestQrCode='';
  const reader=document.getElementById('qrReader');
  if(reader) reader.innerHTML='';
}

async function closeScanDialog(){
  await stopQrScanner();
  if(scanDialog.open)scanDialog.close();
  if(scanCaptureBtn){
    scanCaptureBtn.style.display='';
    scanCaptureBtn.disabled=false;
  }
}

scanCloseBtn.onclick=closeScanDialog;

scanCaptureBtn.onclick=async()=>{
  const scanValue=confirmedQrCode || latestQrCode;
  if(!scanValue){
    scannerStatus.textContent='Nog geen QR-code herkend. Richt de camera op de code en probeer opnieuw.';
    return;
  }
  const code=parseQrCode(scanValue);

  if(scanContext==='dashboard'){
    const spool=findSpoolByQr(code);
    if(!spool){
      scannerStatus.textContent=`${code} is geen geldige spoelcode.`;
      return;
    }
    scanConfirmation.textContent=`✓ Spoel ${spool.number} succesvol gescand`;
    scanConfirmation.classList.remove('hidden');
    await new Promise(resolve=>setTimeout(resolve,350));
    await closeScanDialog();
    dashboardScannedSpoolId=spool.id;
    if(typeof openDashboardSpoolLevelDialog==='function'){
      openDashboardSpoolLevelDialog(spool);
    }
    return;
  }

  if(scanContext==='refill-link-spool'){
    const spool=findSpoolByQr(code);
    if(!spool){
      scannerStatus.textContent=`${code} is geen geldige spoelcode.`;
      return;
    }
    refillLinkSpoolNumber=spool.number;
    quickFillSpool.value=spool.number;
    fillModeStatus.textContent=`Spoel ${spool.number} gescand. Scan nu de refill.`;
    scanConfirmation.textContent=`✓ Spoel ${spool.number} succesvol gescand`;
    scanConfirmation.classList.remove('hidden');

    // Eerste scannersessie volledig afsluiten.
    await new Promise(resolve=>setTimeout(resolve,350));
    await closeScanDialog();

    // Pas na het sluiten een volledig nieuw dialoog + nieuwe scannersessie voor refill.
    await new Promise(resolve=>setTimeout(resolve,250));
    await openScanDialog('refill-link-refill');
    return;
  }

  if(scanContext==='refill-link-refill'){
    const refill=findRefillByQr(code);
    if(!refill){
      scannerStatus.textContent=`${code} werd gelezen maar is geen refill die in de voorraad staat.`;
      return;
    }

    // Waarden invullen terwijl deze tweede sessie nog actief is.
    quickFillSpool.value=refillLinkSpoolNumber;
    quickFillRefill.value=refill.number;
    quickFillSpool.dispatchEvent(new Event('change',{bubbles:true}));
    quickFillRefill.dispatchEvent(new Event('change',{bubbles:true}));

    scanConfirmation.innerHTML=`✓ Spoel ${esc(refillLinkSpoolNumber)} succesvol gescand<br>✓ Refill ${esc(refill.number)} succesvol gescand`;
    scanConfirmation.classList.remove('hidden');
    scannerStatus.textContent='Spoel en refill zijn klaar om te koppelen.';
    fillModeStatus.textContent=`Spoel ${refillLinkSpoolNumber} en refill ${refill.number} succesvol gescand. Tik op Koppelen om te bevestigen.`;

    await new Promise(resolve=>setTimeout(resolve,500));
    await closeScanDialog();

    // Waarden na sluiten nogmaals expliciet behouden.
    quickFillSpool.value=refillLinkSpoolNumber;
    quickFillRefill.value=refill.number;
    return;
  }
};

dashboardScanSpoolBtn.onclick=()=>openScanDialog('dashboard');
dashboardLevelCancelBtn.onclick=()=>dashboardLevelDialog.close();
dashboardLevelForm.onsubmit=e=>{
  e.preventDefault();
  const spool=state.spools.find(x=>x.id===dashboardScannedSpoolId);
  if(!spool)return dashboardLevelDialog.close();
  const level=Number(dashboardScannedLevel.value);
  if(![100,75,50,25,0].includes(level))return;
  spool.level=level;
  if(level===100)recordRollUsage(spool,'QR-scan naar 100%');
  log(`Spoel ${spool.number} aangepast naar ${level}%`,spool.filamentId);
  dashboardLevelDialog.close();
  dashboardScannedSpoolId=null;
  save();
};

quickFillRefill.addEventListener('change',()=>{
  if(refillLinkMode==='scan') showScanPairConfirmation();
});

confirmScannedPairBtn.onclick=()=>{
  const spoolNumber=quickFillSpool.value.trim().toUpperCase();
  const refillNumber=quickFillRefill.value.trim().toUpperCase();
  if(!spoolNumber || !refillNumber){
    fillModeStatus.textContent='Scan eerst een spoel en een refill.';
    return;
  }
  scanPairConfirmed=true;
  confirmScannedPairBtn.classList.add('hidden');
  rescanPairBtn.classList.remove('hidden');
  quickFillBtn.disabled=false;
  fillModeStatus.textContent=`Scan bevestigd: spoel ${spoolNumber} + refill ${refillNumber}. Tik nu op Koppelen.`;
};

rescanPairBtn.onclick=async()=>{
  resetScanPairConfirmation(true);
  fillModeStatus.textContent='Nieuwe scan: scan eerst de QR-code van de te wisselen spoel.';
  await openScanDialog('refill-link-spool');
};

function setRefillLinkMode(mode){
  refillLinkMode=mode;
  refillScanPhase=null;
  fillManualModeBtn.classList.toggle('active',mode==='manual');
  fillScanModeBtn.classList.toggle('active',mode==='scan');
  fillStartScanBtn.classList.toggle('hidden',mode!=='scan');
  quickFillSpool.readOnly=mode==='scan';
  quickFillRefill.readOnly=mode==='scan';
  if(mode==='manual'){
    scanPairConfirmed=false;
    confirmScannedPairBtn.classList.add('hidden');
    rescanPairBtn.classList.add('hidden');
    quickFillBtn.disabled=false;
    fillModeStatus.textContent='Vul de spoel en refill manueel in.';
  }else{
    quickFillSpool.value='';
    quickFillRefill.value='';
    resetScanPairConfirmation(false);
    fillModeStatus.textContent='Open de camera. Scan eerst de te wisselen spoel en daarna de refill.';
  }
}
fillManualModeBtn.onclick=()=>setRefillLinkMode('manual');
fillScanModeBtn.onclick=()=>setRefillLinkMode('scan');
fillStartScanBtn.onclick=async()=>{
  quickFillSpool.value='';
  quickFillRefill.value='';
  refillLinkSpoolNumber='';
  refillScanPhase=null;
  resetScanPairConfirmation(false);
  fillModeStatus.textContent='Scan eerst de QR-code van de te wisselen spoel.';
  await openScanDialog('refill-link-spool');
};

quickFillBtn.onclick=()=>{
  if(refillLinkMode==='scan' && !scanPairConfirmed){
    alert('Bevestig eerst de gescande spoel en refill met "Scan bevestigen".');
    return;
  }
  const s=state.spools.find(x=>x.number===quickFillSpool.value.trim().toUpperCase());
  const r=state.refills.find(x=>x.number===quickFillRefill.value.trim().toUpperCase());
  if(!s||!r)return alert('Spoel of refill niet gevonden.');
  const spoolFilament=filament(s.filamentId);
  const refillFilament=filament(r.filamentId);
  if(!spoolFilament||!refillFilament)return alert('Filamentgegevens van spoel of refill ontbreken.');
  if(s.filamentId!==r.filamentId){
    alert(`Verkeerde refill.\n\nSpoel ${s.number}: ${label(spoolFilament)}\nRefill ${r.number}: ${label(refillFilament)}\n\nDe refill moet exact hetzelfde filament zijn als het filament op de spoel.\nGebruik voor een ander filament een nieuw spoelnummer.`);
    return;
  }
  if(Number(s.level)!==0){
    const ok=confirm(`Spoel ${s.number} staat nog op ${Number(s.level)||0}%. Toch deze refill koppelen?`);
    if(!ok)return;
  }
  s.filamentId=r.filamentId;
  s.level=100;
  recordRollUsage(s,'Refill gekoppeld',r.number);
  state.refills=state.refills.filter(x=>x.id!==r.id);
  log(`Refill ${r.number} gekoppeld aan ${s.number}`,s.filamentId);
  quickFillSpool.value='';
  quickFillRefill.value='';
  refillScanPhase=null;
  scanPairConfirmed=false;
  confirmScannedPairBtn.classList.add('hidden');
  rescanPairBtn.classList.add('hidden');
  if(refillLinkMode==='scan') quickFillBtn.disabled=true;
  save();
  fillModeStatus.textContent=refillLinkMode==='scan'
    ? 'Koppeling voltooid. Open de camera voor een volgende wissel.'
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
      appVersion:'10.1',
      data:state
    };
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    const url=URL.createObjectURL(blob);
    a.href=url;
    const now=new Date();
    const pad=n=>String(n).padStart(2,'0');
    const backupDate=`${pad(now.getDate())}-${pad(now.getMonth()+1)}-${now.getFullYear()}`;
    const backupTime=`${pad(now.getHours())}u${pad(now.getMinutes())}`;
    a.download=`Filament_Backup_${backupDate}_${backupTime}.json`;
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
    rollUsage:Array.isArray(source.rollUsage)?source.rollUsage:[],
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
    add(`Verbruiksregistraties: ${restored.rollUsage.length}`);
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
    state.appVersion='10.1';
    save();
    add('Opslaan in browser: geslaagd');
    add('Firebase-synchronisatie: ingepland');
    add('Schermen opnieuw opbouwen: geslaagd');
    backupStatus.textContent=`Back-up teruggezet: ${summary}.`;
    alert('Back-up succesvol teruggezet.');
  }catch(error){
    add('Verwerken/opslag: MISLUKT');
    add(`Fout: ${error.name}: ${error.message}`);
    state=previousState;
    persistLocalState();
    try{renderAll()}catch{}
    backupStatus.textContent='Terugzetten mislukt; oude gegevens zijn behouden.';
    alert(`De JSON is geldig, maar verwerken mislukte:\n${error.message}`);
  }
}

globalSearch.oninput=()=>{
  const q=globalSearch.value.toLowerCase();
  if(!q){globalResults.classList.add('hidden');return}
  const rows=[];
  state.catalog.forEach(f=>{if(label(f).toLowerCase().includes(q))rows.push({html:filamentLabelHtml(f),m:'Filament',a:()=>openDetail(f.id)})});
  state.spools.forEach(s=>{if(s.number.toLowerCase().includes(q)){const f=filament(s.filamentId);rows.push({html:`${esc(s.number)}${f?` · ${filamentLabelHtml(f)}`:''}`,m:'Spoel',a:()=>openSpool(s.id)})}});
  state.refills.forEach(r=>{if(r.number.toLowerCase().includes(q)){const f=filament(r.filamentId);rows.push({html:`${esc(r.number)}${f?` · ${filamentLabelHtml(f)}`:''}`,m:'Refill',a:()=>openRefill(r.id)})}});
  globalResults.innerHTML=rows.map((r,i)=>`<div class="search-result" data-i="${i}"><strong>${r.html}</strong><div class="item-meta">${r.m}</div></div>`).join('')||'<div class="search-result">Geen resultaten</div>';
  globalResults.classList.remove('hidden');
  globalResults.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>rows[Number(x.dataset.i)].a());
}


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
  return `<div class="label ${String(i.kind).toLowerCase()==='refill'?'refill-label':''}">
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
        grid-template-columns:50mm 50mm 50mm;
        grid-auto-rows:70mm;
        gap:0;
        width:150mm;
        align-items:start;
        justify-content:start;
      }
      .label{
        box-sizing:border-box;
        width:50mm;
        min-width:50mm;
        max-width:50mm;
        height:70mm;
        min-height:70mm;
        max-height:70mm;
        padding:2.5mm;
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
        width:34mm;
        height:34mm;
        margin:0 auto 1.2mm;
      }
      .number{
        font-size:24pt;
        font-weight:900;
        letter-spacing:.5mm;
        line-height:1;
      }
      .refill-label .number{
        color:#c00000;
      }
      .divider{
        border-top:1px solid #000;
        margin:.7mm 0;
      }
      .main{
        font-size:12pt;
        font-weight:900;
        line-height:1.05;
      }
      .line{
        font-size:10pt;
        font-weight:800;
        line-height:1.05;
        margin-top:.2mm;
      }
      .small{
        font-size:6.5pt;
        line-height:1.05;
        margin-top:.2mm;
        min-height:2mm;
      }
      .kind{
        font-size:6.5pt;
        font-weight:900;
        text-transform:uppercase;
        margin-top:.2mm;
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


let statsMode='month';
let statsCursor=new Date();
statsCursor=new Date(statsCursor.getFullYear(),statsCursor.getMonth(),1);

function capFirst(s){s=String(s||'');return s?s.charAt(0).toUpperCase()+s.slice(1):s}
function statsRange(mode=statsMode,cursor=statsCursor){
  const y=cursor.getFullYear(),m=cursor.getMonth();
  if(mode==='month')return{start:new Date(y,m,1),end:new Date(y,m+1,1)};
  if(mode==='quarter'){
    const qm=Math.floor(m/3)*3;
    return{start:new Date(y,qm,1),end:new Date(y,qm+3,1)};
  }
  if(mode==='year')return{start:new Date(y,0,1),end:new Date(y+1,0,1)};
  return{start:null,end:null};
}
function statsEvents(mode=statsMode,cursor=statsCursor){
  const {start,end}=statsRange(mode,cursor);
  return (state.rollUsage||[]).filter(x=>{
    const d=new Date(x.date);
    return !Number.isNaN(d.getTime()) && (!start||d>=start) && (!end||d<end);
  });
}
function getStatsPeriodLabel(){
  const y=statsCursor.getFullYear(),m=statsCursor.getMonth();
  if(statsMode==='month')return capFirst(new Intl.DateTimeFormat('nl-BE',{month:'long',year:'numeric'}).format(statsCursor));
  if(statsMode==='quarter'){
    const qm=Math.floor(m/3)*3,q=Math.floor(qm/3)+1;
    const a=capFirst(new Intl.DateTimeFormat('nl-BE',{month:'long'}).format(new Date(y,qm,1)));
    const b=new Intl.DateTimeFormat('nl-BE',{month:'long'}).format(new Date(y,qm+2,1));
    return `Q${q} ${y}`+' · '+`${a} – ${b}`;
  }
  if(statsMode==='year')return String(y);
  return 'Totaal';
}
function sameCurrentStatsPeriod(){
  if(statsMode==='total')return true;
  const now=new Date();
  if(statsMode==='month')return statsCursor.getFullYear()===now.getFullYear()&&statsCursor.getMonth()===now.getMonth();
  if(statsMode==='quarter')return statsCursor.getFullYear()===now.getFullYear()&&Math.floor(statsCursor.getMonth()/3)===Math.floor(now.getMonth()/3);
  return statsCursor.getFullYear()===now.getFullYear();
}
function moveStatsPeriod(direction){
  if(statsMode==='month')statsCursor=new Date(statsCursor.getFullYear(),statsCursor.getMonth()+direction,1);
  else if(statsMode==='quarter')statsCursor=new Date(statsCursor.getFullYear(),statsCursor.getMonth()+3*direction,1);
  else if(statsMode==='year')statsCursor=new Date(statsCursor.getFullYear()+direction,0,1);
  renderStatistics();
}
function countCurrentRange(mode){
  const now=new Date();
  const cursor=new Date(now.getFullYear(),now.getMonth(),1);
  const {start,end}=statsRange(mode,cursor);
  return usageCountBetween(start,end);
}
function statsTimelineRows(events){
  const counts=new Map();
  const add=(key,label)=>{if(!counts.has(key))counts.set(key,{label,count:0});counts.get(key).count++};
  if(statsMode==='month'){
    events.forEach(x=>{const d=new Date(x.date);const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;add(key,new Intl.DateTimeFormat('nl-BE',{day:'numeric',month:'short'}).format(d));});
    return [...counts.values()];
  }
  if(statsMode==='quarter'){
    const y=statsCursor.getFullYear(),qm=Math.floor(statsCursor.getMonth()/3)*3;
    const rows=[];
    for(let i=0;i<3;i++)rows.push({key:`${y}-${qm+i}`,label:capFirst(new Intl.DateTimeFormat('nl-BE',{month:'long'}).format(new Date(y,qm+i,1))),count:0});
    events.forEach(x=>{const d=new Date(x.date);const row=rows.find(r=>r.key===`${d.getFullYear()}-${d.getMonth()}`);if(row)row.count++});
    return rows;
  }
  if(statsMode==='year'){
    const y=statsCursor.getFullYear(),rows=[];
    for(let m=0;m<12;m++)rows.push({key:`${y}-${m}`,label:capFirst(new Intl.DateTimeFormat('nl-BE',{month:'long'}).format(new Date(y,m,1))),count:0});
    events.forEach(x=>{const d=new Date(x.date);const row=rows[d.getMonth()];if(row)row.count++});
    return rows;
  }
  events.forEach(x=>{const y=String(new Date(x.date).getFullYear());add(y,y)});
  return [...counts.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([,v])=>v);
}
function renderStatistics(){
  if(!window.statsMonthTotal)return;
  statsMonthTotal.textContent=countCurrentRange('month');
  statsQuarterTotal.textContent=countCurrentRange('quarter');
  statsYearTotal.textContent=countCurrentRange('year');
  statsAllTotal.textContent=(state.rollUsage||[]).length;

  document.querySelectorAll('[data-stats-mode]').forEach(b=>b.classList.toggle('active',b.dataset.statsMode===statsMode));
  statsPeriodLabel.textContent=getStatsPeriodLabel();
  statsPeriodSubtitle.textContent=statsMode==='total'?'Alle geregistreerde rollen':'Elke 100%-registratie telt als 1 rol';
  statsPrevBtn.classList.toggle('hidden',statsMode==='total');
  statsNextBtn.classList.toggle('hidden',statsMode==='total');
  statsNextBtn.disabled=sameCurrentStatsPeriod();

  const events=statsEvents().slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
  statsPeriodTotal.textContent=events.length;

  const timeline=statsTimelineRows(events);
  statsTimelineTitle.textContent=statsMode==='month'?'Verbruik per dag':statsMode==='total'?'Verbruik per jaar':'Verbruik per maand';
  statsTimeline.innerHTML=timeline.length?`<table class="stats-table"><thead><tr><th>Periode</th><th class="stats-number">Rollen</th></tr></thead><tbody>${timeline.map(r=>`<tr><td>${esc(r.label)}</td><td class="stats-number"><strong>${r.count}</strong></td></tr>`).join('')}</tbody><tfoot><tr><th>Totaal</th><th class="stats-number">${events.length}</th></tr></tfoot></table>`:'<div class="note stats-empty">Nog geen verbruik geregistreerd in deze periode.</div>';

  const cats=new Map();
  events.forEach(x=>cats.set(x.category||'Onbekend',(cats.get(x.category||'Onbekend')||0)+1));
  const catRows=[...cats.entries()].sort((a,b)=>a[0].localeCompare(b[0],'nl'));
  statsCategoryTable.innerHTML=catRows.length?`<table class="stats-table"><thead><tr><th>Categorie</th><th class="stats-number">Rollen</th></tr></thead><tbody>${catRows.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="stats-number"><strong>${v}</strong></td></tr>`).join('')}</tbody><tfoot><tr><th>Totaal</th><th class="stats-number">${events.length}</th></tr></tfoot></table>`:'<div class="note stats-empty">Geen gegevens.</div>';

  const details=new Map();
  events.forEach(x=>{
    const key=[x.category||'Onbekend',x.type||'Onbekend',x.color||'Onbekend'].join('\u0001');
    if(!details.has(key))details.set(key,{category:x.category||'Onbekend',type:x.type||'Onbekend',color:x.color||'Onbekend',count:0});
    details.get(key).count++;
  });
  const detailRows=[...details.values()].sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl'));
  statsDetailTable.innerHTML=detailRows.length?`<table class="stats-table stats-detail-table"><thead><tr><th>Categorie</th><th>Type</th><th>Kleur</th><th class="stats-number">Rollen</th></tr></thead><tbody>${detailRows.map(r=>`<tr><td>${esc(r.category)}</td><td>${esc(r.type)}</td><td>${colorNameHtml(r.color)}</td><td class="stats-number"><strong>${r.count}</strong></td></tr>`).join('')}</tbody><tfoot><tr><th colspan="3">Totaal</th><th class="stats-number">${events.length}</th></tr></tfoot></table>`:'<div class="note stats-empty">Geen gegevens.</div>';

  const newest=events.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  statsUsageLog.innerHTML=newest.length?`<table class="stats-table stats-log-table"><thead><tr><th>Datum</th><th>Spoel</th><th>Filament</th><th>Registratie</th><th></th></tr></thead><tbody>${newest.map(x=>`<tr><td>${new Date(x.date).toLocaleString('nl-BE')}</td><td><strong>${esc(x.spoolNumber)}</strong></td><td>${esc(x.category)} · ${esc(x.type)} · ${colorNameHtml(x.color)}</td><td>${esc(x.source||'100% ingesteld')}${x.refillNumber?` · ${esc(x.refillNumber)}`:''}</td><td><button class="stats-delete-button" type="button" onclick="deleteRollUsage('${x.id}')">Verwijder</button></td></tr>`).join('')}</tbody></table>`:'<div class="note stats-empty">Nog geen verbruiksregistraties.</div>';
}
function deleteRollUsage(id){
  const item=(state.rollUsage||[]).find(x=>x.id===id);
  if(!item)return;
  if(!confirm(`Verbruiksregistratie van ${item.spoolNumber} verwijderen?`))return;
  state.rollUsage=state.rollUsage.filter(x=>x.id!==id);
  log(`Verbruiksregistratie ${item.spoolNumber} verwijderd`,item.filamentId||null);
  save();
}
document.querySelectorAll('[data-stats-mode]').forEach(b=>b.onclick=()=>{
  statsMode=b.dataset.statsMode;
  const now=new Date();
  statsCursor=new Date(now.getFullYear(),now.getMonth(),1);
  renderStatistics();
});
statsPrevBtn.onclick=()=>moveStatsPeriod(-1);
statsNextBtn.onclick=()=>{if(!sameCurrentStatsPeriod())moveStatsPeriod(1)};

function renderAll(){refreshDatalists();renderDashboard();renderCatalog();renderStock();renderSpoolScreen();renderRefillScreen();renderOrderList();renderOrders();renderLibraries();renderLog();renderStatistics()}

const spoolScreenSearchEl=document.getElementById('spoolScreenSearch');
const refillScreenSearchEl=document.getElementById('refillScreenSearch');
const spoolScreenSortEl=document.getElementById('spoolScreenSort');
const refillScreenSortEl=document.getElementById('refillScreenSort');
if(spoolScreenSearchEl)spoolScreenSearchEl.oninput=renderSpoolScreen;
if(refillScreenSearchEl)refillScreenSearchEl.oninput=renderRefillScreen;
if(spoolScreenSortEl)spoolScreenSortEl.onchange=renderSpoolScreen;
if(refillScreenSortEl)refillScreenSortEl.onchange=renderRefillScreen;

const printSelectedSpoolLabelsBtnEl=document.getElementById('printSelectedSpoolLabelsBtn');
const printSelectedRefillLabelsBtnEl=document.getElementById('printSelectedRefillLabelsBtn');

function printSelectedFromSeparateScreen(viewId){
  const selected=[...document.querySelectorAll(`#${viewId} .label-select:checked`)];
  if(!selected.length)return alert('Selecteer eerst minstens één sticker.');

  const otherChecked=[...document.querySelectorAll(`.label-select:checked`)].filter(x=>!x.closest(`#${viewId}`));
  otherChecked.forEach(x=>x.checked=false);
  document.getElementById('printSelectedLabelsBtn').click();
  otherChecked.forEach(x=>x.checked=true);
}

if(printSelectedSpoolLabelsBtnEl)printSelectedSpoolLabelsBtnEl.onclick=()=>printSelectedFromSeparateScreen('spoelen');
if(printSelectedRefillLabelsBtnEl)printSelectedRefillLabelsBtnEl.onclick=()=>printSelectedFromSeparateScreen('refills');



/* ============================================================
   Firebase synchronisatie - VERSIE 10.1
   ------------------------------------------------------------
   - Versie 10.1 gebruikt een eigen localStorage-sleutel.
   - Firebase gebruikt een eigen pad voor deze aangemelde gebruiker.
   - Bij eerste cloudstart zonder data worden de lokale 10.0-gegevens geüpload.
   - Daarna is Firebase de gedeelde bron en blijft localStorage de lokale cache.
   ============================================================ */
const FIREBASE_ALLOWED_UID='EOsNru7BilUx9GguaBk0QxxY9oo1';
const FIREBASE_CONFIG={
  apiKey:'AIzaSyD1tdycD-rLDVFQZSReIK4QgHN-m1JGNjA',
  authDomain:'filamentsynctest.firebaseapp.com',
  databaseURL:'https://filamentsynctest-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'filamentsynctest',
  storageBucket:'filamentsynctest.firebasestorage.app',
  messagingSenderId:'672569696347',
  appId:'1:672569696347:web:247fb11fd3d2f663f31f7e'
};
const firebaseSync={
  auth:null, db:null, ref:null, user:null, ready:false, firstSnapshot:true,
  unsubscribe:null, writeTimer:null, writing:false, lastWriteJson:'', modules:null
};
function stableStringify(value){
  if(value===null||typeof value!=='object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stableStringify(value[k])).join(',')+'}';
}
function hasMeaningfulState(data=state){
  return ['catalog','spools','refills','orders','history','rollUsage'].some(k=>Array.isArray(data?.[k])&&data[k].length>0);
}
function setFirebaseStatus(text,kind='idle'){
  const status=$('firebaseSyncStatus');
  const bar=$('firebaseSyncBarText');
  const dot=$('firebaseSyncDot');
  if(status)status.textContent=text;
  if(bar)bar.textContent=text;
  if(dot){dot.classList.remove('ok','error','busy');if(kind==='ok')dot.classList.add('ok');else if(kind==='error')dot.classList.add('error');else if(kind==='busy')dot.classList.add('busy')}
}
function setFirebaseUserUI(user){
  const login=$('firebaseLoginBox'),userBox=$('firebaseUserBox'),userText=$('firebaseUserText');
  if(login)login.classList.toggle('hidden',!!user);
  if(userBox)userBox.classList.toggle('hidden',!user);
  if(userText)userText.textContent=user?.email?`Aangemeld als ${user.email}`:'';
}
function normalizeCloudState(raw){
  const normalized=normalizeBackupData(raw);
  normalized.appVersion='10.1';
  return normalized;
}
function applyFirebaseState(raw){
  try{
    const incoming=normalizeCloudState(raw);
    if(stableStringify(incoming)===stableStringify(state)){
      clearSyncDirty();
      setFirebaseStatus('Firebase: gesynchroniseerd','ok');
      return;
    }
    state=incoming;
    persistLocalState();
    clearSyncDirty();
    renderAll();
    setFirebaseStatus('Firebase: wijziging ontvangen','ok');
  }catch(error){
    console.error(error);
    setFirebaseStatus('Firebase: ontvangen gegevens zijn ongeldig','error');
  }
}
async function writeStateToFirebase(reason='Synchroniseren'){
  if(!firebaseSync.ready||!firebaseSync.ref||!firebaseSync.modules||firebaseSync.writing)return;
  const payload=structuredClone(state);
  payload.appVersion='10.1';
  const json=stableStringify(payload);
  firebaseSync.lastWriteJson=json;
  firebaseSync.writing=true;
  setFirebaseStatus(`Firebase: ${reason.toLowerCase()}…`,'busy');
  try{
    await firebaseSync.modules.set(firebaseSync.ref,payload);
    clearSyncDirty();
    setFirebaseStatus('Firebase: gesynchroniseerd','ok');
  }catch(error){
    console.error(error);
    markSyncDirty();
    setFirebaseStatus('Firebase: synchronisatie mislukt — lokale kopie is bewaard','error');
  }finally{
    firebaseSync.writing=false;
  }
}
function queueFirebaseWrite(){
  if(!firebaseSync.ready)return;
  clearTimeout(firebaseSync.writeTimer);
  firebaseSync.writeTimer=setTimeout(()=>writeStateToFirebase('Wijzigingen opslaan'),250);
}
async function startFirebaseDataListener(user){
  if(firebaseSync.unsubscribe){firebaseSync.unsubscribe();firebaseSync.unsubscribe=null}
  firebaseSync.ready=false;
  firebaseSync.firstSnapshot=true;
  const {ref,onValue}=firebaseSync.modules;
  firebaseSync.ref=ref(firebaseSync.db,`users/${user.uid}/filamentManager/state`);
  setFirebaseStatus('Firebase: gegevens laden…','busy');

  firebaseSync.unsubscribe=onValue(firebaseSync.ref,async snapshot=>{
    const remote=snapshot.val();
    const isFirst=firebaseSync.firstSnapshot;
    firebaseSync.firstSnapshot=false;
    firebaseSync.ready=true;

    if(remote===null){
      // Eerste gebruik: de lokale 10.0-gegevens worden de startinhoud van Firebase.
      await writeStateToFirebase(hasMeaningfulState()?'Eerste lokale gegevens uploaden':'Lege database initialiseren');
      return;
    }

    const remoteJson=stableStringify(remote);
    if(remoteJson===firebaseSync.lastWriteJson){
      clearSyncDirty();
      setFirebaseStatus('Firebase: gesynchroniseerd','ok');
      return;
    }

    // Indien deze browser nog niet-verzonden lokale wijzigingen heeft, krijgen die bij herverbinden voorrang.
    if(isFirst&&isSyncDirty()){
      await writeStateToFirebase('Lokale wijzigingen hervatten');
      return;
    }

    applyFirebaseState(remote);
  },error=>{
    console.error(error);
    firebaseSync.ready=false;
    setFirebaseStatus(`Firebase: ${error.code||'verbindingsfout'} — lokale kopie actief`,'error');
  });
}
async function initFirebaseSync(){
  setFirebaseStatus('Firebase: starten…','busy');
  try{
    const [appMod,authMod,dbMod]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js')
    ]);
    const app=appMod.initializeApp(FIREBASE_CONFIG);
    const auth=authMod.getAuth(app);
    const db=dbMod.getDatabase(app);
    firebaseSync.auth=auth;
    firebaseSync.db=db;
    firebaseSync.modules={...authMod,...dbMod};
    try{await authMod.setPersistence(auth,authMod.browserLocalPersistence)}catch(error){console.warn('Auth-persistentie kon niet expliciet worden ingesteld.',error)}

    authMod.onAuthStateChanged(auth,async user=>{
      firebaseSync.user=user||null;
      if(firebaseSync.unsubscribe){firebaseSync.unsubscribe();firebaseSync.unsubscribe=null}
      firebaseSync.ready=false;
      firebaseSync.ref=null;
      firebaseSync.lastWriteJson='';
      setFirebaseUserUI(user);

      if(!user){
        setFirebaseStatus('Firebase: niet aangemeld — lokale kopie actief');
        return;
      }
      if(user.uid!==FIREBASE_ALLOWED_UID){
        setFirebaseStatus('Firebase: dit account heeft geen toegang','error');
        await authMod.signOut(auth);
        return;
      }
      await startFirebaseDataListener(user);
    });

    const loginBtn=$('firebaseLoginBtn');
    if(loginBtn)loginBtn.onclick=async()=>{
      const email=$('firebaseEmail')?.value.trim()||'';
      const password=$('firebasePassword')?.value||'';
      if(!email||!password)return setFirebaseStatus('Firebase: vul e-mailadres en wachtwoord in','error');
      loginBtn.disabled=true;
      setFirebaseStatus('Firebase: aanmelden…','busy');
      try{
        await authMod.signInWithEmailAndPassword(auth,email,password);
        if($('firebasePassword'))$('firebasePassword').value='';
      }catch(error){
        console.error(error);
        setFirebaseStatus('Firebase: aanmelden mislukt — controleer e-mailadres en wachtwoord','error');
      }finally{loginBtn.disabled=false}
    };
    const passwordEl=$('firebasePassword');
    if(passwordEl)passwordEl.addEventListener('keydown',e=>{if(e.key==='Enter')$('firebaseLoginBtn')?.click()});
    const logoutBtn=$('firebaseLogoutBtn');
    if(logoutBtn)logoutBtn.onclick=()=>authMod.signOut(auth);
    const pushBtn=$('firebasePushLocalBtn');
    if(pushBtn)pushBtn.onclick=async()=>{
      if(!firebaseSync.user)return setFirebaseStatus('Firebase: meld eerst aan','error');
      if(!confirm('Firebase herstellen vanaf de lokale kopie op dit apparaat? Dit overschrijft de huidige cloudgegevens. Gebruik dit alleen als herstelactie.'))return;
      markSyncDirty();
      await writeStateToFirebase('Cloud herstellen');
    };
  }catch(error){
    console.error(error);
    setFirebaseStatus('Firebase kon niet starten — lokale kopie blijft bruikbaar','error');
  }
}

renderAll();
persistLocalState();
initFirebaseSync();

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
