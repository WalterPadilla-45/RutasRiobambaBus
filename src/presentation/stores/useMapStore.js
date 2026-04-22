// ============================================================
// presentation/stores/useMapStore.js
// Store global de Zustand para el estado del mapa y las rutas
// ============================================================

import { create } from 'zustand'

const useMapStore = create((set, get) => ({
  // Datos de rutas
  routesGeoJSON: null,
  stopsJSON: null,

  // Rutas visibles en el mapa
  visibleRoutes: [], // Array de IDs de líneas visibles

  // Línea seleccionada
  selectedLine: null,

  // Ubicación del usuario
  userLocation: null,
  locationError: null,
  isLocating: false,

  // Puntos de búsqueda (¿Qué bus tomo?)
  originPoint: null,
  destinationPoint: null,

  // Resultados de sugerencias
  suggestedRoutes: [],

  // Modo de selección de punto en el mapa
  selectingPoint: null, // null | 'origin' | 'destination'

  // ---- Acciones ----

  setRoutesGeoJSON: (data) => set({ routesGeoJSON: data }),
  setStopsJSON: (data) => set({ stopsJSON: data }),

  setVisibleRoutes: (routeIds) => set({ visibleRoutes: routeIds }),

  toggleRouteVisibility: (routeId) => {
    const current = get().visibleRoutes
    if (current.includes(routeId)) {
      set({ visibleRoutes: current.filter((id) => id !== routeId) })
    } else {
      set({ visibleRoutes: [...current, routeId] })
    }
  },

  selectLine: (lineId) => {
    const current = get().selectedLine
    if (current === lineId) {
      set({ selectedLine: null, visibleRoutes: [] })
    } else {
      set({ selectedLine: lineId, visibleRoutes: [lineId] })
    }
  },

  setUserLocation: (location) => set({ userLocation: location, locationError: null, isLocating: false }),
  setLocationError: (error) => set({ locationError: error, isLocating: false }),
  setIsLocating: (val) => set({ isLocating: val }),

  setOriginPoint: (point) => set({
    originPoint: point,
    selectingPoint: null, // Terminar modo selección
  }),
  setDestinationPoint: (point) => set({
    destinationPoint: point,
    selectingPoint: null, // Terminar modo selección
  }),

  setSuggestedRoutes: (routes) => set({ suggestedRoutes: routes }),

  // Activar modo de selección de punto en el mapa
  setSelectingPoint: (type) => set({ selectingPoint: type }),

  // Limpiar toda la búsqueda
  clearSearch: () =>
    set({
      originPoint: null,
      destinationPoint: null,
      suggestedRoutes: [],
      selectingPoint: null,
    }),

  // Manejar clic en el mapa cuando estamos en modo selección de punto
  handleMapClickForSearch: (latlng) => {
    const { selectingPoint } = get()
    if (!selectingPoint) return false

    const point = { lat: latlng.lat, lng: latlng.lng }

    if (selectingPoint === 'origin') {
      set({ originPoint: point, selectingPoint: null })
    } else if (selectingPoint === 'destination') {
      set({ destinationPoint: point, selectingPoint: null })
    }

    return true // Indica que el clic fue manejado
  },
}))

export default useMapStore
