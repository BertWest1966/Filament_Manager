
const KEY='filament_manager_v5_3';
const DEFAULTS={categories:['PLA','PETG','TPU','ABS','ASA','PA / Nylon','PC','PVA','Andere'],brands:['Bambu Lab'],colors:[],suppliers:['Bambu Lab'],types:{'PLA':['Basic','Matte','Silk','CF','Glow'],'PETG':['Basic','HF','CF'],'TPU':['95A','85A'],'ABS':['Basic'],'ASA':['Basic'],'PA / Nylon':['Basic','CF'],'PC':['Basic'],'PVA':['Basic'],'Andere':[]}};
let state=loadState(),stockMode='spools',stockSortMode='filament',editFilamentId=null,editSpoolId=null,editRefillId=null,currentDetailId=null,previousView='dashboard',receiveOrderId=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

document.addEventListener('DOMContentLoaded',()=>{
  const cancel=document.getElementById('cancelFilamentBtn');
  const dialog=document.getElementById('filamentDialog');
  if(cancel&&dialog){
    cancel.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      if(dialog.open)dialog.close();
    });
  }
});
function fresh(){return{appVersion:'7.0',catalog:[],spools:[],refills:[],orders:[],history:[],libraries:structuredClone(DEFAULTS),settings:{spoolPrefix:'S',refillPrefix:'R',digits:4,defaultBrand:'Bambu Lab',defaultSupplier:'Bambu Lab'}}}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random()}
function pushUnique(a,v){v=String(v||'').trim();if(v&&!a.some(x=>x.toLowerCase()===v.toLowerCase()))a.push(v)}
function migrate(raw){
  if(!raw)return fresh();
  const d=fresh();
  d.catalog=raw.catalog||[];
  d.spools=(raw.spools||[]).map(s=>({...s,status:s.status||'active'}));
  d.refills=raw.refills||[];
  d.history=raw.history||[];
  if(raw.libraries)d.libraries={...d.libraries,...raw.libraries,types:{...d.libraries.types,...(raw.libraries.types||{})}};
  for(const f of d.catalog){pushUnique(d.libraries.categories,f.category);pushUnique(d.libraries.brands,f.brand);pushUnique(d.libraries.colors,f.color);pushUnique(d.libraries.suppliers,f.supplier);if(!d.libraries.types[f.category])d.libraries.types[f.category]=[];pushUnique(d.libraries.types[f.category],f.type)}
  const oldOrders=raw.orders||[];
  d.orders=oldOrders.map(o=>{
    if(Array.isArray(o.lines)) return {...o};
    const qty=Number(o.quantity??o.qty??0);
    return {
      id:o.id||uid(),
      supplier:o.supplier||'',
      date:o.date||'',
      expected:o.expected||'',
      reference:o.reference||'',
      status:o.status||'Besteld',
      lines:[{id:uid(),filamentId:o.filamentId,quantity:qty,received:Number(o.received||0)}]
    };
  });
  d.settings={...d.settings,...(raw.settings||{})};
  d.appVersion='7.0';
  return d;
}
function loadState(){try{return migrate(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function addLog(kind,message,filamentId=null,number=''){
  state.history.push({id:uid(),date:new Date().toISOString(),kind,message,filamentId,number});
}
function filament(id){return state.catalog.find(f=>f.id===id)}
function label(f){return f?`${f.category} | ${f.brand} ${f.type} | ${f.color}`:''}
function nextNumber(prefix,list){
  const n=list.map(x=>Number(String(x.number||'').replace(/\D/g,''))).filter(Number.isFinite);
  const digits=Number(state.settings?.digits||4);
  return prefix+String((n.length?Math.max(...n):0)+1).padStart(digits,'0');
}
function spoolStock(fid){return state.spools.filter(s=>s.status==='active'&&s.filamentId===fid).reduce((a,s)=>a+Number(s.level||0)/100,0)}
function refillCount(fid){return state.refills.filter(r=>r.filamentId===fid).length}
function totalStock(fid){return spoolStock(fid)+refillCount(fid)}
function spoolPercentage(fid){return Math.round(spoolStock(fid)*100)}
function openOrdered(fid){return state.orders.filter(o=>!['Geleverd','Geannuleerd'].includes(o.status)).reduce((sum,o)=>sum+o.lines.filter(l=>l.filamentId===fid).reduce((a,l)=>a+Math.max(0,Number(l.quantity)-Number(l.received||0)),0),0)}
function toOrder(f){const available=totalStock(f.id);if(available>=Number(f.min))return 0;return Math.max(0,Math.ceil(Number(f.target)-available-openOrdered(f.id)))}
function sortByFilament(a,b){const fa=filament(a.filamentId),fb=filament(b.filamentId);return (fa?.category||'').localeCompare(fb?.category||'','nl')||(fa?.type||'').localeCompare(fb?.type||'','nl')||(fa?.color||'').localeCompare(fb?.color||'','nl')||String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true})}
function setView(v){document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===v));document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===v))}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
function refreshLists(){}
function refreshTypeOptions(){}
function fillFilaments(el,selected=''){el.innerHTML=state.catalog.slice().sort((a,b)=>a.category.localeCompare(b.category,'nl')||a.type.localeCompare(b.type,'nl')||a.color.localeCompare(b.color,'nl')).map(f=>`<option value="${f.id}" ${f.id===selected?'selected':''}>${esc(label(f))}</option>`).join('')}

let activePicker=null;

function pickerValues(kind){
  if(kind==='category')return [...state.libraries.categories];
  if(kind==='brand')return [...state.libraries.brands];
  if(kind==='color'){
    const blocked=new Set(['white','black','wit','zwart']);
    return [...state.libraries.colors].filter(
      value=>!blocked.has(String(value||'').trim().toLowerCase())
    );
  }
  if(kind==='supplier')return [...state.libraries.suppliers];
  if(kind==='type')return [...(state.libraries.types[fCategory.value]||[])];
  return [];
}

function pickerLabel(kind){
  return {category:'Categorie',type:'Type',color:'Kleur',brand:'Merk',supplier:'Leverancier'}[kind]||'Kies';
}

function pickerInput(kind){
  return {category:fCategory,type:fType,color:fColor,brand:fBrand,supplier:fSupplier}[kind];
}

function pickerTextElement(kind){
  return {
    category:pickCategoryText,
    type:pickTypeText,
    color:pickColorText,
    brand:pickBrandText,
    supplier:pickSupplierText
  }[kind];
}

function renderPicker(){
  if(activePicker==='color'){
    const blocked=new Set(['white','black','wit','zwart']);
    state.libraries.colors=(state.libraries.colors||[]).filter(
      value=>!blocked.has(String(value||'').trim().toLowerCase())
    );
  }
  const q=pickerSearch.value.trim().toLowerCase();
  const selected=pickerInput(activePicker).value;
  const values=pickerValues(activePicker)
    .filter(v=>!q||String(v).toLowerCase().includes(q))
    .sort((a,b)=>String(a).localeCompare(String(b),'nl'));

  pickerList.innerHTML=values.map(v=>`
    <button type="button" class="picker-option ${v===selected?'selected':''}" data-value="${esc(v)}">
      <span>${esc(v)}</span><span>${v===selected?'✓':''}</span>
    </button>`).join('')||'<div class="empty">Geen resultaten.</div>';

  pickerList.querySelectorAll('.picker-option').forEach(btn=>{
    btn.onclick=()=>{
      const value=btn.dataset.value;
      pickerInput(activePicker).value=value;
      pickerTextElement(activePicker).textContent=value;

      if(activePicker==='category'){
        fType.value='';
        pickTypeText.textContent='Kies type';
      }

      pickerDialog.close();
    };
  });
}

