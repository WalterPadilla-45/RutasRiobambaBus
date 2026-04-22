// ============================================================
// presentation/components/StopsLayer.jsx
// Componente que renderiza las paradas de bus como Markers
// en el mapa. Solo muestra las paradas de las rutas visibles
// cuando hay una selección activa. Al tocar una parada,
// actualiza el estado global.
//
// MEJORADO: Tooltip con nombre de parada (H6 Nielsen),
// iconos cacheados con Map para evitar recreación.
// ============================================================

import { memo, useMemo, useCallback } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import useMapStore from '../stores/useMapStore'
import useUIStore from '../stores/useUIStore'

// Caché global de iconos para evitar recreación en cada render
const iconCache = new Map()

/**
 * Crea o recupera del caché un DivIcon para paradas.
 * Usa una clave compuesta por tipo para memoización eficiente.
 */
function getStopIcon(isHighlighted, isTerminal) {
  const key = `${isHighlighted}-${isTerminal}`

  if (iconCache.has(key)) {
    return iconCache.get(key)
  }

  const size = isTerminal ? 16 : isHighlighted ? 14 : 10
  const borderColor = isHighlighted ? '#1e3a5f' : '#ffffff'
  const bgColor = isHighlighted ? '#ffffff' : '#1e3a5f'
  const shadow = isHighlighted
    ? 'box-shadow: 0 0 0 3px rgba(30,58,95,0.3), 0 2px 6px rgba(0,0,0,0.2);'
    : 'box-shadow: 0 1px 3px rgba(0,0,0,0.3);'

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      ${shadow}
      transform: translate(-50%, -50%);
      cursor: pointer;
    "></div>
  `

  const icon = new DivIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })

  iconCache.set(key, icon)
  return icon
}

// Marker individual memoizado con Tooltip (H6 Nielsen: reconocimiento)
const StopMarker = memo(function StopMarker({ stop, isSelected, onClick }) {
  const [lng, lat] = stop.coordinates
  const isHighlighted = stop.lines?.includes(isSelected)
  const isTerminal = stop.lines.length >= 5

  return (
    <Marker
      position={[lat, lng]}
      icon={getStopIcon(isHighlighted, isTerminal)}
      eventHandlers={{
        click: () => onClick(stop),
      }}
    >
      {/* H6 Nielsen: Tooltip con nombre visible al hover/tap */}
      <Tooltip
        direction="top"
        offset={[0, -8]}
        className="stop-tooltip"
        opacity={0.95}
      >
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: '#1a1a2e',
        }}>
          {stop.name}
        </span>
        {stop.lines.length > 1 && (
          <span style={{
            display: 'block',
            fontSize: '10px',
            color: '#6b7a8d',
            marginTop: '2px',
          }}>
            {stop.lines.length} líneas conectan aquí
          </span>
        )}
      </Tooltip>
    </Marker>
  )
})

function StopsLayer() {
  const stopsJSON = useMapStore((s) => s.stopsJSON)
  const visibleRoutes = useMapStore((s) => s.visibleRoutes)
  const selectedLine = useMapStore((s) => s.selectedLine)
  const openBottomSheet = useUIStore((s) => s.openBottomSheet)

  // Set para lookup O(1)
  const visibleSet = useMemo(() => new Set(visibleRoutes), [visibleRoutes])

  // Filtrar paradas relevantes según la selección
  const filteredStops = useMemo(() => {
    if (!stopsJSON || !selectedLine) return []

    return stopsJSON.filter((stop) =>
      stop.lines?.some((lineId) => visibleSet.has(lineId))
    )
  }, [stopsJSON, selectedLine, visibleSet])

  // Memoizar el handler de click
  const handleStopClick = useCallback((stop) => {
    openBottomSheet({
      type: 'stop',
      stopId: stop.id,
      stopName: stop.name,
      lines: stop.lines,
    })
  }, [openBottomSheet])

  return (
    <>
      {filteredStops.map((stop) => (
        <StopMarker
          key={stop.id}
          stop={stop}
          isSelected={selectedLine}
          onClick={handleStopClick}
        />
      ))}
    </>
  )
}

export default memo(StopsLayer)
