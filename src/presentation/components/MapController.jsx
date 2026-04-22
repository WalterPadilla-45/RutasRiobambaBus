// ============================================================
// presentation/components/MapController.jsx
// Componente hijo de MapContainer que usa useMap() para obtener
// la instancia del mapa y registrarla en el hook useMapController.
// Reacciona a cambios en el store de Zustand para controlar
// el mapa programáticamente (flyTo, fitBounds, etc.)
// ============================================================

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import useMapStore from '../stores/useMapStore'
import { useMapController } from '../hooks/useMapController'
import { MAP_CONFIG } from '../../core/constants/routes'

function MapController() {
  const map = useMap()
  const { registerMap, invalidateSize, fitBounds } = useMapController()
  const prevLineRef = useRef(null)
  const prevLocationRef = useRef(null)
  const prevSearchBoundsRef = useRef(null)

  const selectedLine = useMapStore((s) => s.selectedLine)
  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)
  const userLocation = useMapStore((s) => s.userLocation)
  const originPoint = useMapStore((s) => s.originPoint)
  const destinationPoint = useMapStore((s) => s.destinationPoint)
  const selectingPoint = useMapStore((s) => s.selectingPoint)

  // Registrar la instancia del mapa al montar
  useEffect(() => {
    registerMap(map)
  }, [map, registerMap])

  // Invalidar tamaño cuando el mapa se monta (fix para tiles grises)
  useEffect(() => {
    const timer = setTimeout(() => {
      invalidateSize()
    }, 200)
    return () => clearTimeout(timer)
  }, [invalidateSize])

  // Reaccionar a la línea seleccionada: volar a los bounds de la ruta
  useEffect(() => {
    if (!selectedLine || !routesGeoJSON?.features) {
      // Si se deseleccionó, volver al centro de Riobamba
      if (prevLineRef.current && !selectedLine) {
        map.flyTo(MAP_CONFIG.CENTER, MAP_CONFIG.DEFAULT_ZOOM, { duration: 1 })
      }
      prevLineRef.current = selectedLine
      return
    }

    // Buscar la feature de la ruta seleccionada
    const feature = routesGeoJSON.features.find(
      (f) => (f.properties?.id || f.id) === selectedLine
    )

    if (feature?.geometry) {
      // Crear una capa GeoJSON temporal para obtener los bounds
      const geoJsonLayer = L.geoJSON(feature)
      const bounds = geoJsonLayer.getBounds()

      if (bounds.isValid()) {
        map.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 16,
          duration: 1,
        })
      }
    }

    prevLineRef.current = selectedLine
  }, [selectedLine, routesGeoJSON, map])

  // Reaccionar a la ubicación del usuario: centrar el mapa
  useEffect(() => {
    if (!userLocation) return

    const locationKey = `${userLocation.lat}-${userLocation.lng}`
    const shouldFlyTo =
      !prevLocationRef.current || // Primera vez
      userLocation._refresh ||    // Re-centrar solicitado
      false                       // No volar en cada update del GPS

    if (shouldFlyTo) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 })
    }

    prevLocationRef.current = locationKey
  }, [userLocation, map])

  // Reaccionar a los puntos de búsqueda: ajustar bounds para ver ambos
  useEffect(() => {
    if (!originPoint && !destinationPoint) {
      prevSearchBoundsRef.current = null
      return
    }

    // Si estamos seleccionando un punto, no mover el mapa
    if (selectingPoint) return

    const bounds = L.latLngBounds([])

    if (originPoint) {
      bounds.extend([originPoint.lat, originPoint.lng])
    }
    if (destinationPoint) {
      bounds.extend([destinationPoint.lat, destinationPoint.lng])
    }

    const boundsKey = `${originPoint?.lat}-${originPoint?.lng}-${destinationPoint?.lat}-${destinationPoint?.lng}`

    if (bounds.isValid() && boundsKey !== prevSearchBoundsRef.current) {
      map.flyToBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16,
        duration: 1,
      })
      prevSearchBoundsRef.current = boundsKey
    }
  }, [originPoint, destinationPoint, selectingPoint, map])

  // Este componente no renderiza nada visual
  return null
}

export default MapController