function openPicker(kind){
  activePicker=kind;
  pickerTitle.textContent=`Kies ${pickerLabel(kind).toLowerCase()}`;
  pickerSearch.value='';
  pickerAddBtn.textContent=`+ Nieuwe ${pickerLabel(kind).toLowerCase()} toevoegen`;
  renderPicker();
  pickerDialog.showModal();
}

document.querySelectorAll('[data-picker]').forEach(btn=>{
  btn.onclick=()=>openPicker(btn.dataset.picker);
});

pickerSearch.oninput=renderPicker;
closePickerBtn.onclick=()=>pickerDialog.close();

pickerAddBtn.onclick=()=>{
  newPickerValueTitle.textContent=`Nieuwe ${pickerLabel(activePicker).toLowerCase()}`;
  newPickerValueInput.value=pickerSearch.value.trim();
  newPickerValueDialog.showModal();
};

newPickerValueForm.onsubmit=e=>{
  e.preventDefault();
  const value=newPickerValueInput.value.trim();
  if(!value)return;

  if(activePicker==='type'){
    const category=fCategory.value;
    if(!category){alert('Kies eerst een categorie.');return}
    if(!state.libraries.types[category])state.libraries.types[category]=[];
    pushUnique(state.libraries.types[category],value);
  }else{
    const map={category:'categories',brand:'brands',color:'colors',supplier:'suppliers'};
    pushUnique(state.libraries[map[activePicker]],value);
  }

  pickerInput(activePicker).value=value;
  pickerTextElement(activePicker).textContent=value;
  newPickerValueDialog.close();
  pickerDialog.close();
};

function setTapChoice(container,value){
  container.querySelectorAll('button[data-value]').forEach(btn=>{
    btn.classList.toggle('selected',String(btn.dataset.value)===String(value));
  });
}

minimumChoices.querySelectorAll('button').forEach(btn=>{
  btn.onclick=()=>{
    fMinimum.value=btn.dataset.value;
    setTapChoice(minimumChoices,btn.dataset.value);
  };
});

spoolLevelChoices.querySelectorAll('button').forEach(btn=>{
  btn.onclick=()=>{
    sLevel.value=btn.dataset.value;
    setTapChoice(spoolLevelChoices,btn.dataset.value);
  };
});

