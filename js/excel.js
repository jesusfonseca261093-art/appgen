function processExcel(input) {
    const file = input.files[0];
    if (!file) return;
    showLoading("Cargando Base de Datos...");
    const reader = new FileReader();
    reader.onload = async function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets["COLONIAS DE GEOCERCA"] || workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);

        database.colonias = json.map((row, index) => {
            const nombre = (row.Nombre || row.nombre || "Desconocida").toString().trim();
            const ruta   = String(row.ruta  || row.Ruta  || "").toUpperCase().trim();
            const turno  = (row.Turno || row.turno || "Sin turno").toString().trim();

            let lat = null, lng = null;

            // Caso 1: columnas separadas lat y lng/largo
            const latRaw = row.lat  ?? row.Lat  ?? row.LAT  ?? null;
            const lngRaw = row.lng  ?? row.Lng  ?? row.LNG  ??
                           row.largo ?? row.Largo ?? row.LARGO ?? null;

            if (latRaw !== null && lngRaw !== null) {
                lat = parseFloat(String(latRaw).replace(",", "."));
                lng = parseFloat(String(lngRaw).replace(",", "."));
            }

            // Caso 2: columna coordenada combinada "lat,lng"
            if ((lat === null || isNaN(lat)) || (lng === null || isNaN(lng))) {
                const coordStr = (row.coordenada || row.Coordenada || row.COORDENADA || "").toString().trim();
                if (coordStr.includes(",")) {
                    const partes = coordStr.split(",");
                    lat = parseFloat(partes[0].trim());
                    lng = parseFloat(partes[1].trim());
                }
            }

            if (isNaN(lat) || isNaN(lng)) { lat = null; lng = null; }

            return { id: index, nombre, ruta, lat, lng, turno };
        }).filter(c => c.lat !== null && c.lng !== null);

        const excelStatus = document.getElementById('excelStatus');
        if (excelStatus) {
            excelStatus.classList.replace('bg-slate-300', 'bg-emerald-500');
            excelStatus.title = file.name;
        }

        // Guardar en localStorage como respaldo
        saveAppData();

        // Enviar a Supabase
        try {
            showLoading("Guardando en Supabase...");
            const { saveColoniasToSupabase, updateMetadata } = await import('./supabase-operations.js');
            
            const coloniasParaSupabase = database.colonias.map(c => ({
                nombre: c.nombre,
                ruta:   c.ruta,
                lat:    c.lat,
                lng:    c.lng,
                turno:  c.turno
            }));

            await saveColoniasToSupabase(coloniasParaSupabase);
            await updateMetadata('last_excel_import', {
                fileName: file.name,
                timestamp: new Date().toISOString(),
                recordCount: database.colonias.length
            });
            console.log(`✅ ${database.colonias.length} colonias guardadas en Supabase`);
        } catch (error) {
            console.error('❌ Error guardando en Supabase:', error);
        }

        hideLoading();
        actualizarBadgesGeocercas();
        if (document.getElementById('mainSearch').value.trim() !== "") ejecutarBusqueda();
        actualizarFecha();
    };
    reader.readAsArrayBuffer(file);
}

document.getElementById('excelInput').addEventListener('change', function(e) {
    processExcel(e.target);
});