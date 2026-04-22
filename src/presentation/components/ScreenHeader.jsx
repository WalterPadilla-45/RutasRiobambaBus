// ============================================================
// presentation/components/ScreenHeader.jsx
// Componente reutilizable para el header de pantallas.
// Garantiza consistencia visual (H4 Nielsen) y semántica
// HTML correcta (WCAG 1.3.1: un solo <h1> por pantalla).
// ============================================================

function ScreenHeader({ title, subtitle, children }) {
  return (
    <header className="px-4 pt-5 pb-3 border-b border-gray-100/60 shrink-0">
      <h1
        className="text-2xl font-extrabold"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-sm mt-1 font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </header>
  )
}

export default ScreenHeader