function openFilament(id=null){
  editFilamentId=id;
  const f=filament(id);

  filamentTitle.textContent=f?'Filament wijzigen':'Nieuw filament';

  fCategory.value=f?.category||state.libraries.categories[0]||'PLA';
  pickCategoryText.textContent=fCategory.value||'Kies categorie';

  fType.value=f?.type||'';
  pickTypeText.textContent=fType.value||'Kies type';

  fColor.value=f?.color||'';
  pickColorText.textContent=fColor.value||'Kies kleur';

  fBrand.value=f?.brand||localStorage.getItem('lastBrand')||state.settings.defaultBrand||'Bambu Lab';
  pickBrandText.textContent=fBrand.value||'Kies merk';

  fSupplier.value=f?.supplier||localStorage.getItem('lastSupplier')||state.settings.defaultSupplier||'Bambu Lab';
  pickSupplierText.textContent=fSupplier.value||'Kies leverancier';

  const allowed=[0,0.25,0.5,0.75,1];
  const current=Number(f?.min??1);
  const nearest=allowed.reduce((best,v)=>Math.abs(v-current)<Math.abs(best-current)?v:best,allowed[0]);
  fMinimum.value=String(nearest);
  setTapChoice(minimumChoices,String(nearest));

  fTarget.value=String(f?.target??2);
  fSupplierRef.value=f?.supplierRef||'';

  filamentDialog.showModal();
}
newFilamentBtn.onclick=()=>openFilament();
filamentForm.onsubmit=e=>{e.preventDefault();const o={id:editFilamentId||uid(),category:fCategory.value.trim(),brand:fBrand.value.trim(),type:fType.value.trim(),color:fColor.value.trim(),min:[0,0.25,0.5,0.75,1].includes(Number(fMinimum.value))?Number(fMinimum.value):0,target:Number(fTarget.value),supplier:fSupplier.value.trim(),supplierRef:fSupplierRef.value.trim()};if(!o.category||!o.brand||!o.type||!o.color){alert('Vul categorie, merk, type en kleur in.');return}pushUnique(state.libraries.categories,o.category);pushUnique(state.libraries.brands,o.brand);pushUnique(state.libraries.colors,o.color);pushUnique(state.libraries.suppliers,o.supplier);if(!state.libraries.types[o.category])state.libraries.types[o.category]=[];pushUnique(state.libraries.types[o.category],o.type);state.catalog=editFilamentId?state.catalog.map(f=>f.id===editFilamentId?o:f):[...state.catalog,o];addLog(editFilamentId?'filament_updated':'filament_created',`${o.category} ${o.type} ${o.color} ${editFilamentId?'gewijzigd':'aangemaakt'}`,o.id);filamentDialog.close();save()}
function openSpool(id=null,preset=null){if(!state.catalog.length)return alert('Maak eerst een filament aan.');editSpoolId=id;const s=state.spools.find(x=>x.id===id);spoolTitle.textContent=s?'Spoel wijzigen':'Nieuwe spoel';sNumber.value=s?.number||nextNumber(state.settings.spoolPrefix||'S',state.spools);fillFilaments(sFilament,s?.filamentId||preset||state.catalog[0].id);sLevel.value=String(s?.level??100);setTapChoice(spoolLevelChoices,sLevel.value);sStatus.value=s?.status||'active';spoolDialog.showModal()}
newSpoolBtn.onclick=()=>openSpool();
spoolForm.onsubmit=e=>{e.preventDefault();const o={id:editSpoolId||uid(),number:sNumber.value.trim().toUpperCase(),filamentId:sFilament.value,level:Number(sLevel.value),status:sStatus.value};state.spools=editSpoolId?state.spools.map(s=>s.id===editSpoolId?o:s):[...state.spools,o];addLog('spool_update',`Spoel ${o.number} ${editSpoolId?'gewijzigd':'aangemaakt'} naar ${o.level}%`,o.filamentId,o.number);spoolDialog.close();save()}
function openRefill(id=null,preset=null){if(!state.catalog.length)return alert('Maak eerst een filament aan.');editRefillId=id;const r=state.refills.find(x=>x.id===id);refillTitle.textContent=r?'Refill wijzigen':'Nieuwe refill';rNumber.value=r?.number||nextNumber(state.settings.refillPrefix||'R',state.refills);fillFilaments(rFilament,r?.filamentId||preset||state.catalog[0].id);refillDialog.showModal()}
newRefillBtn.onclick=()=>openRefill();
refillForm.onsubmit=e=>{e.preventDefault();const o={id:editRefillId||uid(),number:rNumber.value.trim().toUpperCase(),filamentId:rFilament.value};state.refills=editRefillId?state.refills.map(r=>r.id===editRefillId?o:r):[...state.refills,o];addLog('refill_update',`Refill ${o.number} ${editRefillId?'gewijzigd':'aangemaakt'}`,o.filamentId,o.number);refillDialog.close();save()}
function openFill(spoolId=null){const empty=state.spools.filter(s=>s.status==='active'&&Number(s.level)===0);if(!empty.length||!state.refills.length)return alert('Er is een lege spoel en een refill nodig.');fillSpool.innerHTML=empty.sort(sortByFilament).map(s=>`<option value="${s.id}" ${s.id===spoolId?'selected':''}>${esc(s.number)} - ${esc(label(filament(s.filamentId)))}</option>`).join('');fillRefill.innerHTML=state.refills.slice().sort(sortByFilament).map(r=>`<option value="${r.id}">${esc(r.number)} - ${esc(label(filament(r.filamentId)))}</option>`).join('');fillDialog.showModal()}
fillForm.onsubmit=e=>{e.preventDefault();const s=state.spools.find(x=>x.id===fillSpool.value),r=state.refills.find(x=>x.id===fillRefill.value);s.filamentId=r.filamentId;s.level=100;state.history.push({id:uid(),date:new Date().toISOString(),kind:'consumption',filamentId:r.filamentId,spoolNumber:s.number,refillNumber:r.number});state.refills=state.refills.filter(x=>x.id!==r.id);fillDialog.close();save()}
function addOrderLine(fid=null,qty=1){const row=document.createElement('div');row.className='order-line';const sel=document.createElement('select');fillFilaments(sel,fid||state.catalog[0]?.id);const inp=document.createElement('input');inp.type='number';inp.min='1';inp.step='1';inp.value=qty;const btn=document.createElement('button');btn.type='button';btn.textContent='Verwijder';btn.onclick=()=>row.remove();row.append(sel,inp,btn);orderLines.appendChild(row)}
addOrderLineBtn.onclick=()=>addOrderLine();
function openOrder(preselected=[]){if(!state.catalog.length)return alert('Maak eerst een filament aan.');orderLines.innerHTML='';oSupplier.value=preselected[0]?.supplier||state.libraries.suppliers[0]||'';oDate.value=new Date().toISOString().slice(0,10);oExpected.value='';oReference.value='';if(preselected.length)preselected.forEach(x=>addOrderLine(x.filamentId,x.quantity));else addOrderLine();orderDialog.showModal()}
newOrderBtn.onclick=()=>openOrder();
orderForm.onsubmit=e=>{e.preventDefault();const lines=[...orderLines.querySelectorAll('.order-line')].map(row=>({id:uid(),filamentId:row.children[0].value,quantity:Number(row.children[1].value),received:0})).filter(x=>x.quantity>0);if(!lines.length)return alert('Voeg minstens één bestelregel toe.');const order={id:uid(),supplier:oSupplier.value.trim(),date:oDate.value,expected:oExpected.value,reference:oReference.value.trim(),status:'Besteld',lines};state.orders.push(order);state.history.push({id:uid(),date:new Date().toISOString(),kind:'order_created',orderId:order.id});orderDialog.close();save()}
function openReceive(id){receiveOrderId=id;const o=state.orders.find(x=>x.id===id);receiveHeader.innerHTML=`<strong>${esc(o.supplier)}</strong><div class="item-meta">${esc(o.reference||'')} · ${esc(o.status)}</div>`;receiveLines.innerHTML=o.lines.map(l=>{const f=filament(l.filamentId),open=Number(l.quantity)-Number(l.received||0);return `<div class="receive-line" data-line-id="${l.id}"><div><strong>${esc(label(f))}</strong><div class="item-meta">Besteld ${l.quantity} · ontvangen ${l.received||0}</div></div><input type="number" min="0" max="${open}" value="${open}"><div>open ${open}</div></div>`}).join('');receiveDialog.showModal()}
receiveForm.onsubmit=e=>{e.preventDefault();const o=state.orders.find(x=>x.id===receiveOrderId);[...receiveLines.querySelectorAll('.receive-line')].forEach(row=>{const l=o.lines.find(x=>x.id===row.dataset.lineId),n=Number(row.querySelector('input').value),open=Number(l.quantity)-Number(l.received||0);if(n>0&&n<=open){for(let i=0;i<n;i++)state.refills.push({id:uid(),number:nextNumber(state.settings.refillPrefix||'R',state.refills),filamentId:l.filamentId,receivedDate:new Date().toISOString(),orderId:o.id});l.received=Number(l.received||0)+n;state.history.push({id:uid(),date:new Date().toISOString(),kind:'delivery_received',orderId:o.id,filamentId:l.filamentId,quantity:n})}});const openTotal=o.lines.reduce((a,l)=>a+Math.max(0,Number(l.quantity)-Number(l.received||0)),0);o.status=openTotal===0?'Geleverd':o.lines.some(l=>Number(l.received||0)>0)?'Gedeeltelijk geleverd':'Besteld';receiveDialog.close();save()}
createOrderFromListBtn.onclick=()=>{const selected=[...document.querySelectorAll('.order-select:checked')].map(c=>({filamentId:c.dataset.id,quantity:Number(c.dataset.qty),supplier:filament(c.dataset.id)?.supplier||''}));if(!selected.length)return alert('Selecteer minstens één regel.');openOrder(selected)}
function stockStatus(f){const total=totalStock(f.id);if(total<Number(f.min))return 'red';if(total<Number(f.target))return 'orange';return 'green'}
function statusDot(f){return `<span class="status-dot status-${stockStatus(f)}"></span>`}

let dashboardSpoolId=null;

function openDashboardLevel(spoolId){
  const spool=state.spools.find(s=>s.id===spoolId);
  if(!spool)return;
  dashboardSpoolId=spoolId;
  dashboardLevelTitle.textContent=`Hoeveelheid op ${spool.number}`;
  setTapChoice(dashboardLevelChoices,String(spool.level));
  dashboardLevelDialog.showModal();
}

dashboardLevelChoices.querySelectorAll('button').forEach(btn=>{
  btn.onclick=()=>{
    const spool=state.spools.find(s=>s.id===dashboardSpoolId);
    if(!spool)return;
    const oldLevel=Number(spool.level||0);
    spool.level=Number(btn.dataset.value);
    addLog(
      'spool_update',
      `Spoel ${spool.number} aangepast van ${oldLevel}% naar ${spool.level}%`,
      spool.filamentId,
      spool.number
    );
    dashboardLevelDialog.close();
    save();
  };
});

function dashboardRowsForFilament(f){
  const active=state.spools
    .filter(s=>s.status==='active'&&s.filamentId===f.id)
    .sort((a,b)=>String(a.number).localeCompare(String(b.number),'nl',{numeric:true}));

  if(!active.length){
    return [{
      filamentId:f.id,
      color:f.color,
      spool:null,
      refill:refillCount(f.id)
    }];
  }

  return active.map((spool,index)=>({
    filamentId:f.id,
    color:f.color,
    spool,
    refill:index===0?refillCount(f.id):''
  }));
}

