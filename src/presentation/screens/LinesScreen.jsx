// ============================================================
// presentation/screens/LinesScreen.jsx
// Directorio de líneas de transporte con búsqueda por texto.
// Filtros falsos eliminados. Diseño premium con tarjetas grid.
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import { BusFront, Search, MapPin, Circle, Clock, CarFront, AlertTriangle, X } from 'lucide-react'
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
    if (!searchQuery.trim()) return BUS_LINES
    const q = searchQuery.toLowerCase().trim()
    return BUS_LINES.filter((line) =>
      line.name.toLowerCase().includes(q) ||
      line.id.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleLinePress = useCallback((lineId, lineName) => {
    selectLine(lineId)
    openBottomSheet({ type: 'route', lineId, lineName })
    navigate('/')
  }, [selectLine, openBottomSheet, navigate])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <div className="h-full w-full overflow-y-auto bg-[#fafafa] custom-scrollbar smooth-scroll">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-full flex flex-col">

        {/* Header Section con gradiente sutil */}
        <div className="max-w-2xl mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                boxShadow: '0 4px 16px rgba(30, 58, 95, 0.25)',
              }}
            >
              <BusFront size={24} className="text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                Directorio de Líneas
              </h1>
            </div>
          </div>
          <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
            Explora todas las rutas de transporte público en Riobamba. Selecciona una línea
            para ver su recorrido completo en el mapa.
          </p>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm mb-6 relative overflow-hidden">
          <div className="relative flex items-center">
            <Search size={20} className="absolute left-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número, nombre o destino..."
              className="w-full pl-12 pr-12 py-4 bg-transparent text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 rounded-2xl transition-all placeholder:text-gray-400"
            />
            {/* Botón limpiar búsqueda */}
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClearSearch}
                  className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} className="text-gray-500" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-500">
            {searchQuery ? (
              <>
                {filteredLines.length} resultado{filteredLines.length !== 1 ? 's' : ''} para "<span className="text-gray-800">{searchQuery}</span>"
              </>
            ) : (
              <>{BUS_LINES.length} líneas disponibles</>
            )}
          </p>
        </div>

        {/* Grid de Tarjetas */}
        {filteredLines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg mb-1">Sin resultados</p>
            <p className="text-gray-400 text-sm font-medium">No se encontraron líneas para "{searchQuery}"</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
            {filteredLines.map((line, index) => {
              const lineStops = stopsByLine[line.id] || []
              const origin = lineStops[0]?.name || 'Origen desconocido'
              const dest = lineStops[lineStops.length - 1]?.name || 'Destino desconocido'

              // Simular estado de retraso para L3
              const hasDelay = line.id === 'L03'

              return (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  onClick={() => handleLinePress(line.id, line.name)}
                  className="bg-white/90 backdrop-blur-sm rounded-[24px] p-6 cursor-pointer border border-gray-100/80 group card-hover"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2"
                      style={{
                        background: `linear-gradient(135deg, ${line.color} 0%, ${line.color}dd 100%)`,
                        boxShadow: `0 6px 16px ${line.color}40`,
                      }}
                    >
                      <span className="text-white text-xl font-extrabold">{line.id}</span>
                    </div>
                    {hasDelay ? (
                      <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider flex items-center gap-1.5 uppercase animate-status-pulse">
                        <AlertTriangle size={12} />Retraso
                      </div>
                    ) : (
                      <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase">
                        Activa
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-4 pr-4 group-hover:text-[var(--color-primary)] transition-colors duration-200">
                    {line.name}
                  </h3>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: line.color + '15' }}>
                        <Circle size={10} style={{ color: line.color }} strokeWidth={4} />
                      </div>
                      <span className="text-sm text-gray-600 font-medium truncate">{origin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: line.color + '15' }}>
                        <MapPin size={12} style={{ color: line.color }} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm text-gray-600 font-medium truncate">{dest}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100/80">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock size={13} />
                      <span className="text-xs font-semibold">{hasDelay ? '15 min' : '10 min'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <CarFront size={13} />
                      <span className="text-xs font-semibold">{hasDelay ? '8 Unidades' : '12 Unidades'}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-16 pb-4 border-t border-gray-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }}
            >
              <span className="text-white text-[9px] font-extrabold">R</span>
            </div>
            <span className="font-bold text-[var(--color-primary)]">Kinetic Riobamba</span>
            <span className="text-gray-300 mx-1">·</span>
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

export default LinesScreen
