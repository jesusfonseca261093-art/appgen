function mostrarModalExportar() {
    const query = document.getElementById('mainSearch').value.trim().toUpperCase();
    if (!query) {
        alert("⚠️ Primero busca una ruta para exportar sus colonias.\nEjemplo: R02, R03, R04, etc.");
        return;
    }
    const coloniasDeRuta = database.colonias.filter(c => c.ruta === query);
    if (coloniasDeRuta.length === 0) {
        alert(`⚠️ No se encontró la ruta "${query}".\nAsegúrate de buscar una ruta válida como R02, R03, R04, etc.`);
        return;
    }
    rutaSeleccionadaParaExportar = query;
    document.getElementById('passwordModal').classList.remove('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
}

function cerrarModalExportar() {
    document.getElementById('passwordModal').classList.add('hidden');
}

function verificarPasswordYExportar() {
    const password = document.getElementById('passwordInput').value;
    const ADMIN_PASSWORD = "jesus5374";
    if (password !== ADMIN_PASSWORD) {
        alert("❌ Contraseña incorrecta. Acceso denegado.");
        return;
    }
    cerrarModalExportar();
    setTimeout(() => { exportarColoniasDeRuta(); }, 100);
}

function exportarColoniasDeRuta() {
    if (!rutaSeleccionadaParaExportar) {
        alert("⚠️ No hay ruta seleccionada para exportar. Primero busca una ruta.");
        return;
    }
    const coloniasRuta = database.colonias.filter(c => c.ruta === rutaSeleccionadaParaExportar);
    if (coloniasRuta.length === 0) {
        alert(`⚠️ No se encontraron colonias para la ruta ${rutaSeleccionadaParaExportar}`);
        return;
    }
    const datosExportar = coloniasRuta.map((col, idx) => ({
        '#': idx + 1,
        'COLONIA': col.nombre,
        'RUTA': col.ruta,
        'TURNO': col.turno,
        'LATITUD': col.lat || 0,
        'LONGITUD': col.lng || 0,
        'COORDENADA': (col.lat && col.lng && col.lat !== 0 && col.lng !== 0) ? `${col.lat},${col.lng}` : 'No disponible'
    }));
    const ws = XLSX.utils.json_to_sheet(datosExportar);
    ws['!cols'] = [{wch:5}, {wch:35}, {wch:8}, {wch:12}, {wch:12}, {wch:12}, {wch:25}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `RUTA_${rutaSeleccionadaParaExportar}`);
    const fecha = new Date();
    const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,'0')}-${fecha.getDate().toString().padStart(2,'0')}`;
    XLSX.writeFile(wb, `colonias_ruta_${rutaSeleccionadaParaExportar}_${fechaStr}.xlsx`);
    alert(`✅ Exportación completada.\n📊 Se exportaron ${coloniasRuta.length} colonias de la ruta ${rutaSeleccionadaParaExportar}`);
    rutaSeleccionadaParaExportar = null;
}