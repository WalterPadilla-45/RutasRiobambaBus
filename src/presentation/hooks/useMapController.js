// ============================================================
// presentation/hooks/useMapController.js
// Hook personalizado que almacena la referencia al mapa Leaflet
// y permite control programático (flyTo, setZoom, etc.) desde
// cualquier componente externo al MapContainer.
// ============================================================

import { useCallback, useRef } from 'react'

// Referencia singleton al mapa Leaflet
const mapRef = { current: null }

/**
 * Hook que devuelve funciones para controlar el mapa Leaflet
 * desde fuera del componente MapContainer.
 */
export function useMapController() {
  const registerMap = useCallback((map) => {
    mapRef.current = map
  }, [])

  const flyTo = useCallback((lat, lng, zoom = 16) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], zoom, { duration: 1.2 })
    }
  }, [])

  const setZoom = useCallback((zoom) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom)
    }
  }, [])

  const getCenter = useCallback(() => {
    if (mapRef.current) {
      return mapRef.current.getCenter()
    }
    return null
  }, [])

  const getBounds = useCallback(() => {
    if (mapRef.current) {
      return mapRef.current.getBounds()
    }
    return null
  }, [])

  const fitBounds = useCallback((bounds, options = {}) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], ...options })
    }
  }, [])

  const invalidateSize = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize()
    }
  }, [])

  return {
    registerMap,
    flyTo,
    setZoom,
    getCenter,
    getBounds,
    fitBounds,
    invalidateSize,
  }
}
