// ============================================================
// data/repositories/busRouteRepository.js
// Repositorio para gestión de datos GeoJSON con caché en IndexedDB.
// Estrategia offline-first:
//   1. Intentar leer de IndexedDB (caché local)
//   2. Si no existe, hacer fetch del archivo estático
//   3. Persistir en IndexedDB para uso futuro sin red
//   4. Fallback: intentar fetch incluso si hay caché vieja
// ============================================================

import storage from '../../core/config/storage.js'

const ROUTES_KEY = 'routes_geojson'
const STOPS_KEY = 'stops_json'
const ROUTES_TIMESTAMP_KEY = 'routes_timestamp'
const STOPS_TIMESTAMP_KEY = 'stops_timestamp'
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días en ms

/**
 * Verifica si la caché es válida (existe y no es muy vieja).
 */
async function isCacheValid(key) {
  try {
    const timestamp = await storage.getItem(key)
    if (!timestamp) return false
    return Date.now() - timestamp < CACHE_MAX_AGE
  } catch {
    return false
  }
}

/**
 * Obtiene los datos de rutas GeoJSON.
 * Estrategia: caché primero, fetch como fallback.
 */
export async function getRoutesGeoJSON() {
  try {
    // 1. Intentar leer de IndexedDB
    const cached = await storage.getItem(ROUTES_KEY)
    const cacheValid = await isCacheValid(ROUTES_TIMESTAMP_KEY)

    if (cached && cacheValid) {
      console.log('[Repository] Rutas cargadas desde IndexedDB (caché válida)')
      return cached
    }

    // 2. Fetch desde archivo estático
    const response = await fetch('/data/rutas.geojson')
    if (!response.ok) {
      throw new Error(`Error fetching rutas.geojson: ${response.status}`)
    }
    const data = await response.json()

    // 3. Persistir en IndexedDB
    await storage.setItem(ROUTES_KEY, data)
    await storage.setItem(ROUTES_TIMESTAMP_KEY, Date.now())
    console.log('[Repository] Rutas descargadas y guardadas en IndexedDB')

    return data
  } catch (error) {
    console.error('[Repository] Error obteniendo rutas:', error)

    // 4. Fallback: usar caché aunque sea vieja
    const cached = await storage.getItem(ROUTES_KEY)
    if (cached) {
      console.log('[Repository] Usando caché vieja como fallback (sin red)')
      return cached
    }

    return null
  }
}

/**
 * Obtiene los datos de paradas.
 * Misma estrategia offline-first que las rutas.
 */
export async function getStopsJSON() {
  try {
    const cached = await storage.getItem(STOPS_KEY)
    const cacheValid = await isCacheValid(STOPS_TIMESTAMP_KEY)

    if (cached && cacheValid) {
      console.log('[Repository] Paradas cargadas desde IndexedDB (caché válida)')
      return cached
    }

    const response = await fetch('/data/paradas.json')
    if (!response.ok) {
      throw new Error(`Error fetching paradas.json: ${response.status}`)
    }
    const data = await response.json()

    await storage.setItem(STOPS_KEY, data)
    await storage.setItem(STOPS_TIMESTAMP_KEY, Date.now())
    console.log('[Repository] Paradas descargadas y guardadas en IndexedDB')

    return data
  } catch (error) {
    console.error('[Repository] Error obteniendo paradas:', error)

    const cached = await storage.getItem(STOPS_KEY)
    if (cached) {
      console.log('[Repository] Usando caché vieja como fallback (sin red)')
      return cached
    }

    return null
  }
}

/**
 * Limpia toda la caché almacenada en IndexedDB.
 */
export async function clearCache() {
  await storage.removeItem(ROUTES_KEY)
  await storage.removeItem(STOPS_KEY)
  await storage.removeItem(ROUTES_TIMESTAMP_KEY)
  await storage.removeItem(STOPS_TIMESTAMP_KEY)
  console.log('[Repository] Caché limpiada')
}

/**
 * Fuerza la recarga de datos desde el servidor,
 * ignorando la caché existente.
 */
export async function forceRefresh() {
  await clearCache()
  const [routes, stops] = await Promise.all([
    getRoutesGeoJSON(),
    getStopsJSON(),
  ])
  return { routes, stops }
}