function renderDashboard(){
  sumSpools.textContent=state.spools.filter(s=>s.status==='active').length;
  sumRefills.textContent=state.refills.length;
  sumEmpty.textContent=state.spools.filter(s=>s.status==='active'&&Number(s.level)===0).length;
  sumLow.textContent=state.catalog.filter(f=>totalStock(f.id)<Number(f.min)).length;

  const q=dashboardSearch.value.trim().toLowerCase();
  const grouped={};

  state.catalog
    .slice()
    .sort((a,b)=>
      a.category.localeCompare(b.category,'nl') ||
      a.type.localeCompare(b.type,'nl') ||
      a.color.localeCompare(b.color,'nl')
    )
    .forEach(f=>{
      if(q&&!`${f.category} ${f.type} ${f.color}`.toLowerCase().includes(q))return;
      grouped[f.category]??={};
      grouped[f.category][f.type]??=[];
      grouped[f.category][f.type].push(...dashboardRowsForFilament(f));
    });

  dashboardList.innerHTML=Object.keys(grouped).sort((a,b)=>a.localeCompare(b,'nl')).map(category=>`
    <div class="category-title">${esc(category)}</div>
    ${Object.keys(grouped[category]).sort((a,b)=>a.localeCompare(b,'nl')).map(type=>`
      <div class="type-title">${esc(type)}</div>
      <table class="dashboard-stock-table">
        <thead>
          <tr>
            <th>Kleur</th>
            <th>Spoel</th>
            <th>Hoeveelheid</th>
            <th>Refill</th>
          </tr>
        </thead>
        <tbody>
          ${grouped[category][type].map(row=>`
            <tr>
              <td class="clickable" onclick="openDetail('${row.filamentId}')">${esc(row.color)}</td>
              <td>
                ${row.spool
                  ? `<button class="spool-link" onclick="openSpool('${row.spool.id}')">${esc(row.spool.number)}</button>`
                  : `<span class="no-spool">—</span>`}
              </td>
              <td>
                ${row.spool
                  ? `<button class="level-button level-${row.spool.level}" onclick="openDashboardLevel('${row.spool.id}')">${row.spool.level}%</button>`
                  : `<span class="no-spool">—</span>`}
              </td>
              <td>${row.refill}</td>
            </tr>`).join('')}
        </tbody>
      </table>`).join('')}
  `).join('')||'<div class="empty">Nog geen filamenten.</div>';
}
dashboardSearch.oninput=renderDashboard;
function renderCatalog(){
  const q=catalogSearch.value.toLowerCase();

  const items=state.catalog
    .filter(f=>!q||label(f).toLowerCase().includes(q))
    .sort((a,b)=>
      String(a.category||'').localeCompare(String(b.category||''),'nl') ||
      String(a.type||'').localeCompare(String(b.type||''),'nl') ||
      String(a.color||'').localeCompare(String(b.color||''),'nl')
    );

  catalogList.innerHTML=items.map(f=>`
    <div class="item-row">
      <div class="item-main">
        <strong>${esc(f.category)} · ${esc(f.type)} · ${esc(f.color)}</strong>
        <div class="item-meta">${esc(f.brand)} · min. ${f.min} · gewenst ${f.target}</div>
      </div>
      <div class="item-actions">
        <button onclick="openDetail('${f.id}')">Open</button>
        <button onclick="openFilament('${f.id}')">Wijzig</button>
      </div>
    </div>`).join('')||'<div class="empty">Nog geen filamenten.</div>';
}
catalogSearch.oninput=renderCatalog;

