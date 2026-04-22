// ============================================================
// domain/services/geometryService.js
// Funciones puras de geometría espacial usando Turf.js
// Sin efectos secundarios — solo cálculos matemáticos
//
// OPTIMIZADO: Import selectivo de funciones @turf para reducir
// el tamaño del bundle (solo lo que usamos, no todo @turf/turf)
// ============================================================

import {
  point,
  buffer,
  booleanIntersects,
  lineIntersect,
  getCoord,
  distance,
} from '@turf/turf'

/**
 * Crea un buffer circular alrededor de un punto.
 * @param {number[]} pointCoords - Coordenadas [lng, lat]
 * @param {number} radiusMeters - Radio del buffer en metros
 * @returns {Object} Polígono del buffer
 */
export function createBuffer(pointCoords, radiusMeters = 300) {
  const turfPoint = point(pointCoords)
  return buffer(turfPoint, radiusMeters, { units: 'meters' })
}

/**
 * Verifica si una línea intersecta con un polígono (buffer).
 * @param {Object} line - Línea (GeoJSON LineString)
 * @param {Object} polygon - Polígono de búsqueda
 * @returns {boolean}
 */
export function lineIntersectsBuffer(line, polygon) {
  return booleanIntersects(line, polygon)
}

/**
 * Busca rutas directas que crucen tanto el buffer de origen como el de destino.
 * @param {Object} routes - FeatureCollection con las rutas GeoJSON
 * @param {Object} originBuffer - Buffer del punto de origen
 * @param {Object} destBuffer - Buffer del punto de destino
 * @returns {Array<{id: string, line: Object}>} Rutas directas encontradas
 */
export function findDirectRoutes(routes, originBuffer, destBuffer) {
  const results = []

  if (!routes?.features) return results

  for (const feature of routes.features) {
    const geometryType = feature.geometry?.type
    if (geometryType !== 'LineString' && geometryType !== 'MultiLineString') continue

    const intersectsOrigin = booleanIntersects(feature, originBuffer)
    const intersectsDest = booleanIntersects(feature, destBuffer)

    if (intersectsOrigin && intersectsDest) {
      results.push({
        id: feature.properties?.id || feature.id || `route-${results.length}`,
        line: feature,
      })
    }
  }

  return results
}

/**
 * Busca combinaciones de rutas con trasbordo.
 * Una ruta cruza el buffer de origen y otra el de destino,
 * y ambas se intersectan en algún punto intermedio.
 * @param {Object} routes - FeatureCollection con las rutas GeoJSON
 * @param {Object} originBuffer - Buffer del punto de origen
 * @param {Object} destBuffer - Buffer del punto de destino
 * @returns {Array<{fromRoute: Object, toRoute: Object, transferPoint: number[]}>}
 */
export function findTransferRoutes(routes, originBuffer, destBuffer) {
  const results = []

  if (!routes?.features) return results

  const originRoutes = []
  const destRoutes = []

  for (const feature of routes.features) {
    const geometryType = feature.geometry?.type
    if (geometryType !== 'LineString' && geometryType !== 'MultiLineString') continue

    const id = feature.properties?.id || feature.id

    if (booleanIntersects(feature, originBuffer)) {
      originRoutes.push({ id, line: feature })
    }
    if (booleanIntersects(feature, destBuffer)) {
      destRoutes.push({ id, line: feature })
    }
  }

  // Buscar intersecciones entre rutas de origen y destino
  for (const oRoute of originRoutes) {
    for (const dRoute of destRoutes) {
      if (oRoute.id === dRoute.id) continue // Ya es ruta directa

      try {
        const intersects = lineIntersect(oRoute.line, dRoute.line)
        if (intersects.features.length > 0) {
          const transferPoint = getCoord(intersects.features[0])
          results.push({
            fromRoute: oRoute,
            toRoute: dRoute,
            transferPoint,
          })
        }
      } catch {
        // Ignorar errores de geometría inválida
      }
    }
  }

  return results
}

/**
 * Calcula la distancia entre dos puntos en metros.
 * @param {number[]} from - Coordenadas [lng, lat] origen
 * @param {number[]} to - Coordenadas [lng, lat] destino
 * @returns {number} Distancia en metros
 */
export function distanceBetween(from, to) {
  const fromPoint = point(from)
  const toPoint = point(to)
  return distance(fromPoint, toPoint, { units: 'meters' })
}
