// ============================================================
// core/constants/routes.js
// Constantes globales de la aplicación: líneas de bus, colores, etc.
// ============================================================

export const APP_NAME = 'Riobamba Rutas'

export const MAP_CONFIG = {
  CENTER: [-1.67, -78.65], // Riobamba, Ecuador
  DEFAULT_ZOOM: 14,
  MIN_ZOOM: 12,
  MAX_ZOOM: 19,
}

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export const ROUTE_COLORS = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9a6324', '#fffac8', '#800000',
  '#aaffc3', '#808000',
]

export const ROUTE_LINE_WEIGHT = 4

export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
}

export const BUFFER_RADIUS_METERS = 300

// ============================================================
// Datos mock de las 17 líneas de transporte de Riobamba
// (Se reemplazarán por datos reales del GeoJSON en Fase 4)
// ============================================================

export const BUS_LINES = [
  { id: 'L01', name: 'Línea 1 — Terminal Norte / Centro', color: ROUTE_COLORS[0] },
  { id: 'L02', name: 'Línea 2 — Terminal Sur / Centro', color: ROUTE_COLORS[1] },
  { id: 'L03', name: 'Línea 3 — Terminal Oriente / Centro', color: ROUTE_COLORS[2] },
  { id: 'L04', name: 'Línea 4 — Terminal Occidente / Centro', color: ROUTE_COLORS[3] },
  { id: 'L05', name: 'Línea 5 — Básica / Universidad', color: ROUTE_COLORS[4] },
  { id: 'L06', name: 'Línea 6 — La Dolorosa / Centro', color: ROUTE_COLORS[5] },
  { id: 'L07', name: 'Línea 7 — Bellavista / Terminal', color: ROUTE_COLORS[6] },
  { id: 'L08', name: 'Línea 8 — Licán / Centro', color: ROUTE_COLORS[7] },
  { id: 'L09', name: 'Línea 9 — Quimiag / Centro', color: ROUTE_COLORS[8] },
  { id: 'L10', name: 'Línea 10 — San Luis / Centro', color: ROUTE_COLORS[9] },
  { id: 'L11', name: 'Línea 11 — San Francisco / Terminal', color: ROUTE_COLORS[10] },
  { id: 'L12', name: 'Línea 12 — Yaruquíes / Centro', color: ROUTE_COLORS[11] },
  { id: 'L13', name: 'Línea 13 — Flores / Universidad', color: ROUTE_COLORS[12] },
  { id: 'L14', name: 'Línea 14 — Guaslán / Centro', color: ROUTE_COLORS[13] },
  { id: 'L15', name: 'Línea 15 — Calpi / Centro', color: ROUTE_COLORS[14] },
  { id: 'L16', name: 'Línea 16 — Punín / Terminal', color: ROUTE_COLORS[15] },
  { id: 'L17', name: 'Línea 17 — Cubijíes / Centro', color: ROUTE_COLORS[16] },
]
