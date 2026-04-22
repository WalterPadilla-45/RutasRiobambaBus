// ============================================================
// core/config/leaflet.js
// Fix para los iconos por defecto de Leaflet que se rompen
// en bundlers como Vite porque las URLs de las imágenes
// no se resuelven correctamente.
// ============================================================

import L from 'leaflet'

// Solución al bug de iconos rotos en Vite/Webpack
// https://github.com/PaulLeCam/react-leaflet/issues/453
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default L