function qrPayload(kind,number){
  return `filament-manager:${kind.toLowerCase()}:${number}`;
}
function qrImageUrl(kind,number){
  const payload=encodeURIComponent(qrPayload(kind,number));
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${payload}`;
}
function openQr(kind,id){
  const item=kind==='spoel'?state.spools.find(x=>x.id===id):state.refills.find(x=>x.id===id);
  if(!item)return;
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
printQrBtn.onclick=()=>window.print();

function findCode(code){
  const clean=String(code||'').trim().toUpperCase();
  const spool=state.spools.find(s=>s.number.toUpperCase()===clean);
  if(spool)return{kind:'spool',item:spool};
  const refill=state.refills.find(r=>r.number.toUpperCase()===clean);
  if(refill)return{kind:'refill',item:refill};
  return null;
}
function parseScannedValue(value){
  const text=String(value||'').trim();
  const parts=text.split(':');
  if(parts.length===3&&parts[0]==='filament-manager')return parts[2].toUpperCase();
  return text.toUpperCase();
}
function openScannedCode(value){
  const code=parseScannedValue(value);
  const found=findCode(code);
  if(!found){alert('Code niet gevonden.');return}

  if(found.kind==='spool'&&found.item.status==='active'&&Number(found.item.level)===0&&!quickFillSpool.value){
    quickFillSpool.value=found.item.number;
    scannerStatus.textContent=`Lege spoel ${found.item.number} gekozen. Scan nu een refill.`;
    return;
  }

  if(found.kind==='refill'&&quickFillSpool.value&&!quickFillRefill.value){
    quickFillRefill.value=found.item.number;
    scannerStatus.textContent=`Refill ${found.item.number} gekozen. Tik op Koppelen.`;
    return;
  }

  if(found.kind==='spool'){
    setView('voorraad');
    stockMode='spools';
    renderStock();
    openSpool(found.item.id);
  }else{
    setView('voorraad');
    stockMode='refills';
    renderStock();
    openRefill(found.item.id);
  }
}
manualScanBtn.onclick=()=>openScannedCode(manualScanCode.value);

let html5QrCode=null;
let scannerRunning=false;

async function startScanner(){
  if(typeof Html5Qrcode==='undefined'){
    scannerStatus.textContent='De QR-scanner kon niet geladen worden. Controleer je internetverbinding en vernieuw de app.';
    return;
  }

  if(scannerRunning)return;

  try{
    qrReader.classList.remove('hidden');
    html5QrCode=new Html5Qrcode('qrReader');

    const config={
      fps:10,
      qrbox:(width,height)=>{
        const size=Math.floor(Math.min(width,height)*0.72);
        return {width:size,height:size};
      },
      aspectRatio:1.0
    };

    scannerStatus.textContent='Camera wordt geopend...';

    await html5QrCode.start(
      {facingMode:'environment'},
      config,
      decodedText=>{
        stopScanner().finally(()=>openScannedCode(decodedText));
      },
      ()=>{}
    );

    scannerRunning=true;
    scannerStatus.textContent='Camera actief. Richt de QR-code binnen het kader.';
  }catch(err){
    scannerRunning=false;
    qrReader.classList.add('hidden');
    scannerStatus.textContent='Camera kon niet worden geopend. Controleer cameratoegang in Safari en open de app via HTTPS.';
  }
}

async function stopScanner(){
  if(html5QrCode){
    try{
      if(scannerRunning)await html5QrCode.stop();
      await html5QrCode.clear();
    }catch{}
  }
  html5QrCode=null;
  scannerRunning=false;
  qrReader.classList.add('hidden');
  scannerStatus.textContent='Scanner gestopt.';
}

startScannerBtn.onclick=startScanner;
stopScannerBtn.onclick=stopScanner;

quickFillBtn.onclick=()=>{
  const spoolCode=parseScannedValue(quickFillSpool.value);
  const refillCode=parseScannedValue(quickFillRefill.value);
  const spool=state.spools.find(s=>s.number.toUpperCase()===spoolCode);
  const refill=state.refills.find(r=>r.number.toUpperCase()===refillCode);
  if(!spool)return alert('Spoel niet gevonden.');
  if(!refill)return alert('Refill niet gevonden.');
  if(spool.status!=='active'||Number(spool.level)!==0)return alert('De spoel moet actief en leeg zijn.');
  spool.filamentId=refill.filamentId;
  spool.level=100;
  state.history.push({id:uid(),date:new Date().toISOString(),kind:'consumption',filamentId:refill.filamentId,spoolNumber:spool.number,refillNumber:refill.number});
  state.refills=state.refills.filter(r=>r.id!==refill.id);
  quickFillSpool.value='';quickFillRefill.value='';
  save();
  alert(`${spool.number} is gevuld met ${refill.number}.`);
};

printAllLabelsBtn.onclick=()=>{
  const selected=[...document.querySelectorAll('.label-select:checked')].map(el=>{
    const kind=el.dataset.kind;
    const id=el.dataset.id;
    const item=kind==='spoel'?state.spools.find(x=>x.id===id):state.refills.find(x=>x.id===id);
    const f=filament(item?.filamentId);
    return item?{kind,number:item.number,filament:f}:null;
  }).filter(Boolean);

  if(!selected.length){
    alert('Selecteer eerst minstens één sticker.');
    return;
  }

  const win=window.open('','_blank');
  win.document.write(`<html><head><title>Stickers</title><style>
    body{font-family:Arial;margin:10mm}.sheet{display:grid;grid-template-columns:repeat(3,1fr);gap:7mm}
    .label{border:1.5px solid #000;border-radius:8px;padding:4mm;text-align:center;break-inside:avoid}
    img{width:38mm;height:38mm}.number{font-size:20pt;font-weight:900;letter-spacing:1mm}
    .divider{border-top:1px solid #000;margin:2mm 0}.main{font-size:12pt;font-weight:bold}.line{font-size:10pt;font-weight:bold}.small{font-size:8pt}.kind{font-size:9pt;font-weight:bold;text-transform:uppercase;margin-top:2mm}
    @media print{body{margin:6mm}}
  </style></head><body><div class="sheet">${
    selected.map(i=>`<div class="label">
      <img src="${qrImageUrl(i.kind,i.number)}">
      <div class="number">${esc(i.number)}</div>
      <div class="divider"></div>
      <div class="main">${esc(i.filament?`${i.filament.category} ${i.filament.type}`:'')}</div>
      <div class="line">${esc(i.filament?.color||'')}</div>
      <div class="line">${esc(i.filament?.supplier||i.filament?.brand||'')}</div>
      <div class="small">${i.filament?.supplierRef?`Ref. ${esc(i.filament.supplierRef)}`:''}</div>
      <div class="kind">${esc(i.kind)}</div>
    </div>`).join('')
  }</div><script>window.onload=()=>setTimeout(()=>window.print(),900)</script></body></html>`);
  win.document.close();
};


function sortStockItems(items){
  const copy=items.slice();

  if(stockSortMode==='number-asc'){
    return copy.sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),'nl',{numeric:true}));
  }

  if(stockSortMode==='number-desc'){
    return copy.sort((a,b)=>String(b.number||'').localeCompare(String(a.number||''),'nl',{numeric:true}));
  }

  return copy.sort(sortByFilament);
}

stockSort.onchange=()=>{
  stockSortMode=stockSort.value;
  renderStock();
};

function renderStock(){document.querySelectorAll('[data-stock-mode]').forEach(b=>b.classList.toggle('active',b.dataset.stockMode===stockMode));const q=stockSearch.value.toLowerCase();const items=sortStockItems((stockMode==='spools'?state.spools:state.refills).filter(x=>{const f=filament(x.filamentId);return !q||`${f?.category} ${f?.type} ${f?.color} ${x.number}`.toLowerCase().includes(q)}));stockList.innerHTML=items.map(x=>{const f=filament(x.filamentId);return `<div class="item-row"><div class="item-main"><strong>${esc(f?.category)} · ${esc(f?.type)} · ${esc(f?.color)}</strong><div class="item-meta">${esc(x.number)} · ${stockMode==='spools'?(x.status==='inactive'?'Buiten gebruik':Number(x.level)===0?'Leeg':x.level+'%'):'Refill'}</div></div><div class="item-actions"><input class="stock-select label-select" type="checkbox" data-kind="${stockMode==='spools'?'spoel':'refill'}" data-id="${x.id}"><button onclick="${stockMode==='spools'?`openSpool('${x.id}')`:`openRefill('${x.id}')`}">Wijzig</button><button onclick="openQr('${stockMode==='spools'?'spoel':'refill'}','${x.id}')">QR</button>${stockMode==='spools'&&x.status==='active'&&Number(x.level)===0?`<button onclick="openFill('${x.id}')">Vullen</button>`:''}</div></div>`}).join('')||'<div class="empty">Geen gegevens.</div>'}
document.querySelectorAll('[data-stock-mode]').forEach(b=>b.onclick=()=>{stockMode=b.dataset.stockMode;renderStock()});stockSearch.oninput=renderStock;
function renderOrderList(){const q=orderListSearch.value.toLowerCase(),rows=state.catalog.map(f=>({f,available:totalStock(f.id),incoming:openOrdered(f.id),needed:toOrder(f)})).filter(x=>x.needed>0&&(!q||`${x.f.category} ${x.f.type} ${x.f.color}`.toLowerCase().includes(q))).sort((a,b)=>a.f.category.localeCompare(b.f.category,'nl')||a.f.type.localeCompare(b.f.type,'nl')||a.f.color.localeCompare(b.f.color,'nl'));orderList.innerHTML=rows.length?`<table class="order-table"><thead><tr><th></th><th>Categorie</th><th>Type</th><th>Kleur</th><th>Op spoel</th><th>Refill</th><th>In bestelling</th><th>Nog bestellen</th></tr></thead><tbody>${rows.map(x=>`<tr><td><input class="order-select" type="checkbox" data-id="${x.f.id}" data-qty="${x.needed}"></td><td>${esc(x.f.category)}</td><td>${esc(x.f.type)}</td><td>${esc(x.f.color)}</td><td>${Math.round(spoolStock(x.f.id)*100)}%</td><td>${refillCount(x.f.id)}</td><td>${x.incoming}</td><td><strong>${x.needed}</strong></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Niets te bestellen.</div>'}
orderListSearch.oninput=renderOrderList;
function renderOrders(){const q=ordersSearch.value.toLowerCase(),rows=state.orders.filter(o=>!q||`${o.supplier} ${o.reference}`.toLowerCase().includes(q)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));ordersList.innerHTML=rows.map(o=>{const total=o.lines.reduce((a,l)=>a+Number(l.quantity),0),rec=o.lines.reduce((a,l)=>a+Number(l.received||0),0);return `<div class="order-card"><h3>${esc(o.supplier)} · ${esc(o.reference||'')}</h3><div class="item-meta">${esc(o.date)} · ${esc(o.status)} · ${rec}/${total} ontvangen</div>${o.lines.map(l=>`<div class="order-line-summary">${esc(label(filament(l.filamentId)))} — ${l.received||0}/${l.quantity}</div>`).join('')}<div class="item-actions">${o.status!=='Geleverd'&&o.status!=='Geannuleerd'?`<button onclick="openReceive('${o.id}')">Ontvangen</button>`:''}</div></div>`}).join('')||'<div class="empty">Nog geen bestellingen.</div>'}
ordersSearch.oninput=renderOrders;
function openDetail(id){currentDetailId=id;previousView=document.querySelector('.view.active')?.id||'dashboard';renderDetail();setView('detail')}backFromDetail.onclick=()=>setView(previousView);
function renderDetail(){
  const f=filament(currentDetailId);if(!f)return;
  const spools=state.spools.filter(s=>s.filamentId===f.id).sort(sortByFilament);
  const refills=state.refills.filter(r=>r.filamentId===f.id).sort(sortByFilament);
  const orders=state.orders.filter(o=>o.lines.some(l=>l.filamentId===f.id));
  const history=state.history.filter(h=>h.filamentId===f.id).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,20);
  detailContent.innerHTML=`<div class="panel"><div class="panel-head"><div><h2>${statusDot(f)}${esc(f.category)} · ${esc(f.type)} · ${esc(f.color)}</h2><div class="note">${esc(f.brand)} · ${esc(f.supplier||'')}</div></div><button onclick="openFilament('${f.id}')">Wijzig filament</button></div><div class="detail-grid"><div class="detail-stat"><span>Op spoel</span><strong>${spoolPercentage(f.id)}%</strong></div><div class="detail-stat"><span>Refills</span><strong>${refillCount(f.id)}</strong></div><div class="detail-stat"><span>In bestelling</span><strong>${openOrdered(f.id)}</strong></div><div class="detail-stat"><span>Minimum</span><strong>${f.min}</strong></div><div class="detail-stat"><span>Gewenst</span><strong>${f.target}</strong></div></div></div><div class="quick-actions"><button onclick="openSpool(null,'${f.id}')">+ Spoel</button><button onclick="openRefill(null,'${f.id}')">+ Refill</button><button onclick="openOrder([{filamentId:'${f.id}',quantity:1,supplier:'${esc(f.supplier||'')}'}])">Bestellen</button><button onclick="openFill()">Vullen</button></div><details class="detail-section" open><summary>Spoelen (${spools.length})</summary><div class="detail-section-body">${spools.map(s=>`<div class="item-row"><div class="item-main"><strong>${esc(s.number)}</strong><div class="item-meta">${s.status==='inactive'?'Buiten gebruik':Number(s.level)===0?'Leeg':s.level+'%'}</div></div><div class="item-actions"><button onclick="openSpool('${s.id}')">Wijzig</button><button onclick="openQr('spoel','${s.id}')">QR</button>${s.status==='active'&&Number(s.level)===0?`<button onclick="openFill('${s.id}')">Vullen</button>`:''}</div></div>`).join('')||'<div class="empty">Geen spoelen.</div>'}</div></details><details class="detail-section" open><summary>Refills (${refills.length})</summary><div class="detail-section-body">${refills.map(r=>`<div class="item-row"><div class="item-main"><strong>${esc(r.number)}</strong><div class="item-meta">${r.receivedDate?new Date(r.receivedDate).toLocaleDateString('nl-BE'):'Beschikbaar'}</div></div><div class="item-actions"><button onclick="openRefill('${r.id}')">Wijzig</button><button onclick="openQr('refill','${r.id}')">QR</button></div></div>`).join('')||'<div class="empty">Geen refills.</div>'}</div></details><details class="detail-section"><summary>Bestellingen (${orders.length})</summary><div class="detail-section-body">${orders.map(o=>`<div class="item-row"><div class="item-main"><strong>${esc(o.supplier)} · ${esc(o.reference||'')}</strong><div class="item-meta">${esc(o.status)}</div></div><div class="item-actions">${o.status!=='Geleverd'&&o.status!=='Geannuleerd'?`<button onclick="openReceive('${o.id}')">Ontvangen</button>`:''}</div></div>`).join('')||'<div class="empty">Geen bestellingen.</div>'}</div></details><details class="detail-section"><summary>Historiek (${history.length})</summary><div class="detail-section-body">${history.map(h=>`<div class="item-row"><div class="item-main"><strong>${new Date(h.date).toLocaleDateString('nl-BE')}</strong><div class="item-meta">${h.kind==='consumption'?`Refill ${esc(h.refillNumber)} gekoppeld aan ${esc(h.spoolNumber)}`:h.kind==='delivery_received'?`${h.quantity} refill(s) ontvangen`:`Spoel ${esc(h.number||'')} aangepast`}</div></div></div>`).join('')||'<div class="empty">Geen historiek.</div>'}</div></details>`;
}
function renderLibraries(){librarySummary.innerHTML=`<div class="item-row"><div class="item-main"><strong>Merken</strong><div class="item-meta">${state.libraries.brands.length}</div></div></div><div class="item-row"><div class="item-main"><strong>Kleuren</strong><div class="item-meta">${state.libraries.colors.length}</div></div></div><div class="item-row"><div class="item-main"><strong>Leveranciers</strong><div class="item-meta">${state.libraries.suppliers.length}</div></div></div>`}
exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='filament-manager-v5.3-backup.json';a.click();URL.revokeObjectURL(a.href)}
importInput.onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{state=migrate(JSON.parse(r.result));save();alert('Back-up geïmporteerd.')}catch(err){alert('Import mislukt: '+err.message)}};r.readAsText(file)}
resetBtn.onclick=()=>{if(confirm('Alle gegevens wissen?')){state=fresh();save()}}

function renderGlobalSearch(){
  const q=globalSearch.value.trim().toLowerCase();
  if(!q){globalResults.classList.add('hidden');globalResults.innerHTML='';return}
  const results=[];
  state.catalog.forEach(f=>{if(label(f).toLowerCase().includes(q))results.push({title:`${f.category} · ${f.type} · ${f.color}`,meta:`Filament · ${f.brand}`,action:()=>openDetail(f.id)})});
  state.spools.forEach(s=>{const f=filament(s.filamentId);if(`${s.number} ${label(f)}`.toLowerCase().includes(q))results.push({title:s.number,meta:`Spoel · ${f?.type||''} · ${f?.color||''}`,action:()=>{setView('voorraad');openSpool(s.id)}})});
  state.refills.forEach(r=>{const f=filament(r.filamentId);if(`${r.number} ${label(f)}`.toLowerCase().includes(q))results.push({title:r.number,meta:`Refill · ${f?.type||''} · ${f?.color||''}`,action:()=>{setView('voorraad');openRefill(r.id)}})});
  state.orders.forEach(o=>{if(`${o.supplier} ${o.reference||''}`.toLowerCase().includes(q))results.push({title:o.reference||o.supplier,meta:`Bestelling · ${o.status}`,action:()=>setView('bestellingen')})});
  globalResults.innerHTML=results.slice(0,20).map((r,i)=>`<div class="global-result" data-result-index="${i}"><strong>${esc(r.title)}</strong><span>${esc(r.meta)}</span></div>`).join('')||'<div class="global-result"><span>Geen resultaten</span></div>';
  globalResults.classList.remove('hidden');
  globalResults.querySelectorAll('[data-result-index]').forEach(el=>el.onclick=()=>{results[Number(el.dataset.resultIndex)].action();globalSearch.value='';renderGlobalSearch()});
}
globalSearch.addEventListener('input',renderGlobalSearch);
document.addEventListener('click',e=>{if(!e.target.closest('.global-search-wrap'))globalResults.classList.add('hidden')});
function renderSettings(){setSpoolPrefix.value=state.settings.spoolPrefix||'S';setRefillPrefix.value=state.settings.refillPrefix||'R';setDigits.value=state.settings.digits||4;setDefaultBrand.value=state.settings.defaultBrand||'Bambu Lab';setDefaultSupplier.value=state.settings.defaultSupplier||'Bambu Lab';qrSpoolCount.textContent=state.spools.length;qrRefillCount.textContent=state.refills.length}
saveSettingsBtn.onclick=()=>{state.settings={spoolPrefix:setSpoolPrefix.value.trim().toUpperCase()||'S',refillPrefix:setRefillPrefix.value.trim().toUpperCase()||'R',digits:Number(setDigits.value)||4,defaultBrand:setDefaultBrand.value.trim()||'Bambu Lab',defaultSupplier:setDefaultSupplier.value.trim()||'Bambu Lab'};save();alert('Instellingen opgeslagen.')};


function renderLog(){
  const q=(logSearch?.value||'').trim().toLowerCase();
  const rows=state.history.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(h=>{
    const f=filament(h.filamentId);
    return !q||`${h.message||''} ${h.number||''} ${f?label(f):''}`.toLowerCase().includes(q);
  });
  logList.innerHTML=rows.map(h=>{
    const f=filament(h.filamentId);
    const text=h.message||(
      h.kind==='consumption'?`Refill ${h.refillNumber} gekoppeld aan spoel ${h.spoolNumber}`:
      h.kind==='delivery_received'?`${h.quantity} refill(s) ontvangen`:
      h.kind
    );
    return `<div class="log-entry"><strong>${new Date(h.date).toLocaleString('nl-BE')}</strong><div class="item-meta">${esc(text)}</div>${f?`<div class="item-meta">${esc(f.category)} · ${esc(f.type)} · ${esc(f.color)}</div>`:''}</div>`;
  }).join('')||'<div class="empty">Geen transacties.</div>';
}
if(window.logSearch)logSearch.oninput=renderLog;

function renderAll(){refreshLists();renderDashboard();renderCatalog();renderStock();renderOrderList();renderOrders();renderLibraries();renderSettings();renderLog();renderLibraryManager();if(currentDetailId&&detail.classList.contains('active'))renderDetail()}
renderAll();


let deferredInstallPrompt=null;

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  installAppBtn.classList.remove('hidden');
});

installAppBtn.onclick=async()=>{
  if(!deferredInstallPrompt){
    alert('Op iPhone: open in Safari, tik op Deel en kies “Zet op beginscherm”.');
    return;
  }
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  installAppBtn.classList.add('hidden');
};

installHelpBtn.onclick=()=>{
  alert('iPhone-installatie:\\n\\n1. Open de app in Safari.\\n2. Tik op de deelknop.\\n3. Kies “Zet op beginscherm”.\\n4. Open Filament Manager via het nieuwe pictogram.');
};

mobileExportBtn.onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`filament-manager-overdracht-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
};

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  });
}


document.addEventListener('click',e=>{
 const b=e.target.closest('[data-view]');
 if(!b)return;
 const v=b.dataset.view;
 if(typeof setView==='function') setView(v);
});


function formatBackupTimestamp(date=new Date()){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

function validateBackupData(data){
  if(!data || typeof data!=='object') return 'Het bestand bevat geen geldige gegevens.';
  if(!Array.isArray(data.catalog)) return 'De filamentcatalogus ontbreekt.';
  if(!Array.isArray(data.spools)) return 'De spoelenlijst ontbreekt.';
  if(!Array.isArray(data.refills)) return 'De refillslijst ontbreekt.';
  if(!Array.isArray(data.orders)) return 'De bestellingenlijst ontbreekt.';
  if(!Array.isArray(data.history)) return 'De historiek ontbreekt.';
  return '';
}

function setBackupStatus(message,type=''){
  if(!window.backupStatus) return;
  backupStatus.textContent=message;
  backupStatus.className=`backup-status ${type}`.trim();
}

function downloadBackup(){
  const backup={
    ...state,
    appVersion:'7.0',
    exportedAt:new Date().toISOString(),
    backupFormat:'filament-manager-json-v1'
  };

  const fileName=`FilamentManager_Backup_${formatBackupTimestamp()}.json`;
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');

  link.href=url;
  link.download=fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setBackupStatus(`Back-up gemaakt: ${fileName}`,'success');
}

async function restoreBackupFile(file){
  if(!file) return;

  try{
    const text=await file.text();
    const parsed=JSON.parse(text);
    const validationError=validateBackupData(parsed);

    if(validationError){
      setBackupStatus(`Herstel mislukt: ${validationError}`,'error');
      alert(validationError);
      return;
    }

    const summary=[
      `${parsed.catalog.length} filamenten`,
      `${parsed.spools.length} spoelen`,
      `${parsed.refills.length} refills`,
      `${parsed.orders.length} bestellingen`
    ].join(', ');

    const confirmed=confirm(
      `Deze back-up bevat ${summary}.\n\n` +
      `Je huidige gegevens worden volledig vervangen.\n\n` +
      `Wil je doorgaan?`
    );

    if(!confirmed){
      setBackupStatus('Herstel geannuleerd.');
      return;
    }

    state=migrate(parsed);
    localStorage.setItem(KEY,JSON.stringify(state));
    renderAll();

    setBackupStatus(`Back-up hersteld uit ${file.name}.`,'success');
    alert('Back-up succesvol teruggezet.');
  }catch(error){
    setBackupStatus(`Herstel mislukt: ${error.message}`,'error');
    alert('Dit is geen geldig Filament Manager-back-upbestand.');
  }
}

if(window.createBackupBtn){
  createBackupBtn.onclick=downloadBackup;
}

if(window.restoreBackupInput){
  restoreBackupInput.onchange=event=>{
    const file=event.target.files?.[0];
    restoreBackupFile(file);
    event.target.value='';
  };
}

setTimeout(()=>{
  if(window.backupStatus){
    setBackupStatus('Maak vóór verdere tests eerst een back-up.');
  }
},300);








function removeDefaultColors(){
  const blocked=new Set(['white','black','wit','zwart']);
  if(!state.libraries)state.libraries={...structuredClone(DEFAULTS)};
  if(!Array.isArray(state.libraries.colors))state.libraries.colors=[];

  state.libraries.colors=state.libraries.colors.filter(
    color=>!blocked.has(String(color||'').trim().toLowerCase())
  );
}

function resetFilamentDraft(){
  editFilamentId=null;

  const fields=['fCategory','fType','fColor','fBrand','fSupplier','fSupplierRef'];
  fields.forEach(id=>{
    const field=document.getElementById(id);
    if(field)field.value='';
  });

  const labels={
    pickCategoryText:'Kies categorie',
    pickTypeText:'Kies type',
    pickColorText:'Kies kleur',
    pickBrandText:'Kies merk',
    pickSupplierText:'Kies leverancier'
  };

  Object.entries(labels).forEach(([id,text])=>{
    const element=document.getElementById(id);
    if(element)element.textContent=text;
  });
}

function closeDialogSafely(dialog){
  if(dialog && dialog.open){
    try{dialog.close()}catch{}
  }
}

document.addEventListener('click',event=>{
  const directButton=event.target.closest('[data-close-dialog]');
  if(directButton){
    event.preventDefault();
    if(directButton.dataset.closeDialog==='filamentDialog')resetFilamentDraft();
    closeDialogSafely(document.getElementById(directButton.dataset.closeDialog));
    return;
  }

  const currentButton=event.target.closest('[data-close-current-dialog]');
  if(currentButton){
    event.preventDefault();
    const dialog=currentButton.closest('dialog');
    if(dialog?.id==='filamentDialog')resetFilamentDraft();
    closeDialogSafely(dialog);
  }
});

const filamentDialogElement=document.getElementById('filamentDialog');
if(filamentDialogElement){
  filamentDialogElement.addEventListener('cancel',event=>{
    event.preventDefault();
    resetFilamentDraft();
    closeDialogSafely(filamentDialogElement);
  });
}

removeDefaultColors();
localStorage.setItem(KEY,JSON.stringify(state));
renderAll();


let activeLibraryKind='colors';
let editingLibraryValue=null;
let replacingLibraryValue=null;

function libraryDisplayName(kind){
  return {
    colors:'Kleur',
    types:'Type',
    brands:'Merk',
    suppliers:'Leverancier',
    categories:'Categorie'
  }[kind]||'Waarde';
}

function libraryValues(kind){
  if(kind==='types'){
    const values=[];
    Object.values(state.libraries.types||{}).forEach(list=>{
      (list||[]).forEach(v=>pushUnique(values,v));
    });
    return values;
  }
  return [...(state.libraries[kind]||[])];
}

function valueUsageCount(kind,value){
  return state.catalog.filter(f=>{
    if(kind==='colors')return f.color===value;
    if(kind==='brands')return f.brand===value;
    if(kind==='suppliers')return f.supplier===value;
    if(kind==='categories')return f.category===value;
    if(kind==='types')return f.type===value;
    return false;
  }).length;
}

function replaceValueEverywhere(kind,oldValue,newValue){
  state.catalog.forEach(f=>{
    if(kind==='colors'&&f.color===oldValue)f.color=newValue;
    if(kind==='brands'&&f.brand===oldValue)f.brand=newValue;
    if(kind==='suppliers'&&f.supplier===oldValue)f.supplier=newValue;
    if(kind==='categories'&&f.category===oldValue)f.category=newValue;
    if(kind==='types'&&f.type===oldValue)f.type=newValue;
  });

  if(kind==='types'){
    Object.keys(state.libraries.types||{}).forEach(category=>{
      state.libraries.types[category]=(state.libraries.types[category]||[]).map(v=>v===oldValue?newValue:v);
      state.libraries.types[category]=[...new Set(state.libraries.types[category])];
    });
  }else{
    state.libraries[kind]=(state.libraries[kind]||[]).map(v=>v===oldValue?newValue:v);
    state.libraries[kind]=[...new Set(state.libraries[kind])];
  }
}

function removeLibraryValue(kind,value){
  const usage=valueUsageCount(kind,value);

  if(usage>0){
    replacingLibraryValue={kind,value};
    const alternatives=libraryValues(kind).filter(v=>v!==value);
    if(!alternatives.length){
      alert(`Deze ${libraryDisplayName(kind).toLowerCase()} wordt gebruikt en er is geen andere waarde om naar te vervangen.`);
      return;
    }
    replaceLibraryMessage.textContent=`${value} wordt gebruikt door ${usage} filament(en). Kies een vervangende waarde.`;
    replaceLibrarySelect.innerHTML=alternatives.sort((a,b)=>a.localeCompare(b,'nl')).map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    replaceLibraryValueDialog.showModal();
    return;
  }

  if(!confirm(`${value} verwijderen?`))return;

  if(kind==='types'){
    Object.keys(state.libraries.types||{}).forEach(category=>{
      state.libraries.types[category]=(state.libraries.types[category]||[]).filter(v=>v!==value);
    });
  }else{
    state.libraries[kind]=(state.libraries[kind]||[]).filter(v=>v!==value);
  }

  addLog('library_delete',`${libraryDisplayName(kind)} ${value} verwijderd`);
  save();
}

function renderLibraryManager(){
  if(!window.libraryManagerList)return;
  const q=(librarySearch?.value||'').trim().toLowerCase();
  const values=libraryValues(activeLibraryKind)
    .filter(v=>!q||String(v).toLowerCase().includes(q))
    .sort((a,b)=>String(a).localeCompare(String(b),'nl'));

  libraryManagerList.innerHTML=values.map(value=>`
    <div class="library-row">
      <div>
        <strong>${esc(value)}</strong>
        <div class="item-meta">${valueUsageCount(activeLibraryKind,value)} filament(en)</div>
      </div>
      <div class="item-actions">
        <button data-library-edit="${encodeURIComponent(value)}">Wijzig</button>
        <button data-library-delete="${encodeURIComponent(value)}">Verwijder</button>
      </div>
    </div>`).join('')||'<div class="empty">Geen waarden.</div>';
}

window.editLibraryValue=function(encoded){
  const value=decodeURIComponent(encoded);
  editingLibraryValue={kind:activeLibraryKind,value};
  libraryValueTitle.textContent=`${libraryDisplayName(activeLibraryKind)} wijzigen`;
  libraryValueInput.value=value;
  libraryValueDialog.showModal();
};

const originalRemoveLibraryValue=removeLibraryValue;
window.removeLibraryValue=function(kind,encoded){
  originalRemoveLibraryValue(kind,decodeURIComponent(encoded));
};

document.querySelectorAll('[data-library-kind]').forEach(btn=>{
  btn.onclick=()=>{
    activeLibraryKind=btn.dataset.libraryKind;
    document.querySelectorAll('[data-library-kind]').forEach(b=>b.classList.toggle('active',b===btn));
    renderLibraryManager();
  };
});

addLibraryValueBtn.onclick=()=>{
  editingLibraryValue={kind:activeLibraryKind,value:null};
  libraryValueTitle.textContent=`Nieuwe ${libraryDisplayName(activeLibraryKind).toLowerCase()}`;
  libraryValueInput.value='';
  libraryValueDialog.showModal();
};

librarySearch.oninput=renderLibraryManager;

libraryValueForm.onsubmit=event=>{
  event.preventDefault();
  const value=libraryValueInput.value.trim();
  if(!value)return;

  const {kind}=editingLibraryValue||{kind:activeLibraryKind};
  const oldValue=editingLibraryValue?.value;

  const exists=libraryValues(kind).some(v=>v.toLowerCase()===value.toLowerCase()&&v!==oldValue);
  if(exists){
    alert('Deze waarde bestaat al.');
    return;
  }

  if(oldValue){
    replaceValueEverywhere(kind,oldValue,value);
    addLog('library_rename',`${libraryDisplayName(kind)} ${oldValue} gewijzigd naar ${value}`);
  }else{
    if(kind==='types'){
      if(!state.libraries.types['Andere'])state.libraries.types['Andere']=[];
      pushUnique(state.libraries.types['Andere'],value);
    }else{
      pushUnique(state.libraries[kind],value);
    }
    addLog('library_add',`${libraryDisplayName(kind)} ${value} toegevoegd`);
  }

  libraryValueDialog.close();
  save();
};

replaceLibraryValueForm.onsubmit=event=>{
  event.preventDefault();
  if(!replacingLibraryValue)return;

  const {kind,value}=replacingLibraryValue;
  const replacement=replaceLibrarySelect.value;
  replaceValueEverywhere(kind,value,replacement);

  if(kind==='types'){
    Object.keys(state.libraries.types||{}).forEach(category=>{
      state.libraries.types[category]=(state.libraries.types[category]||[]).filter(v=>v!==value);
    });
  }else{
    state.libraries[kind]=(state.libraries[kind]||[]).filter(v=>v!==value);
  }

  addLog('library_replace',`${libraryDisplayName(kind)} ${value} vervangen door ${replacement}`);
  replacingLibraryValue=null;
  replaceLibraryValueDialog.close();
  save();
};

document.addEventListener('click',event=>{
  const edit=event.target.closest('[data-library-edit]');
  if(edit){
    window.editLibraryValue(edit.dataset.libraryEdit);
    return;
  }
  const del=event.target.closest('[data-library-delete]');
  if(del){
    window.removeLibraryValue(activeLibraryKind,del.dataset.libraryDelete);
  }
});
