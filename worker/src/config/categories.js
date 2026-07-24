/**
 * Fuente única de verdad para las categorías del clasificador IA.
 * Si agregas, quitás o renombrás una categoría, solo toca este archivo.
 * El prompt se genera automáticamente desde aquí.
 */

export const CATEGORIES = [
  {
    value: 'Tarea',
    description: 'Acciones ejecutables inmediatas o pendientes de trabajo.',
    rule: 'extraer: priority (high/medium/low), deadline (YYYY-MM-DD o null)',
    metadataSchema: {
      priority: 'high | medium | low',
      deadline: 'YYYY-MM-DD | null',
    },
  },
  {
    value: 'Idea',
    description: 'Conceptos, proyectos o hallazgos creativos.',
    rule: 'extraer: area (proyecto/área), next_steps (acción inicial)',
    metadataSchema: {
      area: 'string',
      next_steps: 'string',
    },
  },
  {
    value: 'Reunion',
    description: 'Coordinación, agendamiento y minutas.',
    rule: 'extraer: participants (array), proposed_date (YYYY-MM-DDTHH:MM:SSZ)',
    metadataSchema: {
      participants: ['string'],
      proposed_date: 'ISO8601 | null',
    },
  },
  {
    value: 'Recordatorio',
    description: 'Avisos o alertas en momentos puntuales.',
    rule: 'extraer: description, alert_at (ISO8601), recurrence (once/daily/weekly)',
    metadataSchema: {
      description: 'string',
      alert_at: 'ISO8601',
      recurrence: 'once | daily | weekly',
    },
  },
  {
    value: 'Nota',
    description: 'Información pasiva, apuntes o referencias.',
    rule: 'extraer: body (detalle), tags (array de palabras clave)',
    metadataSchema: {
      body: 'string',
      tags: ['string'],
    },
  },
  {
    value: 'Investigar',
    description: 'Dudas, temas a consultar o bookmarks.',
    rule: 'extraer: source_url, success_criteria (respuesta buscada)',
    metadataSchema: {
      source_url: 'string | null',
      success_criteria: 'string',
    },
  },
  {
    value: 'Llamar',
    description: 'Contactos pendientes de comunicación.',
    rule: 'extraer: contact_name, phone, objective, deadline',
    metadataSchema: {
      contact_name: 'string',
      phone: 'string',
      objective: 'string',
      deadline: 'YYYY-MM-DD | null',
    },
  },
  {
    value: 'Email',
    description: 'Redacción y envío de correos electrónicos.',
    rule: 'extraer: recipient, subject, body',
    metadataSchema: {
      recipient: 'string',
      subject: 'string',
      body: 'string',
    },
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

  const metadataSchemas = CATEGORIES
    .filter(c => c.metadataSchema)
    .map(c => {
      const fields = Object.entries(c.metadataSchema)
        .map(([key, type]) => `      "${key}": ${type}`)
        .join(',\n');
      return `  - "${c.value}":\n{\n${fields}\n  }`;
    })
    .join('\n\n');

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
    // Campos específicos según la categoría (ver METADATA POR CATEGORÍA)
  }
}

REGLAS DE CLASIFICACIÓN:
- Si incluye una acción concreta ("hacer", "enviar", "programar", "llamar", "revisar") -> Priorizar "Tarea"
- Si es una acción pero tiene un horario o fecha explícita ("a las 15hs", "mañana a la mañana", "el lunes") -> Priorizar "Recordatorio" o "Reunion"
- Si menciona un correo electrónico o redacción de mensaje -> Priorizar "Email"
- Si no encaja con ninguna categoría clara de acción -> Usar "Nota" como fallback por defecto

REGLAS ESPECÍFICAS POR CATEGORÍA:
${rules}

METADATA REQUERIDA POR CATEGORÍA (incluir SOLO los campos de la categoría asignada):
${metadataSchemas}

REGLAS GENERALES:
- Los tags deben ser relevantes y consistentes (ej: "trabajo", "personal", "salud", "proyecto-x")
- Si no hay datos para un campo, devolver null o [] según corresponda
- Extraer la mayor cantidad de información estructurada posible según el schema de cada categoría`;
}
