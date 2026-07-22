# Decisiones de Arquitectura — kodanHELPER

> **Proyecto:** Organizador Inteligente de Ideas, Tareas y Reuniones  
> **MVP:** V1.0  
> **Fecha:** 22 Julio 2026  
> **Base:** `Documento_Unificado_Organizador_IA.md`

---

## 1. Stack Tecnológico Definitivo

| Capa | Tecnología | Versión/Nota |
|---|---|---|
| **Mobile** | Capacitor + Vue 3 + Tailwind CSS | Compila a iOS (Xcode) y Android (Android Studio). Mismo código que desktop. |
| **Desktop** | Vue 3 + Tailwind CSS | SPA servida por Nginx. Subdominio: `helper.kodan.software` |
| **Backend API** | Node.js + Express/Fastify | Contenedor Docker: `helper-api`. Subdominio: `helper-api.kodan.software` |
| **Worker IA** | Node.js | Contenedor Docker: `helper-worker`. Sin puerto expuesto. Cola interna o polling. |
| **Base de Datos** | Supabase (PostgreSQL) | Incluye Auth, Realtime y Storage. |
| **Autenticación** | Supabase Auth | OAuth (Google, GitHub, Apple) + Magic Links. |
| **Realtime** | Supabase Realtime | Suscripción `postgres_changes` a tabla `items`. |
| **Storage** | Supabase Storage | Audios crudos antes de transcripción. |
| **STT** | Whisper API (OpenAI) | Transcripción audio → texto. |
| **LLM** | Gemini 1.5 Flash | Clasificación y estructuración JSON. |

---

## 2. ¿Por qué Capacitor y no Expo?

Decisión tomada después de evaluar ambas opciones para publicación en iOS:

| Aspecto | Capacitor + Vue 3 | Expo + React Native |
|---|---|---|
| **Publicación iOS** | ✅ Xcode → App Store | ✅ Xcode → App Store |
| **Publicación Android** ✅ Android Studio | ✅ Play Store |
| **Stack** | Vue 3 (conocido, compartido con desktop) | React Native (nuevo, código separado) |
| **Código compartido** | ✅ 100% entre mobile y desktop | ❌ Cero con el desktop Vue 3 |
| **Micrófono** | ✅ Plugin `@capacitor/filesystem` + MediaRecorder | ✅ Nativo |
| **Cámara** | ✅ Plugin `@capacitor/camera` | ✅ Nativo |
| **Performance** | ⚠️ WebView (suficiente para esta app) | ✅ Nativo |
| **Curva de aprendizaje** | Baja (mismo stack) | Alta (React + React Native) |

**Decisión: Capacitor + Vue 3.** La app es principalmente formularios, listas y texto — no necesita animaciones 3D ni rendering pesado. Un WebView moderno (WKW ebView en iOS, WebView en Android) es más que suficiente. El beneficio de compartir código con el desktop es enorme.

---

## 3. Infraestructura Docker

### 3.1 Servicios

```
3 contenedores en red kodan_net (existente):

  helper-front:80     → Vue 3 build estático servido por nginx:alpine
  helper-api:3000     → Node.js (API REST)
  helper-worker       → Node.js (IA pipeline). Sin puerto, solo cómputo.
```

### 3.2 Integración con Nginx existente (kodan-infra)

Se añaden dos server blocks al `prod.nginx.conf` de `kodan_nginx_proxy`:

```nginx
# helper.kodan.software → Frontend Vue 3
server {
    listen 8080;
    server_name helper.kodan.software;

    include /etc/nginx/security-headers.conf;

    location / {
        resolver 127.0.0.11 valid=30s;
        set $upstream_helper_front helper-front;
        proxy_pass http://$upstream_helper_front:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# helper-api.kodan.software → API Node.js
server {
    listen 8080;
    server_name helper-api.kodan.software;

    include /etc/nginx/security-headers.conf;

    location / {
        resolver 127.0.0.11 valid=30s;
        set $upstream_helper_api helper-api;
        proxy_pass http://$upstream_helper_api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Rate limiting específico para la API
        limit_req zone=api burst=40 nodelay;
    }

    # WebSocket support for Realtime (si es necesario)
    location /ws {
        resolver 127.0.0.11 valid=30s;
        set $upstream_helper_api helper-api;
        proxy_pass http://$upstream_helper_api:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Se añaden registros DNS en Cloudflare:
- `helper.kodan.software` → CNAME al tunnel
- `helper-api.kodan.software` → CNAME al tunnel

### 3.3 Dockerfiles

**helper-front:**
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**helper-api:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

**helper-worker:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/worker.js"]
```

