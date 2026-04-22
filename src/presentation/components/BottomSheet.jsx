// ============================================================
// presentation/components/BottomSheet.jsx
// Ventana deslizante desde abajo que muestra información
// detallada de la ruta seleccionada.
//
// ACCESIBILIDAD: role="dialog", aria-modal, aria-labelledby,
// focus trap, escape para cerrar (WCAG 4.1.2).
// UX: swipe-to-close mejorado (H3 Nielsen), nombres legibles (H2).
// ============================================================

import { memo, useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { X, BusFront, MapPin, ChevronUp, Route } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useMapStore from '../stores/useMapStore'
import useUIStore from '../stores/useUIStore'
import { BUS_LINES } from '../../core/constants/routes'

// Mapa de lookup O(1) para BUS_LINES
const LINE_MAP = Object.fromEntries(BUS_LINES.map((l) => [l.id, l]))

// Alturas del sheet en píxeles
const SHEET_COLLAPSED = 80
const SHEET_HALF = 260
const SHEET_FULL = 420
const DRAG_THRESHOLD = 40

// Constante para cálculo de distancia
const EARTH_RADIUS = 6371000

/**
 * Calcula la distancia total de una ruta en metros usando Haversine.
 */
function calculateRouteDistance(coords) {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    total += EARTH_RADIUS * c
  }
  return total
}

