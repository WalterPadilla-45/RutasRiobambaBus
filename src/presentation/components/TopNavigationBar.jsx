// ============================================================
// presentation/components/TopNavigationBar.jsx
// Barra de navegación superior con glassmorphism, iconos
// y un indicador activo con gradiente premium.
// ============================================================

import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, ListOrdered, Navigation } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Mapa', icon: Map, accessKey: 'm' },
  { path: '/lines', label: 'Líneas', icon: ListOrdered, accessKey: 'l' },
  { path: '/what-bus', label: '¿Qué bus tomo?', icon: Navigation, accessKey: 'b' },
]

function TopNavigationBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="sticky top-0 z-[2000] shrink-0"
      style={{
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 1px 12px rgba(30, 58, 95, 0.06)',
      }}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex-shrink-0 cursor-pointer flex items-center gap-2 group"
          onClick={() => navigate('/')}
          aria-label="Ir a Inicio"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              boxShadow: '0 2px 8px rgba(30, 58, 95, 0.25)',
            }}
          >
            <span className="text-white text-sm font-extrabold">R</span>
          </div>
          <span
            className="text-[20px] font-extrabold tracking-tight hidden sm:inline"
            style={{ color: 'var(--color-primary)' }}
          >
            Kinetic Riobamba
          </span>
        </div>

        {/* Links de navegación */}
        <div className="flex items-center gap-1 sm:gap-2" role="tablist">
          {NAV_ITEMS.map(({ path, label, icon: Icon, accessKey }) => {
            const isActive = location.pathname === path

            return (
              <button
                key={path}
                role="tab"
                aria-selected={isActive}
                aria-label={label}
                accessKey={accessKey}
                tabIndex={isActive ? 0 : -1}
                onClick={() => navigate(path)}
                className={`
                  relative h-16 flex items-center gap-1.5 px-2.5 sm:px-3
                  text-[13px] sm:text-sm font-semibold transition-all duration-200
                  ${isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <Icon
                  size={16}
                  className={`shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-tertiary)]'
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden xs:inline sm:inline">{label}</span>
                {/* Indicador activo con gradiente */}
                {isActive && (
                  <motion.div
                    layoutId="top-nav-indicator"
                    className="absolute bottom-0 left-1 right-1 h-[3px] rounded-t-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default TopNavigationBar