### 3.4 docker-compose.prod.yml

```yaml
name: kodan-helper

services:
  helper-front:
    image: ghcr.io/gerlandog-sudo/kodan-helper-front:latest
    container_name: kodan_helper_front
    restart: always
    networks:
      - kodan_net

  helper-api:
    image: ghcr.io/gerlandog-sudo/kodan-helper-api:latest
    container_name: kodan_helper_api
    restart: always
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - kodan_net

  helper-worker:
    image: ghcr.io/gerlandog-sudo/kodan-helper-worker:latest
    container_name: kodan_helper_worker
    restart: always
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    networks:
      - kodan_net

networks:
  kodan_net:
    external: true
```

---

## 4. Pipeline de IA (Worker)

```
[Mobile] → POST /api/ingest → [helper-api]
                                  │
                        Guarda raw_input (status: pending)
                        Responde 200 OK ( < 200ms )
                                  │
                        Worker recibe notificación
                                  │
                        ┌─────────────────────────┐
                        │   helper-worker          │
                        │   1. Descarga audio de   │
                        │      Supabase Storage    │
                        │   2. Whisper API → texto │
                        │   3. Gemini 1.5 Flash →  │
                        │      JSON estructurado   │
                        │   4. INSERT en items     │
                        │      (status: processed) │
                        └─────────────────────────┘
                                  │
                        Supabase Realtime NOTIFICA
                                  │
                        [Desktop/Mobile] recibe evento
```

**¿Por qué worker separado?**
- Whisper API puede tardar 5-30 segundos en audios largos
- Si el worker falla, la API sigue funcionando
- El worker puede reintentar N veces sin afectar al usuario
- Escalabilidad independiente (el worker es CPU-heavy, la API es I/O-heavy)

**Comunicación API → Worker (MVP):**
- Opción A (simplista): La API escribe en `raw_inputs`, el worker hace polling cada pocos segundos
- Opción B (mejor): Usar Supabase Realtime desde el worker para escuchar nuevos `raw_inputs` con status `pending`
- Opción C (futuro): Cola dedicada (BullMQ + Redis/Upstash)

**Para el MVP, recomiendo Opción B:** El worker se suscribe a cambios en `raw_inputs` via Realtime, evitando polling y sin infraestructura extra.

---

## 5. Esquema de Base de Datos (PostgreSQL Supabase)

```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- RAW INPUTS: Capturas brutas (inmutable, solo inserts)
-- ============================================================
CREATE TABLE raw_inputs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('audio', 'text')),
  content_url   TEXT,                  -- URL del audio en Supabase Storage (NULL si text)
  content_text  TEXT,                  -- Texto directo del usuario (NULL si audio)
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,                  -- Mensaje de error si status = 'failed'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITEMS: Entidades procesadas por IA
-- ============================================================
CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_input_id  UUID REFERENCES raw_inputs(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  category      VARCHAR(20) NOT NULL
                CHECK (category IN ('TASK', 'IDEA', 'MEETING', 'UNCATEGORIZED')),
  title         VARCHAR(255) NOT NULL,
  summary       TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
                -- due_date: "YYYY-MM-DD" | null
                -- time: "HH:MM" | null
                -- participants: ["Nombre", ...]
                -- checklist: ["Paso 1", ...]
                -- tags: ["Tag1", ...]
  status        VARCHAR(20) NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox', 'actioned', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_raw_inputs_user_id ON raw_inputs(user_id);
CREATE INDEX idx_raw_inputs_status ON raw_inputs(status);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE raw_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven sus propios datos
CREATE POLICY "users_see_own_raw_inputs" ON raw_inputs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_see_own_items" ON items
  FOR ALL USING (auth.uid() = user_id);

-- El service_role (worker) puede leer/insertar todas las filas
-- (se maneja con la service_key, no con RLS)

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE raw_inputs;
```

