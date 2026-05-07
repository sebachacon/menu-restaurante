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