# kodanHELPER - Documento de Comprensión Profunda

**Fecha**: 24 de julio de 2026  
**Versión**: 1.0  
**Propósito**: Referencia técnica completa del proyecto para evitar re-análisis en cada sesión

---

## 1. Arquitectura General

### Monorepo con 4 subproyectos independientes

```
kodanHELPER/
├── api/              # Backend REST API (Express, Node.js ESM)
├── desktop/          # App Desktop (Vue 3 SPA + Tailwind v4)
├── mobile/           # App Mobile (Vue 3 + Capacitor + PWA + Tailwind v4)
├── worker/           # Worker IA (Node.js, procesamiento asíncrono)
├── DOCS/             # Documentación técnica y de diseño
├── scripts/          # Scripts de setup/migración DB
└── docker-compose.prod.yml
```

**No usa workspaces de npm**. Cada subproyecto tiene su propio `package.json` y se despliega como contenedor Docker independiente.

---

## 2. Stack Tecnológico

### Frontend (Desktop & Mobile)
- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Bundler**: Vite 5.4
- **CSS**: Tailwind CSS v4
- **Estado**: Pinia 2.2
- **Router**: Vue Router 4.4
- **Backend-as-a-Service**: Supabase (Auth, DB, Realtime, Storage)
- **Utilidades**: date-fns 3.6

### Backend API
- **Framework**: Express 4.21
- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Middleware**: helmet, cors, express.json (50mb limit), pino (logging)
- **Cliente DB**: @supabase/supabase-js 2.45

### Worker IA
- **Runtime**: Node.js (ESM)
- **Cliente DB**: @supabase/supabase-js 2.45
- **Modelo IA**: NVIDIA Llama 3.1 8B (via OpenAI-compatible API)
- **Logging**: pino + pino-pretty

### Infraestructura
- **Docker**: 4 servicios en red externa `kodan_net`
  - `helper-front` (desktop, puerto 80)
  - `helper-api` (API REST, puerto 3000)
  - `helper-mobile` (PWA, puerto 80)
  - `helper-worker` (sin puerto expuesto)
- **Dominios**:
  - Desktop: `helper.kodan.software`
  - Mobile: `mhelper.kodan.software`
  - API: `helper-api.kodan.software`

---

## 3. Base de Datos (Supabase / PostgreSQL)

### URL del proyecto
`https://pozzbfpwxpgeflldfnmb.supabase.co`

### Tabla: `raw_inputs` (Capturas brutas)

| Columna | Tipo | Detalles |
|---------|------|----------|
| `id` | UUID PK | `uuid_generate_v4()` |
| `user_id` | UUID NOT NULL | References `auth.users(id)` |
| `type` | VARCHAR(10) | CHECK `IN ('audio', 'text')` |
| `content_url` | TEXT | URL del audio en Storage (si type=audio) |
| `content_text` | TEXT | Texto directo (si type=text) |
| `status` | VARCHAR(20) | CHECK `IN ('pending', 'processing', 'processed', 'failed')` |
| `error_message` | TEXT | Mensaje de error si failed |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

**Índices**: `idx_raw_inputs_user_id`, `idx_raw_inputs_status`

**RLS**: Policy `users_see_own_raw_inputs` — usuarios ven solo sus filas

**Realtime**: Habilitado (publicación `supabase_realtime`)

### Tabla: `items` (Entidades procesadas por IA)

| Columna | Tipo | Detalles |
|---------|------|----------|
| `id` | UUID PK | `uuid_generate_v4()` |
| `raw_input_id` | UUID FK | References `raw_inputs(id)` ON DELETE CASCADE |
| `user_id` | UUID NOT NULL | References `auth.users(id)` |
| `category` | VARCHAR(20) NOT NULL | CHECK `IN ('Tarea', 'Idea', 'Reunion', 'Recordatorio', 'Nota', 'Investigar', 'Llamar')` |
| `title` | VARCHAR(255) NOT NULL | Título generado por IA |
| `summary` | TEXT | Resumen generado por IA |
| `metadata` | JSONB | `{due_date, time, participants, checklist, tags}` |
| `status` | VARCHAR(20) | CHECK `IN ('inbox', 'actioned', 'archived')` |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` |

**Índices**: `idx_items_user_id`, `idx_items_category`, `idx_items_status`, `idx_items_created_at`

**RLS**: Policy `users_see_own_items` — usuarios ven solo sus filas

**Realtime**: Habilitado (publicación `supabase_realtime`)

### Storage

- **Bucket `captures`**: Para fotos capturadas desde mobile
- **Bucket `audio-uploads`**: Ya no usado activamente (el audio se procesa via SpeechRecognition del browser)

---

## 4. Categorías del Sistema

**7 categorías actuales** definidas en `config/categories.js` (desktop, mobile, worker):

| Valor | Label | Color | Propósito |
|-------|-------|-------|-----------|
| `Tarea` | Tarea | `var(--primary)` | Acciones ejecutables |
| `Idea` | Idea | `var(--secondary)` | Conceptos, pensamientos creativos |
| `Reunion` | Reunión | `var(--tertiary)` | Coordinación de reuniones |
| `Recordatorio` | Recordatorio | `var(--error)` | Avisos temporales |
| `Nota` | Nota | `var(--on-surface-variant)` | Información estática (DEFAULT) |
| `Investigar` | Investigar | `#9b59b6` | Enlaces/referencias a revisar |
| `Llamar` | Llamar | `#e67e22` | Contactos a llamar |

