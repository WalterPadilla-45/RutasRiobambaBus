// ============================================================
// presentation/screens/MapScreen.jsx
// Pantalla del mapa interactivo con react-leaflet
// Centrado en Riobamba, Ecuador [-1.67, -78.65]
//
// MEJORADO: Vibración háptica al seleccionar puntos (H1),
// mensajes de error amigables (H9), aria-hidden en iconos,
// banners con role="status"/"alert", CSS variables.
// ============================================================

import { useCallback } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { MAP_CONFIG, TILE_URL, TILE_ATTRIBUTION } from '../../core/constants/routes'
import MapController from '../components/MapController'
import RouteLayer from '../components/RouteLayer'
import StopsLayer from '../components/StopsLayer'
import BottomSheet from '../components/BottomSheet'
import UserLocationMarker from '../components/UserLocationMarker'
import LocationFAB from '../components/LocationFAB'
import SearchPointMarker from '../components/SearchPointMarker'
import RouteResultsCard from '../components/RouteResultsCard'
import { useLoadRoutes } from '../hooks/useLoadRoutes'
import { BusFront, Crosshair, WifiOff, Loader2, RefreshCw, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useMapStore from '../stores/useMapStore'
import { useMapController } from '../hooks/useMapController'

/**
 * Componente que escucha clics en el mapa y los reenvía
 * al store cuando estamos en modo de selección de punto.
 * H1 Nielsen: Feedback háptico al seleccionar punto.
 */
function MapClickHandler() {
  const selectingPoint = useMapStore((s) => s.selectingPoint)
  const handleMapClickForSearch = useMapStore((s) => s.handleMapClickForSearch)

  useMapEvents({
    click: (e) => {
      if (selectingPoint) {
        const handled = handleMapClickForSearch(e.latlng)
        // H1 Nielsen: Vibración háptica como feedback inmediato
        if (handled && navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    },
  })

  return null
}

// Variantes de animación reutilizables
const bannerVariants = {
  hidden: { opacity: 0, y: -16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.97 },
}

const bannerTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
}

function MapScreen() {
  // Cargar datos GeoJSON al montar (con feedback de carga/offline)
  const { isLoading, loadError, isOffline, reload } = useLoadRoutes()

  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)
  const selectedLine = useMapStore((s) => s.selectedLine)
  const userLocation = useMapStore((s) => s.userLocation)
  const locationError = useMapStore((s) => s.locationError)
  const selectingPoint = useMapStore((s) => s.selectingPoint)
  const originPoint = useMapStore((s) => s.originPoint)
  const destinationPoint = useMapStore((s) => s.destinationPoint)
  const suggestedRoutes = useMapStore((s) => s.suggestedRoutes)
  const selectLine = useMapStore((s) => s.selectLine)
  const clearSearch = useMapStore((s) => s.clearSearch)

  const hasSearchPoints = originPoint || destinationPoint
  const hasResults = suggestedRoutes.length > 0

  // H3 Nielsen: "Restablecer Vista" — Control del usuario
  const { flyTo } = useMapController()
  const handleResetView = useCallback(() => {
    selectLine(null)
    clearSearch()
    flyTo(MAP_CONFIG.CENTER[0], MAP_CONFIG.CENTER[1], MAP_CONFIG.DEFAULT_ZOOM)
  }, [selectLine, clearSearch, flyTo])

  const showResetButton = selectedLine || hasSearchPoints

  return (
    <div className="h-full w-full relative">
      {/* H1 Nielsen: Heading accesible oculto para lectores de pantalla */}
      <h1 className="sr-only">Mapa de rutas de transporte público de Riobamba</h1>

      <MapContainer
        center={MAP_CONFIG.CENTER}
        zoom={MAP_CONFIG.DEFAULT_ZOOM}
        minZoom={MAP_CONFIG.MIN_ZOOM}
        maxZoom={MAP_CONFIG.MAX_ZOOM}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={true}
      >
        {/* Capa de tiles de OpenStreetMap */}
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={MAP_CONFIG.MAX_ZOOM}
        />

        {/* Controlador programático del mapa */}
        <MapController />

        {/* Handler de clics para selección de puntos */}
        <MapClickHandler />

        {/* Capa de rutas de bus */}
        {routesGeoJSON && <RouteLayer />}

        {/* Capa de paradas */}
        {selectedLine && <StopsLayer />}

        {/* Marcador de ubicación del usuario */}
        <UserLocationMarker />

        {/* Marcadores de origen y destino */}
        <SearchPointMarker />
      </MapContainer>

      {/* Overlay: Banner de carga de datos — H1: Visibilidad del estado */}
      <AnimatePresence>
        {isLoading && !routesGeoJSON && (
          <motion.div
            key="loading-banner"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={bannerTransition}
            className="absolute top-3 left-3 right-3 z-[1000]"
            role="status"
            aria-live="polite"
          >
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-3"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 32px rgba(30, 58, 95, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <Loader2 size={18} className="animate-spin shrink-0" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Cargando rutas...</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Descargando datos del transporte</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Banner offline sutil (solo cuando hay datos cargados) */}
      <AnimatePresence>
        {isOffline && routesGeoJSON && (
          <motion.div
            key="offline-banner"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={bannerTransition}
            className="absolute top-3 left-3 z-[1000]"
            role="status"
          >
            <div
              className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgba(255, 243, 224, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <WifiOff size={12} aria-hidden="true" style={{ color: 'var(--color-warning-dark)' }} />
              <span className="text-[11px] font-semibold" style={{ color: '#92400e' }}>Modo sin conexión</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Error de carga — H9: Mensajes amigables */}
      <AnimatePresence>
        {loadError && !routesGeoJSON && (
          <motion.div
            key="error-banner"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={bannerTransition}
            className="absolute top-3 left-3 right-3 z-[1000]"
            role="alert"
          >
            <div
              className="px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(254, 242, 242, 0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(220, 38, 38, 0.12)',
                border: '1px solid rgba(220, 38, 38, 0.18)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: '#991b1b' }}>{loadError}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: '#b91c1c' }}>
                Verifica tu conexión a internet o intenta de nuevo.
              </p>
              <button
                onClick={reload}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold
                           active:opacity-70 min-h-[44px] transition-colors"
                style={{ color: '#991b1b' }}
                aria-label="Reintentar carga de datos"
              >
                <RefreshCw size={12} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Banner de selección de punto */}
      <AnimatePresence>
        {selectingPoint && (
          <motion.div
            key="selecting-banner"
            variants={bannerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={bannerTransition}
            className="absolute top-3 left-3 right-3 z-[1000]"
            role="status"
            aria-live="assertive"
          >
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-3 text-white"
              style={{
                background: selectingPoint === 'origin'
                  ? 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-dark) 100%)'
                  : 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-dark) 100%)',
                boxShadow: selectingPoint === 'origin'
                  ? '0 8px 24px rgba(34, 197, 94, 0.35)'
                  : '0 8px 24px rgba(239, 68, 68, 0.35)',
              }}
            >
              <Crosshair size={18} className="animate-pulse shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">
                  Toca el mapa para definir el {selectingPoint === 'origin' ? 'origen' : 'destino'}
                </p>
                <p className="text-xs opacity-80 mt-0.5 font-medium">
                  Selecciona una calle o punto de referencia
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Label de ciudad (solo cuando no hay nada seleccionado) */}
      <AnimatePresence>
        {!selectedLine && !selectingPoint && !hasSearchPoints && !isLoading && (
          <motion.div
            key="city-label"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
          >
            <div
              className="px-4 py-2 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                boxShadow: '0 4px 20px rgba(30, 58, 95, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--color-primary)' }}>
                Riobamba, Ecuador
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay: Badge de línea seleccionada */}
      <AnimatePresence>
        {selectedLine && !selectingPoint && (
          <motion.div
            key="line-badge"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
          >
            <div
              className="px-4 py-2 rounded-full flex items-center gap-2"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 4px 20px rgba(30, 58, 95, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <BusFront size={16} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                {selectedLine}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB de geolocalización */}
      <LocationFAB />

      {/* H3 Nielsen: Botón "Restablecer Vista" (Control y libertad) */}
      <AnimatePresence>
        {showResetButton && (
          <motion.button
            key="reset-fab"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleResetView}
            className="absolute bottom-40 right-4 z-[1000] w-11 h-11 rounded-full
                       flex items-center justify-center ring-2 ring-white/60
                       active:scale-90 transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(30, 58, 95, 0.2)',
            }}
            aria-label="Restablecer vista del mapa"
          >
            <RotateCcw size={18} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Banner de error de ubicación — H9: Mensajes amigables */}
      <AnimatePresence>
        {locationError && !userLocation && (
          <motion.div
            key="location-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-14 left-3 right-3 z-[1000]"
            role="alert"
          >
            <div
              className="rounded-xl px-3 py-2.5"
              style={{
                background: 'rgba(254, 242, 242, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.15)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: '#991b1b' }}>
                {locationError.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tarjeta de resultados de búsqueda */}
      {hasSearchPoints && hasResults && !selectingPoint && (
        <RouteResultsCard />
      )}

      {/* Bottom Sheet contextual (solo cuando hay línea seleccionada sin búsqueda) */}
      {selectedLine && !hasSearchPoints && <BottomSheet />}
    </div>
  )
}

export default MapScreen