function BottomSheet() {
  const selectedLine = useMapStore((s) => s.selectedLine)
  const selectLine = useMapStore((s) => s.selectLine)
  const stopsJSON = useMapStore((s) => s.stopsJSON)
  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)
  const isBottomSheetOpen = useUIStore((s) => s.isBottomSheetOpen)
  const closeBottomSheet = useUIStore((s) => s.closeBottomSheet)

  // Estado del sheet: 'collapsed' | 'half' | 'full'
  const [sheetState, setSheetState] = useState('half')
  const [translateY, setTranslateY] = useState(0)
  const sheetRef = useRef(null)
  const closeButtonRef = useRef(null)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)

  // Obtener datos de la línea seleccionada (lookup O(1))
  const lineData = useMemo(() => {
    if (!selectedLine) return null
    return LINE_MAP[selectedLine] || null
  }, [selectedLine])

  // Obtener paradas de la línea seleccionada
  const lineStops = useMemo(() => {
    if (!selectedLine || !stopsJSON) return []
    return stopsJSON.filter((stop) => stop.lines?.includes(selectedLine))
  }, [selectedLine, stopsJSON])

  // Obtener información de la ruta GeoJSON
  const routeInfo = useMemo(() => {
    if (!selectedLine || !routesGeoJSON?.features) return null
    const feature = routesGeoJSON.features.find(
      (f) => (f.properties?.id || f.id) === selectedLine
    )
    if (!feature) return null

    const coords = feature.geometry?.coordinates || []
    const totalDistance = calculateRouteDistance(coords)

    return {
      pointCount: coords.length,
      distanceKm: (totalDistance / 1000).toFixed(1),
    }
  }, [selectedLine, routesGeoJSON])

  // Cerrar el sheet y deseleccionar la línea
  const handleClose = useCallback(() => {
    setSheetState('half')
    closeBottomSheet()
    selectLine(null)
  }, [closeBottomSheet, selectLine])

  // H3 Nielsen: Cerrar con tecla Escape
  useEffect(() => {
    if (!selectedLine || !lineData) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedLine, lineData, handleClose])

  // Focus trap: enfocar el botón cerrar al abrir (WCAG 4.1.2)
  useEffect(() => {
    if (selectedLine && lineData && closeButtonRef.current) {
      // Pequeño delay para que la animación de entrada complete
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [selectedLine, lineData])

  // Manejar gestos de arrastre
  const handleTouchStart = useCallback((e) => {
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return
    const deltaY = e.touches[0].clientY - dragStartY.current
    if (deltaY > 0) {
      setTranslateY(deltaY)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
    // UX mejorado: cerrar si se arrastra > 60% de la altura visible
    const currentHeight = sheetState === 'collapsed' ? SHEET_COLLAPSED : sheetState === 'half' ? SHEET_HALF : SHEET_FULL
    const closeThreshold = currentHeight * 0.6

    if (translateY > closeThreshold) {
      handleClose()
    } else if (translateY > DRAG_THRESHOLD * 3) {
      setSheetState('collapsed')
    } else if (translateY > DRAG_THRESHOLD) {
      setSheetState(sheetState === 'full' ? 'half' : 'collapsed')
    } else if (translateY < -DRAG_THRESHOLD) {
      setSheetState(sheetState === 'collapsed' ? 'half' : 'full')
    }
    setTranslateY(0)
  }, [translateY, sheetState, handleClose])

  // Calcular altura del sheet
  const sheetHeight = useMemo(() => {
    switch (sheetState) {
      case 'collapsed': return SHEET_COLLAPSED
      case 'half': return SHEET_HALF
      case 'full': return SHEET_FULL
      default: return SHEET_HALF
    }
  }, [sheetState])

  // No renderizar si no hay línea seleccionada
  if (!selectedLine || !lineData) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="absolute bottom-16 left-0 right-0 z-[1001]"
        style={{
          height: sheetHeight + translateY,
          transition: isDragging.current ? 'none' : 'height 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="h-full flex flex-col overflow-hidden rounded-t-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 -8px 32px rgba(30, 58, 95, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderBottom: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle de arrastre */}
          <div className="flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
            <div className="w-10 h-1 rounded-full bg-gray-300/80" />
          </div>

          {/* Header del sheet */}
          <div className="px-4 pb-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Badge de color de la línea */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: lineData.color + '18',
                  border: `2px solid ${lineData.color}`,
                  boxShadow: `0 4px 12px ${lineData.color}30`,
                }}
              >
                <BusFront size={18} style={{ color: lineData.color }} aria-hidden="true" />
              </div>
              <div>
                <h3 id="sheet-title" className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {lineData.name}
                </h3>
                {routeInfo && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {routeInfo.distanceKm} km &middot; {routeInfo.pointCount} puntos
                  </p>
                )}
              </div>
            </div>

            {/* Botón cerrar — 44x44 para WCAG 2.5.5 */}
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="w-11 h-11 rounded-xl bg-gray-100/80 flex items-center justify-center
                         hover:bg-gray-200/80 active:bg-gray-300/60 transition-colors shrink-0"
              aria-label="Cerrar panel de detalles de ruta"
            >
              <X size={18} className="text-[var(--color-text-secondary)]" aria-hidden="true" />
            </button>
          </div>

          {/* Contenido solo visible cuando no está colapsado */}
          {sheetState !== 'collapsed' && (
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(30, 58, 95, 0.05)' }}
                >
                  <Route size={16} className="mx-auto mb-1.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Recorrido</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {routeInfo?.distanceKm || '—'} km
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(30, 58, 95, 0.05)' }}
                >
                  <MapPin size={16} className="mx-auto mb-1.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Paradas</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {lineStops.length}
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(30, 58, 95, 0.05)' }}
                >
                  <BusFront size={16} className="mx-auto mb-1.5" style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
                  <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>Línea</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                    {lineData.name.split('—')[0]?.trim() || selectedLine}
                  </p>
                </motion.div>
              </div>

              {/* Lista de paradas principales */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
                  Paradas principales
                </h4>
                <ul className="space-y-0.5" aria-label="Lista de paradas">
                  {lineStops.map((stop, index) => {
                    const isLast = index === lineStops.length - 1
                    return (
                      <motion.li
                        key={stop.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index, duration: 0.25 }}
                        className="flex items-start gap-3"
                      >
                        {/* Indicador de línea vertical + punto */}
                        <div className="flex flex-col items-center shrink-0" aria-hidden="true">
                          <div
                            className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-200"
                            style={{
                              borderColor: lineData.color,
                              backgroundColor: index === 0 || isLast
                                ? lineData.color
                                : '#ffffff',
                              boxShadow: index === 0 || isLast
                                ? `0 0 0 3px ${lineData.color}20`
                                : 'none',
                            }}
                          />
                          {!isLast && (
                            <div
                              className="w-0.5 h-6"
                              style={{ backgroundColor: lineData.color + '30' }}
                            />
                          )}
                        </div>
                        {/* Nombre de parada */}
                        <div className="pb-2">
                          <p className={`text-sm ${
                            index === 0 || isLast
                              ? 'font-bold'
                              : 'font-medium'
                          }`} style={{
                            color: index === 0 || isLast
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)'
                          }}>
                            {stop.name}
                          </p>
                          {stop.lines.length > 1 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Conexiones:</span>
                              {stop.lines
                                .filter((l) => l !== selectedLine)
                                .map((lId) => {
                                  const connLine = LINE_MAP[lId]
                                  return connLine ? (
                                    <span
                                      key={lId}
                                      className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold"
                                      style={{
                                        backgroundColor: connLine.color,
                                        boxShadow: `0 2px 4px ${connLine.color}40`,
                                      }}
                                    >
                                      {connLine.name.split('—')[0]?.trim() || lId}
                                    </span>
                                  ) : null
                                })}
                            </div>
                          )}
                        </div>
                      </motion.li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Indicador de expandir cuando está colapsado */}
          {sheetState === 'collapsed' && (
            <div className="flex-1 flex items-center justify-center px-4">
              <button
                onClick={() => setSheetState('half')}
                className="flex items-center gap-1.5 text-xs font-medium
                           active:text-[var(--color-primary)] transition-colors min-h-[44px] min-w-[44px]
                           px-4 rounded-lg"
                style={{ color: 'var(--color-text-muted)' }}
                aria-label="Expandir panel de detalles"
              >
                <ChevronUp size={14} aria-hidden="true" />
                <span>Desliza para ver detalles</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(BottomSheet)