---

## 6. Prompt de IA (Gemini 1.5 Flash — Structured Output)

```
SYSTEM:
Eres un asistente ejecutivo de IA. Tu trabajo es analizar notas de audio/texto del usuario
y clasificarlas estrictamente en una de estas categorías:

1. TASK: Requiere una acción concreta a realizar. Incluye fecha límite si se menciona.
2. IDEA: Un concepto, reflexión, pensamiento creativo o proyecto futuro. Sin presión de tiempo.
3. MEETING: Mención de una reunión, llamada, cita o evento con fecha/hora o personas involucradas.
4. UNCATEGORIZED: No encaja claramente en ninguna categoría anterior.

Devuelve SIEMPRE un objeto JSON válido. No incluyas texto adicional fuera del JSON.

ESQUEMA DE SALIDA:
{
  "category": "TASK" | "IDEA" | "MEETING" | "UNCATEGORIZED",
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

REGLAS:
- El título debe ser accionable para TASK, descriptivo para IDEA, y basado en el evento para MEETING
- Los tags deben ser relevantes y consistentes (ej: "trabajo", "personal", "salud", "proyecto-x")
- Si no hay participantes, due_date, etc., devolver null o [] según corresponda
- Para MEETING: siempre extraer fecha, hora y participantes si están disponibles
- Para TASK: extraer due_date si se menciona explícitamente
```

---

## 7. CI/CD — GitHub Actions

Siguiendo el patrón de `kodan-infra`, se crearán tres workflows:

### 7.1 deploy-api.yml

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: api/
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/kodan-helper-api:latest
            ghcr.io/${{ github.repository_owner }}/kodan-helper-api:${{ github.sha }}
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/kodanapps/kodan-helper
            docker compose pull helper-api
            docker compose up -d --remove-orphans helper-api
            docker image prune -f
