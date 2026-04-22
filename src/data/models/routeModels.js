// ============================================================
// data/models/routeModels.js
// Interfaces/modelos de datos para las rutas de bus
// ============================================================

/**
 * @typedef {Object} BusLine
 * @property {string} id - Identificador único de la línea
 * @property {string} name - Nombre de la línea (ej. "Línea 1 - Terminal")
 * @property {string} color - Color hexadecimal de la línea
 * @property {number[]} coordinates - Array de [lng, lat] que define el recorrido
 * @property {BusStop[]} stops - Paradas principales de la línea
 */

/**
 * @typedef {Object} BusStop
 * @property {string} id - Identificador de la parada
 * @property {string} name - Nombre de la parada
 * @property {number[]} coordinates - Coordenadas [lng, lat] de la parada
 * @property {string[]} lines - IDs de las líneas que pasan por esta parada
 */

/**
 * @typedef {Object} RouteSuggestion
 * @property {string} type - 'direct' | 'transfer'
 * @property {string[]} lineIds - IDs de las líneas sugeridas
 * @property {string} description - Descripción legible de la sugerencia
 * @property {Object} transferPoint - Punto de trasbordo (si aplica)
 */

export {}
