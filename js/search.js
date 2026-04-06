function ejecutarBusqueda() {
    const query = document.getElementById('mainSearch').value.trim().toUpperCase();
    if (!query) return;

    markersLayer.clearLayers();
    
    const filtradas = database.colonias.filter(c => 
        c.ruta.includes(query) || 
        c.nombre.toUpperCase().includes(query)
    );

    currentResultados = filtradas;

    const esRuta = database.colonias.some(c => c.ruta === query);
    document.getElementById('searchType').innerText = esRuta ? "Plan por Ruta" : "Búsqueda por Colonia";
    document.getElementById('colCount').innerText = filtradas.length;

    const bounds = L.latLngBounds();
    let hasValidCoords = false;

    filtradas.forEach(col => {
        if (col.lat && col.lng && col.lat !== 0 && col.lng !== 0) {
            const marker = L.circleMarker([col.lat, col.lng], {
                radius: 8,
                fillColor: "#4f46e5",
                color: "#ffffff",
                weight: 2.5,
                fillOpacity: 0.95
            });
            marker.bindTooltip(`${col.nombre} (${col.ruta})`, { direction: 'top', sticky: true });
            marker.bindPopup(`<b class='uppercase text-sm'>${col.nombre}</b><br><span class='text-indigo-600 font-bold'>RUTA ${col.ruta}</span><br><span class='text-slate-500'>Turno: ${col.turno}</span>`);
            marker.addTo(markersLayer);
            bounds.extend([col.lat, col.lng]);
            hasValidCoords = true;
        }
    });

    renderizarListaResultados(filtradas);

    if (hasValidCoords && filtradas.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function limpiarBusqueda() {
    document.getElementById('mainSearch').value = '';
    document.getElementById('resultadosSearch').value = '';
    markersLayer.clearLayers();
    currentResultados = [];
    document.getElementById('searchType').innerText = '';
    document.getElementById('colCount').innerText = '0';
    map.setView([20.5888, -100.3899], 12);

    const lista = document.getElementById('resultadosList');
    const emptyMsg = document.getElementById('resultadosEmptyMsg');
    lista.innerHTML = '';
    emptyMsg.style.display = 'block';
    lista.appendChild(emptyMsg);
}

function renderizarListaResultados(colonias) {
    const lista = document.getElementById('resultadosList');
    const emptyMsg = document.getElementById('resultadosEmptyMsg');

    if (emptyMsg.parentNode === lista) lista.removeChild(emptyMsg);
    lista.innerHTML = '';

    if (!colonias || colonias.length === 0) {
        emptyMsg.style.display = 'block';
        lista.appendChild(emptyMsg);
        return;
    }

    emptyMsg.style.display = 'none';

    colonias.forEach(col => {
        const row = document.createElement('div');
        row.className = 'resultado-row';
        row.id = 'resultado_row_' + col.id;

        const tieneCoords = (col.lat && col.lng && col.lat !== 0 && col.lng !== 0);
        const dotClass = tieneCoords ? 'resultado-dot' : 'resultado-dot faltante';
        const faltaBadge = !tieneCoords ? '<span class="coords-faltante ml-1">📍 SIN UBICACIÓN</span>' : '';

        row.innerHTML = `
            <div class="${dotClass}"></div>
            <span class="resultado-name" title="${col.nombre}">${col.nombre}</span>
            <span class="resultado-ruta-badge">RUTA: ${col.ruta}</span>
            <span class="resultado-turno-badge">${col.turno}</span>
            ${faltaBadge}
            <button class="edit-colonia-btn" onclick="event.stopPropagation(); window.abrirEditor(${col.id}, event)">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </button>
        `;

        row.onclick = () => {
            if (tieneCoords) {
                map.flyTo([col.lat, col.lng], 16);
                markersLayer.eachLayer(layer => {
                    if (layer._latlng &&
                        layer._latlng.lat === col.lat &&
                        layer._latlng.lng === col.lng) {
                        layer.openPopup();
                    }
                });
            } else {
                alert(`La colonia "${col.nombre}" no tiene coordenadas asignadas.\nUsa el botón "Completar Faltantes" o edítala manualmente.`);
            }
        };

        lista.appendChild(row);
    });
}

function filtrarListaResultados() {
    const q = document.getElementById('resultadosSearch').value.trim().toUpperCase();
    if (!q) {
        renderizarListaResultados(currentResultados);
        return;
    }
    const filtradas = currentResultados.filter(col => 
        col.nombre.toUpperCase().includes(q) || col.ruta.includes(q)
    );
    renderizarListaResultados(filtradas);
}