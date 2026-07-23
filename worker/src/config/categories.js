/**
 * Fuente única de verdad para las categorías del clasificador IA.
 * Si agregas, quitás o renombrás una categoría, solo toca este archivo.
 * El prompt se genera automáticamente desde aquí.
 */

export const CATEGORIES = [
  {
    value: 'Tarea',
    description: 'Acciones ejecutables inmediatas o pendientes de trabajo.',
    rule: 'extraer due_date si se menciona explícitamente',
  },
  {
    value: 'Idea',
    description: 'Conceptos, hipótesis de negocio, nuevas features o pensamientos creativos.',
    rule: 'título descriptivo',
  },
  {
    value: 'Reunion',
    description: 'Coordinación de reuniones, notas de agenda o llamadas programadas.',
    rule: 'siempre extraer fecha, hora y participantes si están disponibles',
  },
  {
    value: 'Recordatorio',
    description: 'Avisos temporales con fecha/hora específica.',
    rule: 'siempre extraer fecha y hora si están disponibles',
  },
  {
    value: 'Nota',
    description: 'Datos puros, contraseñas, direcciones o información estática.',
    rule: 'título descriptivo, sin acción requerida',
  },
  {
    value: 'Investigar',
    description: 'Enlaces, nombres de software, libros, repositorios o referencias a revisar.',
    rule: 'incluir enlaces o referencias como tags',
  },
  {
    value: 'Llamar',
    description: 'Nombres de personas junto a sus datos de contacto, rol o empresa.',
    rule: 'extraer nombre, teléfono, rol y empresa si se mencionan',
  },
];

export const DEFAULT_CATEGORY = 'Nota';

/**
 * Genera el system prompt completo para el clasificador IA.
 * Se construye dinámicamente desde CATEGORIES para mantener un solo punto de cambio.
 */
export function buildClassifierPrompt() {
  const categoryLines = CATEGORIES
    .map((c, i) => `${i + 1}. "${c.value}": ${c.description}`)
    .join('\n');

  const categoryUnion = CATEGORIES.map(c => `"${c.value}"`).join(' | ');

  const rules = CATEGORIES
    .filter(c => c.rule)
    .map(c => `- Para "${c.value}": ${c.rule}`)
    .join('\n');

  return `Eres un asistente ejecutivo de IA. Tu trabajo es analizar notas de audio/texto del usuario y clasificarlas estrictamente en una de estas categorías:

### CATEGORÍAS PERMITIDAS:
${categoryLines}

Devuelve SIEMPRE un objeto JSON válido. No incluyas texto adicional fuera del JSON.

ESQUEMA DE SALIDA:
{
  "category": ${categoryUnion},
  "title": "Título conciso (máx 8-10 palabras)",
  "summary": "Resumen o cuerpo principal de la nota (1-3 oraciones)",
  "metadata": {
    "due_date": "YYYY-MM-DD" o null,
    "time": "HH:MM" o null,
    "participants": ["Nombre1", "Nombre2"] o [],
    "checklist": ["Paso 1", "Paso 2"] o [],
    "tags": ["Tag1", "Tag2"] o []
  }
}

REGLAS DE CLASIFICACIÓN:
- Si incluye una acción concreta ("hacer", "enviar", "programar", "llamar", "revisar") -> Priorizar "Tarea"
- Si es una acción pero tiene un horario o fecha explícita ("a las 15hs", "mañana a la mañana", "el lunes") -> Priorizar "Recordatorio" o "Reunion"
- Si no encaja con ninguna categoría clara de acción -> Usar "Nota" como fallback por defecto

REGLAS ESPECÍFICAS POR CATEGORÍA:
${rules}

REGLAS GENERALES:
- Los tags deben ser relevantes y consistentes (ej: "trabajo", "personal", "salud", "proyecto-x")
- Si no hay participantes, due_date, etc., devolver null o [] según corresponda`;
}
