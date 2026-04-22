import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/', label: 'Mapa', accessKey: 'm' },
  { path: '/lines', label: 'Líneas', accessKey: 'l' },
  { path: '/what-bus', label: '¿Qué bus tomo?', accessKey: 'b' },
]

function TopNavigationBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav
      className="bg-white border-b border-gray-100/60 sticky top-0 z-[2000] shrink-0"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex-shrink-0 cursor-pointer flex items-center"
          onClick={() => navigate('/')}
          aria-label="Ir a Inicio"
        >
          <span 
            className="text-[22px] font-extrabold tracking-tight"
            style={{ color: 'var(--color-primary)' }}
          >
            Kinetic Riobamba
          </span>
        </div>

        {/* Links de navegación */}
        <div className="flex items-center gap-6" role="tablist">
          {NAV_ITEMS.map(({ path, label, accessKey }) => {
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
                  relative h-16 flex items-center px-1
                  text-sm font-semibold transition-colors
                  ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}
                `}
              >
                {label}
                {/* Indicador activo */}
                {isActive && (
                  <motion.div
                    layoutId="top-nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[var(--color-primary)]"
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
