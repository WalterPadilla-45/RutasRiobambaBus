// ============================================================
// presentation/components/UserLocationMarker.jsx
// Componente que renderiza la ubicación del usuario en el mapa
// como un punto azul estético usando L.divIcon con HTML/CSS.
// Incluye un anillo de precisión que muestra el radio de
// incertidumbre del GPS.
// ============================================================

import { useMemo } from 'react'
import { Marker, Circle } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import useMapStore from '../stores/useMapStore'

/**
 * Crea un DivIcon personalizado para representar la ubicación
 * del usuario como un punto azul con pulso animado.
 */
function createUserLocationIcon() {
  const size = 20

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      <!-- Anillo de pulso animado -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.15);
        animation: pulse-ring 2s ease-out infinite;
      "></div>
      <!-- Punto central azul -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.25);
        z-index: 1;
      "></div>
    </div>
    <style>
      @keyframes pulse-ring {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
        }
      }
    </style>
  `

  return new DivIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function UserLocationMarker() {
  const userLocation = useMapStore((s) => s.userLocation)

  // Memoizar el icono para evitar recrearlo en cada render
  const icon = useMemo(() => createUserLocationIcon(), [])

  if (!userLocation) return null

  const { lat, lng, accuracy } = userLocation

  return (
    <>
      {/* Círculo de precisión del GPS */}
      {accuracy && accuracy < 100 && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }}
        />
      )}

      {/* Marcador del punto azul */}
      <Marker
        position={[lat, lng]}
        icon={icon}
        interactive={false}
        zIndexOffset={1000}
      />
    </>
  )
}

export default UserLocationMarker
