// Configuración de eventos e inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Eventos del sidebar móvil
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Cerrar sidebar al hacer clic fuera en móvil
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebarPanel');
        const btn = document.getElementById('toggleSidebarBtn');
        if (sidebar && window.innerWidth <= 768 && sidebar.classList.contains('visible')) {
            if (!sidebar.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                toggleSidebar();
            }
        }
    });
    
    // Eventos de búsqueda
    document.getElementById('mainSearch').addEventListener('keypress', e => e.key === 'Enter' && ejecutarBusqueda());
    document.getElementById('resultadosSearch').addEventListener('input', filtrarListaResultados);
    document.getElementById('geocercaSearch').addEventListener('input', filtrarListaGeocercas);
    
    // Eventos de botones
    document.getElementById('btnBuscar').addEventListener('click', ejecutarBusqueda);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarBusqueda);
    document.getElementById('btnCompletar').addEventListener('click', completarColoniasFaltantes);
    document.getElementById('btnExportar').addEventListener('click', mostrarModalExportar);
    document.getElementById('btnGestionar').addEventListener('click', toggleGlobalEditor);
    
    // Eventos de geocercas
    document.getElementById('toggleGeofences').addEventListener('change', toggleGeofencesLayer);
    document.getElementById('btnTodasGeocercas').addEventListener('click', () => setAllGeocercas(true));
    document.getElementById('btnNingunaGeocercas').addEventListener('click', () => setAllGeocercas(false));
    
    // Eventos del editor
    document.getElementById('btnCerrarEditor').addEventListener('click', toggleGlobalEditor);
    document.getElementById('btnGuardarEdicion').addEventListener('click', confirmarEdicion);
    
    // Eventos del modal de exportación
    document.getElementById('btnCancelarExportar').addEventListener('click', cerrarModalExportar);
    document.getElementById('btnConfirmarExportar').addEventListener('click', verificarPasswordYExportar);

    // Inicializar mapa PRIMERO
    initMap();
    document.getElementById('toggleGeofences').checked = true;
    if (typeof geofenceLayer !== 'undefined' && map) {
        geofenceLayer.addTo(map);
    }
    setTimeout(() => { if(map) map.invalidateSize() }, 100);

    // Cargar datos desde Supabase DESPUÉS del mapa
    loadDataFromSupabase();

    function hideStartupLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;
        loader.classList.add('loader-hidden');
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }

    if (document.readyState === 'complete') {
        hideStartupLoader();
    } else {
        window.addEventListener('load', hideStartupLoader);
    }

    setTimeout(hideStartupLoader, 1500);
});

// Función para cargar datos desde Supabase
async function loadDataFromSupabase() {
    console.log('Iniciando carga de datos desde Supabase...');

    // 1. Cargar desde localStorage como respaldo inicial
    if (typeof loadAppData === 'function') {
        loadAppData();
    }

    try {
        // 2. Importar dinámicamente las funciones (Asegúrate que la ruta ./js/ sea correcta si main.js está en la raíz)
        console.log('Intentando importar funciones desde supabase-operations.js...');
        
        const { 
            loadColoniasFromSupabase, 
            loadGeocercasFromSupabase, 
            subscribeToColonias, 
            subscribeToGeocercas 
        } = await import('./supabase-operations.js');

        console.log('Funciones importadas correctamente.');

        // 3. Cargar colonias
        console.log('Cargando colonias...');
        const colonias = await loadColoniasFromSupabase();
        if (colonias && colonias.length > 0) {
            database.colonias = colonias;
            console.log(`Cargadas ${colonias.length} colonias desde Supabase`);
            if (document.getElementById('mainSearch').value.trim() !== '') {
                ejecutarBusqueda();
            }
        }

        // 4. Cargar geocercas
        console.log('Cargando geocercas...');
        const geocercas = await loadGeocercasFromSupabase();
        if (geocercas && geocercas.length > 0) {
            database.geocercas = {};
            geocercas.forEach(geocerca => {
                database.geocercas[geocerca.nombre] = geocerca.polygon_coordinates;
            });
            console.log(`Cargadas ${geocercas.length} geocercas desde Supabase`);
            if (typeof renderTodasLasGeocercas === 'function') renderTodasLasGeocercas();
            if (typeof construirPanelGeocercas === 'function') construirPanelGeocercas();
        }

        // 5. Configurar suscripciones en tiempo real
        console.log('Configurando suscripciones...');
        
        subscribeToColonias((payload) => {
            loadColoniasFromSupabase().then(nuevasColonias => {
                database.colonias = nuevasColonias;
                if (document.getElementById('mainSearch').value.trim() !== '') ejecutarBusqueda();
                cargarFechaGuardada();
            });
        });

        subscribeToGeocercas((payload) => {
            loadGeocercasFromSupabase().then(nuevasGeocercas => {
                database.geocercas = {};
                nuevasGeocercas.forEach(g => database.geocercas[g.nombre] = g.polygon_coordinates);
                if (typeof renderTodasLasGeocercas === 'function') renderTodasLasGeocercas();
                if (typeof construirPanelGeocercas === 'function') construirPanelGeocercas();
            });
        });

    } catch (error) {
        console.error('Error cargando datos desde Supabase:', error);
        console.log('Se mantendrán los datos cargados de localStorage');
    }
}

// Evento de redimensionamiento
window.addEventListener('resize', () => {
    if (typeof map !== 'undefined' && map) map.invalidateSize();
});