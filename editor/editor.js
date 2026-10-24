(() => {
'use strict';
const FORMAT = 'ukbar-menu-editor-v1';
const DRAFT_KEY = 'ukbar-v6-menu-draft-v1';
const categories = [
  ['picadas','Picadas y tablas',1], ['quesadillas','Quesadillas',1],
  ['chorrillanas','Chorrillanas',3],['sandwiches','Sándwiches y hamburguesas',3],
  ['pizzas','Pizzas',2],['autor','Coctelería de autor',1],
  ['clasicos','Clásicos',1],['para-compartir','Para brindar',1],
  ['sin-alcohol','Sin alcohol',1],['cervezas','Cervezas de barril',2]
];
const categoryLabels = Object.fromEntries(categories.map(([key,label])=>[key,label]));
const categoryPriceCount = Object.fromEntries(categories.map(([key,,count])=>[key,count]));
const labels = {
  chorrillanas:['Chica','Mediana','Grande'],
  sandwiches:['Churrasco / mechada','Pollo','Hamburguesa / seitán'],
  pizzas:['Mediana','Familiar'],
  cervezas:['300 cc','Pinta']
};
const $ = id => document.getElementById(id);
const nodes = {
  itemCount:$('item-count'),changeCount:$('change-count'),globalStatus:$('global-status'),
  restore:$('restore-draft'),reset:$('reset-all'),importButton:$('import-button'),
  importFile:$('import-file'),exportJson:$('export-json'),exportCsv:$('export-csv'),
  search:$('search'),filter:$('category-filter'),newCategory:$('new-category'),
  list:$('item-list'),listCount:$('list-count'),add:$('add-item'),del:$('delete-item'),
  title:$('detail-title'),form:$('product-form'),prices:$('price-fields'),
  beerFields:$('beer-fields'),previewName:$('preview-name'),
  previewDescription:$('preview-description'),previewPrices:$('preview-prices')
};
let original = [], records = [], sourceHash = '',selectedIndex = 0;
let ready = false;
const clone = value => JSON.parse(JSON.stringify(value));
const normalize = text => String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const fmt = amount => amount === null ? '—' : '$'+Number(amount).toLocaleString('es-CL');
const hasChanges = () => JSON.stringify(records)!==JSON.stringify(original);
const stamp = () => new Date().toISOString().slice(0,10);
const status = (message,isError=false) => {
  nodes.globalStatus.textContent = message;
  nodes.globalStatus.classList.toggle('is-error',isError);
};
const store = (payload) => {
  try {
    if (payload) localStorage.setItem(DRAFT_KEY,JSON.stringify(payload));
    else localStorage.removeItem(DRAFT_KEY);
  }catch{/* Private browsing may block localStorage; export still works. */}
};
const saved = () => {
  try {
    const payload=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
    return payload && payload.baseSha256===sourceHash ? payload : null;
  }catch{return null;}
};
async function digest(text){
  const bytes=new TextEncoder().encode(text);
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function selectOptions(){
  for (const node of [nodes.filter,nodes.newCategory]){
    node.replaceChildren();
    if (node === nodes.filter){
      const option=new Option('Todas las secciones','all');
      node.add(option);
    }
    categories.forEach(([key,label])=>node.add(new Option(label,key)));
  }
}
function refreshStatus(){
  nodes.itemCount.textContent = records.length+' PRODUCTOS';
  const dirty=hasChanges();
  nodes.changeCount.textContent=dirty?'CAMBIOS SIN PUBLICAR':'Sin cambios';
  nodes.changeCount.classList.toggle('is-dirty',dirty);
  nodes.reset.disabled=!dirty;
  if (!dirty){store(null);}else{
    store({format:FORMAT,baseSha256:sourceHash,items:records,savedAt:new Date().toISOString()});
  }
}
function visibleRecord(index){
  const obj=records[index];
  const cat=nodes.filter.value;
  const query=normalize(nodes.search.value);
  return (cat==='all'||cat===obj.category) &&
    (!query||normalize([obj.name,obj.name_en,obj.description_es,obj.description_en,obj.style||''].join(' ')).includes(query));
}
function renderList(){
  nodes.list.replaceChildren();
  let count=0;
  for (let index=0;index<records.length;index++){
    if (!visibleRecord(index))continue;
    count++;
    const item=records[index];
    const li=document.createElement('li');
    const button=document.createElement('button');
    button.type='button';
    button.dataset.index=String(index);
    button.className=index===selectedIndex?'is-active':'';
    button.setAttribute('aria-pressed',String(index===selectedIndex));
    const name=document.createElement('span');
    name.textContent=item.name.trim()||'Nuevo producto (sin nombre)';
    const sub=document.createElement('small');
    const valid=item.prices.filter(Number.isFinite);
    sub.textContent=categoryLabels[item.category]+' · '+(valid.length?valid.map(fmt).join(' / '):'Precio por definir');
    button.append(name,sub);
    button.addEventListener('click',()=>select(index));
    li.appendChild(button);
    nodes.list.appendChild(li);
  }
  nodes.listCount.textContent=count+' de '+records.length+' productos';
  if(count===0){
    const li=document.createElement('li');
    li.textContent='No hay productos para esta búsqueda.';
    li.style.padding='15px 8px';
    nodes.list.appendChild(li);
  }
}
function updatePreview(){
  const product=records[selectedIndex];
  if (!product)return;
  nodes.title.textContent=product.name.trim()||'NUEVO PRODUCTO';
  nodes.previewName.textContent=product.name.trim()||'Nombre pendiente';
  nodes.previewDescription.textContent=product.description_es.trim()||'Sin descripción';
  nodes.previewPrices.replaceChildren();
  (product.prices||[]).forEach((value,i)=>{
    const span=document.createElement('span');
    const small=document.createElement('small');
    small.textContent=(labels[product.category]||['Precio'])[i]||'Precio';
    span.append(small,document.createTextNode(fmt(value)));
    nodes.previewPrices.appendChild(span);
  });
}
function select(index){
  if(index<0||index>=records.length)return;
  selectedIndex=index;
  const product=records[index];
  for(const input of nodes.form.querySelectorAll('[data-field]')){
    if(input.dataset.field==='abv'||input.dataset.field==='ibu'||input.dataset.field==='style'){
      input.value=product[input.dataset.field]??'';
    }else input.value=product[input.dataset.field]??'';
  }
  nodes.beerFields.hidden=product.category!=='cervezas';
  nodes.prices.replaceChildren();
  product.prices.forEach((value,i)=>{
    const label=document.createElement('label');
    label.textContent=(labels[product.category]||['Precio'])[i]||'Precio '+(i+1);
    const input=document.createElement('input');
    input.type='number';input.min='1';input.max='1000000';input.step='1';
    input.inputMode='numeric';input.value=value===null?'':String(value);
    input.dataset.priceIndex=String(i);
    input.setAttribute('aria-label','Precio en pesos: '+label.textContent);
    label.append(input);
    nodes.prices.append(label);
  });
  renderList();updatePreview();
}
function updateRecord(){
  if(!ready||!records[selectedIndex])return;
  const product=records[selectedIndex];
  for(const input of nodes.form.querySelectorAll('[data-field]')){
    const key=input.dataset.field;
    if (product.category!=='cervezas' && ['style','abv','ibu'].includes(key))continue;
    if(['abv','ibu'].includes(key))product[key]=input.value===''?null:Number(input.value);
    else product[key]=input.value;
  }
  nodes.prices.querySelectorAll('[data-price-index]').forEach(input=>{
    product.prices[Number(input.dataset.priceIndex)]=input.value===''?null:Number(input.value);
  });
  refreshStatus();renderList();updatePreview();
}
function validate(items){
  if(!Array.isArray(items)||items.length===0||items.length>400)throw Error('La actualización debe contener entre 1 y 400 productos.');
  const known=new Set(categories.map(x=>x[0]));
  const uniqueness=new Set();
  const textKeys=['name','name_en','description_es','description_en','special'];
  items.forEach((item,i)=>{
    const place='Producto '+(i+1);
    if(!item||typeof item!=='object'||Array.isArray(item))throw Error(place+': registro inválido.');
    if(!known.has(item.category))throw Error(place+': categoría no reconocida.');
    for(const key of textKeys){
      if(typeof item[key]!=='string')throw Error(place+': falta el campo '+key+'.');
      const limit=key.startsWith('description')?1000:120;
      if(item[key].length>limit)throw Error(place+': campo '+key+' demasiado largo.');
    }
    if(!item.name.trim()||!item.name_en.trim())throw Error(place+': completa los nombres ES y EN.');
    if(!['','vegano','vegetariano'].includes(item.special))throw Error(place+': etiqueta alimentaria inválida.');
    const duplicate=item.category+'|'+normalize(item.name);
    if(uniqueness.has(duplicate))throw Error(place+': el nombre '+item.name+' está duplicado en su categoría.');
    uniqueness.add(duplicate);
    if(!Array.isArray(item.prices)||item.prices.length!==categoryPriceCount[item.category])throw Error(place+': cantidad de precios distinta de las variantes esperadas.');
    if(!item.prices.some(v=>v!==null))throw Error(place+': debe existir al menos un precio publicado.');
    item.prices.forEach((v,j)=>{
      if(v!==null&&(!Number.isInteger(v)||v<1||v>1000000))throw Error(place+': precio '+(j+1)+' inválido; utiliza pesos enteros.');
    });
    if(item.category==='cervezas'){
      if(typeof item.style!=='string'||item.style.length>80)throw Error(place+': estilo de cerveza inválido.');
      if(item.abv!==null&&(!Number.isFinite(item.abv)||item.abv<0||item.abv>30))throw Error(place+': ABV fuera de rango.');
      if(item.ibu!==null&&(!Number.isInteger(item.ibu)||item.ibu<0||item.ibu>150))throw Error(place+': IBU fuera de rango.');
    }else{
      if(['style','abv','ibu'].some(x=>x in item))throw Error(place+': los datos de cerveza solo corresponden a su categoría.');
    }
  });
  return true;
}
function applyImport(payload,source){
  if(!payload||payload.format!==FORMAT)throw Error('Archivo no reconocido: se requiere una exportación de este editor.');
  if(payload.baseSha256!==sourceHash)throw Error('Esta actualización fue creada sobre una versión distinta de la carta. No se aplica para evitar sobrescribir cambios recientes.');
  validate(payload.items);
  records=clone(payload.items);selectedIndex=0;
  nodes.search.value='';nodes.filter.value='all';
  select(0);refreshStatus();
  nodes.restore.hidden=true;
  status('Borrador '+source+' cargado. Revisa el contenido y descarga tu archivo; ningún cambio está publicado.');
}
function download(name,data,type){
  const blob=new Blob([data],{type});
  const uri=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=uri;link.download=name;link.style.display='none';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(uri),2000);
}
function csvCell(value){
  let s=String(value??'');
  if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;
  return '"'+s.replaceAll('"','""')+'"';
}
function exportJson(){
  try{
    updateRecord();validate(records);
    const payload={format:FORMAT,baseSha256:sourceHash,exportedAt:new Date().toISOString(),items:records};
    download('ukbar-carta-actualizacion-'+stamp()+'.json',JSON.stringify(payload,null,2)+'\n','application/json;charset=utf-8');
    status('Actualización descargada para revisión. No se ha publicado ningún cambio.');
  }catch(error){status(error.message,true);}
}
function exportCsv(){
  try{
    updateRecord();validate(records);
    const head=['Categoría','Nombre ES','Name EN','Descripción ES','Description EN','Precio 1','Precio 2','Precio 3','Etiqueta','Estilo cerveza','ABV','IBU'];
    const rows=[head,...records.map(x=>[x.category,x.name,x.name_en,x.description_es,x.description_en,...[0,1,2].map(i=>x.prices[i]??''),x.special,x.style||'',x.abv??'',x.ibu??''])];
    const csv='\ufeff'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')+'\r\n';
    download('ukbar-carta-revision-'+stamp()+'.csv',csv,'text/csv;charset=utf-8');
    status('CSV descargado para revisión en Excel; no publica modificaciones.');
  }catch(error){status(error.message,true);}
}
function bind(){
  nodes.form.addEventListener('submit',e=>e.preventDefault());
  nodes.form.addEventListener('input',updateRecord);
  nodes.form.addEventListener('change',updateRecord);
  nodes.search.addEventListener('input',renderList);
  nodes.filter.addEventListener('change',renderList);
  nodes.add.addEventListener('click',()=>{
    if(records.length>=400)return status('Límite de 400 productos.',true);
    const category=nodes.newCategory.value;
    const count=categoryPriceCount[category];
    const product={category,name:'',name_en:'',description_es:'',description_en:'',prices:Array(count).fill(null),special:''};
    if(category==='cervezas'){product.style='';product.abv=null;product.ibu=null;}
    records.push(product);nodes.search.value='';nodes.filter.value='all';select(records.length-1);
    refreshStatus();status('Nuevo producto creado en el borrador. Completa sus campos antes de exportar.');
    $('name-es').focus();
  });
  nodes.del.addEventListener('click',()=>{
    if(records.length<=1)return status('No se puede dejar la carta sin productos.',true);
    if(!confirm('¿Eliminar este producto del borrador? Esta acción no afecta a la carta publicada.'))return;
    records.splice(selectedIndex,1);select(Math.min(selectedIndex,records.length-1));
    refreshStatus();status('Producto eliminado del borrador; todavía no está publicado.');
  });
  nodes.reset.addEventListener('click',()=>{
    if(!confirm('¿Descartar todos los cambios locales y recuperar la carta publicada?'))return;
    records=clone(original);nodes.search.value='';nodes.filter.value='all';select(0);refreshStatus();
    nodes.restore.hidden=true;status('Borrador descartado. Se muestra la carta publicada.');
  });
  nodes.restore.addEventListener('click',()=>{
    const draft=saved();
    if(!draft)return status('No hay un borrador compatible para recuperar.',true);
    try{applyImport(draft,'local');}catch(error){status(error.message,true);}
  });
  nodes.importButton.addEventListener('click',()=>nodes.importFile.click());
  nodes.importFile.addEventListener('change',async()=>{
    const file=nodes.importFile.files[0];if(!file)return;
    try{
      if(file.size>2000000)throw Error('El archivo supera el límite de 2 MB.');
      const obj=JSON.parse(await file.text());
      applyImport(obj,'importado');
    }catch(error){status('No se importó: '+error.message,true);}
    nodes.importFile.value='';
  });
  nodes.exportJson.addEventListener('click',exportJson);
  nodes.exportCsv.addEventListener('click',exportCsv);
}
async function initialize(){
  try{
    const response=await fetch('../menu-data.json',{cache:'no-store'});
    if(!response.ok)throw Error('No se pudo obtener el catálogo publicado ('+response.status+').');
    const raw=await response.text();
    sourceHash=await digest(raw);
    original=JSON.parse(raw);validate(original);records=clone(original);
    selectOptions();nodes.filter.value='all';nodes.newCategory.value='picadas';
    ready=true;bind();select(0);refreshStatus();
    const draft=saved();
    if(draft&&JSON.stringify(draft.items)!==JSON.stringify(original))nodes.restore.hidden=false;
    status('Carta publicada cargada: '+records.length+' productos. Cambios locales sin publicación automática.');
  }catch(error){
    status('Error al cargar la carta: '+error.message,true);
    nodes.exportJson.disabled=true;nodes.exportCsv.disabled=true;nodes.add.disabled=true;
  }
}
initialize();
})();