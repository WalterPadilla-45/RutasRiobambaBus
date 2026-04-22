// ============================================================
// presentation/screens/LinesScreen.jsx
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { BusFront, Search, MapPin, Circle, Clock, CarFront, Leaf, Zap, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUS_LINES } from '../../core/constants/routes'
import useMapStore from '../stores/useMapStore'
import useUIStore from '../stores/useUIStore'
import { useNavigate } from 'react-router-dom'

function LinesScreen() {
  const selectLine = useMapStore((s) => s.selectLine)
  const stopsJSON = useMapStore((s) => s.stopsJSON)
  const openBottomSheet = useUIStore((s) => s.openBottomSheet)
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas') // Todas, Eco-Rutas, Exprés

  // Memoizar mapa de paradas por línea para origin/destino
  const stopsByLine = useMemo(() => {
    if (!stopsJSON) return {}
    const map = {}
    for (const stop of stopsJSON) {
      for (const lineId of stop.lines || []) {
        if (!map[lineId]) map[lineId] = []
        map[lineId].push(stop)
      }
    }
    return map
  }, [stopsJSON])

  const filteredLines = useMemo(() => {
    let result = BUS_LINES

    // Simular filtros para el diseño visual
    if (activeFilter === 'Eco-Rutas') {
      result = result.slice(0, 2) // Solo para simular
    } else if (activeFilter === 'Exprés') {
      result = result.slice(2, 4) // Solo para simular
    }

    if (!searchQuery.trim()) return result
    const q = searchQuery.toLowerCase().trim()
    return result.filter((line) =>
      line.name.toLowerCase().includes(q) ||
      line.id.toLowerCase().includes(q)
    )
  }, [searchQuery, activeFilter])

  const handleLinePress = useCallback((lineId, lineName) => {
    selectLine(lineId)
    openBottomSheet({ type: 'route', lineId, lineName })
    navigate('/')
  }, [selectLine, openBottomSheet, navigate])

  return (
    <div className="h-full w-full overflow-y-auto bg-[#fafafa] custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--color-primary)' }}>
            Directorio de Líneas
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed font-medium">
            Explora todas las rutas de transporte público en Riobamba. Encuentra tu línea
            ideal para moverte por la ciudad de manera eficiente.
          </p>
        </div>

        {/* Búsqueda y Filtros */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número, origen o destino..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setActiveFilter('Todas')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeFilter === 'Todas' ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BusFront size={16} /> Todas
            </button>
            <button
              onClick={() => setActiveFilter('Eco-Rutas')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeFilter === 'Eco-Rutas' ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Leaf size={16} /> Eco-Rutas
            </button>
            <button
              onClick={() => setActiveFilter('Exprés')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeFilter === 'Exprés' ? 'bg-[#1b5e20] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Zap size={16} /> Exprés
            </button>
          </div>
        </div>

        {/* Grid de Tarjetas */}
        {filteredLines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No se encontraron líneas para "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLines.map((line, index) => {
              const lineStops = stopsByLine[line.id] || []
              const origin = lineStops[0]?.name || 'Origen desconocido'
              const dest = lineStops[lineStops.length - 1]?.name || 'Destino desconocido'
              
              // Simular estado de retraso para L3 según la imagen
              const hasDelay = line.id === 'L3'

              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleLinePress(line.id, line.name)}
                  className="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 cursor-pointer hover:shadow-lg transition-all border border-gray-100/80 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <span className="text-white text-xl font-extrabold">{line.id}</span>
                    </div>
                    {hasDelay ? (
                      <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider flex items-center gap-1.5 uppercase">
                        <AlertTriangle size={12} /> Retraso
                      </div>
                    ) : (
                      <div className="bg-[#bbf7d0] text-[#166534] px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase">
                        Activa
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-4 pr-4">
                    {line.name}
                  </h3>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <Circle size={12} className="text-[#1e3a5f]" strokeWidth={4} />
                      <span className="text-sm text-gray-600 font-medium truncate">{origin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin size={14} className="text-[#1e3a5f] -ml-[1px]" strokeWidth={2.5} />
                      <span className="text-sm text-gray-600 font-medium truncate">{dest}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock size={14} />
                      <span className="text-xs font-semibold">Frecuencia: {hasDelay ? '15 min' : '10 min'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <CarFront size={14} />
                      <span className="text-xs font-semibold">{hasDelay ? '8 Unidades' : '12 Unidades'}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Footer Minimalista */}
        <footer className="mt-20 pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
          <div>
            <span className="font-bold text-[var(--color-primary)]">Kinetic Riobamba</span>
            <span className="mx-2"></span>
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

export default LinesScreen
