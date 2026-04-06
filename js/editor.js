function toggleGlobalEditor() {
    const editor = document.getElementById('globalEditor');
    editor.classList.toggle('hidden');
    if (editor.classList.contains('hidden')) {
        document.getElementById('editorContent').classList.remove('hidden');
        document.getElementById('editorForm').classList.add('hidden');
    }
}

window.abrirEditor = function(id, e) {
    if (e) e.stopPropagation();
    const col = database.colonias.find(c => c.id === id);
    if (!col) return;
    selectedColoniaId = id;
    document.getElementById('editorContent').classList.add('hidden');
    document.getElementById('editorForm').classList.remove('hidden');
    document.getElementById('editNombre').value = col.nombre;
    document.getElementById('editRuta').value = col.ruta;
    document.getElementById('editTurno').value = col.turno;
    document.getElementById('globalEditor').classList.remove('hidden');
};

function confirmarEdicion() {
    const index = database.colonias.findIndex(c => c.id === selectedColoniaId);
    if (index !== -1) {
        database.colonias[index].nombre = document.getElementById('editNombre').value.trim();
        database.colonias[index].ruta = document.getElementById('editRuta').value.trim().toUpperCase();
        database.colonias[index].turno = document.getElementById('editTurno').value;
        ejecutarBusqueda();
        actualizarBadgesGeocercas();
        toggleGlobalEditor();
        document.getElementById('editorContent').classList.remove('hidden');
        document.getElementById('editorForm').classList.add('hidden');
        selectedColoniaId = null;
    }
}