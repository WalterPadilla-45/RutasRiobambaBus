// ============================================================
// presentation/components/RouteLayer.jsx
// Componente que renderiza las rutas de bus como Polylines
// en el mapa, filtradas por visibleRoutes del store.
// Al tocar una ruta: selecciona la línea y abre el BottomSheet.
//
// OPTIMIZADO: React.memo + useMemo + useCallback para evitar
// re-renderizados innecesarios de las 17 polilíneas.
// ============================================================

import { memo, useMemo, useCallback } from 'react'
import { Polyline } from 'react-leaflet'
import useMapStore from '../stores/useMapStore'
import useUIStore from '../stores/useUIStore'
import { ROUTE_LINE_WEIGHT, BUS_LINES } from '../../core/constants/routes'

// Mapa de colores por ID para lookup O(1) en vez de .find()
const COLOR_MAP = Object.fromEntries(BUS_LINES.map((l) => [l.id, l.color]))
const NAME_MAP = Object.fromEntries(BUS_LINES.map((l) => [l.id, l.name]))

// Componente individual de polilínea memoizado
const RoutePolyline = memo(function RoutePolyline({
  id, color, name, positions, isSelected, isVisible, onClick
}) {
  return (
    <Polyline
      key={id}
      positions={positions}
      pathOptions={{
        color,
        weight: isSelected ? ROUTE_LINE_WEIGHT + 2 : ROUTE_LINE_WEIGHT,
        opacity: isVisible ? (isSelected ? 1 : 0.6) : 0.15,
        lineCap: 'round',
        lineJoin: 'round',
      }}
      eventHandlers={{
        click: () => onClick(id, name),
      }}
    />
  )
})

function RouteLayer() {
  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)
  const visibleRoutes = useMapStore((s) => s.visibleRoutes)
  const selectLine = useMapStore((s) => s.selectLine)
  const openBottomSheet = useUIStore((s) => s.openBottomSheet)

  // Convertir GeoJSON features a datos de polilínea para react-leaflet
  const routeData = useMemo(() => {
    if (!routesGeoJSON?.features) return []

    return routesGeoJSON.features
      .filter((f) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString')
      .map((feature) => {
        const id = feature.properties?.id || feature.id
        const color = feature.properties?.color || COLOR_MAP[id] || '#888888'
        const name = feature.properties?.name || NAME_MAP[id] || id

        // Convertir coordenadas [lng, lat] → [lat, lng] para Leaflet
        let positions = []
        if (feature.geometry.type === 'LineString') {
          positions = feature.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          )
        } else if (feature.geometry.type === 'MultiLineString') {
          positions = feature.geometry.coordinates.map((line) =>
            line.map(([lng, lat]) => [lat, lng])
          )
        }

        return { id, color, name, positions }
      })
  }, [routesGeoJSON])

  // Determinar si hay alguna ruta seleccionada (modo selección)
  const hasSelection = visibleRoutes.length > 0

  // Set para lookup O(1) en vez de .includes() O(n)
  const visibleSet = useMemo(() => new Set(visibleRoutes), [visibleRoutes])

  const handleRouteClick = useCallback((id, name) => {
    selectLine(id)
    openBottomSheet({
      type: 'route',
      lineId: id,
      lineName: name,
    })
  }, [selectLine, openBottomSheet])

  return (
    <>
      {routeData.map(({ id, color, name, positions }) => {
        const isVisible = !hasSelection || visibleSet.has(id)
        const isSelected = visibleSet.has(id)

        return (
          <RoutePolyline
            key={id}
            id={id}
            color={color}
            name={name}
            positions={positions}
            isSelected={isSelected}
            isVisible={isVisible}
            onClick={handleRouteClick}
          />
        )
      })}
    </>
  )
}

export default memo(RouteLayer)
