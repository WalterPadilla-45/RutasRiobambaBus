// ============================================================
// presentation/screens/WhatBusScreen.jsx
// Pantalla "¿Qué bus tomo?" con diseño premium mejorado.
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import {
  MapPin, ArrowRight, X, Circle,
  Crosshair, BusFront, AlertCircle, TriangleAlert, ArrowUpDown, Home, Briefcase, Navigation
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useMapStore from '../stores/useMapStore'
import useUIStore from '../stores/useUIStore'
import { useGeolocation } from '../hooks/useGeolocation'
import { useNavigate } from 'react-router-dom'
import { findRoutes } from '../../domain/usecases/findRoutesUseCase'

function quickDistance(a, b) {
  if (!a || !b) return Infinity
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function getNearestStopLabel(point, stopsJSON) {
  if (!point || !stopsJSON || stopsJSON.length === 0) {
    return point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : ''
  }
  let nearest = null
  let minDist = Infinity
  for (const stop of stopsJSON) {
    const [lng, lat] = stop.coordinates
    const dist = quickDistance(point, { lat, lng })
    if (dist < minDist) {
      minDist = dist
      nearest = stop
    }
  }
  if (nearest && minDist < 500) return `Cerca de ${nearest.name}`
  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`
}

function WhatBusScreen() {
  const originPoint = useMapStore((s) => s.originPoint)
  const destinationPoint = useMapStore((s) => s.destinationPoint)
  const suggestedRoutes = useMapStore((s) => s.suggestedRoutes)
  const setSuggestedRoutes = useMapStore((s) => s.setSuggestedRoutes)
  const setOriginPoint = useMapStore((s) => s.setOriginPoint)
  const setDestinationPoint = useMapStore((s) => s.setDestinationPoint)
  const setSelectingPoint = useMapStore((s) => s.setSelectingPoint)
  const selectingPoint = useMapStore((s) => s.selectingPoint)
  const clearSearch = useMapStore((s) => s.clearSearch)
  const routesGeoJSON = useMapStore((s) => s.routesGeoJSON)
  const userLocation = useMapStore((s) => s.userLocation)
  const stopsJSON = useMapStore((s) => s.stopsJSON)
  const setVisibleRoutes = useMapStore((s) => s.setVisibleRoutes)

  const lastDeletedPoint = useUIStore((s) => s.lastDeletedPoint)
  const setLastDeletedPoint = useUIStore((s) => s.setLastDeletedPoint)
  const clearLastDeletedPoint = useUIStore((s) => s.clearLastDeletedPoint)

  const { requestLocation } = useGeolocation()
  const navigate = useNavigate()

  const [isSearching, setIsSearching] = useState(false)
  const [tooCloseWarning, setTooCloseWarning] = useState(false)

  useEffect(() => {
    if (!originPoint || !destinationPoint || !routesGeoJSON) {
      setSuggestedRoutes([])
      setTooCloseWarning(false)
      return
    }
    const dist = quickDistance(originPoint, destinationPoint)
    if (dist < 20) {
      setTooCloseWarning(true)
      setSuggestedRoutes([])
      return
    }
    setTooCloseWarning(false)
    setIsSearching(true)
    const timer = setTimeout(() => {
      try {
        const results = findRoutes(routesGeoJSON, [originPoint.lng, originPoint.lat], [destinationPoint.lng, destinationPoint.lat])
        setSuggestedRoutes([...results.directRoutes, ...results.transferRoutes])
        if (results.allLineIds.length > 0) setVisibleRoutes(results.allLineIds)
      } catch (error) {
        console.error('[WhatBusScreen] Error en búsqueda:', error)
        setSuggestedRoutes([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [originPoint, destinationPoint, routesGeoJSON, setSuggestedRoutes, setVisibleRoutes])

  const handleSelectOnMap = useCallback((type) => {
    setSelectingPoint(type)
    navigate('/')
  }, [setSelectingPoint, navigate])

  const handleSelectRoute = useCallback((route) => {
    if (route.type === 'direct') setVisibleRoutes([route.lineId])
    else setVisibleRoutes([route.fromLineId, route.toLineId])
    navigate('/')
  }, [setVisibleRoutes, navigate])

  const handleDeleteOrigin = useCallback(() => {
    if (originPoint) setLastDeletedPoint('origin', originPoint)
    setOriginPoint(null)
  }, [originPoint, setOriginPoint, setLastDeletedPoint])

  const handleDeleteDestination = useCallback(() => {
    if (destinationPoint) setLastDeletedPoint('destination', destinationPoint)
    setDestinationPoint(null)
  }, [destinationPoint, setDestinationPoint, setLastDeletedPoint])

  const handleUndo = useCallback(() => {
    if (!lastDeletedPoint) return
    if (lastDeletedPoint.type === 'origin') setOriginPoint(lastDeletedPoint.point)
    else setDestinationPoint(lastDeletedPoint.point)
    clearLastDeletedPoint()
  }, [lastDeletedPoint, setOriginPoint, setDestinationPoint, clearLastDeletedPoint])

  const originLabel = selectingPoint === 'origin' ? 'Toca el mapa...' : originPoint ? getNearestStopLabel(originPoint, stopsJSON) : '¿De dónde sales?'
  const destLabel = selectingPoint === 'destination' ? 'Toca el mapa...' : destinationPoint ? getNearestStopLabel(destinationPoint, stopsJSON) : '¿A dónde vas?'

  const canSearch = originPoint && destinationPoint && suggestedRoutes.length > 0

  return (
    <div className="h-full w-full overflow-y-auto bg-[#fafafa] custom-scrollbar smooth-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-full flex flex-col">

        <div className="flex-1 flex flex-col lg:flex-row gap-10">

          {/* Columna Izquierda: Formulario y Resultados */}
          <div className="w-full lg:w-[45%] flex flex-col">

            {/* Hero con icono decorativo */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                  boxShadow: '0 6px 20px rgba(30, 58, 95, 0.3)',
                }}
              >
                <Navigation size={26} className="text-white" aria-hidden="true" />
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                  Encuentra tu ruta.
                </h1>
              </div>
            </div>
            <p className="text-[15px] text-gray-600 leading-relaxed font-medium mb-8">
              Ingresa tu origen y destino para descubrir la mejor forma de moverte por Riobamba.
            </p>

            {/* Formulario de Origen/Destino */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 mb-6 relative">
              <div className="absolute left-10 top-[76px] bottom-[114px] w-0.5 bg-gray-200" aria-hidden="true" />

              {/* ORIGEN */}
              <div className="mb-6 relative z-10">
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block text-gray-500">Origen</label>
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${selectingPoint === 'origin' ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
                  onClick={() => handleSelectOnMap('origin')}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectingPoint === 'origin' ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <Circle size={14} className={selectingPoint === 'origin' ? 'text-blue-500' : 'text-gray-400'} strokeWidth={3} />
                  </div>
                  <span className={`text-sm truncate font-medium flex-1 ${originPoint ? 'text-gray-900' : 'text-gray-400'}`}>
                    {originLabel}
                  </span>
                  {originPoint && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteOrigin(); }} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Eliminar origen">
                      <X size={14} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Botón Invertir */}
              <div className="absolute right-10 top-[90px] z-20">
                <motion.button
                  whileTap={{ rotate: 180 }}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center border-2 border-gray-100 shadow-sm hover:bg-gray-50 hover:border-gray-200 transition-all"
                  onClick={() => {
                    const temp = originPoint;
                    setOriginPoint(destinationPoint);
                    setDestinationPoint(temp);
                  }}
                  title="Invertir origen y destino"
                >
                  <ArrowUpDown size={14} className="text-gray-500" />
                </motion.button>
              </div>

              {/* DESTINO */}
              <div className="mb-6 relative z-10">
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block text-gray-500">Destino</label>
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 ${selectingPoint === 'destination' ? 'bg-red-50 border-2 border-red-300 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}
                  onClick={() => handleSelectOnMap('destination')}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${selectingPoint === 'destination' ? 'bg-red-100' : 'bg-gray-200'}`}>
                    <MapPin size={14} className={selectingPoint === 'destination' ? 'text-red-500' : 'text-gray-400'} strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm truncate font-medium flex-1 ${destinationPoint ? 'text-gray-900' : 'text-gray-400'}`}>
                    {destLabel}
                  </span>
                  {destinationPoint && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDestination(); }} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Eliminar destino">
                      <X size={14} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Buscar Ruta */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                className={`w-full py-4 rounded-xl text-white font-bold text-[15px] transition-all duration-300 ${canSearch ? 'shadow-lg hover:shadow-xl' : 'opacity-60'}`}
                style={{
                  background: canSearch
                    ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)'
                    : 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)',
                  boxShadow: canSearch ? '0 8px 24px rgba(30, 58, 95, 0.3)' : 'none',
                }}
                onClick={() => {
                  if (canSearch) navigate('/')
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Crosshair size={18} aria-hidden="true" />
                  Buscar Ruta
                </span>
              </motion.button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mb-8">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="flex-1 bg-white border border-gray-100/80 shadow-sm py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-200 transition-all card-hover"
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Home size={16} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-sm font-bold text-gray-700">Casa</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="flex-1 bg-white border border-gray-100/80 shadow-sm py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-200 transition-all card-hover"
              >
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Briefcase size={16} className="text-amber-600" />
                </div>
                <span className="text-sm font-bold text-gray-700">Trabajo</span>
              </motion.button>
            </div>

            {/* Resultados In-Line */}
            <AnimatePresence mode="wait">
              {suggestedRoutes.length > 0 && !isSearching && !tooCloseWarning && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Rutas sugeridas</h3>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {suggestedRoutes.length} ruta{suggestedRoutes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {suggestedRoutes.map((route, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => handleSelectRoute(route)}
                        className="w-full text-left bg-gray-50/80 hover:bg-gray-100 border border-gray-200/60 p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 hover:border-gray-300/80 card-hover"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${route.type === 'direct' ? route.color : route.fromColor}15, ${route.type === 'direct' ? route.color : route.fromColor}25)`,
                            border: `2px solid ${route.type === 'direct' ? route.color : route.fromColor}`,
                          }}
                        >
                          <BusFront size={20} style={{ color: route.type === 'direct' ? route.color : route.fromColor }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{route.type === 'direct' ? route.lineName : `${route.fromLineName} + ${route.toLineName}`}</p>
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">{route.type === 'direct' ? 'Ruta directa — sin trasbordo' : 'Con trasbordo'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {route.type === 'direct' ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Directa</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">2 buses</span>
                          )}
                          <ArrowRight size={16} className="text-gray-300" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {isSearching && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-gray-200 border-t-[var(--color-primary)] animate-spin" />
                  <p className="text-gray-500 font-semibold">Buscando rutas...</p>
                </motion.div>
              )}

              {tooCloseWarning && (
                <motion.div
                  key="too-close"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-amber-50 border border-amber-200/60 text-amber-800 rounded-2xl text-sm font-medium flex items-center gap-3"
                >
                  <TriangleAlert size={18} className="shrink-0" /> Origen y destino están muy cerca. Intenta con puntos más separados.
                </motion.div>
              )}

              {!isSearching && !tooCloseWarning && originPoint && destinationPoint && suggestedRoutes.length === 0 && (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-red-50 border border-red-200/60 text-red-800 rounded-2xl text-sm font-medium flex items-center gap-3"
                >
                  <AlertCircle size={18} className="shrink-0" /> No se encontraron rutas para este recorrido.
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Columna Derecha: Placeholder visual del Mapa */}
          <div className="hidden lg:flex lg:w-[55%] relative rounded-[32px] overflow-hidden border-[4px] border-white shadow-lg">
            {/* Fondo con gradiente animado */}
            <div
              className="absolute inset-0 animate-gradient"
              style={{
                background: 'linear-gradient(135deg, #e8edf5 0%, #dce3ed 25%, #d4dce8 50%, #dce3ed 75%, #e8edf5 100%)',
                backgroundSize: '200% 200%',
              }}
            />

            {/* Patrón decorativo sutil */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, var(--color-primary) 1px, transparent 1px),
                                radial-gradient(circle at 80% 70%, var(--color-primary) 1px, transparent 1px),
                                radial-gradient(circle at 50% 50%, var(--color-primary) 1px, transparent 1px)`,
              backgroundSize: '40px 40px, 60px 60px, 50px 50px',
            }} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white/95 backdrop-blur-md px-10 py-12 rounded-3xl shadow-xl border border-white max-w-sm text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    boxShadow: '0 8px 24px rgba(30, 58, 95, 0.25)',
                  }}
                >
                  <BusFront size={32} className="text-white" />
                </motion.div>
                <h3 className="text-xl font-extrabold mb-3" style={{ color: 'var(--color-primary)' }}>Listo para planificar</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                  Ingresa tu destino en el panel izquierdo para ver las opciones de rutas de transporte público disponibles.
                </p>
              </motion.div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-auto pt-10 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }}
            >
              <span className="text-white text-[9px] font-extrabold">R</span>
            </div>
            <span>© 2024 — Dirección de Movilidad</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Privacidad</a>
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Términos</a>
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Contacto</a>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default WhatBusScreen
