// ============================================================
// core/config/storage.js
// Configuración de localforage para persistencia en IndexedDB
// ============================================================

import localforage from 'localforage'

const store = localforage.createInstance({
  name: 'riobamba-rutas',
  storeName: 'geojson_data',
  description: 'Almacén offline de datos geográficos de rutas',
})

export default store
