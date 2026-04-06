async function saveGeocercasToSupabase(geocercasData) {
    try {
        console.log('Intentando guardar geocercas en Supabase...', Object.keys(geocercasData).length, 'geocercas');
        const { saveGeocercasToSupabase, updateMetadata } = await import('./supabase-operations.js');
        
        // Convertir geocercas al formato de Supabase
        const geocercasParaSupabase = Object.keys(geocercasData).map(nombre => ({
            nombre: nombre,
            polygon_coordinates: geocercasData[nombre],
            color: '#4f46e5' // Color por defecto
        }));

        console.log('Geocercas convertidas:', geocercasParaSupabase.length);
        await saveGeocercasToSupabase(geocercasParaSupabase);
        await updateMetadata('last_kml_import', {
            fileName: file.name,
            timestamp: new Date().toISOString(),
            recordCount: Object.keys(geocercasData).length
        });
        console.log('Geocercas guardadas en Supabase exitosamente');
        return true;
    } catch (error) {
        console.error('Error guardando geocercas en Supabase:', error);
        return false;
    }
}

async function processKML(input) {
    const file = input.files[0];
    if (!file) return;
    showLoading("Cargando Geocercas...");
    
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
                const placemarks = Array.from(xmlDoc.getElementsByTagName("Placemark"));
                database.geocercas = {};
                placemarks.forEach(pm => {
                    let name = (pm.getElementsByTagName("name")[0]?.textContent || "").trim().toUpperCase();
                    const coordNodes = pm.getElementsByTagName("coordinates");
                    const polys = [];
                    for (let node of coordNodes) {
                        const points = node.textContent.trim().split(/\s+/).map(p => {
                            const c = p.split(",");
                            return c.length >= 2 ? [parseFloat(c[1]), parseFloat(c[0])] : null;
                        }).filter(p => p !== null && !isNaN(p[0]) && p[0] !== undefined);
                        if (points.length > 2) polys.push(points);
                    }
                    if (name && polys.length > 0) {
                        if (!database.geocercas[name]) database.geocercas[name] = [];
                        database.geocercas[name].push(...polys);
                    }
                });
                
                const kmlStatus = document.getElementById('kmlStatus');
                if (kmlStatus) {
                    kmlStatus.classList.replace('bg-slate-300', 'bg-indigo-500');
                    kmlStatus.title = file.name;
                }

                // Intentar guardar en Supabase, si falla usar localStorage
                const savedToSupabase = await saveGeocercasToSupabase(database.geocercas);
                if (!savedToSupabase) {
                    saveAppData(); // Fallback a localStorage
                }

                hideLoading();
                renderTodasLasGeocercas();
                construirPanelGeocercas();
                if (document.getElementById('mainSearch').value.trim() !== "") ejecutarBusqueda();
                actualizarFecha();
            } catch (error) {
                console.error('Error procesando KML:', error);
                hideLoading();
                alert('Error al procesar el archivo KML. Verifica el formato.');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        console.error('Error leyendo archivo KML:', error);
        hideLoading();
        alert('Error al leer el archivo KML.');
    }
}

document.getElementById('kmlInput').addEventListener('change', function(e) {
    processKML(e.target);
});