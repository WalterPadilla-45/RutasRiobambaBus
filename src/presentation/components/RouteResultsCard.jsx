// ============================================================
// presentation/components/RouteResultsCard.jsx
// Tarjeta de resultados que muestra las rutas sugeridas
// (directas y con trasbordo) al buscar "¿Qué bus tomo?".
//
// ACCESIBILIDAD: listas semánticas <ul>/<li> (WCAG 1.3.1),
// aria-hidden en iconos decorativos, headings con id,
// glassmorphism, sombras premium con tinte, badges mejorados.
// ============================================================

import { memo, useMemo, useCallback } from 'react'
import { BusFront, ArrowRight, Repeat, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import useMapStore from '../stores/useMapStore'

function RouteResultsCard() {
  const suggestedRoutes = useMapStore((s) => s.suggestedRoutes)
  const selectLine = useMapStore((s) => s.selectLine)
  const setVisibleRoutes = useMapStore((s) => s.setVisibleRoutes)
  const originPoint = useMapStore((s) => s.originPoint)
  const destinationPoint = useMapStore((s) => s.destinationPoint)

  // Memoizar la separación por tipo
  const { directRoutes, transferRoutes } = useMemo(() => {
    const direct = suggestedRoutes.filter((r) => r.type === 'direct')
    const transfer = suggestedRoutes.filter((r) => r.type === 'transfer')
    return { directRoutes: direct, transferRoutes: transfer }
  }, [suggestedRoutes])

  const handleSelectRoute = useCallback((route) => {
    if (route.type === 'direct') {
      selectLine(route.lineId)
    } else {
      setVisibleRoutes([route.fromLineId, route.toLineId])
    }
  }, [selectLine, setVisibleRoutes])

  if (!originPoint || !destinationPoint || suggestedRoutes.length === 0) return null

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="absolute bottom-16 left-0 right-0 z-[1001] px-3 pb-2"
      role="region"
      aria-label="Resultados de búsqueda de rutas"
    >
      <div
        className="rounded-2xl max-h-[50vh] overflow-hidden flex flex-col"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 -8px 32px rgba(30, 58, 95, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100/60 shrink-0">
          <h3 id="results-title" className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Rutas encontradas
          </h3>
          <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {directRoutes.length} directa{directRoutes.length !== 1 ? 's' : ''}
            {transferRoutes.length > 0 && ` · ${transferRoutes.length} con trasbordo`}
          </p>
        </div>

        {/* Lista de resultados */}
        <div className="overflow-y-auto custom-scrollbar">
          {/* Rutas directas */}
          {directRoutes.length > 0 && (
            <div className="px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Directas
              </p>
              <ul aria-label="Rutas directas">
                {directRoutes.map((route, idx) => (
                  <motion.li
                    key={`direct-${route.lineId}-${idx}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <button
                      onClick={() => handleSelectRoute(route)}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl
                                 hover:bg-[var(--color-primary)]/[0.04] active:bg-[var(--color-primary)]/[0.08]
                                 transition-colors mb-1"
                      aria-label={`Ruta directa: ${route.lineName}`}
                    >
                      {/* Badge de línea */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: route.color + '18',
                          border: `2px solid ${route.color}`,
                          boxShadow: `0 4px 10px ${route.color}25`,
                        }}
                      >
                        <BusFront size={17} style={{ color: route.color }} aria-hidden="true" />
                      </div>
                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {route.lineName}
                        </p>
                        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Sin trasbordo</p>
                      </div>
                      {/* Indicador */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            color: 'var(--color-success-dark)',
                            background: 'rgba(16, 185, 129, 0.12)',
                          }}
                        >
                          Directa
                        </span>
                      </div>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Rutas con trasbordo */}
          {transferRoutes.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100/60">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                Con trasbordo
              </p>
              <ul aria-label="Rutas con trasbordo">
                {transferRoutes.map((route, idx) => (
                  <motion.li
                    key={`transfer-${route.fromLineId}-${route.toLineId}-${idx}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (directRoutes.length + idx) * 0.06 }}
                  >
                    <button
                      onClick={() => handleSelectRoute(route)}
                      className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl
                                 hover:bg-[var(--color-primary)]/[0.04] active:bg-[var(--color-primary)]/[0.08]
                                 transition-colors mb-1"
                      aria-label={`Ruta con trasbordo: ${route.fromLineName || route.fromLineId} a ${route.toLineName || route.toLineId}`}
                    >
                      {/* Badge línea origen */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: route.fromColor + '18',
                          border: `2px solid ${route.fromColor}`,
                        }}
                      >
                        <BusFront size={14} style={{ color: route.fromColor }} aria-hidden="true" />
                      </div>

                      {/* Flecha de trasbordo */}
                      <div className="flex flex-col items-center shrink-0" aria-hidden="true">
                        <ArrowRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                        <Repeat size={10} className="text-amber-500 mt-0.5" />
                      </div>

                      {/* Badge línea destino */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: route.toColor + '18',
                          border: `2px solid ${route.toColor}`,
                        }}
                      >
                        <BusFront size={14} style={{ color: route.toColor }} aria-hidden="true" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {route.fromLineName || route.fromLineId} → {route.toLineName || route.toLineId}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={9} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)' }} />
                          <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
                            Trasbordo a {route.transferToDestDist}m del destino
                          </p>
                        </div>
                      </div>

                      {/* Indicador */}
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{
                          color: 'var(--color-warning-dark)',
                          background: 'rgba(245, 158, 11, 0.12)',
                        }}
                      >
                        2 buses
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default memo(RouteResultsCard)
