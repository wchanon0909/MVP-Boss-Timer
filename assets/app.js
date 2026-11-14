(() => {
  'use strict';
  const BOSSES = (window.MVP_BOSSES || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const BOSS_MAP = new Map(BOSSES.map(b => [String(b.id), b]));
  const API = String(window.MVP_CONFIG?.API_BASE || '').trim().replace(/\/+$/, '');
  const LOCAL_KEY = 'mvp-tomb-timers-v1';
  const NICK_KEY = 'mvp-tomb-editor-v1';
  const DELAY = 2 * 60 * 60 * 1000;
  const $ = id => document.getElementById(id);
  const elements = {
    bossSearch: $('bossSearch'), bossSelect: $('bossSelect'), mapSelect: $('mapSelect'), mapLink: $('mapLink'), mapInfo: $('mapInfo'),
    date: $('deathDate'), time: $('deathTime'), editor: $('editorName'), form: $('timerForm'), saveBtn: $('saveBtn'),
    list: $('records'), listSearch: $('listSearch'), mode: $('modeBadge'), error: $('errorNotice'),
    dialog: $('deleteDialog'), toast: $('toast')
  };
  let records = [];
  let statusFilter = 'all';
  let pendingDelete = null;
  let editingKey = null;
  let saving = false;
  let toastHandle = null;

  function safeText(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function pairs(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
    return Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
  }
  function thaiDateISO(date = new Date()) { const p = pairs(date); return `${p.year}-${p.month}-${p.day}`; }
  function thaiTime(date = new Date(), seconds = false) { const p = pairs(date); return `${p.hour}:${p.minute}${seconds ? ':' + p.second : ''}`; }
  function dateLabel(date) { const p = pairs(date); return `${p.day}/${p.month}/${p.year}`; }
  function parseThaiDateTime(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
    const parsed = new Date(`${date}T${time}:00+07:00`);
    if (!Number.isFinite(parsed.valueOf()) || thaiDateISO(parsed) !== date || thaiTime(parsed) !== time) return null;
    return parsed;
  }
  function pretty(dateString) { const date = new Date(dateString); return Number.isFinite(date.valueOf()) ? `${dateLabel(date)} ${thaiTime(date)}` : '—'; }
  function keyOf(id, mapId) { return `${id}::${mapId}`; }
  function getBoss(id) { return BOSS_MAP.get(String(id)); }
  function getMap(bossId, mapId) { const boss=getBoss(bossId); return boss?.maps.find(m => m[0] === mapId); }
  function isValidRow(r) { return !!(r && getMap(r.bossId,r.mapId) && Number.isFinite(Date.parse(r.tombAt)) && Number.isFinite(Date.parse(r.spawnAt))); }
  function localRead() {
    try { const rows = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); return Array.isArray(rows) ? rows.filter(isValidRow) : []; }
    catch { return []; }
  }
  function localWrite(rows) { try { localStorage.setItem(LOCAL_KEY,JSON.stringify(rows)); return true; } catch { return false; } }
  function setMode(mode) {
    elements.mode.className = `mode ${mode==='online' ? '' : mode==='local' ? 'mode-local' : 'mode-offline'}`;
    elements.mode.querySelector('span').textContent = ({online:'ออนไลน์ · แชร์ร่วมกัน',local:'โหมดทดลอง',offline:'เชื่อมต่อไม่สำเร็จ'})[mode];
  }
  function showError(message = '') { elements.error.hidden = !message; elements.error.textContent = message; }
  function notify(message, error = false) {
    elements.toast.textContent = message; elements.toast.className = `toast ${error?'error':''}`; elements.toast.hidden = false;
    clearTimeout(toastHandle); toastHandle=setTimeout(() => elements.toast.hidden=true, 3300);
  }
  function todayMinusDays(days) {
    const [y,m,d]=thaiDateISO().split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d-days)).toISOString().slice(0,10);
  }
  function updateDayPills() {
    $('todayBtn').classList.toggle('active', elements.date.value === todayMinusDays(0));
    $('yesterdayBtn').classList.toggle('active', elements.date.value === todayMinusDays(1));
  }
  function addBossOptions(query = '', keep = '') {
    const q=query.trim().toLowerCase();
    const shown=BOSSES.filter(b => b.name.toLowerCase().includes(q) || String(b.id).includes(q));
    elements.bossSelect.innerHTML='<option value="">— เลือกบอส —</option>'+shown.map(b=>`<option value="${b.id}">${safeText(b.name)}</option>`).join('');
    if (shown.some(b=>String(b.id)===String(keep))) elements.bossSelect.value=String(keep);
    else if (shown.length === 1 && q) elements.bossSelect.value=String(shown[0].id);
    onBossChange();
    $('bossHint').textContent=`พบ ${shown.length} / ${BOSSES.length} บอสจาก RateMyServer (Pre-Re)`;
  }
  function onBossChange(keepMap='') {
    const boss = getBoss(elements.bossSelect.value);
    elements.mapSelect.disabled = !boss;
    if (!boss) {
      elements.mapSelect.innerHTML='<option value="">— เลือกบอสก่อน —</option>';
      elements.mapLink.hidden=true;
      elements.mapInfo.textContent='บอสบางตัวมีหลายแมพ ระบบจะแยกเวลาแต่ละแมพ';
    } else {
      elements.mapSelect.innerHTML=boss.maps.map(m=>`<option value="${safeText(m[0])}">${safeText(m[0])} · ${safeText(m[1])}</option>`).join('');
      if (boss.maps.some(m=>m[0]===keepMap)) elements.mapSelect.value=keepMap;
      elements.mapInfo.textContent=boss.maps.length > 1 ? `บอสนี้มี ${boss.maps.length} แมพ — เวลาแต่ละแมพแยกจากกัน` : 'แมพอ้างอิงจาก RateMyServer (Pre-Re)';
    }
    onMapChange();
  }
  function onMapChange() {
    const id=elements.mapSelect.value;
    elements.mapLink.hidden=!id;
    if (id) elements.mapLink.href=`https://ratemyserver.net/index.php?map=${encodeURIComponent(id)}&page=npc_shop_warp&s_block=mob_block`;
    const existing=records.find(r=>keyOf(r.bossId,r.mapId)===keyOf(elements.bossSelect.value,id));
    if (existing && !editingKey) $('saveBtn').textContent='↻ อัปเดตเวลาบอส';
    else $('saveBtn').textContent=editingKey ? '↻ อัปเดตเวลาบอส' : '✚ บันทึกเวลาบอส';
  }
  function updatePreview() {
    const dead=parseThaiDateTime(elements.date.value,elements.time.value);
    const spawn=dead && new Date(dead.valueOf()+DELAY);
    $('previewTime').textContent=spawn ? thaiTime(spawn) : '— : —';
    $('previewDay').textContent=spawn ? dateLabel(spawn) : 'กรอกเวลาตายก่อน';
    updateDayPills();
  }
  function resetForm(focus=false) {
    editingKey=null;
    elements.bossSearch.value='';
    addBossOptions();
    elements.date.value=todayMinusDays(0);
    elements.time.value='';
    $('saveBtn').textContent='✚ บันทึกเวลาบอส';
    updatePreview();
    if (focus) { window.scrollTo({top:0,behavior:'smooth'}); elements.bossSearch.focus({preventScroll:true}); }
  }
  function readForm() {
    const bossId=Number(elements.bossSelect.value);
    const mapId=elements.mapSelect.value;
    if (!getMap(bossId,mapId)) throw new Error('กรุณาเลือกชื่อบอสและแมพให้ครบ');
    const tomb=parseThaiDateTime(elements.date.value,elements.time.value);
    if (!tomb) throw new Error('กรุณากรอกวันและเวลาตายบน Tomb ให้ถูกต้อง');
    const age=Date.now()-tomb.valueOf();
    if (age < -5*60*1000) throw new Error('เวลาตายบน Tomb ต้องไม่ใช่เวลาในอนาคต');
    if (age > 14*24*60*60*1000) throw new Error('กรุณากรอกเวลาตายในช่วง 14 วันที่ผ่านมา');
    const editor=elements.editor.value.trim().slice(0,24);
    try { localStorage.setItem(NICK_KEY,editor); } catch {}
    return {bossId,mapId,tombAt:tomb.toISOString(),editor};
  }
  async function loadRecords(quiet=false) {
    if (!API) {
      records=localRead(); setMode('local'); showError(''); renderRecords();
      $('syncStamp').textContent='ข้อมูลบนเครื่อง'; return;
    }
    try {
      const res=await fetch(`${API}/api/timers`,{cache:'no-store',headers:{'Accept':'application/json'}});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      if (!Array.isArray(data.rows)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
      records=data.rows.filter(isValidRow);
      setMode('online'); showError(''); renderRecords();
      $('syncStamp').textContent=`ซิงก์ล่าสุด ${thaiTime(new Date())}`;
    } catch(e) {
      setMode('offline');
      if (!quiet) showError('เชื่อมต่อ Worker ไม่สำเร็จ — ตรวจ URL ใน config.js และการ Deploy Cloudflare ('+e.message+')');
      $('syncStamp').textContent='ยังซิงก์ไม่ได้';
      if (!quiet) notify('โหลดข้อมูลร่วมกันไม่สำเร็จ',true);
    }
  }
  async function saveRow(row) {
    if (!API) {
      const now=new Date().toISOString();
      const record={...row,spawnAt:new Date(Date.parse(row.tombAt)+DELAY).toISOString(),updatedAt:now};
      const next=localRead().filter(r=>keyOf(r.bossId,r.mapId)!==keyOf(row.bossId,row.mapId));next.push(record);
      if (!localWrite(next)) throw new Error('ไม่สามารถบันทึกข้อมูลในเบราว์เซอร์นี้ได้');
      await loadRecords(true);return;
    }
    const res=await fetch(`${API}/api/timers`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)});
    if (!res.ok) {let msg=`HTTP ${res.status}`;try{msg=(await res.json()).error||msg;}catch{}throw new Error(msg);}
    await loadRecords(true);
  }
  async function removeRow(row) {
    if (!API) {
      if (!localWrite(localRead().filter(r=>keyOf(r.bossId,r.mapId)!==keyOf(row.bossId,row.mapId)))) throw new Error('ไม่สามารถลบข้อมูลในเครื่องนี้ได้');
      await loadRecords(true);return;
    }
    const res=await fetch(`${API}/api/timers`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({bossId:row.bossId,mapId:row.mapId})});
    if (!res.ok) {let msg=`HTTP ${res.status}`;try{msg=(await res.json()).error||msg;}catch{}throw new Error(msg);}
    await loadRecords(true);
  }
  function duration(ms) {
    const total=Math.max(0,Math.floor(Math.abs(ms)/1000));
    const d=Math.floor(total/86400),h=Math.floor(total/3600)%24,m=Math.floor(total/60)%60,s=total%60;
    return d ? `${d}วัน ${h}ชม. ${m}น.` : `${h ? h+'ชม. ' : ''}${String(m).padStart(h?2:1,'0')}น. ${String(s).padStart(2,'0')}วิ.`;
  }
  function countdownHTML(spawn) { const ms=Date.parse(spawn)-Date.now();return ms>0 ? `เหลือ ${duration(ms)}` : `เลยมา ${duration(ms)}`; }
  function formatEntry(r) {
    const boss=getBoss(r.bossId),map=getMap(r.bossId,r.mapId);
    if (!boss || !map) return '';
    const expired=Date.parse(r.spawnAt)<=Date.now();
    const nickname=r.editor ? ` · โดย <b>${safeText(r.editor)}</b>` : '';
    const actionKey=safeText(keyOf(r.bossId,r.mapId));
    const monogram=safeText(boss.name.substring(0,2).toUpperCase());
    const mapLink=`https://ratemyserver.net/index.php?map=${encodeURIComponent(r.mapId)}&page=npc_shop_warp&s_block=mob_block`;
    const when=new Date(r.spawnAt);
    return `<article class="entry ${expired?'overdue':''}" data-row-key="${actionKey}">
      <div class="entry-head"><div class="mob-monogram">${monogram}</div><div><h3>${safeText(boss.name)}</h3><p><a href="${safeText(mapLink)}" target="_blank" rel="noopener noreferrer"><code>${safeText(r.mapId)}</code> ↗</a> · ${safeText(map[1])}</p></div></div>
      <div class="entry-time"><strong class="respawn-clock">${thaiTime(when)}</strong><span class="respawn-day">${dateLabel(when)}</span><span class="countdown" data-spawn="${safeText(r.spawnAt)}">${countdownHTML(r.spawnAt)}</span></div>
      <div class="entry-bottom"><div class="entry-meta"><span>Tomb <b>${pretty(r.tombAt)}</b>${nickname}</span><span>แก้ไขล่าสุด ${pretty(r.updatedAt)}</span></div><div class="entry-actions"><button type="button" data-action="edit" data-key="${actionKey}">✎ แก้ไข</button><button type="button" class="delete" data-action="delete" data-key="${actionKey}">ลบ</button></div></div>
    </article>`;
  }
  function sortedRows() {
    const now=Date.now();
    return records.slice().sort((a,b)=> {
      const at=Date.parse(a.spawnAt), bt=Date.parse(b.spawnAt), aPast=at<=now, bPast=bt<=now;
      if (aPast!==bPast) return aPast?1:-1;
      return aPast ? bt-at : at-bt;
    });
  }
  function renderRecords() {
    const now=Date.now();
    const waiting=records.filter(r=>Date.parse(r.spawnAt)>now).length;
    $('statWaiting').textContent=waiting;
    $('statOverdue').textContent=records.length-waiting;
    $('statAll').textContent=records.length;
    const q=elements.listSearch.value.trim().toLowerCase();
    const filtered=sortedRows().filter(r=> {
      if (statusFilter==='waiting' && Date.parse(r.spawnAt)<=now) return false;
      if (statusFilter==='overdue' && Date.parse(r.spawnAt)>now) return false;
      const b=getBoss(r.bossId),m=getMap(r.bossId,r.mapId);
      return b && m && [b.name,r.mapId,m[1]].some(x=>x.toLowerCase().includes(q));
    });
    $('visibleCount').textContent=`แสดง ${filtered.length} จาก ${records.length} รายการ`;
    if (!filtered.length) {
      const hasData=records.length>0;
      elements.list.innerHTML=`<div class="empty"><span class="empty-symbol">◌</span><h3>${hasData?'ไม่พบรายการที่ค้นหา':'ยังไม่มีเวลาบอส'}</h3><p>${hasData?'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ':'เมื่อมีคนกรอก Tomb ระบบจะแสดงเวลาบอสเกิดตรงนี้'}</p></div>`;
    } else elements.list.innerHTML=filtered.map(formatEntry).join('');
    onMapChange();
  }
  function refreshTick() {
    $('thaiClock').textContent=thaiTime(new Date(),true);
    let crossed=false;
    for (const el of elements.list.querySelectorAll('[data-spawn]')) {
      const spawn=el.dataset.spawn, diff=Date.parse(spawn)-Date.now();
      const previouslyOverdue=el.closest('.entry')?.classList.contains('overdue');
      if (previouslyOverdue !== (diff<=0)) crossed=true;
      el.textContent=countdownHTML(spawn);
    }
    if (crossed) renderRecords();
  }
  function editRow(row) {
    const boss=getBoss(row.bossId); if (!boss) return;
    editingKey=keyOf(row.bossId,row.mapId);
    elements.bossSearch.value=boss.name;
    addBossOptions(boss.name, row.bossId);
    onBossChange(row.mapId);
    elements.date.value=thaiDateISO(new Date(row.tombAt));
    elements.time.value=thaiTime(new Date(row.tombAt));
    elements.editor.value=row.editor||'';
    updatePreview();
    $('saveBtn').textContent='↻ อัปเดตเวลาบอส';
    window.scrollTo({top:0,behavior:'smooth'});
    notify(`กำลังแก้ไข ${boss.name} · ${row.mapId}`);
  }
  async function onSubmit(ev) {
    ev.preventDefault(); if (saving) return;
    let row;
    try {row=readForm();} catch(e){notify(e.message,true);return;}
    saving=true; elements.saveBtn.disabled=true;elements.saveBtn.textContent='กำลังบันทึก...';
    try { await saveRow(row);notify('บันทึกสำเร็จ · ระบบคำนวณเกิดใหม่ +2 ชั่วโมงแล้ว');resetForm(); }
    catch(e){notify(`บันทึกไม่สำเร็จ: ${e.message}`,true);showError(e.message);}
    finally{saving=false;elements.saveBtn.disabled=false;onMapChange();}
  }
  function askDelete(row) {
    pendingDelete=row;
    $('deleteMessage').textContent=`${getBoss(row.bossId)?.name || 'บอส'} ที่แมพ ${row.mapId} จะถูกลบจากตารางของทุกคน`;
    if (typeof elements.dialog.showModal === 'function') elements.dialog.showModal();
    else if (confirm('ยืนยันลบเวลาบอสนี้?')) confirmDelete();
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    const row=pendingDelete; pendingDelete=null;
    elements.dialog.close?.();
    const button=$('confirmDelete');button.disabled=true;
    try {await removeRow(row);notify('ลบเวลาบอสเรียบร้อยแล้ว');}
    catch(e){notify(`ลบไม่สำเร็จ: ${e.message}`,true);showError(e.message);}
    finally{button.disabled=false;}
  }
  function bindEvents() {
    elements.bossSearch.addEventListener('input',()=>addBossOptions(elements.bossSearch.value));
    elements.bossSelect.addEventListener('change',()=>{ editingKey=null; onBossChange(); });
    elements.mapSelect.addEventListener('change',()=>{ editingKey=null; onMapChange(); });
    elements.date.addEventListener('input',updatePreview);
    elements.time.addEventListener('input',updatePreview);
    $('todayBtn').addEventListener('click',()=>{elements.date.value=todayMinusDays(0);updatePreview();});
    $('yesterdayBtn').addEventListener('click',()=>{elements.date.value=todayMinusDays(1);updatePreview();});
    elements.form.addEventListener('submit',onSubmit);
    $('clearBtn').addEventListener('click',()=>resetForm());
    elements.listSearch.addEventListener('input',renderRecords);
    document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
      statusFilter=btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===btn));renderRecords();
    }));
    elements.list.addEventListener('click',event=>{
      const button=event.target.closest('button[data-action]');if(!button)return;
      const row=records.find(r=>keyOf(r.bossId,r.mapId)===button.dataset.key);if(!row)return;
      if(button.dataset.action==='edit') editRow(row);
      if(button.dataset.action==='delete') askDelete(row);
    });
    $('cancelDelete').addEventListener('click',()=>{pendingDelete=null;elements.dialog.close();});
    $('confirmDelete').addEventListener('click',confirmDelete);
    elements.dialog.addEventListener('close',()=>{pendingDelete=null;});
    $('reloadBtn').addEventListener('click',()=>loadRecords());
    window.addEventListener('focus',()=>loadRecords(true));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadRecords(true);});
  }
  async function init() {
    bindEvents();
    resetForm();
    try {elements.editor.value=localStorage.getItem(NICK_KEY)||'';}catch{}
    $('localNotice').hidden=!!API;
    refreshTick();
    await loadRecords();
    setInterval(refreshTick,1000);
    setInterval(()=>{if(document.visibilityState==='visible')loadRecords(true);},15000);
  }
  init();
})();
