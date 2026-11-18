import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {seed,warehouses} from '../data/seed';
import realCatalog from '../data/realCatalog.json';
const C=createContext(null), KEY='inventario-demo-v5';
const uid=(prefix)=>`${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
const now=()=>new Date().toLocaleString('es-PE');
// Una fila por unidad física, incluso para los artículos sin número de serie.
// El identificador de inventario no equivale a un número de serie del fabricante.
const source=[...seed,...realCatalog.map((a,i)=>({...a,id:`ACT-${String(1000+i).padStart(4,'0')}`,sku:`ART-REAL-${String(i+1).padStart(3,'0')}`,warehouse:warehouses[i%4],serial:a.serialized?`DEMO-SER-${String(i+1).padStart(5,'0')}`:'',location:a.origin||`AL-${warehouses[i%4]}`,notes:'Modelo y categoría del Excel; serie y distribución simuladas.'}))];
const initialAssets=source.flatMap((a,i)=>Array.from({length:Math.max(1,Number(a.quantity)||1)},(_,n)=>({...a,id:n===0?a.id:`${a.id}-U${String(n+1).padStart(3,'0')}`,quantity:1,serial:n===0?a.serial:(a.serialized?`DEMO-${a.id}-U${n+1}`:''),unitIndex:n+1})));
const initial={assets:initialAssets,requests:[],events:[]};
export function InventoryProvider({children}){
 const [db,setDb]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(initial)}catch{return structuredClone(initial)}});
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(db)),[db]);
 const [role,setRole]=useState('Supervisor'),[warehouse,setWarehouse]=useState('Moquegua');
 const locked=(assetId,d=db)=>d.requests.some(r=>['Pendiente de preparación','En preparación','En tránsito'].includes(r.status)&&r.lines.some(l=>l.assetId===assetId));
 const available=(a,d=db)=>a&&a.quantity>0&&a.status==='ALMACENADO'&&a.substatus!=='BLOQUEADO'&&!locked(a.id,d)?1:0;
 const transact=(action,fn)=>{const next=structuredClone(db);const detail=fn(next);if(!detail)return false;next.events.unshift({id:uid('EV'),date:now(),action,detail,actor:role});setDb(next);return detail};
 const addAsset=v=>transact('Ingreso',d=>{const qty=Number(v.quantity)||1;if(qty<1||!Number.isInteger(qty))return false;const base=uid('ACT');for(let i=0;i<qty;i++)d.assets.push({...v,id:qty===1?base:`${base}-U${i+1}`,quantity:1,serial:i===0?(v.serial||''):'',status:'ALMACENADO',substatus:'DISPONIBLE'});return `${qty} unidad(es) de ${v.model}`});

 const createEntryRequest=(items,from,reason)=>transact('Solicitud de ingreso',d=>{
  if(role!=='Supervisor'||!warehouses.includes(from)||!items.length)return false;
  const id=uid('ING');const lines=[];
  for(const item of items){const count=Number(item.quantity)||1;if(!Number.isInteger(count)||count<1)return false;
   for(let i=0;i<count;i++){const assetId=uid('ACT');const asset={...item,id:assetId,quantity:1,warehouse:from,status:'PENDIENTE INGRESO',substatus:'NO DISPONIBLE',condition:item.condition||'NUEVO',serial:i===0?(item.serial||''):'',requestId:id};d.assets.push(asset);lines.push({assetId,checked:false});}}
  d.requests.unshift({id,type:'Ingreso',from,to:'',reason:reason||'Ingreso de nuevos activos',by:role,date:now(),status:'Pendiente de recepción',lines,history:[{date:now(),by:role,status:'Pendiente de recepción'}]});return id;
 });
 const createRMARequest=(assetIds,from,reason,decision)=>transact('Solicitud RMA',d=>{
  if(!['Supervisor','Gestor'].includes(role)||!warehouses.includes(from)||!['Reingreso','DISPOSAL'].includes(decision)||!assetIds.length||!reason?.trim())return false;
  if(new Set(assetIds).size!==assetIds.length)return false;
  for(const assetId of assetIds){const a=d.assets.find(x=>x.id===assetId);if(!a||a.status!=='ASIGNADO'||d.requests.some(r=>r.type==='RMA'&&!['Cerrada','Cancelada'].includes(r.status)&&r.lines.some(l=>l.assetId===assetId)))return false;}
  const id=uid('RMA');d.requests.unshift({id,type:'RMA',decision,from,to:'',reason,by:role,date:now(),status:'Pendiente de recepción',lines:assetIds.map(assetId=>({assetId,checked:false})),history:[{date:now(),by:role,status:'Pendiente de recepción'}]});return id;
 });
 const checkReception=(id,assetId,checked)=>transact('Verificación física',d=>{
  if(role!=='Almacenero')return false;const r=d.requests.find(x=>x.id===id);
  if(!r||!['Ingreso','RMA'].includes(r.type)||r.from!==warehouse||r.status!=='Pendiente de recepción')return false;
  const line=r.lines.find(l=>l.assetId===assetId);if(!line)return false;line.checked=checked;return `${id} · ${assetId} · ${checked?'Verificado':'Sin verificar'}`;
 });
 const closeReception=(id)=>transact('Cierre de recepción',d=>{
  if(role!=='Almacenero')return false;const r=d.requests.find(x=>x.id===id);
  if(!r||!['Ingreso','RMA'].includes(r.type)||r.from!==warehouse||r.status!=='Pendiente de recepción'||!r.lines.length||r.lines.some(l=>!l.checked))return false;
  for(const l of r.lines){const a=d.assets.find(x=>x.id===l.assetId);if(!a)return false;
   if(r.type==='Ingreso'){a.status='ALMACENADO';a.substatus='DISPONIBLE';a.warehouse=r.from;}
   else if(r.decision==='DISPOSAL'){a.status='DISPOSAL';a.substatus='BAJA';a.warehouse=r.from;a.condition='AVERIADO';}
   else{a.status='ALMACENADO';a.substatus='DISPONIBLE';a.warehouse=r.from;a.condition='USADO';a.user='';}
  }
  r.status='Cerrada';r.history.push({date:now(),by:role,status:'Cerrada'});return `${id} · ${r.type}${r.decision?' / '+r.decision:''} · ${r.lines.length} activos recibidos`;
 });
 const createRequest=(type,items,reason,from,to='')=>transact(type==='Salida'?'Solicitud de salida':'Solicitud de transferencia',d=>{if(!['Salida','Transferencia'].includes(type)||!from||!reason?.trim()||!items?.length||type==='Transferencia'&&(!to||to===from))return false;const ids=items.map(x=>x.assetId);if(new Set(ids).size!==ids.length)return false;for(const id of ids){const a=d.assets.find(x=>x.id===id);if(!a||a.warehouse!==from||!available(a,d))return false;}const id=uid(type==='Salida'?'SAL':'TRA');d.requests.unshift({id,type,from,to,reason,by:role,date:now(),status:'Pendiente de preparación',lines:ids.map(assetId=>({assetId})),history:[{date:now(),by:role,status:'Pendiente de preparación'}]});return `${id} · ${ids.length} activos · ${from}${to?' → '+to:''}`});
 const advanceRequest=(id)=>transact('Operación física',d=>{const r=d.requests.find(x=>x.id===id);if(!r)return false;const inOrigin=warehouse===r.from,inDest=warehouse===r.to;let next;if(r.status==='Pendiente de preparación'&&inOrigin)next='En preparación';else if(r.status==='En preparación'&&inOrigin){for(const l of r.lines){const a=d.assets.find(x=>x.id===l.assetId);if(!a||a.quantity!==1||a.warehouse!==r.from)return false;}next=r.type==='Salida'?'Despachada':'En tránsito';for(const l of r.lines){const a=d.assets.find(x=>x.id===l.assetId);if(r.type==='Salida'){a.quantity=1;a.status='ASIGNADO';a.substatus='EN USO';a.warehouse='Asignado';a.user=r.reason}else{a.warehouse='En tránsito';a.status='EN TRÁNSITO'}}}else if(r.status==='En tránsito'&&inDest){next='Recibida';for(const l of r.lines){const a=d.assets.find(x=>x.id===l.assetId);a.warehouse=r.to;a.status='ALMACENADO';a.substatus='DISPONIBLE'}}else return false;r.status=next;r.history.push({date:now(),by:role,status:next});return `${r.id} → ${next} (${r.lines.length} activos)`});
 const receive=(assetId,qty,condition,notes)=>transact('Devolución',d=>{const a=d.assets.find(x=>x.id===assetId);if(!a||qty!==1)return false;a.quantity=1;a.status='ALMACENADO';a.warehouse=warehouse;a.substatus=condition==='Operativo'?'DISPONIBLE':'BLOQUEADO';a.condition=condition==='Operativo'?'USADO':'AVERIADO';a.notes=[a.notes,notes].filter(Boolean).join(' | ');return `${a.id} · ${condition}`});
 const reset=()=>setDb(structuredClone(initial));
 const value=useMemo(()=>({db,role,setRole,warehouse,setWarehouse,warehouses,available,addAsset,createEntryRequest,createRMARequest,checkReception,closeReception,createRequest,advanceRequest,receive,reset}),[db,role,warehouse]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export const useInventory=()=>useContext(C);
