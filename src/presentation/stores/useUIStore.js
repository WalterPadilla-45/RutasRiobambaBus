// ============================================================
// presentation/stores/useUIStore.js
// Store de Zustand para el estado de la interfaz de usuario.
//
// MEJORADO: Estado de undo para puntos eliminados (H3 Nielsen),
// snackbar state para feedback visual.
// ============================================================

import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  // Vista activa (mapea a las rutas: 'map', 'lines', 'whatbus')
  activeView: 'map',

  // Bottom Sheet
  isBottomSheetOpen: false,
  bottomSheetData: null,

  // H3 Nielsen: Undo — último punto eliminado
  lastDeletedPoint: null, // { type: 'origin'|'destination', point: {lat, lng} }
  undoTimeout: null,

  // Snackbar para feedback visual
  snackbar: null, // { message: string, action?: string }

  // ---- Acciones ----

  setActiveView: (view) => set({ activeView: view }),

  openBottomSheet: (data) => set({ isBottomSheetOpen: true, bottomSheetData: data }),
  closeBottomSheet: () => set({ isBottomSheetOpen: false, bottomSheetData: null }),

  // H3 Nielsen: Guardar punto eliminado para posible undo
  setLastDeletedPoint: (type, point) => {
    // Limpiar timeout anterior
    const prevTimeout = get().undoTimeout
    if (prevTimeout) clearTimeout(prevTimeout)

    // Auto-limpiar después de 5 segundos
    const timeout = setTimeout(() => {
      set({ lastDeletedPoint: null, snackbar: null, undoTimeout: null })
    }, 5000)

    set({
      lastDeletedPoint: { type, point },
      undoTimeout: timeout,
      snackbar: {
        message: `Punto de ${type === 'origin' ? 'origen' : 'destino'} eliminado`,
        action: 'Deshacer',
      },
    })
  },

  clearLastDeletedPoint: () => {
    const prevTimeout = get().undoTimeout
    if (prevTimeout) clearTimeout(prevTimeout)
    set({ lastDeletedPoint: null, snackbar: null, undoTimeout: null })
  },

  dismissSnackbar: () => set({ snackbar: null }),
}))

export default useUIStore
