async function geocodeColonia(nombre) {
    const query = encodeURIComponent(`${nombre}, Querétaro, México`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'GeocoloniasApp/1.0' } });
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error(`Error geocodificando ${nombre}:`, error);
        return null;
    }
}

async function completarColoniasFaltantes() {
    const coloniasFaltantes = database.colonias.filter(col => 
        col.lat === 0 || col.lng === 0 || isNaN(col.lat) || isNaN(col.lng)
    );
    if (coloniasFaltantes.length === 0) {
        alert("✅ No hay colonias con coordenadas faltantes.");
        return;
    }
    const confirmar = confirm(`Se encontraron ${coloniasFaltantes.length} colonias sin coordenadas.\n¿Deseas buscarlas automáticamente?`);
    if (!confirmar) return;
    showLoading(`Buscando coordenadas para ${coloniasFaltantes.length} colonias...`);
    let completadas = 0;
    for (let i = 0; i < coloniasFaltantes.length; i++) {
        const col = coloniasFaltantes[i];
        const resultado = await geocodeColonia(col.nombre);
        if (resultado) {
            const index = database.colonias.findIndex(c => c.id === col.id);
            if (index !== -1) {
                database.colonias[index].lat = resultado.lat;
                database.colonias[index].lng = resultado.lng;
                completadas++;
            }
        }
        if ((i + 1) % 5 === 0 || i === coloniasFaltantes.length - 1) {
            document.getElementById('loadingText').innerText = `Progreso: ${i + 1}/${coloniasFaltantes.length}`;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    hideLoading();
    actualizarBadgesGeocercas();
    if (document.getElementById('mainSearch').value.trim() !== "") ejecutarBusqueda();
    alert(`✅ Se completaron ${completadas} de ${coloniasFaltantes.length} colonias.`);
}