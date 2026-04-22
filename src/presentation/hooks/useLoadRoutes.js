// ============================================================
// presentation/hooks/useLoadRoutes.js
// Hook personalizado que carga los datos de rutas y paradas
// desde el repositorio (fetch + localforage) al store Zustand.
// Se ejecuta una vez al montar la aplicación.
//
// OPTIMIZADO: Maneja estado de carga, errores de red,
// y proporciona feedback de conectividad offline.
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { getRoutesGeoJSON, getStopsJSON, forceRefresh } from '../../data/repositories/busRouteRepository'
import useMapStore from '../stores/useMapStore'

export function useLoadRoutes() {
  const setRoutesGeoJSON = useMapStore((s) => s.setRoutesGeoJSON)
  const setStopsJSON = useMapStore((s) => s.setStopsJSON)
  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)

  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      console.log('[useLoadRoutes] Conexión restaurada')
    }
    const handleOffline = () => {
      setIsOffline(true)
      console.log('[useLoadRoutes] Sin conexión — usando caché')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cargar datos al montar
  useEffect(() => {
    if (routesGeoJSON) return // Ya tenemos datos

    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    async function loadData() {
      try {
        console.log('[useLoadRoutes] Cargando datos de rutas y paradas...')

        const [routes, stops] = await Promise.all([
          getRoutesGeoJSON(),
          getStopsJSON(),
        ])

        if (cancelled) return

        if (routes) {
          setRoutesGeoJSON(routes)
          console.log(`[useLoadRoutes] ${routes.features?.length || 0} rutas cargadas`)
        } else {
          setLoadError('No se pudieron cargar las rutas. Verifica tu conexión.')
        }

        if (stops) {
          setStopsJSON(stops)
          console.log(`[useLoadRoutes] ${stops.length || 0} paradas cargadas`)
        }
      } catch (error) {
        console.error('[useLoadRoutes] Error cargando datos:', error)
        if (!cancelled) {
          setLoadError('Error al cargar datos. Intenta de nuevo.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [routesGeoJSON, setRoutesGeoJSON, setStopsJSON])

  // Función para forzar recarga
  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { routes, stops } = await forceRefresh()
      if (routes) setRoutesGeoJSON(routes)
      if (stops) setStopsJSON(stops)
      console.log('[useLoadRoutes] Datos recargados exitosamente')
    } catch (error) {
      console.error('[useLoadRoutes] Error en recarga:', error)
      setLoadError('Error al recargar datos.')
    } finally {
      setIsLoading(false)
    }
  }, [setRoutesGeoJSON, setStopsJSON])

  return { isLoading, loadError, isOffline, reload }
}
