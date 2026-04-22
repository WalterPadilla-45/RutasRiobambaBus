// ============================================================
// App.jsx
// Layout raíz: Router + BottomNavigationBar + contenido de pantalla
// Layout raíz: Router + TopNavigationBar + contenido de pantalla
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MapScreen from './presentation/screens/MapScreen'
import LinesScreen from './presentation/screens/LinesScreen'
import WhatBusScreen from './presentation/screens/WhatBusScreen'
import TopNavigationBar from './presentation/components/TopNavigationBar'

function AppLayout() {
  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* WCAG 2.4.1: Skip-link para saltar navegación con teclado */}
      <a href="#main-content" className="skip-link">
        Ir al contenido principal
      </a>

      {/* Barra de navegación superior fija */}
      <TopNavigationBar />

      {/* Área de contenido principal (ocupa todo el espacio menos la barra) */}
      <main id="main-content" className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<MapScreen />} />
          <Route path="/lines" element={<LinesScreen />} />
          <Route path="/what-bus" element={<WhatBusScreen />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