**Categoría por defecto**: `Nota`

---

## 5. Componentes UX (Frontend)

### Desktop (`desktop/src/components/`)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `ItemCard.vue` | 42 líneas | Tarjeta genérica de item (categoría, fecha, título, summary, tags) |
| `CategoryBoard.vue` | 29 líneas | Board de una categoría (título, contador, layout list/grid) |
| `KanbanBoard.vue` | 17 líneas | Vista de tareas (wrapper simple de ItemCard) |
| `IdeaWall.vue` | - | Grid de ideas (wrapper simple de ItemCard) |
| `MeetingCalendar.vue` | - | Lista de reuniones (wrapper simple de ItemCard) |

### Mobile (`mobile/src/components/`)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `ItemCard.vue` | 48 líneas | Tarjeta con icono de categoría, badge, fecha, título, summary |
| `AudioRecorder.vue` | 173 líneas | Grabación de audio con **SpeechRecognition** (Web API), live transcript, botón enviar |
| `QuickTextInput.vue` | 93 líneas | Input de texto rápido + selector de categoría + botón capturar |
| `PhotoCapture.vue` | - | Captura de foto (input file + preview + upload a Supabase Storage) |
| `FeedbackToast.vue` | 36 líneas | Toast de feedback (success/error) con animación |

**No existe librería de componentes externa** (como Vuetify, Quasar, etc.). Todo es hecho a medida con Tailwind CSS y variables CSS.

---

## 6. Estado Global (Pinia Stores)

### Desktop (`desktop/src/stores/items.js`)

```javascript
export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed por categoría (generado dinámicamente desde CATEGORIES)
  const byCategory = {
    tarea: computed(() => items.value.filter(i => i.category === 'Tarea')),
    idea: computed(() => items.value.filter(i => i.category === 'Idea')),
    // ... etc
  };

  // Alias semánticos
  const tasks = byCategory.tarea;
  const ideas = byCategory.idea;
  const meetings = byCategory.reunion;
  const reminders = byCategory.recordatorio;
  const notes = byCategory.nota;
  const toResearch = byCategory.investigar;
  const toCall = byCategory.llamar;

  // Counts
  const totalCount = computed(() => items.value.length);
  const inboxCount = computed(() => items.value.filter(i => i.status === 'inbox').length);

  // Methods
  async function loadItems() { /* ... */ }
  function startRealtime() { /* ... */ }
  function stopRealtime() { /* ... */ }

  return { items, loading, error, ...byCategory, tasks, ideas, meetings, reminders, notes, toResearch, toCall, totalCount, inboxCount, loadItems, startRealtime, stopRealtime };
});
```

### Mobile (`mobile/src/stores/items.js`)

Similar al desktop, pero agrega:
- `filter` ref (para filtrar por categoría)
- `filteredItems` computed (items filtrados según `filter`)
- `setFilter(value)` method

---

## 7. Comunicación Frontend-Backend

### Flujo de captura (Mobile → API → Worker → DB)

```
[Mobile CaptureView]
     │
     ├─ Audio: AudioRecorder.vue (SpeechRecognition API)
     │        → texto transcrito
     │        → ingestTranscribedText(text) → INSERT en raw_inputs (vía Supabase JS)
     │        → pollStatus(id) (cada 5s hasta que raw_inputs.status = 'processed')
     │
     ├─ Texto: QuickTextInput.vue
     │        → createItem() directo a Supabase (rápido, sin IA)
     │        → ingestText() via API REST (no bloqueante, para procesamiento IA adicional)
     │
     └─ Foto: PhotoCapture.vue
              → Upload a Supabase Storage
              → createItem() con metadata.photo URL
```

