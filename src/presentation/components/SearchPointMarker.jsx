// ============================================================
// presentation/components/SearchPointMarker.jsx
// Componente que renderiza los marcadores de origen y destino
// en el mapa cuando el usuario usa la función "¿Qué bus tomo?".
// Usa DivIcon con HTML/CSS para estilo estético.
// ============================================================

import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import useMapStore from '../stores/useMapStore'

/**
 * Crea un DivIcon para el marcador de origen (verde) o destino (rojo).
 */
function createSearchPointIcon(type) {
  const isOrigin = type === 'origin'
  const color = isOrigin ? '#22c55e' : '#ef4444'
  const label = isOrigin ? 'A' : 'B'
  const size = 32

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Sombra del pin -->
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 6px;
        background: rgba(0,0,0,0.15);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
      <!-- Pin -->
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
          font-family: system-ui, sans-serif;
          line-height: 1;
        ">${label}</span>
      </div>
    </div>
  `

  return new DivIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size], // Ancla en la punta del pin
    popupAnchor: [0, -size],
  })
}

function SearchPointMarker() {
  const originPoint = useMapStore((s) => s.originPoint)
  const destinationPoint = useMapStore((s) => s.destinationPoint)

  const originIcon = useMemo(() => createSearchPointIcon('origin'), [])
  const destIcon = useMemo(() => createSearchPointIcon('destination'), [])

  return (
    <>
      {/* Marcador de origen */}
      {originPoint && (
        <Marker
          position={[originPoint.lat, originPoint.lng]}
          icon={originIcon}
          zIndexOffset={900}
        />
      )}

      {/* Marcador de destino */}
      {destinationPoint && (
        <Marker
          position={[destinationPoint.lat, destinationPoint.lng]}
          icon={destIcon}
          zIndexOffset={901}
        />
      )}
    </>
  )
}

export default SearchPointMarker
