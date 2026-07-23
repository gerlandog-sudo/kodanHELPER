/**
 * Fuente única de verdad para categorías - Desktop.
 * Define los valores, colores y labels que usan stores, filtros y componentes.
 */

export const CATEGORIES = [
  { value: 'Tarea',       label: 'Tarea',       color: 'var(--primary)' },
  { value: 'Idea',        label: 'Idea',        color: 'var(--secondary)' },
  { value: 'Reunion',     label: 'Reunión',     color: 'var(--tertiary)' },
  { value: 'Recordatorio',label: 'Recordatorio',color: 'var(--error)' },
  { value: 'Nota',        label: 'Nota',        color: 'var(--on-surface-variant)' },
  { value: 'Investigar',  label: 'Investigar',  color: '#9b59b6' },
  { value: 'Llamar',      label: 'Llamar',      color: '#e67e22' },
];

/** Categoría por defecto cuando la IA no puede clasificar */
export const DEFAULT_CATEGORY = 'Nota';

/** Obtiene el color de una categoría por su value */
export function getCategoryColor(value) {
  return CATEGORIES.find(c => c.value === value)?.color || 'var(--on-surface-variant)';
}

/** Obtiene el label de una categoría por su value */
export function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}