### Flujo de procesamiento (Worker IA)

```
[Worker IA] detecta raw_input nuevo (status=pending) vía Supabase Realtime
    → Procesa con NVIDIA Llama 3.1 8B
    → INSERT en items (con categoría, título, resumen, metadata)
    → UPDATE raw_inputs.status = 'processed'
```

### Comunicación en tiempo real (Realtime)

```
[Desktop/Mobile] suscritos a cambios en items vía Supabase Realtime
    → Callback 'insert' → agrega item al store
    → Callback 'update' → actualiza item en store
```

### Canales de comunicación

1. **Supabase JS SDK** (lectura/escritura directa a DB desde el frontend)
2. **Supabase Realtime** (suscripciones a cambios en `items` y `raw_inputs`)
3. **API REST** (`POST /api/ingest` para procesamiento IA vía Worker)
4. **Supabase Storage** (para fotos y audios)

---

## 8. Rutas y Navegación

### Desktop

```
/login          → LoginView       (sin auth)
/dashboard      → DashboardView   (require auth) → boards de categorías
/inbox          → InboxView       (require auth) → lista plana de items
/settings       → SettingsView    (require auth) → tema, cuenta, tipografía
/               → redirect a /dashboard
```

**Layout**: Sidebar izquierdo (solo visible con sesión) con indicador de ruta activa animado.

### Mobile

```
/login          → LoginView       (sin auth)
/home           → HomeView        (require auth) → inbox con filtros por categoría
/capture        → CaptureView     (require auth) → tabs Audio/Texto
/settings       → SettingsView    (require auth) → tema, cuenta, actividad reciente
/               → redirect a /home
```

**Layout**: Bottom navigation bar con 3 íconos: Inbox, Capture (botón central elevado con +), Ajustes.

---

## 9. Autenticación

- **Provider**: Supabase Auth
- **Métodos soportados**:
  - Google OAuth (`signInWithOAuth`)
  - Email + Password (`signInWithPassword`)
  - Registro por email (`signUpWithEmail`)
  - Magic Link / OTP (`signInWithOtp`)
- **Guard de rutas**: `router.beforeEach` verifica `supabase.auth.getSession()`. Si `requiresAuth` y no hay sesión, redirige a `/login`.
- **Persistencia**: Sesión en localStorage con auto-refresh de token.
- **API**: Las requests a `POST /api/ingest` llevan `Authorization: Bearer <access_token>`. El middleware verifica con `supabase.auth.getUser(token)`.

---

## 10. Variables de Entorno

### API (`api/.env`)
- `PORT` (default 3000)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `CORS_ORIGIN`

### Worker (`worker/.env`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `NVIDIA_API_KEY` (o `GEMINI_API_KEY`)
- `OPENAI_API_KEY`

### Desktop/Mobile (`.env.local`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (solo mobile, `https://helper-api.kodan.software`)

---

## 11. Worker IA: Clasificador

### System Prompt (`worker/src/prompts/classifier.js`)

Generado dinámicamente desde `worker/src/config/categories.js`:

```javascript
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
  // ... etc
];

export function buildClassifierPrompt() {
  // Genera el prompt completo con las 7 categorías
  // Instruye a la IA a devolver JSON con: category, title, summary, metadata
}
```

### Procesador (`worker/src/services/processor.js`)

```javascript
export async function processRawInput(supabase, record) {
  const { id, content_text, user_id } = record;
  
  // 1. Clasificar con NVIDIA Llama 3.1 8B
  const classification = await classifyText(text, nvidiaApiKey);
  
  // 2. Insertar en items
  await supabase.from('items').insert({
    raw_input_id: id,
    user_id,
    category: classification.category || 'Nota',
    title: classification.title || 'Untitled',
    summary: classification.summary || text.substring(0, 500),
    metadata: classification.metadata || {},
    status: 'inbox',
  });
  
  // 3. Marcar raw_input como processed
  await supabase.from('raw_inputs').update({ status: 'processed' }).eq('id', id);
}
```

---

## 12. Diseño Visual: "Luminous Intelligence"

### Tema oscuro y claro completo con variables CSS

**Tipografía**:
- Headline: Sora
- Body: Inter
- Mono: Geist

**Paleta**: Violeta/índigo con acentos luminosos