```

### 7.2 deploy-front.yml (análogo)

### 7.3 deploy-worker.yml (análogo)

---

## 8. Estructura de Repositorios

### Repositorio 1: `kodan-infra` (EXISTENTE)
- Configuración de nginx (se añaden server blocks)
- `docker-compose.prod.yml` (se añaden servicios)
- Cloudflare tunnel
- No tocar estructura actual, solo extender

### Repositorio 2: `kodan-helper` (NUEVO)
```
kodan-helper/
├── api/                    # Backend API (helper-api)
│   ├── src/
│   │   ├── index.js        # Entry point (Express/Fastify)
│   │   ├── routes/
│   │   │   └── ingest.js   # POST /api/ingest
│   │   ├── services/
│   │   │   └── supabase.js # Cliente Supabase
│   │   └── middleware/
│   │       └── auth.js     # Verificación JWT de Supabase
│   ├── Dockerfile
│   └── package.json
├── worker/                 # Worker IA (helper-worker)
│   ├── src/
│   │   ├── index.js        # Entry point (escucha Realtime o cola)
│   │   ├── services/
│   │   │   ├── whisper.js  # Llamada a Whisper API
│   │   │   ├── gemini.js   # Llamada a Gemini 1.5 Flash
│   │   │   └── supabase.js # Cliente Supabase
│   │   └── prompts/
│   │       └── classifier.js # Prompt de clasificación
│   ├── Dockerfile
│   └── package.json
├── mobile/                 # App Mobile (Capacitor + Vue 3)
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── AudioRecorder.vue
│   │   │   ├── QuickTextInput.vue
│   │   │   └── FeedbackToast.vue
│   │   ├── views/
│   │   │   └── CaptureView.vue
│   │   └── services/
│   │       └── api.ts      # Cliente HTTP para helper-api
│   ├── capacitor.config.ts
│   ├── package.json
│   └── vite.config.ts
├── desktop/                # Panel Desktop (Vue 3 + Tailwind)
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── KanbanBoard.vue   # Tareas
│   │   │   ├── IdeaWall.vue      # Ideas
│   │   │   ├── MeetingCalendar.vue # Reuniones
│   │   │   └── ItemCard.vue      # Tarjeta genérica
│   │   ├── views/
│   │   │   ├── DashboardView.vue
│   │   │   └── InboxView.vue
│   │   ├── stores/
│   │   │   └── items.ts   # Pinia store
│   │   └── services/
│   │       ├── api.ts      # Cliente HTTP
│   │       └── realtime.ts # Suscripción Supabase Realtime
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── docs/                   # Documentación
├── .github/
│   └── workflows/
│       ├── deploy-api.yml
│       ├── deploy-front.yml
│       └── deploy-worker.yml
└── README.md
```

---

## 9. Lo que hay que tener en cuenta para el futuro

### 🔴 Riesgos Altos (Mitigar desde el Día 1)

| Riesgo | Mitigación |
|---|---|
| **Vendor lock-in Supabase** | Usar solo PostgreSQL estándar + Auth. NO usar Edge Functions. Mantener worker Node.js independiente. |
| **Costo a escala** | Monitorear uso. Plan Pro ($25/mes) es el piso. A 10k+ usuarios, evaluar Neon (PostgreSQL serverless) + Auth0 + Socket.io. |
| **Límites Realtime** | Supabase Pro: 500 conexiones Realtime concurrentes. Para más, evaluar Team ($599/mes) o migrar a WebSocket propio. |

### 🟡 Decisiones Futuras

| Tema | Cuándo | Opciones |
|---|---|---|
| **Offline-first** | Cuando usuarios pidan crear sin internet | RxDB o PouchDB con sincronización diferida a Supabase |
| **Búsqueda semántica** | Cuando haya >1000 items | pgvector en Supabase (plan Pro) |
| **Cola de procesamiento** | Cuando el worker IA reciba >100 requests/día | BullMQ + Redis (o Upstash serverless) |
| **Desktop nativo** | Cuando se necesiten notificaciones sistema/bandeja | Tauri (Rust + Vue 3) |
| **WebSockets para progreso** | Cuando la UX lo requiera | Canal Realtime por usuario mostrando % de transcripción |

### 🟢 Buenas Prácticas desde el Día 1

- **Variables de entorno:** TODO configurable (`SUPABASE_URL`, `OPENAI_API_KEY`, etc.)
- **Logs estructurados:** Pino en API y Worker
- **Migraciones SQL:** Versionadas con `supabase migration new`
- **Testing:**
  - Unitarios: Pipeline IA (mock Whisper/Gemini)
  - Integración: Endpoints de API
  - E2E: Flujo completo de captura a renderizado
- **CI/CD:** GitHub Actions con build + push a GHCR + deploy SSH
- **Secrets:** GitHub Secrets (nunca .env en el repo)

---

## 10. Diagrama de Arquitectura General

```
                    ┌─────────────────────────────────────┐
                    │         MOBILE (Capacitor)           │
                    │      Vue 3 + Tailwind + Plugins      │
                    │  [Grabar] [Escribir] [Foto]          │
                    └──────────────┬──────────────────────┘
                                   │ POST /api/ingest
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
│  helper.kodan.software ───────┐                             │
│  helper-api.kodan.software ───┼─── Tunnel ─── cloudflared   │
└────────────────────────────────┼───────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│              VPS — NGINX PROXY (kodan_nginx_proxy)          │
│                                                             │
│  helper.kodan.software  ───→ proxy_pass → helper-front:80   │
│  helper-api.kodan.software ──→ proxy_pass → helper-api:3000 │
└─────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────────┐
                    ▼            ▼                ▼
           ┌────────────┐ ┌────────────┐ ┌──────────────┐
           │helper-front│ │ helper-api │ │helper-worker │
           │ Vue 3 SPA │ │ Node.js    │ │ Whisper +    │
           │ Nginx:80  │ │ REST:3000  │ │ Gemini       │
           └────────────┘ └─────┬──────┘ └──────┬───────┘
                                │               │
                                ▼               ▼
                    ┌───────────────────────────────┐
                    │         SUPABASE               │
                    │  PostgreSQL + Auth + Realtime   │
                    │  + Storage (audios)            │
                    └───────────────────────────────┘
                                │
                    ┌───────────┘
                    ▼
          ┌─────────────────────┐
          │   DESKTOP (Web)     │
          │ Vue 3 + Tailwind    │
          │ Kanban | Muro | Cal │
          └─────────────────────┘
```

---

*Documento generado el 22 Julio 2026. Próxima revisión: post-MVP.*
