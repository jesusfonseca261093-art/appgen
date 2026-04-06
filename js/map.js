function initMap() {
    console.log('Inicializando mapa...');
    map = L.map('map', { zoomControl: false }).setView([20.5888, -100.3899], 12);
    console.log('Mapa creado:', map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    currentGoogleLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
    markersLayer.addTo(map);
    geofenceLayer.addTo(map);
    console.log('Mapa inicializado completamente');
}

window.changeGoogleLayer = function(type) {
    if (currentGoogleLayer) map.removeLayer(currentGoogleLayer);
    let url = '';
    if (type === 'satellite') url = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    else if (type === 'street') url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    else if (type === 'terrain') url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
    currentGoogleLayer = L.tileLayer(url, {
        attribution: '&copy; Google Maps',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);
    document.getElementById('btnSatellite').classList.remove('active');
    document.getElementById('btnStreet').classList.remove('active');
    document.getElementById('btnTerrain').classList.remove('active');
    if (type === 'satellite') document.getElementById('btnSatellite').classList.add('active');
    if (type === 'street') document.getElementById('btnStreet').classList.add('active');
    if (type === 'terrain') document.getElementById('btnTerrain').classList.add('active');
};