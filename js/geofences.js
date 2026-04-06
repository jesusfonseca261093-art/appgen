function toggleGeofencesLayer() {
    const isChecked = document.getElementById('toggleGeofences').checked;
    if (isChecked) map.addLayer(geofenceLayer);
    else map.removeLayer(geofenceLayer);
    Object.keys(geocercaState).forEach(nombre => {
        const chk = document.getElementById('chk_' + CSS.escape(nombre));
        if (chk) chk.checked = isChecked;
        geocercaState[nombre].visible = isChecked;
    });
}

function renderTodasLasGeocercas() {
    geofenceLayer.clearLayers();
    geocercaState = {};
    const nombres = Object.keys(database.geocercas);
    nombres.forEach((nombre, idx) => {
        const color = GEOCERCA_COLORS[idx % GEOCERCA_COLORS.length];
        const polygons = [];
        database.geocercas[nombre].forEach(points => {
            if (points && points.length >= 3) {
                const poly = L.polygon(points, {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.18,
                    weight: 2.5,
                    smoothFactor: 1
                });
                poly.bindTooltip(`<b>${nombre}</b>`, { sticky: true, direction: 'center' });
                poly.addTo(geofenceLayer);
                polygons.push(poly);
            }
        });
        geocercaState[nombre] = { visible: true, polygons, color };
    });
}

function construirPanelGeocercas() {
    const panel = document.getElementById('geocercasPanel');
    const lista = document.getElementById('geocercasList');
    const countEl = document.getElementById('geocercaCount');
    const nombres = Object.keys(database.geocercas);
    if (nombres.length === 0) { panel.style.display = 'none'; return; }
    panel.style.removeProperty('display');
    countEl.textContent = `${nombres.length} zonas cargadas`;
    lista.innerHTML = '';
    nombres.forEach(nombre => {
        const state = geocercaState[nombre];
        const row = document.createElement('div');
        row.className = 'geocerca-row';
        row.id = 'row_' + nombre;
        const inside = coloniasEnGeocerca(nombre);
        const badgeClass = inside > 0 ? 'colonias-inside-badge has-colonias' : 'colonias-inside-badge';
        const badgeText = inside > 0 ? `${inside} col.` : 'sin col.';
        row.innerHTML = `
            <div class="geocerca-dot" style="background:${state.color}"></div>
            <span class="geocerca-name" title="${nombre}">${nombre}</span>
            <span class="${badgeClass}" id="badge_${CSS.escape(nombre)}">${badgeText}</span>
            <label class="toggle-sm" onclick="event.stopPropagation()">
                <input type="checkbox" id="chk_${CSS.escape(nombre)}" checked
                    onchange="window.toggleGeocercaIndividual('${nombre.replace(/'/g,"\\'")}', this.checked)">
                <span class="slider-sm"></span>
            </label>
        `;
        row.onclick = () => volarAGeocerca(nombre);
        lista.appendChild(row);
    });
}

window.toggleGeocercaIndividual = function(nombre, visible) {
    const state = geocercaState[nombre];
    if (!state) return;
    state.visible = visible;
    state.polygons.forEach(poly => {
        if (visible) poly.addTo(geofenceLayer);
        else geofenceLayer.removeLayer(poly);
    });
    if (visible && !document.getElementById('toggleGeofences').checked) {
        document.getElementById('toggleGeofences').checked = true;
        map.addLayer(geofenceLayer);
    }
    if (visible) {
        volarAGeocerca(nombre);
        mostrarColoniasEnGeocerca(nombre);
    }
};

function volarAGeocerca(nombre) {
    const state = geocercaState[nombre];
    if (!state || state.polygons.length === 0) return;
    let bounds = L.latLngBounds();
    state.polygons.forEach(p => bounds.extend(p.getBounds()));
    if (bounds.isValid()) map.flyToBounds(bounds, { padding: [30, 30], duration: 0.8 });
}

function setAllGeocercas(visible) {
    document.getElementById('toggleGeofences').checked = visible;
    if (visible) map.addLayer(geofenceLayer);
    else map.removeLayer(geofenceLayer);
    Object.keys(geocercaState).forEach(nombre => {
        geocercaState[nombre].visible = visible;
        geocercaState[nombre].polygons.forEach(poly => {
            if (visible) poly.addTo(geofenceLayer);
            else geofenceLayer.removeLayer(poly);
        });
        const chk = document.getElementById('chk_' + CSS.escape(nombre));
        if (chk) chk.checked = visible;
    });
}

function filtrarListaGeocercas() {
    const q = document.getElementById('geocercaSearch').value.trim().toUpperCase();
    Object.keys(geocercaState).forEach(nombre => {
        const row = document.getElementById('row_' + nombre);
        if (row) row.style.display = nombre.includes(q) ? '' : 'none';
    });
}

function coloniasEnGeocerca(nombre) {
    if (database.colonias.length === 0) return 0;
    const polysPoints = database.geocercas[nombre] || [];
    return database.colonias.filter(col =>
        col.lat && col.lng && col.lat !== 0 && col.lng !== 0 &&
        polysPoints.some(pts => puntoDentroDePoligono([col.lat, col.lng], pts))
    ).length;
}

function mostrarColoniasEnGeocerca(nombre) {
    if (database.colonias.length === 0) return;
    const polysPoints = database.geocercas[nombre] || [];
    const coloniasDentro = database.colonias.filter(col =>
        col.lat && col.lng && col.lat !== 0 && col.lng !== 0 &&
        polysPoints.some(pts => puntoDentroDePoligono([col.lat, col.lng], pts))
    );
    coloniasDentro.forEach(col => {
        const color = geocercaState[nombre]?.color || '#4f46e5';
        L.circleMarker([col.lat, col.lng], {
            radius: 6,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.95
        })
        .bindTooltip(`<b>${col.nombre}</b><br>Ruta: ${col.ruta}`, { direction: 'top', sticky: true })
        .addTo(markersLayer);
    });
}

function actualizarBadgesGeocercas() {
    Object.keys(geocercaState).forEach(nombre => {
        const badge = document.getElementById('badge_' + CSS.escape(nombre));
        if (!badge) return;
        const inside = coloniasEnGeocerca(nombre);
        badge.textContent = inside > 0 ? `${inside} col.` : 'sin col.';
        badge.className = 'colonias-inside-badge' + (inside > 0 ? ' has-colonias' : '');
    });
}