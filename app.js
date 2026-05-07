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