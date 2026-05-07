/* ════════════════════════════════════════════════════════════
ESTADO GLOBAL
════════════════════════════════════════════════════════════ */
let db = null;
let filterCat = 'all';

/* ════════════════════════════════════════════════════════════
FIREBASE — INICIALIZACIÓN
════════════════════════════════════════════════════════════ */
function initFirebase() {
try {
firebase.initializeApp(firebaseConfig);
db = firebase.database(); 
db.ref('.info/connected').on('value', snap => {
setDbStatus(snap.val() === true ? 'connected' : 'disconnected');
});	 
startListening();
} catch (e) {
showToast('Error al conectar con Firebase: ' + e.message, 'error');
setDbStatus('error');
}
}

/* ════════════════════════════════════════════════════════════
FIREBASE — ESCUCHAR CAMBIOS EN TIEMPO REAL
════════════════════════════════════════════════════════════ */
function startListening() {
if (!db) return;
const ref = db.ref('platillos');	 
ref.on('value', snap => {
const data = snap.val() || {};
const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
renderAll(list);
}, err => {
showToast('Error al leer datos: ' + err.message, 'error');
});
}

/* ════════════════════════════════════════════════════════════
CARGAR DATOS DE EJEMPLO
════════════════════════════════════════════════════════════ */
function cargarEjemplos() {
if (!db) return;
db.ref('platillos').once('value').then(snap => {
if (snap.exists()) {
showToast('La base de datos ya tiene platillos registrados.', 'info');
return;
}
const batch = {};
PLATILLOS_EJEMPLO.forEach(p => {
const key = db.ref('platillos').push().key;
batch['platillos/' + key] = p;
});
db.ref().update(batch)
.then(() => showToast('¡' + PLATILLOS_EJEMPLO.length + ' platillos de ejemplo cargados!', 'success'))
.catch(e => showToast('Error al cargar ejemplos: ' + e.message, 'error'));
});
}

/* ════════════════════════════════════════════════════════════
CRUD
════════════════════════════════════════════════════════════ */
function saveDish() {
const name = document.getElementById('f-name').value.trim();
const price = parseFloat(document.getElementById('f-price').value);
const cat = document.getElementById('f-cat').value;
const icon = document.getElementById('f-icon').value.trim() || '🍽️';
const desc = document.getElementById('f-desc').value.trim();
const editId = document.getElementById('edit-id').value;
if (!name) { showToast('El nombre del platillo es obligatorio.', 'error'); return; }
if (!price || price <= 0) { showToast('Ingresa un precio válido mayor a 0.', 'error'); return; }
if (!db) { showToast('Sin conexión con Firebase. Recarga la página.', 'error'); return; }	 
const dish = { name, price, cat, icon, desc };	 
if (editId) {
db.ref('platillos/' + editId).update(dish)
.then(() => { showToast('Platillo actualizado.', 'success'); clearForm(); })
.catch(e => showToast('Error: ' + e.message, 'error'));
} else {
db.ref('platillos').push(dish)
.then(() => { showToast('Platillo agregado al menú.', 'success'); clearForm(); })
.catch(e => showToast('Error: ' + e.message, 'error'));
}
}	 

function editDish(id) {
if (!db) return;
db.ref('platillos/' + id).once('value').then(snap => {
const d = snap.val();
if (d) populateForm(id, d);
});
}

