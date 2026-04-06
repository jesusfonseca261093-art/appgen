// Funciones para interactuar con Supabase
import { supabase } from './supabase-config.js';

// Cargar colonias desde Supabase
export async function loadColoniasFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('colonias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando colonias:', error);
        return [];
    }
}

// Cargar geocercas desde Supabase
export async function loadGeocercasFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('geocercas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error cargando geocercas:', error);
        return [];
    }
}

// Guardar colonias en Supabase
export async function saveColoniasToSupabase(colonias) {
    try {
        // Primero eliminar todas las colonias existentes
        const { error: deleteError } = await supabase
            .from('colonias')
            .delete()
            .neq('id', 0); // Eliminar todo

        if (deleteError) throw deleteError;

        // Insertar las nuevas colonias
        const { data, error } = await supabase
            .from('colonias')
            .insert(colonias)
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error guardando colonias:', error);
        throw error;
    }
}

// Guardar geocercas en Supabase
export async function saveGeocercasToSupabase(geocercas) {
    try {
        // Primero eliminar todas las geocercas existentes
        const { error: deleteError } = await supabase
            .from('geocercas')
            .delete()
            .neq('id', 0);

        if (deleteError) throw deleteError;

        // Insertar las nuevas geocercas
        const { data, error } = await supabase
            .from('geocercas')
            .insert(geocercas)
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error guardando geocercas:', error);
        throw error;
    }
}

// Actualizar metadata
export async function updateMetadata(key, value) {
    try {
        const { data, error } = await supabase
            .from('app_metadata')
            .upsert({
                metadata_key: key,
                metadata_value: value,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error actualizando metadata:', error);
        throw error;
    }
}

// Cargar metadata
export async function loadMetadata(key) {
    try {
        const { data, error } = await supabase
            .from('app_metadata')
            .select('metadata_value')
            .eq('metadata_key', key)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data?.metadata_value || null;
    } catch (error) {
        console.error('Error cargando metadata:', error);
        return null;
    }
}

// Función de prueba de conexión
export async function testSupabaseConnection() {
    try {
        console.log('Probando conexión con Supabase...');
        const { data, error } = await supabase.from('app_metadata').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Conexión con Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión con Supabase:', error);
        return false;
    }
}

export function subscribeToGeocercas(callback) {
    return supabase
        .channel('geocercas_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'geocercas' },
            (payload) => {
                console.log('Cambio en geocercas:', payload);
                callback(payload);
            }
        )
        .subscribe();
}
// Suscripción en tiempo real para Colonias (ESTA ES LA QUE FALTA)
export function subscribeToColonias(callback) {
    return supabase
        .channel('colonias_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'colonias' },
            (payload) => {
                console.log('Cambio en colonias:', payload);
                callback(payload);
            }
        )
        .subscribe();
}