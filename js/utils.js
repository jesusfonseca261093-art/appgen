// Variables globales
let map;
let markersLayer = L.layerGroup();
let geofenceLayer = L.layerGroup();
let selectedColoniaId = null;
let currentGoogleLayer = null;
let currentResultados = [];
let rutaSeleccionadaParaExportar = null;
let geocercaState = {};

const GEOCERCA_COLORS = [
    '#4f46e5','#0891b2','#059669','#d97706','#dc2626',
    '#7c3aed','#db2777','#0284c7','#16a34a','#9333ea',
    '#ea580c','#0d9488','#be185d','#1d4ed8','#65a30d'
];

let database = {
    geocercas: {},
    colonias: []
};

const APP_STORAGE_KEY = 'geocolonias_app_data';

function saveAppData() {
    const payload = {
        colonias: database.colonias,
        geocercas: database.geocercas,
        excelFileName: document.getElementById('excelStatus')?.title || '',
        kmlFileName: document.getElementById('kmlStatus')?.title || ''
    };
    try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('No se pudo guardar datos en localStorage', error);
    }
}

function loadAppData() {
    try {
        const raw = localStorage.getItem(APP_STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.colonias && Array.isArray(data.colonias)) {
            database.colonias = data.colonias;
        }
        if (data.geocercas && typeof data.geocercas === 'object') {
            database.geocercas = data.geocercas;
        }
        if (data.excelFileName) {
            const excelStatus = document.getElementById('excelStatus');
            if (excelStatus) {
                excelStatus.title = data.excelFileName;
                excelStatus.classList.remove('bg-slate-300');
                excelStatus.classList.add('bg-emerald-500');
            }
        }
        if (data.kmlFileName) {
            const kmlStatus = document.getElementById('kmlStatus');
            if (kmlStatus) {
                kmlStatus.title = data.kmlFileName;
                kmlStatus.classList.remove('bg-slate-300');
                kmlStatus.classList.add('bg-indigo-500');
            }
        }
        if (document.getElementById('mainSearch')?.value.trim() !== '') {
            ejecutarBusqueda();
        }
        if (typeof actualizarBadgesGeocercas === 'function') actualizarBadgesGeocercas();
        if (typeof renderTodasLasGeocercas === 'function') renderTodasLasGeocercas();
        if (typeof construirPanelGeocercas === 'function') construirPanelGeocercas();
    } catch (error) {
        console.warn('No se pudo cargar datos de localStorage', error);
    }
}

// Funciones de utilidad
function showLoading(text) {
    document.getElementById('loadingText').innerText = text;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebarPanel');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('visible');
    overlay.classList.toggle('visible');
}

function puntoDentroDePoligono(punto, poligono) {
    const [py, px] = punto;
    let inside = false;
    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
        const [iy, ix] = poligono[i];
        const [jy, jx] = poligono[j];
        const intersect = ((iy > py) !== (jy > py)) &&
            (px < (jx - ix) * (py - iy) / (jy - iy) + ix);
        if (intersect) inside = !inside;
    }
    return inside;
}

// FIRMA
const nombreDesarrollador = "Ing. Jesus Fonseca";
const elementoFirma = document.getElementById('firmaOfuscada');
if (elementoFirma) {
    elementoFirma.textContent = nombreDesarrollador;
    elementoFirma.title = "Ing. Jose de Jesus Fonseca Chavez";
}
console.log("%c🔐 Geocolonias - Desarrollado por: " + nombreDesarrollador, "color: #4f46e5; font-size: 14px; font-weight: bold;");

// Función para actualizar la fecha
function actualizarFecha() {
    const fecha = new Date();
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    let horas = fecha.getHours();
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'pm' : 'am';
    horas = horas % 12;
    horas = horas ? horas : 12;
    const horaFormateada = horas.toString().padStart(2, '0');
    
    const fechaFormateada = `${dia}/${mes}/${anio} ${horaFormateada}:${minutos} ${ampm}`;
    const fechaElement = document.getElementById('fechaActualizacion');
    if (fechaElement) {
        fechaElement.textContent = fechaFormateada;
    }
    // Guardar en localStorage
    localStorage.setItem('ultima_actualizacion', fechaFormateada);
}

// Cargar fecha guardada al iniciar
function cargarFechaGuardada() {
    const fechaGuardada = localStorage.getItem('ultima_actualizacion');
    if (fechaGuardada) {
        const fechaElement = document.getElementById('fechaActualizacion');
        if (fechaElement) {
            fechaElement.textContent = fechaGuardada;
        }
    }
}

// Llamar a cargarFechaGuardada cuando la página carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarFechaGuardada);
} else {
    cargarFechaGuardada();
}

// Cargar fecha guardada al iniciar
function cargarFechaGuardada() {
    const fechaGuardada = localStorage.getItem('ultima_actualizacion');
    if (fechaGuardada) {
        const fechaElement = document.getElementById('fechaActualizacion');
        if (fechaElement) {
            fechaElement.textContent = `📅 Fecha de actualización: ${fechaGuardada}`;
        }
    }
}

// Llamar a cargarFechaGuardada cuando la página carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarFechaGuardada);
} else {
    cargarFechaGuardada();
}