**Utilidades CSS**:
- `glass`, `glass-elevated`, `glass-card`, `glass-input` (glassmorphism)
- `btn-primary`, `btn-secondary`, `btn-ghost`
- `chip`, `hover-lift`, `shimmer`, `stagger-enter`
- `pulse-dot`, `animate-in`, `page-enter`, `page-leave`

---

## 13. Features Implementadas

- [x] **Autenticación completa**: Google OAuth, email/password, Magic Links
- [x] **Captura móvil por voz**: SpeechRecognition con transcript en vivo
- [x] **Captura móvil por texto**: Input rápido con selector de categoría
- [x] **Captura de fotos**: Upload a Supabase Storage
- [x] **Clasificación por IA**: NVIDIA Llama 3.1 8B
- [x] **Dashboard desktop**: Boards por categoría
- [x] **Inbox desktop**: Lista completa de items
- [x] **Realtime**: Suscripción a cambios en `items`
- [x] **Tema oscuro/claro**: Sistema completo con persistencia
- [x] **PWA**: Instalable, offline caching, service worker

---

## 14. Features Pendientes (Documentadas)

- [ ] Desktop nativo (Tauri)
- [ ] Offline-first (RxDB/PouchDB)
- [ ] Búsqueda semántica (pgvector)
- [ ] Cola de procesamiento (BullMQ + Redis)
- [ ] WebSockets para progreso de transcripción
- [ ] Drag & drop en Kanban
- [ ] Edición de items
- [ ] Sistema de notificaciones toast
- [ ] Modal de confirmación para cambios de categoría
- [ ] Gestos en mobile (long press, swipe)

---

## 15. Archivos Clave (Rutas Absolutas)

### Configuración
- `C:\Proyectos_Antigravity\kodanHELPER\package.json`
- `C:\Proyectos_Antigravity\kodanHELPER\api\package.json`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\package.json`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\package.json`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\package.json`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\vite.config.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\vite.config.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\capacitor.config.js`
- `C:\Proyectos_Antigravity\kodanHELPER\api\src\config.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\config\categories.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\config\categories.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\src\config\categories.js`
- `C:\Proyectos_Antigravity\kodanHELPER\docker-compose.prod.yml`
- `C:\Proyectos_Antigravity\kodanHELPER\.gitignore`

### Backend API
- `C:\Proyectos_Antigravity\kodanHELPER\api\src\index.js`
- `C:\Proyectos_Antigravity\kodanHELPER\api\src\routes\ingest.js`
- `C:\Proyectos_Antigravity\kodanHELPER\api\src\middleware\auth.js`
- `C:\Proyectos_Antigravity\kodanHELPER\api\src\services\supabase.js`

### Worker IA
- `C:\Proyectos_Antigravity\kodanHELPER\worker\src\index.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\src\services\processor.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\src\services\nvidia.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\src\prompts\classifier.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\tests\classifier.test.js`
- `C:\Proyectos_Antigravity\kodanHELPER\worker\scripts\migrate-categories.js`

### Frontend Desktop
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\main.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\App.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\style.css`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\services\auth.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\services\api.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\services\realtime.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\stores\items.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\stores\theme.js`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\views\LoginView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\views\DashboardView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\views\InboxView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\views\SettingsView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\components\ItemCard.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\components\CategoryBoard.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\components\KanbanBoard.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\components\IdeaWall.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\desktop\src\components\MeetingCalendar.vue`

### Frontend Mobile
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\main.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\App.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\style.css`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\services\auth.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\services\api.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\services\realtime.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\stores\items.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\stores\theme.js`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\views\LoginView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\views\HomeView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\views\CaptureView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\views\SettingsView.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\components\AudioRecorder.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\components\QuickTextInput.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\components\PhotoCapture.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\components\FeedbackToast.vue`
- `C:\Proyectos_Antigravity\kodanHELPER\mobile\src\components\ItemCard.vue`

### Documentación
- `C:\Proyectos_Antigravity\kodanHELPER\DOCS\decisiones-arquitectura.md`
- `C:\Proyectos_Antigravity\kodanHELPER\DOCS\credenciales.md`
- `C:\Proyectos_Antigravity\kodanHELPER\DOCS\DESIGN Dark.md`
- `C:\Proyectos_Antigravity\kodanHELPER\DOCS\DESIGN Light.md`
- `C:\Proyectos_Antigravity\kodanHELPER\DOCS\Documento_Unificado_Organizador_IA.md`
- `C:\Proyectos_Antigravity\kodanHELPER\scripts\setup-supabase.mjs`

