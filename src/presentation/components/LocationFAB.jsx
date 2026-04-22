// ============================================================
// presentation/components/LocationFAB.jsx
// Botón flotante de acción (FAB) que solicita la ubicación
// del usuario y centra el mapa en su posición usando flyTo().
//
// MEJORADO: Indicador de precisión con texto legible (H2 Nielsen),
// mensajes de error amigables (H9), glassmorphism, framer-motion,
// tamaño 48x48px (WCAG 2.5.5), micro-animaciones.
// ============================================================

import { Locate, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useMapStore from '../stores/useMapStore'
import { useGeolocation } from '../hooks/useGeolocation'
import { useMapController } from '../hooks/useMapController'
import { useState, useCallback } from 'react'

function LocationFAB() {
  const userLocation = useMapStore((s) => s.userLocation)
  const locationError = useMapStore((s) => s.locationError)
  const isLocating = useMapStore((s) => s.isLocating)
  const { requestLocation } = useGeolocation()
  const { flyTo } = useMapController()

  const [showTooltip, setShowTooltip] = useState(false)

  const handlePress = useCallback(() => {
    if (locationError && locationError.code === 1) {
      // Permiso denegado, mostrar tooltip
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 4000)
      return
    }

    if (userLocation && !userLocation._refresh) {
      // Ya tenemos ubicación: centrar el mapa
      flyTo(userLocation.lat, userLocation.lng, 16)
    }

    // Solicitar/refresh ubicación
    requestLocation()
  }, [userLocation, locationError, requestLocation, flyTo])

  // Determinar el estado visual del botón
  let icon, bgStyle, ariaLabel

  if (isLocating) {
    icon = <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
    bgStyle = {
      background: 'rgba(74, 170, 240, 0.08)',
      boxShadow: '0 4px 20px rgba(74, 170, 240, 0.2)',
      border: '1.5px solid rgba(74, 170, 240, 0.3)',
    }
    ariaLabel = 'Obteniendo tu ubicación, por favor espera'
  } else if (locationError) {
    icon = <AlertCircle size={20} aria-hidden="true" style={{ color: 'var(--color-danger)' }} />
    bgStyle = {
      background: 'rgba(254, 242, 242, 0.92)',
      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.15)',
      border: '1.5px solid rgba(220, 38, 38, 0.2)',
    }
    ariaLabel = 'Error de ubicación. Toca para más información'
  } else if (userLocation) {
    icon = <Locate size={20} aria-hidden="true" style={{ color: 'var(--color-accent)' }} />
    bgStyle = {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 20px rgba(30, 58, 95, 0.18)',
      border: '1.5px solid rgba(74, 170, 240, 0.25)',
    }
    ariaLabel = 'Centrar mapa en mi ubicación'
  } else {
    icon = <Locate size={20} aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }} />
    bgStyle = {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 16px rgba(30, 58, 95, 0.12)',
      border: '1.5px solid rgba(255, 255, 255, 0.5)',
    }
    ariaLabel = 'Solicitar ubicación GPS'
  }

  // Determinar texto e indicador de precisión
  const precisionInfo = userLocation?.accuracy
    ? userLocation.accuracy < 20
      ? { text: 'Alta', color: 'var(--color-success)', bg: 'rgba(34, 197, 94, 0.15)' }
      : { text: '~', color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.15)' }
    : null

  return (
    <div className="absolute bottom-24 right-4 z-[1000]">
      {/* Tooltip de error — H9 Nielsen: mensajes amigables */}
      <AnimatePresence>
        {showTooltip && locationError && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 w-60"
            role="alert"
          >
            <div
              className="text-xs rounded-xl px-3.5 py-3"
              style={{
                background: 'rgba(30, 42, 58, 0.92)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                color: '#ffffff',
              }}
            >
              <p className="font-semibold mb-1">{locationError.message}</p>
              {locationError.code === 1 && (
                <p className="text-[11px] opacity-80">Ve a Ajustes del navegador → Permisos → Ubicación</p>
              )}
              {/* Flecha del tooltip */}
              <div
                className="absolute top-full right-4 w-0 h-0"
                aria-hidden="true"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(30, 42, 58, 0.92)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón FAB */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={handlePress}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
        style={bgStyle}
        aria-label={ariaLabel}
      >
        {icon}
      </motion.button>

      {/* Indicador de precisión — H2 Nielsen: lenguaje del usuario */}
      <AnimatePresence>
        {precisionInfo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 rounded-full
                       flex items-center justify-center"
            style={{
              width: '20px',
              height: '20px',
              background: precisionInfo.bg,
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
            aria-label={`Precisión GPS: ${precisionInfo.text === 'Alta' ? 'Alta' : 'Aproximada'}`}
          >
            <span className="text-[7px] font-bold" style={{ color: precisionInfo.color }}>
              {precisionInfo.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocationFAB
