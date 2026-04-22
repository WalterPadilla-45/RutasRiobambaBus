// ============================================================
// presentation/hooks/useGeolocation.js
// Hook personalizado que gestiona la geolocalización del usuario
// usando navigator.geolocation.watchPosition(). Actualiza el
// store Zustand con las coordenadas en tiempo real y maneja
// errores de permisos y disponibilidad.
// ============================================================

import { useEffect, useRef, useCallback } from 'react'
import useMapStore from '../stores/useMapStore'
import { GEOLOCATION_OPTIONS } from '../../core/constants/routes'

export function useGeolocation() {
  const setUserLocation = useMapStore((s) => s.setUserLocation)
  const setLocationError = useMapStore((s) => s.setLocationError)
  const setIsLocating = useMapStore((s) => s.setIsLocating)
  const userLocation = useMapStore((s) => s.userLocation)
  const isLocating = useMapStore((s) => s.isLocating)

  const watchIdRef = useRef(null)
  const isFirstFixRef = useRef(true)

  // Iniciar la observación de la posición
  const startWatching = useCallback(() => {
    // Verificar soporte de geolocalización
    if (!navigator.geolocation) {
      setLocationError({
        code: -1,
        message: 'Tu navegador no soporta geolocalización',
      })
      return
    }

    // Evitar múltiples watchers
    if (watchIdRef.current !== null) return

    setIsLocating(true)
    isFirstFixRef.current = true

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords

        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy,
          heading,
          speed,
          timestamp: position.timestamp,
        }

        setUserLocation(newLocation)

        if (isFirstFixRef.current) {
          console.log('[useGeolocation] Primera ubicación obtenida:', newLocation)
          isFirstFixRef.current = false
        }
      },
      (error) => {
        console.warn('[useGeolocation] Error de geolocalización:', error.message)

        let userMessage = ''
        switch (error.code) {
          case error.PERMISSION_DENIED:
            userMessage = 'Permiso de ubicación denegado. Actívalo en la configuración del navegador.'
            break
          case error.POSITION_UNAVAILABLE:
            userMessage = 'No se pudo obtener la ubicación. Verifica que el GPS esté activado.'
            break
          case error.TIMEOUT:
            userMessage = 'La solicitud de ubicación expiró. Intenta de nuevo.'
            break
          default:
            userMessage = 'Error desconocido al obtener la ubicación.'
        }

        setLocationError({
          code: error.code,
          message: userMessage,
        })
      },
      GEOLOCATION_OPTIONS
    )
  }, [setUserLocation, setLocationError, setIsLocating])

  // Detener la observación
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      console.log('[useGeolocation] Observación detenida')
    }
  }, [])

  // Solicitar ubicación y centrar el mapa
  const requestLocation = useCallback(() => {
    if (userLocation) {
      // Ya tenemos ubicación, solo necesitamos re-centrar
      // El MapController reaccionará al cambio de userLocation
      // Forzar una nueva lectura estableciendo isLocating
      setIsLocating(true)
      // Si ya tenemos posición, volvemos a establecerla para disparar flyTo
      setUserLocation({ ...userLocation, _refresh: Date.now() })
      return
    }

    // No tenemos ubicación, iniciar watch
    startWatching()
  }, [userLocation, startWatching, setIsLocating, setUserLocation])

  // Limpiar watcher al desmontar
  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  return {
    userLocation,
    isLocating,
    requestLocation,
    startWatching,
    stopWatching,
  }
}