---

## 16. UX Core (kodanAPPS) - Componentes Disponibles

**Ubicación**: `C:\Proyectos_Antigravity\kodanAPPS\packages\ui-core\src\components`

**Stack**: React 19 + TypeScript + Tailwind CSS v4 + @dnd-kit/core + sonner

### Componentes clave para adaptar

| Componente React | Archivo | Propósito | Adaptación Vue 3 |
|-----------------|---------|-----------|------------------|
| `Toaster.tsx` | 16 líneas | Wrapper de sonner | Crear `AppToast.vue` usando `sonner/vue` |
| `KanbanBoard.tsx` | 138 líneas | Tablero Kanban con drag & drop | NO reutilizable (React). Crear desde cero con `vue-draggable-plus` |
| `KanbanColumn.tsx` | 72 líneas | Columna droppable | NO reutilizable. Crear desde cero |
| `useKanbanDrag.ts` | 86 líneas | Hook de lógica drag & drop | NO reutilizable. Usar lógica de `vue-draggable-plus` |
| `EntityCard.tsx` | 319 líneas | Tarjeta de entidad rica | Adaptar concepto a `ItemCard.vue` mejorado |

### Toaster (sonner)

**React (UX Core)**:
```tsx
import { Toaster as SonnerToaster } from 'sonner'
export function Toaster() {
  return <SonnerToaster richColors position="top-right" />
}
```

**Vue 3 (adaptación)**:
```vue
<script setup>
import { Toaster } from 'sonner/vue'
</script>
<template>
  <Toaster richColors position="top-right" />
</template>
```

**Uso**:
```javascript
import { toast } from 'sonner/vue'
toast.success('Elemento clasificado como Tarea')
toast.error('Error al procesar')
toast('Captura recibida...', { duration: 2000 })
```

### KanbanBoard (dnd-kit) → vue-draggable-plus

**Arquitectura propuesta**:
```
KanbanBoard.vue (contenedor)
├── KanbanColumn.vue (droppable zone)
│   ├── ItemCard.vue (draggable card)
│   └── ItemCard.vue
├── KanbanColumn.vue
│   └── ...
└── ConfirmModal.vue (confirmación al soltar)
```

**Flujo Drag & Drop con confirmación**:
1. Usuario arrastra ItemCard de Columna A a Columna B
2. `onDrop` captura el evento (itemId, fromStage, toStage)
3. Se abre `ConfirmModal.vue` mostrando:
   - "¿Mover a [Categoría Destino]?"
   - Editor de metadata JSONB (opcional)
   - Botones: Confirmar / Cancelar
4. Si confirma → `PATCH /items/:id` con nueva categoría + metadata
5. Si cancela → item vuelve a su columna original

### EntityCard → ItemCard mejorado

**Estructura visual propuesta**:
```
┌──────────────────────────────┐
│ [Badge Categoría]    [Fecha] │
│ Título del elemento          │
│ Resumen/descripción          │
│ [Tag1] [Tag2] [Tag3]        │
│                              │
│ [Acciones: Editar, Eliminar] │
└──────────────────────────────┘
```

**Props adicionales**:
- `item`: Objeto item completo
- `editable`: Boolean (mostrar acciones de edición)
- `draggable`: Boolean (habilitar drag)
- `onEdit`: Callback
- `onDelete`: Callback

---

## 17. Decisiones de Implementación (Confirmadas)

### Categoría Email
✅ **Agregar Email como 8va categoría**
- Agregar al enum de DB (VARCHAR CHECK)
- Agregar a `CATEGORIES` en desktop, mobile, worker
- Agregar al prompt del clasificador IA

### Esquema de DB
✅ **Mantener estructura actual, solo agregar lo faltante**
- No migrar a enums (mantener VARCHAR)
- Agregar columna `email` si es necesario
- Mantener status actuales (`inbox`, `actioned`, `archived`)

### Flujo de texto en mobile
✅ **Solo pasar por IA si no se selecciona categoría manual**
- Si el usuario elige categoría → crear item directo a Supabase
- Si no elige categoría → enviar a `raw_inputs` para procesamiento IA

### Librería Drag & Drop
✅ **Usar `vue-draggable-plus`**
- Wrapper de SortableJS para Vue 3
- Soporte nativo para Composition API
- Animaciones fluidas
- Más liviano que @dnd-kit (React)

---

## 18. Próximos Pasos

Ver documento `DOCS/PLAN-IMPLEMENTACION.md` para el plan detallado de implementación.
