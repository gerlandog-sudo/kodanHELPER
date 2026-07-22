## Documento Unificado de Especificación &

## Arquitectura

Organizador Inteligente de Ideas, Tareas y Reuniones (Captura Móvil → Panel Desktop)

MVP COMPLETO V1.0

## 1. Visión del Producto y Diagrama de Flujo

El objetivo central es eliminar la fricción de captura en dispositivos móviles. El usuario graba o escribe de forma desestructurada; el backend procesa asíncronamente con IA y enruta el resultado formateado a la computadora en tiempo real.

## Flujo Operativo de Datos (Mobile → Backend/IA → Desktop)

- [App Mobile]: Captura audio o texto → Envía via HTTP POST /ingest sin esperar respuesta de IA → Confirmación visual e instantánea al usuario (< 200ms).

- [Backend Engine]: Recibe ingesta → Si es audio, convierte a texto via Speech-to-Text (Whisper) → Invoca LLM (Gemini 1.5 Flash) con esquema de salida estructurada JSON → Guarda en base de datos.

- [App Desktop]: Suscrita via WebSockets/Realtime → Recibe evento de nuevo ítem procesado → Renderiza la tarjeta en la columna correspondiente (Tarea, Idea o Reunión) con acciones contextuales.

## 2. Stack Tecnológico Unificado (Lean Architecture)

|   | CAPA TECNOLOGÍA ROL EN EL SISTEMA |   |
| --- | --- | --- |
|   | Mobile Client PWA / Capacitor + Vue 3 Desktop Client Vue 3 + Tailwind CSS | Captura ultra-rápida, acceso a micrófono nativo y funcionamiento offline básico. Panel de control reactivo con Kanban (Tareas), Muro (Ideas) y Vista Calendario (Reuniones). |
|   | Backend & DB Node.js / Supabase | PostgreSQL DB, Storage de Audio, Autenticación y Servidor |
|   | IA Pipeline Whisper API + Gemini 1.5 Flash | WebSockets Realtime. Transcripción de voz a texto y motor de clasificación/ estructuración JSON. |

## 3. Esquema de Base de Datos (PostgreSQL SQL)

```
-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Tabla de Capturas Brutas (Inmutable)
CREATE TABLE raw_inputs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID NOT NULL,
type VARCHAR(10) NOT NULL CHECK (type IN ('audio', 'text')),
content_url_or_text TEXT NOT NULL,
status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed',
'failed')),
created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tabla de Entidades Procesadas por IA
CREATE TABLE items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
raw_input_id UUID REFERENCES raw_inputs(id) ON DELETE CASCADE,
user_id UUID NOT NULL,
category VARCHAR(20) NOT NULL CHECK (category IN ('TASK', 'IDEA', 'MEETING', 'UNCATEGORIZED')),
title VARCHAR(255) NOT NULL,
description TEXT,
metadata JSONB DEFAULT '{}'::jsonb,
status VARCHAR(20) NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'actioned', 'archived')),
```


created_at TIMESTAMPTZ DEFAULT NOW()

);

-- Habilitar suscripción en tiempo real ALTER PUBLICATION supabase_realtime ADD TABLE items;

## 4. Prompt para el Motor de IA (Structured JSON Output)

```
SYSTEM: Eres un asistente ejecutivo de IA. Tu trabajo es analizar transacciones de audio/texto del usuario y clasificarlas estrictamente en formato JSON.
CATEGORÍAS PERMITIDAS:
1. TASK: Requiere una acción concreta a realizar.
2. IDEA: Un concepto, reflexión, pensamiento creativo o proyecto futuro.
3. MEETING: Mención de una reunión, llamada, cita o evento con fecha/hora o personas.
ESQUEMA DE SALIDA (JSON):
{
"category": "TASK" | "IDEA" | "MEETING",
"title": "Título conciso (máx 8 palabras)",
"summary": "Resumen o cuerpo principal de la nota",
"metadata": {
"due_date": "YYYY-MM-DD" (o null),
"time": "HH:MM" (o null),
"participants": ["Nombre"],
"checklist": ["Paso 1", "Paso 2"],
"tags": ["Tag1", "Tag2"]
}
}
```

## 5. Pasos de Implementación para el Desarrollador / IA Generator

| PASO | MÓDULO | TAREA CONCRETA |
| --- | --- | --- |
| Paso 1 | Setup & Database | Inicializar proyecto Vue 3 + Tailwind + Supabase. Ejecutar el script |
|   |   | SQL de la Sección 3. |
| Paso 2 | Ingesta Móvil | Crear componente de grabación de audio (MediaRecorder API) y |
|   |   | endpoint `POST /api/ingest`. |
| Paso 3 | Pipeline de IA | Implementar integración con Whisper API + Gemini 1.5 Flash con |
|   |   | Structured Output y guardado en `items`. |
| Paso 4 | Panel Desktop | Suscripción Supabase Realtime + Tablero de 3 columnas (Kanban |
|   |   | Tareas, Grid Ideas, Agendables Reuniones). |

Especificación de Producto Unificada — MVP Organizador de Tareas e Ideas con IA