function populateForm(id, d) {
document.getElementById('edit-id').value = id;
document.getElementById('f-name').value = d.name || '';
document.getElementById('f-price').value = d.price || '';
document.getElementById('f-cat').value = d.cat || 'plato';
document.getElementById('f-icon').value = d.icon || '';
document.getElementById('f-desc').value = d.desc || '';
document.getElementById('form-title').textContent = 'Editando: ' + d.name;
document.getElementById('btn-save-text').textContent = 'Guardar cambios';
document.getElementById('btn-cancel-edit').style.display = 'inline-flex';
document.getElementById('f-name').focus();
document.getElementById('f-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}	 
function deleteDish(id, name) {
if (!confirm('¿Eliminar "' + name + '"?')) return;
if (!db) return;
db.ref('platillos/' + id).remove()
.then(() => showToast('Platillo eliminado.', 'info'))
.catch(e => showToast('Error: ' + e.message, 'error'));
}
	 
function clearForm() {
document.getElementById('edit-id').value = '';
document.getElementById('f-name').value = '';
document.getElementById('f-price').value = '';
document.getElementById('f-icon').value = '';
document.getElementById('f-desc').value = '';
document.getElementById('f-cat').value = CATS[0].id;
document.getElementById('form-title').textContent = 'Agregar nuevo platillo';
document.getElementById('btn-save-text').textContent = 'Agregar platillo';
document.getElementById('btn-cancel-edit').style.display = 'none';
}
	 
function cancelEdit() { clearForm(); }

/* ════════════════════════════════════════════════════════════
RENDER
════════════════════════════════════════════════════════════ */
function renderAll(dishes) {
renderMenu(dishes);
renderAdmin(dishes);
renderStats(dishes);
}
	 
/* --- Menú público --- */
function renderMenu(dishes) {
buildFilterBar(dishes);
const filtered = filterCat === 'all' ? dishes : dishes.filter(d => d.cat === filterCat);
	 
const el = document.getElementById('menu-content');
if (!filtered.length) {
el.innerHTML = '<div class="empty-state"><span>🍽️</span>No hay platillos en esta categoría todavía.</div>';
return;
}
	 
// Agrupar por categoría
const byCat = {};
filtered.forEach(d => {
(byCat[d.cat] = byCat[d.cat] || []).push(d);
});
	 
el.innerHTML = Object.entries(byCat).map(([catId, items]) => {
const c = CATS.find(x => x.id === catId) || CATS[5];
const cards = items.map(d => `
<div class="dish-card">
<div class="dish-emoji">${d.icon || '🍽️'}</div>
<div class="dish-body">
<div class="dish-name">${esc(d.name)}</div>
${d.desc ? `<div class="dish-desc">${esc(d.desc)}</div>` : ''}
<div class="dish-price">₡${Number(d.price).toLocaleString('es-CR')}</div>
</div>
</div>`).join('');
	 
return `
<div class="cat-heading">
<span class="cat-icon">${c.icon}</span>
<h2>${c.name}</h2>
<div class="cat-line"></div>
</div>
<div class="dish-grid">${cards}</div>`;
}).join('');
}
	 
function buildFilterBar(dishes) {
const activeCats = [...new Set(dishes.map(d => d.cat))];
const fb = document.getElementById('filter-bar');
const allBtn = `<button class="pill${filterCat==='all'?' active':''}" data-cat="all" onclick="setFilter('all',this)">Todos (${dishes.length})</button>`;
const catBtns = CATS.filter(c => activeCats.includes(c.id)).map(c => {
const count = dishes.filter(d => d.cat === c.id).length;
return `<button class="pill${filterCat===c.id?' active':''}" data-cat="${c.id}" onclick="setFilter('${c.id}',this)">${c.icon} ${c.name} (${count})</button>`;
}).join('');
fb.innerHTML = allBtn + catBtns;
}
	 
function setFilter(cat, btn) {
filterCat = cat;
document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
if (btn) btn.classList.add('active');
if (db) {
db.ref('platillos').once('value').then(snap => {
const list = Object.entries(snap.val() || {}).map(([id,v]) => ({id,...v}));
renderMenu(list);
});
}
}

/* --- Panel de administración --- */
function renderAdmin(dishes) {
const sel = document.getElementById('f-cat');
sel.innerHTML = CATS.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
	 
const el = document.getElementById('admin-list');
document.getElementById('admin-count').textContent = `(${dishes.length} platillos)`;
	 
if (!dishes.length) {
el.innerHTML = '<div class="empty-state"><span>✏️</span>Agrega el primer platillo usando el formulario de arriba.</div>';
return;
}
	 
const byCat = {};
dishes.forEach(d => (byCat[d.cat] = byCat[d.cat] || []).push(d));
	 
el.innerHTML = Object.entries(byCat).map(([catId, items]) => {
const c = CATS.find(x => x.id === catId) || CATS[5];
const rows = items.map(d => `
<div class="admin-row">
<div class="admin-emoji">${d.icon || '🍽️'}</div>
<div class="admin-info">
<div class="admin-name">
${esc(d.name)}
<span class="cat-badge" style="background:${c.bg};color:${c.color}">${c.name}</span>
</div>
<div class="admin-sub">₡${Number(d.price).toLocaleString('es-CR')}${d.desc ? ' · ' + esc(d.desc).substring(0,50) + (d.desc.length>50?'…':'') : ''}</div>
</div>
<div class="admin-actions">
<button class="btn btn-sm btn-edit" onclick="editDish('${d.id}')">✏️ Editar</button>
<button class="btn btn-sm btn-danger" onclick="deleteDish('${d.id}','${esc(d.name)}')">🗑️</button>
</div>
</div>`).join('');
	 
return `<div style="margin-bottom:1.25rem">
<div style="font-size:0.78rem;font-weight:500;color:${c.color};margin-bottom:8px;display:flex;align-items:center;gap:5px">
${c.icon} ${c.name}
</div>${rows}</div>`;
}).join('');
}