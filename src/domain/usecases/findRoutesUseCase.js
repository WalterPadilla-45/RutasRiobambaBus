// ============================================================
// domain/usecases/findRoutesUseCase.js
// Caso de uso principal: "¿Qué bus tomo?"
// Orquesta la lógica de búsqueda de rutas directas y con
// trasbordo usando los servicios de geometría del dominio.
// ============================================================

import {
  createBuffer,
  findDirectRoutes,
  findTransferRoutes,
  distanceBetween,
} from '../services/geometryService'
import { BUFFER_RADIUS_METERS } from '../../core/constants/routes'
import { BUS_LINES } from '../../core/constants/routes'

/**
 * Busca las mejores rutas de bus entre un punto de origen y un destino.
 * Estrategia:
 *   1. Busca rutas directas (una sola línea cruza ambos buffers)
 *   2. Si no hay directas, busca rutas con trasbordo (dos líneas que se cruzan)
 *   3. Ordena resultados por tipo (directas primero) y distancia
 *
 * @param {Object} routesGeoJSON - FeatureCollection con las rutas
 * @param {number[]} originCoords - [lng, lat] del punto de origen
 * @param {number[]} destCoords - [lng, lat] del punto de destino
 * @param {number} [bufferRadius=300] - Radio de tolerancia en metros
 * @returns {Object} { directRoutes, transferRoutes, allLineIds }
 */
export function findRoutes(routesGeoJSON, originCoords, destCoords, bufferRadius = BUFFER_RADIUS_METERS) {
  if (!routesGeoJSON?.features || !originCoords || !destCoords) {
    return { directRoutes: [], transferRoutes: [], allLineIds: [] }
  }

  // 1. Crear buffers de tolerancia alrededor de origen y destino
  const originBuffer = createBuffer(originCoords, bufferRadius)
  const destBuffer = createBuffer(destCoords, bufferRadius)

  if (!originBuffer || !destBuffer) {
    console.warn('[findRoutesUseCase] No se pudieron crear los buffers')
    return { directRoutes: [], transferRoutes: [], allLineIds: [] }
  }

  // 2. Buscar rutas directas
  const rawDirectRoutes = findDirectRoutes(routesGeoJSON, originBuffer, destBuffer)

  // Enriquecer con datos de BUS_LINES
  const directRoutes = rawDirectRoutes.map((route) => {
    const lineInfo = BUS_LINES.find((l) => l.id === route.id)
    return {
      type: 'direct',
      lineId: route.id,
      lineName: lineInfo?.name || route.id,
      color: lineInfo?.color || '#888888',
      line: route.line,
    }
  })

  // Si encontramos rutas directas, no buscar trasbordos
  if (directRoutes.length > 0) {
    const allLineIds = directRoutes.map((r) => r.lineId)
    return { directRoutes, transferRoutes: [], allLineIds }
  }

  // 3. Buscar rutas con trasbordo
  const rawTransferRoutes = findTransferRoutes(routesGeoJSON, originBuffer, destBuffer)

  // Enriquecer y deduplicar trasbordos
  const seen = new Set()
  const transferRoutes = []

  for (const transfer of rawTransferRoutes) {
    // Crear clave única para evitar duplicados (A→B mismo que B→A)
    const ids = [transfer.fromRoute.id, transfer.toRoute.id].sort().join('-')
    if (seen.has(ids)) continue
    seen.add(ids)

    const fromLineInfo = BUS_LINES.find((l) => l.id === transfer.fromRoute.id)
    const toLineInfo = BUS_LINES.find((l) => l.id === transfer.toRoute.id)

    // Calcular distancia del trasbordo al destino para ordenar
    const transferToDestDist = distanceBetween(transfer.transferPoint, destCoords)

    transferRoutes.push({
      type: 'transfer',
      fromLineId: transfer.fromRoute.id,
      fromLineName: fromLineInfo?.name || transfer.fromRoute.id,
      fromColor: fromLineInfo?.color || '#888888',
      toLineId: transfer.toRoute.id,
      toLineName: toLineInfo?.name || transfer.toRoute.id,
      toColor: toLineInfo?.color || '#888888',
      transferPoint: transfer.transferPoint,
      transferToDestDist: Math.round(transferToDestDist),
      fromLine: transfer.fromRoute.line,
      toLine: transfer.toRoute.line,
    })
  }

  // Ordenar trasbordos por distancia al destino (más cercano primero)
  transferRoutes.sort((a, b) => a.transferToDestDist - b.transferToDestDist)

  // Limitar a 5 resultados máximo
  const limitedTransfers = transferRoutes.slice(0, 5)

  // Recopilar todos los IDs de líneas para resaltar en el mapa
  const allLineIds = [
    ...directRoutes.map((r) => r.lineId),
    ...limitedTransfers.flatMap((r) => [r.fromLineId, r.toLineId]),
  ]

  return { directRoutes, transferRoutes: limitedTransfers, allLineIds }
}
