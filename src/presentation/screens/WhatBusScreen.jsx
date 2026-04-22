// ============================================================
// presentation/screens/WhatBusScreen.jsx
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import {
  MapPin, ArrowRight, X, Circle,
  Crosshair, Touchpad, BusFront, AlertCircle, TriangleAlert, Undo2, ArrowUpDown, Home, Briefcase
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

  const snackbar = useUIStore((s) => s.snackbar)
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

  return (
    <div className="h-full w-full overflow-y-auto bg-[#fafafa] custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-full flex flex-col">
        
        <div className="flex-1 flex flex-col lg:flex-row gap-10">
          
          {/* Columna Izquierda: Formulario y Resultados */}
          <div className="w-full lg:w-[45%] flex flex-col">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-primary)' }}>
              Encuentra tu ruta.
            </h1>
            <p className="text-[15px] text-gray-600 leading-relaxed font-medium mb-10">
              Ingresa tu origen y destino para descubrir la mejor forma de moverte por Riobamba de manera rápida y ecológica.
            </p>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 mb-6 relative">
              <div className="absolute left-10 top-[76px] bottom-[114px] w-0.5 bg-gray-200" aria-hidden="true" />
              
              {/* ORIGEN */}
              <div className="mb-6 relative z-10">
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block text-gray-500">Origen</label>
                <div 
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${selectingPoint === 'origin' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100 hover:bg-gray-200/70 border border-transparent'}`}
                  onClick={() => handleSelectOnMap('origin')}
                >
                  <Circle size={18} className="text-gray-400 shrink-0" strokeWidth={3} />
                  <span className={`text-sm truncate font-medium flex-1 ${originPoint ? 'text-gray-900' : 'text-gray-400'}`}>
                    {originLabel}
                  </span>
                  {originPoint && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteOrigin(); }} className="p-1 hover:bg-gray-300 rounded-md">
                      <X size={14} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Botón Invertir */}
              <div className="absolute right-10 top-[90px] z-20">
                <button 
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-white shadow-sm hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    const temp = originPoint;
                    setOriginPoint(destinationPoint);
                    setDestinationPoint(temp);
                  }}
                  title="Invertir origen y destino"
                >
                  <ArrowUpDown size={14} className="text-gray-500" />
                </button>
              </div>

              {/* DESTINO */}
              <div className="mb-6 relative z-10">
                <label className="text-[11px] font-bold uppercase tracking-wider mb-2 block text-gray-500">Destino</label>
                <div 
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer transition-all ${selectingPoint === 'destination' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100 hover:bg-gray-200/70 border border-transparent'}`}
                  onClick={() => handleSelectOnMap('destination')}
                >
                  <MapPin size={18} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                  <span className={`text-sm truncate font-medium flex-1 ${destinationPoint ? 'text-gray-900' : 'text-gray-400'}`}>
                    {destLabel}
                  </span>
                  {destinationPoint && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteDestination(); }} className="p-1 hover:bg-gray-300 rounded-md">
                      <X size={14} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Buscar Ruta */}
              <button 
                className="w-full py-4 rounded-xl text-white font-bold text-[15px] shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#064292' }}
                onClick={() => {
                  if (originPoint && destinationPoint && suggestedRoutes.length > 0) {
                     navigate('/')
                  }
                }}
              >
                Buscar Ruta
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 mb-8">
              <button className="flex-1 bg-white border border-gray-100 shadow-sm py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Home size={18} className="text-[#064292]" />
                <span className="text-sm font-bold text-gray-700">Casa</span>
              </button>
              <button className="flex-1 bg-white border border-gray-100 shadow-sm py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                <Briefcase size={18} className="text-[#064292]" />
                <span className="text-sm font-bold text-gray-700">Trabajo</span>
              </button>
            </div>

            {/* Resultados In-Line */}
            {suggestedRoutes.length > 0 && !isSearching && !tooCloseWarning && (
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 mb-6">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Rutas sugeridas</h3>
                 <div className="space-y-3">
                   {suggestedRoutes.map((route, idx) => (
                     <button key={idx} onClick={() => handleSelectRoute(route)} className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200/60 p-4 rounded-2xl flex items-center gap-4 transition-colors">
                       <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-white shadow-sm border border-gray-100 shrink-0">
                         <BusFront size={20} style={{ color: route.type === 'direct' ? route.color : route.fromColor }} />
                       </div>
                       <div className="flex-1">
                         <p className="font-bold text-gray-900">{route.type === 'direct' ? route.lineName : `${route.fromLineName} + ${route.toLineName}`}</p>
                         <p className="text-xs font-semibold text-gray-500 mt-1">{route.type === 'direct' ? 'Directa' : 'Con trasbordo'}</p>
                       </div>
                       <ArrowRight size={18} className="text-gray-400" />
                     </button>
                   ))}
                 </div>
               </div>
            )}
            
            {isSearching && (
              <div className="py-10 text-center text-gray-500 font-medium animate-pulse">Buscando rutas...</div>
            )}
            
            {tooCloseWarning && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-sm font-medium flex items-center gap-3">
                <TriangleAlert size={18} /> Origen y destino están muy cerca.
              </div>
            )}
            
            {!isSearching && !tooCloseWarning && originPoint && destinationPoint && suggestedRoutes.length === 0 && (
               <div className="p-4 bg-red-50 text-red-800 rounded-2xl text-sm font-medium flex items-center gap-3">
                 <AlertCircle size={18} /> No se encontraron rutas.
               </div>
            )}

          </div>

          {/* Columna Derecha: Placeholder del Mapa */}
          <div className="hidden lg:block lg:w-[55%] relative rounded-[32px] overflow-hidden bg-[#cfd3db] shadow-inner border-[4px] border-white">
            {/* Silueta de mapa decorativa con CSS */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
               backgroundImage: `radial-gradient(circle at 50% 50%, white 0%, transparent 60%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 20px)`
            }} />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-10 py-12 rounded-3xl shadow-xl border border-white max-w-sm text-center">
                <div className="w-16 h-16 bg-[#ebf2fb] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#064292]">
                  <BusFront size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-[#064292] mb-3">Listo para planificar</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                  Ingresa tu destino en el panel izquierdo para ver las opciones de rutas de transporte público disponibles.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-auto pt-10 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
          <div>
            <span>© 2024 — Dirección de Movilidad</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Privacidad</a>
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Términos</a>
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Contacto</a>
            <a href="#" className="hover:text-gray-900 transition-colors underline underline-offset-4">Accesibilidad</a>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default WhatBusScreen
