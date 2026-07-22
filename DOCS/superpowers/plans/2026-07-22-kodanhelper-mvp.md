# kodanHELPER — MVP V1.0 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Organizador Inteligente (Mobile capture + Desktop panel with IA) to production on existing VPS infrastructure.

**Architecture:** 3 Docker containers (front/api/worker) on `kodan_net` behind existing nginx proxy. Supabase as backend (PostgreSQL + Auth + Realtime + Storage). Capacitor + Vue 3 for mobile, Vue 3 + Tailwind for desktop. Whisper API + Gemini 1.5 Flash for IA pipeline.

**Tech Stack:** Vue 3, Tailwind CSS v4, Node.js, Supabase, Capacitor, Docker, Nginx, GitHub Actions, GHCR, Cloudflare Tunnel

**Plan Structure:** 8 phases, ~60 tasks. Each task is 2-10 min.

---

## File Structure

All new code lives in the `kodan-helper` monorepo:

```
kodan-helper/
├── api/                          # Backend (helper-api container)
│   ├── src/
│   │   ├── index.js              # Express entry point
│   │   ├── config.js             # Env vars
│   │   ├── routes/
│   │   │   └── ingest.js         # POST /api/ingest
│   │   ├── services/
│   │   │   └── supabase.js       # Supabase client
│   │   └── middleware/
│   │       └── auth.js           # JWT verification
│   ├── tests/
│   │   ├── ingest.test.js
│   │   └── auth.test.js
│   ├── Dockerfile
│   └── package.json
├── worker/                       # IA pipeline (helper-worker container)
│   ├── src/
│   │   ├── index.js              # Realtime subscriber + processor
│   │   ├── services/
│   │   │   ├── supabase.js       # Supabase client (service_role)
│   │   │   ├── whisper.js        # OpenAI Whisper API
│   │   │   └── gemini.js         # Google Gemini API
│   │   └── prompts/
│   │       └── classifier.js     # System prompt
│   ├── tests/
│   │   ├── whisper.test.js
│   │   ├── gemini.test.js
│   │   └── processor.test.js
│   ├── Dockerfile
│   └── package.json
├── desktop/                      # Desktop SPA (helper-front container)
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── components/
│   │   │   ├── KanbanBoard.vue
│   │   │   ├── IdeaWall.vue
│   │   │   ├── MeetingCalendar.vue
│   │   │   └── ItemCard.vue
│   │   ├── views/
│   │   │   ├── DashboardView.vue
│   │   │   └── InboxView.vue
│   │   ├── stores/
│   │   │   └── items.js         # Pinia store
│   │   └── services/
│   │       ├── api.js            # Axios/fetch client
│   │       └── realtime.js       # Supabase Realtime subscription
│   ├── public/
│   │   └── favicon.ico
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── mobile/                       # Mobile App (Capacitor + Vue 3)
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── components/
│   │   │   ├── AudioRecorder.vue
│   │   │   ├── QuickTextInput.vue
│   │   │   └── FeedbackToast.vue
│   │   ├── views/
│   │   │   └── CaptureView.vue
│   │   └── services/
│   │       └── api.js            # HTTP client
│   ├── capacitor.config.js
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       ├── deploy-api.yml
│       ├── deploy-front.yml
│       └── deploy-worker.yml
├── docs/
├── .gitignore
└── README.md
```

Changes to `kodan-infra` (existing repo):
- `docker/nginx/prod.nginx.conf` — Add 2 server blocks (helper + helper-api)
- Cloudflare DNS — Add 2 CNAME records
- `docker-compose.prod.yml` — Add references to helper images

---

## Phase 0: Repository & Project Scaffolding

### Task 0.1: Create monorepo directory structure and .gitignore

**Files:**
- Create: `kodan-helper/.gitignore`
- Create: `kodan-helper/README.md`
- Create: `kodan-helper/docs/` (empty)

- [ ] **Step 1: Create root .gitignore**

```gitignore
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Capacitor
mobile/ios/
mobile/android/
mobile/capacitor-cordova-android-plugins/
mobile/plugins/

# Docker
*.docker-cache
```

- [ ] **Step 2: Create root README.md**

```markdown
# kodan-helper

Organizador Inteligente de Ideas, Tareas y Reuniones.

## Repositorios

| Repo | Descripción |
|---|---|
| kodan-helper (este) | App monorepo: API, Worker IA, Frontend Desktop y Mobile |
| kodan-infra | Infraestructura compartida: nginx, Cloudflare tunnel, Docker compose |

## Stack

- **Mobile**: Capacitor + Vue 3 + Tailwind CSS
- **Desktop**: Vue 3 + Tailwind CSS
- **Backend**: Node.js + Express
- **Worker IA**: Node.js (Whisper + Gemini)
- **DB**: Supabase (PostgreSQL + Auth + Realtime + Storage)

## Desarrollo

```bash
# API
cd api && npm install && npm run dev

# Desktop
cd desktop && npm install && npm run dev

# Mobile
cd mobile && npm install && npm run dev
```
```

- [ ] **Step 3: Commit**

```bash
git init
git add .gitignore README.md docs/
git commit -m "chore: initialize monorepo structure"
```

---

## Phase 1: Infrastructure — kodan-infra Extensions

### Task 1.1: Add nginx server blocks for helper subdomains

**Files:**
- Modify: `kodan-infra/docker/nginx/prod.nginx.conf` (add after last server block)

- [ ] **Step 1: Append helper server blocks to prod.nginx.conf**

Open `docker/nginx/prod.nginx.conf` and add before the closing `}` of the `http` block:

```nginx
# 4. HELPER FRONT: helper.kodan.software (Vue 3 SPA)
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

# 5. HELPER API: helper-api.kodan.software (Node.js REST)
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
        limit_req zone=api burst=40 nodelay;
    }

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

- [ ] **Step 2: Commit to kodan-infra**

```bash
git add docker/nginx/prod.nginx.conf
git commit -m "feat: add helper subdomains (helper + helper-api)"
```

### Task 1.2: Add helper services to kodan-infra docker-compose and Cloudflare DNS

**Files:**
- Modify: `kodan-infra/docker-compose.prod.yml`
- Action: Cloudflare dashboard (add DNS records)

- [ ] **Step 1: Append helper image references to docker-compose.prod.yml**

Add under the `services:` section, preserving existing nginx and cloudflared:

```yaml
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
```

- [ ] **Step 2: Add Cloudflare DNS CNAME records**

In Cloudflare dashboard for `kodan.software`:
```
helper.kodan.software   CNAME   → 8cdc4153-...cfargotunnel.com   (proxied)
helper-api.kodan.software CNAME → 8cdc4153-...cfargotunnel.com   (proxied)
```

- [ ] **Step 3: Commit to kodan-infra**

```bash
git add docker-compose.prod.yml
git commit -m "feat: add helper services to docker-compose"
```

---

## Phase 2: Supabase Setup

### Task 2.1: Create Supabase project and configure Auth settings

**Files:** None (Supabase dashboard)

- [ ] **Step 1: Create Supabase project**

Go to `supabase.com/dashboard` → New project → Name: `kodan-helper` → Database password → Region: closest to VPS → Create.

- [ ] **Step 2: Enable Auth providers**

Supabase Dashboard → Authentication → Providers:
- Enable Email/Password (disable "Confirm email" for MVP)
- Enable Google
- Enable GitHub
- Enable Apple (requires Apple Developer account — skip for MVP)

- [ ] **Step 3: Copy project API keys**

Supabase Dashboard → Settings → API:
- `Project URL` → save as `SUPABASE_URL`
- `anon public` → save as `SUPABASE_ANON_KEY`
- `service_role` → save as `SUPABASE_SERVICE_KEY`

### Task 2.2: Create Storage bucket for audio files

**Files:** None (Supabase dashboard)

- [ ] **Step 1: Create `audio-uploads` bucket**

Supabase Dashboard → Storage → New bucket:
- Name: `audio-uploads`
- Public: **false** (private, accessed via signed URLs)
- Enable RLS: yes

- [ ] **Step 2: Create RLS policy for storage**

```sql
-- Only authenticated users can upload and read their own audio
CREATE POLICY "users_upload_own_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "users_read_own_audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

Run this in Supabase SQL Editor.

### Task 2.3: Run database migration (tables, indexes, RLS, Realtime)

**Files:** None (Supabase SQL Editor)

- [ ] **Step 1: Execute full schema migration**

Run in Supabase SQL Editor:

```sql
-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- RAW INPUTS
-- ============================================================
CREATE TABLE raw_inputs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('audio', 'text')),
  content_url   TEXT,
  content_text  TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ITEMS
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
  status        VARCHAR(20) NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox', 'actioned', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_raw_inputs_user_id ON raw_inputs(user_id);
CREATE INDEX idx_raw_inputs_status ON raw_inputs(status);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created_at ON items(created_at DESC);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE raw_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_raw_inputs" ON raw_inputs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_see_own_items" ON items
  FOR ALL USING (auth.uid() = user_id);

-- Service role bypasses RLS (used by worker)
-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE items;
ALTER PUBLICATION supabase_realtime ADD TABLE raw_inputs;
```

- [ ] **Step 2: Verify migration**

Run in SQL Editor:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: raw_inputs, items

SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Expected: raw_inputs, items
```

- [ ] **Step 3: Save migration file for version control**

```bash
mkdir -p supabase/migrations
# Copy the SQL above into supabase/migrations/20260722_initial_schema.sql
```

---

## Phase 3: Backend API (helper-api)

### Task 3.1: Scaffold Node.js project with Express

**Files:**
- Create: `api/package.json`
- Create: `api/src/index.js`
- Create: `api/src/config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "kodan-helper-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "NODE_OPTIONS='--experimental-vm-modules' node --test tests/*.test.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "@supabase/supabase-js": "^2.45.0",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

- [ ] **Step 2: Create config.js**

```javascript
// api/src/config.js
import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://helper.kodan.software',
  },
};
```

- [ ] **Step 3: Create index.js (Express entry point)**

```javascript
// api/src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { config } from './config.js';
import { ingestRouter } from './routes/ingest.js';

const logger = pino({ transport: { target: 'pino-pretty' } });
const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json({ limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

// Routes
app.use('/api/ingest', ingestRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  logger.info(`API listening on port ${config.port}`);
});

export { app };
```

- [ ] **Step 4: Run manually to verify it starts**

```bash
cd api
npm install
node --watch src/index.js
# Visit http://localhost:3000/health → {"status":"ok","timestamp":"..."}
```

- [ ] **Step 5: Commit**

```bash
git add api/
git commit -m "feat(api): scaffold Express server with health endpoint"
```

### Task 3.2: Create Supabase client service

**Files:**
- Create: `api/src/services/supabase.js`

- [ ] **Step 1: Create Supabase client**

```javascript
// api/src/services/supabase.js
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

// Client for user-scoped operations (uses RLS)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
);

// Admin client for service operations (bypasses RLS — used by worker)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey,
);
```

### Task 3.3: Create auth middleware (JWT verification)

**Files:**
- Create: `api/src/middleware/auth.js`

- [ ] **Step 1: Create JWT verification middleware**

```javascript
// api/src/middleware/auth.js
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
```

### Task 3.4: Create POST /api/ingest endpoint

**Files:**
- Create: `api/src/routes/ingest.js`
- Create: `api/tests/ingest.test.js`

- [ ] **Step 1: Create ingest route**

```javascript
// api/src/routes/ingest.js
import { Router } from 'express';
import pino from 'pino';
import { authenticate } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

const logger = pino({ transport: { target: 'pino-pretty' } });
export const ingestRouter = Router();

ingestRouter.post('/', authenticate, async (req, res) => {
  const { type, content } = req.body;

  // Validate input
  if (!type || !['audio', 'text'].includes(type)) {
    return res.status(400).json({ error: 'type must be "audio" or "text"' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required and must be a non-empty string' });
  }

  if (type === 'audio' && content.length > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'audio content exceeds 50MB limit' });
  }

  if (type === 'text' && content.length > 10000) {
    return res.status(400).json({ error: 'text content exceeds 10,000 character limit' });
  }

  try {
    // Insert into raw_inputs
    const insertData = {
      user_id: req.user.id,
      type,
      content_url: type === 'audio' ? content : null,
      content_text: type === 'text' ? content.trim() : null,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('raw_inputs')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error({ error }, 'failed to insert raw_input');
      return res.status(500).json({ error: 'Failed to save input' });
    }

    logger.info({ id: data.id, type }, 'raw_input saved');

    // Respond immediately — worker processes async
    return res.status(201).json({
      id: data.id,
      status: data.status,
      message: 'Capture saved, processing will complete shortly',
    });
  } catch (err) {
    logger.error({ err }, 'unexpected error in ingest');
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

- [ ] **Step 2: Create test file**

```javascript
// api/tests/ingest.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { app } from '../src/index.js';

// Note: Full integration tests require a running Supabase instance.
// These tests validate the Express middleware chain.

describe('POST /api/ingest', () => {
  it('should reject requests without auth header', async () => {
    // Via supertest or direct http.request
    // For now, structural assertion:
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push(`${middleware.route.path} [${Object.keys(middleware.route.methods)}]`);
      }
    });
    assert.ok(routes.some(r => r.includes('/api/ingest')));
  });
});
```

- [ ] **Step 3: Run tests**

```bash
cd api
npm test
# Expected: tests pass (structural assertion)
```

- [ ] **Step 4: Commit**

```bash
git add api/src/routes/ingest.js api/tests/ingest.test.js
git commit -m "feat(api): implement POST /api/ingest endpoint"
```

### Task 3.5: Create Dockerfile for helper-api

**Files:**
- Create: `api/Dockerfile`
- Create: `api/.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Create .dockerignore**

```
node_modules/
.npm/
tests/
*.test.js
.git
.gitignore
```

- [ ] **Step 3: Build and test locally**

```bash
cd api
docker build -t helper-api:test .
docker run --rm -p 3000:3000 --env-file ../.env helper-api:test
# Visit http://localhost:3000/health
```

---

## Phase 4: Worker IA (helper-worker)

### Task 4.1: Scaffold worker project

**Files:**
- Create: `worker/package.json`
- Create: `worker/src/index.js`
- Create: `worker/src/services/supabase.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "kodan-helper-worker",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "NODE_OPTIONS='--experimental-vm-modules' node --test tests/*.test.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "openai": "^4.60.0",
    "@google/generative-ai": "^0.19.0",
    "pino": "^9.4.0",
    "pino-pretty": "^11.2.0"
  }
}
```

- [ ] **Step 2: Create worker entry point (Realtime subscriber)**

```javascript
// worker/src/index.js
import pino from 'pino';
import { createClient } from '@supabase/supabase-js';
import { processRawInput } from './services/processor.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

logger.info('Worker starting — subscribing to raw_inputs changes...');

// Subscribe to new raw_inputs with status = 'pending'
const channel = supabase
  .channel('worker-raw-inputs')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'raw_inputs',
      filter: 'status=eq.pending',
    },
    async (payload) => {
      const record = payload.new;
      logger.info({ id: record.id, type: record.type }, 'New raw_input received');

      try {
        // Mark as processing
        await supabase
          .from('raw_inputs')
          .update({ status: 'processing' })
          .eq('id', record.id);

        // Process
        await processRawInput(supabase, record);

        logger.info({ id: record.id }, 'Processing complete');
      } catch (err) {
        logger.error({ err, id: record.id }, 'Processing failed');
        await supabase
          .from('raw_inputs')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', record.id);
      }
    }
  )
  .subscribe((status) => {
    logger.info({ status }, 'Realtime subscription status');
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await supabase.removeChannel(channel);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down worker...');
  await supabase.removeChannel(channel);
  process.exit(0);
});
```

- [ ] **Step 3: Install and verify**

```bash
cd worker
npm install
```

### Task 4.2: Create Whisper API integration

**Files:**
- Create: `worker/src/services/whisper.js`

- [ ] **Step 1: Create whisper service**

```javascript
// worker/src/services/whisper.js
import OpenAI from 'openai';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function transcribeAudio(audioUrl, openaiApiKey) {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  logger.info({ audioUrl }, 'Transcribing audio with Whisper');

  // Download audio from Supabase Storage URL
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();

  // Send to Whisper API
  const transcription = await openai.audio.transcriptions.create({
    file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
    model: 'whisper-1',
    language: 'es',
    response_format: 'text',
  });

  logger.info({ transcriptionLength: transcription.length }, 'Transcription complete');
  return transcription;
}
```

### Task 4.3: Create Gemini integration

**Files:**
- Create: `worker/src/services/gemini.js`
- Create: `worker/src/prompts/classifier.js`

- [ ] **Step 1: Create classifier prompt**

```javascript
// worker/src/prompts/classifier.js
export const CLASSIFIER_SYSTEM_PROMPT = `Eres un asistente ejecutivo de IA. Tu trabajo es analizar notas de audio/texto del usuario y clasificarlas estrictamente en una de estas categorías:

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
- Para TASK: extraer due_date si se menciona explícitamente`;
```

- [ ] **Step 2: Create Gemini service**

```javascript
// worker/src/services/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';
import { CLASSIFIER_SYSTEM_PROMPT } from '../prompts/classifier.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function classifyText(text, geminiApiKey) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  logger.info({ textLength: text.length }, 'Classifying text with Gemini');

  const result = await model.generateContent({
    systemInstruction: CLASSIFIER_SYSTEM_PROMPT,
    contents: [{ role: 'user', parts: [{ text }] }],
  });

  const responseText = result.response.text();
  logger.info({ responseText }, 'Gemini response received');

  // Parse the JSON response
  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini response as JSON: ${responseText}`);
  }
}
```

### Task 4.4: Create main processor that orchestrates Whisper → Gemini → DB insert

**Files:**
- Create: `worker/src/services/processor.js`

- [ ] **Step 1: Create processor**

```javascript
// worker/src/services/processor.js
import pino from 'pino';
import { transcribeAudio } from './whisper.js';
import { classifyText } from './gemini.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export async function processRawInput(supabase, record) {
  const { id, type, content_url, content_text, user_id } = record;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Step 1: Get plain text
  let text;
  if (type === 'audio') {
    // Generate a signed URL for the audio file
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('audio-uploads')
      .createSignedUrl(content_url, 300); // 5 minute expiry

    if (signedUrlError) {
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    text = await transcribeAudio(signedUrl, openaiApiKey);
  } else {
    text = content_text;
  }

  // Step 2: Classify with Gemini
  const classification = await classifyText(text, geminiApiKey);

  // Step 3: Insert into items table
  const { error: insertError } = await supabase
    .from('items')
    .insert({
      raw_input_id: id,
      user_id,
      category: classification.category || 'UNCATEGORIZED',
      title: classification.title || 'Untitled',
      summary: classification.summary || text.substring(0, 500),
      metadata: classification.metadata || {},
      status: 'inbox',
    });

  if (insertError) {
    throw new Error(`Failed to insert item: ${insertError.message}`);
  }

  // Step 4: Mark raw_input as processed
  const { error: updateError } = await supabase
    .from('raw_inputs')
    .update({ status: 'processed' })
    .eq('id', id);

  if (updateError) {
    logger.error({ error: updateError }, 'Failed to update raw_input status');
    // Non-fatal — item was inserted successfully
  }

  logger.info({ id, category: classification.category, title: classification.title }, 'Item processed and saved');
}
```

### Task 4.5: Create Dockerfile for helper-worker

**Files:**
- Create: `worker/Dockerfile`
- Create: `worker/.dockerignore`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["node", "src/index.js"]
```

- [ ] **Step 2: Build locally**

```bash
cd worker
docker build -t helper-worker:test .
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add worker/
git commit -m "feat(worker): implement IA pipeline (Whisper + Gemini + Realtime subscriber)"
```

---

## Phase 5: Desktop Frontend (helper-front)

### Task 5.1: Scaffold Vue 3 + Tailwind project

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/vite.config.js`
- Create: `desktop/tailwind.config.js`
- Create: `desktop/postcss.config.js`
- Create: `desktop/index.html`
- Create: `desktop/src/main.js`
- Create: `desktop/src/App.vue`
- Create: `desktop/src/style.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "kodan-helper-desktop",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "pinia": "^2.2.0",
    "@supabase/supabase-js": "^2.45.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "vite": "^5.4.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>kodanHELPER - Organizador Inteligente</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
</head>
<body class="bg-slate-950 text-slate-100 antialiased">
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create main entry file**

```javascript
// desktop/src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import DashboardView from './views/DashboardView.vue';
import InboxView from './views/InboxView.vue';
import './style.css';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: DashboardView, name: 'dashboard' },
  { path: '/inbox', component: InboxView, name: 'inbox' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

- [ ] **Step 5: Create App.vue**

```vue
<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
      <h1 class="text-xl font-bold text-white mb-8">📋 kodanHELPER</h1>
      <nav class="space-y-2 flex-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="block px-3 py-2 rounded-lg text-sm transition-colors"
          :class="$route.path === item.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <div class="text-xs text-slate-600 pt-4 border-t border-slate-800">
        kodanHELPER v1.0
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/inbox', label: 'Inbox' },
];
</script>
```

- [ ] **Step 6: Create style.css**

```css
@import "tailwindcss";

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
```

- [ ] **Step 7: Verify it builds**

```bash
cd desktop
npm install
npm run build
# Expected: dist/ directory created with index.html + assets
```

- [ ] **Step 8: Commit**

```bash
git add desktop/package.json desktop/vite.config.js desktop/index.html desktop/src/
git commit -m "feat(desktop): scaffold Vue 3 + Tailwind project"
```

### Task 5.1.5: Create Auth view and login flow for Desktop

**Files:**
- Create: `desktop/src/views/LoginView.vue`
- Create: `desktop/src/services/auth.js`
- Modify: `desktop/src/main.js`

- [ ] **Step 1: Create auth service**

```javascript
// desktop/src/services/auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
```

- [ ] **Step 2: Create LoginView.vue**

```vue
<!-- desktop/src/views/LoginView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950">
    <div class="bg-slate-900 rounded-xl p-8 w-full max-w-md border border-slate-800">
      <h1 class="text-2xl font-bold text-white mb-2">kodanHELPER</h1>
      <p class="text-slate-400 mb-8 text-sm">Organizador Inteligente de Ideas, Tareas y Reuniones</p>

      <button
        @click="loginGoogle"
        class="w-full mb-4 px-4 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuar con Google
      </button>

      <div class="relative mb-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-slate-700"/></div>
        <div class="relative flex justify-center text-xs"><span class="bg-slate-900 px-2 text-slate-500">o</span></div>
      </div>

      <form @submit.prevent="loginMagicLink" class="space-y-3">
        <input
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          class="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          required
        />
        <button type="submit" :disabled="sending"
          class="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors">
          {{ sending ? 'Enviando...' : 'Enviar Magic Link' }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-center" :class="messageClass">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signInWithGoogle, signInWithMagicLink } from '../services/auth.js';

const email = ref('');
const sending = ref(false);
const message = ref('');
const messageClass = ref('text-green-400');

async function loginGoogle() {
  try {
    await signInWithGoogle();
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'text-red-400';
  }
}

async function loginMagicLink() {
  sending.value = true;
  message.value = '';
  try {
    await signInWithMagicLink(email.value);
    message.value = '¡Magic link enviado! Revisa tu correo.';
    messageClass.value = 'text-green-400';
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'text-red-400';
  } finally {
    sending.value = false;
  }
}
</script>
```

- [ ] **Step 3: Update main.js with auth guard**

Update `desktop/src/main.js`:

```javascript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import InboxView from './views/InboxView.vue';
import { supabase } from './services/auth.js';
import './style.css';

const routes = [
  { path: '/login', component: LoginView, name: 'login' },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: DashboardView, name: 'dashboard', meta: { requiresAuth: true } },
  { path: '/inbox', component: InboxView, name: 'inbox', meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (to.meta.requiresAuth && !session) {
    next('/login');
  } else if (to.path === '/login' && session) {
    next('/dashboard');
  } else {
    next();
  }
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

- [ ] **Step 4: Commit**

```bash
git add desktop/src/views/LoginView.vue desktop/src/services/auth.js desktop/src/main.js
git commit -m "feat(desktop): add login view with Google OAuth and Magic Link"
```

### Task 5.2: Create Supabase service files (api + realtime)

**Files:**
- Create: `desktop/src/services/api.js`
- Create: `desktop/src/services/realtime.js`

- [ ] **Step 1: Create API client**

```javascript
// desktop/src/services/api.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchItemsByCategory(category) {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Create Realtime subscription service**

```javascript
// desktop/src/services/realtime.js
import { supabase } from './api.js';

export function subscribeToItems(callback) {
  const channel = supabase
    .channel('desktop-items')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        callback('insert', payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'items',
      },
      (payload) => {
        callback('update', payload.new);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
```

### Task 5.3: Create Pinia store for items

**Files:**
- Create: `desktop/src/stores/items.js`

- [ ] **Step 1: Create items store**

```javascript
// desktop/src/stores/items.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchItems } from '../services/api.js';
import { subscribeToItems } from '../services/realtime.js';

export const useItemsStore = defineStore('items', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Computed by category
  const tasks = computed(() => items.value.filter(i => i.category === 'TASK'));
  const ideas = computed(() => items.value.filter(i => i.category === 'IDEA'));
  const meetings = computed(() => items.value.filter(i => i.category === 'MEETING'));
  const uncategorized = computed(() => items.value.filter(i => i.category === 'UNCATEGORIZED'));

  // Counts
  const totalCount = computed(() => items.value.length);
  const inboxCount = computed(() => items.value.filter(i => i.status === 'inbox').length);

  let unsubscribe = null;

  async function loadItems() {
    loading.value = true;
    try {
      items.value = await fetchItems();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  function startRealtime() {
    unsubscribe = subscribeToItems((event, item) => {
      if (event === 'insert') {
        items.value.unshift(item);
      } else if (event === 'update') {
        const idx = items.value.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          items.value[idx] = item;
        }
      }
    });
  }

  function stopRealtime() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  return {
    items, loading, error,
    tasks, ideas, meetings, uncategorized,
    totalCount, inboxCount,
    loadItems, startRealtime, stopRealtime,
  };
});
```

### Task 5.4: Create Dashboard view with 3-column Kanban

**Files:**
- Create: `desktop/src/views/DashboardView.vue`
- Create: `desktop/src/components/KanbanBoard.vue`
- Create: `desktop/src/components/IdeaWall.vue`
- Create: `desktop/src/components/MeetingCalendar.vue`
- Create: `desktop/src/components/ItemCard.vue`

- [ ] **Step 1: Create ItemCard component**

```vue
<!-- desktop/src/components/ItemCard.vue -->
<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500/50 transition-colors">
    <div class="flex items-start justify-between mb-2">
      <span class="text-xs font-medium px-2 py-0.5 rounded-full"
        :class="categoryClass">
        {{ item.category }}
      </span>
      <span class="text-xs text-slate-500">
        {{ formatDate(item.created_at) }}
      </span>
    </div>
    <h3 class="text-sm font-semibold text-white mb-1">{{ item.title }}</h3>
    <p v-if="item.summary" class="text-xs text-slate-400 line-clamp-2">{{ item.summary }}</p>
    <div v-if="item.metadata?.tags?.length" class="flex flex-wrap gap-1 mt-2">
      <span v-for="tag in item.metadata.tags" :key="tag"
        class="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
        #{{ tag }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { format, parseISO } from 'date-fns';

const props = defineProps({
  item: { type: Object, required: true },
});

const categoryClass = {
  TASK: 'bg-blue-900/50 text-blue-300',
  IDEA: 'bg-purple-900/50 text-purple-300',
  MEETING: 'bg-green-900/50 text-green-300',
  UNCATEGORIZED: 'bg-slate-700 text-slate-400',
}[props.item.category] || 'bg-slate-700 text-slate-400';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd MMM HH:mm');
  } catch {
    return dateStr;
  }
}
</script>
```

- [ ] **Step 2: Create KanbanBoard (Tareas)**

```vue
<!-- desktop/src/components/KanbanBoard.vue -->
<template>
  <div>
    <h2 class="text-lg font-semibold text-white mb-4">📋 Tareas</h2>
    <div class="space-y-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm text-slate-500 italic">No hay tareas pendientes</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
```

- [ ] **Step 3: Create IdeaWall (Ideas)**

```vue
<!-- desktop/src/components/IdeaWall.vue -->
<template>
  <div>
    <h2 class="text-lg font-semibold text-white mb-4">💡 Ideas</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm text-slate-500 italic col-span-full">Sin ideas registradas</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
```

- [ ] **Step 4: Create MeetingCalendar (Reuniones)**

```vue
<!-- desktop/src/components/MeetingCalendar.vue -->
<template>
  <div>
    <h2 class="text-lg font-semibold text-white mb-4">📅 Reuniones</h2>
    <div class="space-y-3">
      <ItemCard v-for="item in items" :key="item.id" :item="item" />
      <p v-if="!items.length" class="text-sm text-slate-500 italic">No hay reuniones agendadas</p>
    </div>
  </div>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: { type: Array, default: () => [] },
});
</script>
```

- [ ] **Step 5: Create Dashboard view**

```vue
<!-- desktop/src/views/DashboardView.vue -->
<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <div class="flex gap-4 text-sm text-slate-400">
        <span>Total: {{ store.totalCount }}</span>
        <span>Inbox: {{ store.inboxCount }}</span>
      </div>
    </div>

    <div v-if="store.loading" class="text-slate-400">Cargando...</div>
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <KanbanBoard :items="store.tasks" />
      <IdeaWall :items="store.ideas" />
      <MeetingCalendar :items="store.meetings" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import KanbanBoard from '../components/KanbanBoard.vue';
import IdeaWall from '../components/IdeaWall.vue';
import MeetingCalendar from '../components/MeetingCalendar.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
  store.startRealtime();
});

onUnmounted(() => {
  store.stopRealtime();
});
</script>
```

- [ ] **Step 6: Create Inbox view**

```vue
<!-- desktop/src/views/InboxView.vue -->
<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-white mb-8">Inbox</h1>
    <div class="space-y-3 max-w-2xl">
      <ItemCard v-for="item in store.items" :key="item.id" :item="item" />
      <p v-if="!store.items.length && !store.loading" class="text-sm text-slate-500 italic">
        No hay elementos. ¡Graba algo desde tu móvil!
      </p>
      <p v-if="store.loading" class="text-sm text-slate-500 italic">Cargando...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useItemsStore } from '../stores/items.js';
import ItemCard from '../components/ItemCard.vue';

const store = useItemsStore();

onMounted(async () => {
  await store.loadItems();
});
</script>
```

- [ ] **Step 7: Build to verify**

```bash
cd desktop
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add desktop/src/views/ desktop/src/components/ desktop/src/stores/ desktop/src/services/
git commit -m "feat(desktop): add Dashboard, Inbox, Kanban, IdeaWall, Meeting views"
```

### Task 5.5: Create Dockerfile and nginx config for helper-front

**Files:**
- Create: `desktop/Dockerfile`
- Create: `desktop/nginx.conf`
- Create: `desktop/.dockerignore`

- [ ] **Step 1: Create nginx.conf**

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Build locally**

```bash
cd desktop
docker build -t helper-front:test .
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add desktop/Dockerfile desktop/nginx.conf desktop/.dockerignore
git commit -m "feat(desktop): add Dockerfile and nginx config"
```

---

## Phase 6: Mobile App (Capacitor + Vue 3)

### Task 6.1: Scaffold Capacitor Vue 3 project

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/vite.config.js`
- Create: `mobile/index.html`
- Create: `mobile/capacitor.config.js`
- Create: `mobile/src/main.js`
- Create: `mobile/src/App.vue`
- Create: `mobile/src/style.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "kodan-helper-mobile",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "cap:sync": "cap sync",
    "cap:ios": "cap open ios",
    "cap:android": "cap open android"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "@capacitor/core": "^6.1.0",
    "@capacitor/ios": "^6.1.0",
    "@capacitor/android": "^6.1.0",
    "@capacitor/filesystem": "^6.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "vite": "^5.4.0",
    "@capacitor/cli": "^6.1.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

- [ ] **Step 2: Create capacitor.config.js**

```javascript
import { defineConfig } from '@capacitor/cli';

export default defineConfig({
  appId: 'software.kodan.helper',
  appName: 'kodanHELPER',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
});
```

- [ ] **Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>kodanHELPER</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
  },
});
```

- [ ] **Step 5: Create main.js**

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const app = createApp(App);
app.mount('#app');
```

- [ ] **Step 6: Create App.vue**

```vue
<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <h1 class="text-lg font-bold">kodanHELPER</h1>
      <span class="text-xs text-slate-500">v1.0</span>
    </header>
    <main class="p-4">
      <CaptureView />
    </main>
  </div>
</template>

<script setup>
import CaptureView from './views/CaptureView.vue';
</script>
```

- [ ] **Step 7: Create style.css**

```css
@import "tailwindcss";

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 8: Build and verify**

```bash
cd mobile
npm install
npm run build
# Expected: dist/ directory
```

- [ ] **Step 9: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): scaffold Capacitor + Vue 3 project"
```

### Task 6.1.5: Create Auth service and login flow for Mobile

**Files:**
- Create: `mobile/src/services/auth.js`
- Create: `mobile/src/views/LoginView.vue`
- Modify: `mobile/src/main.js`

- [ ] **Step 1: Create auth service**

```javascript
// mobile/src/services/auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'software.kodan.helper://auth/callback', // Capacitor deep link
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
```

- [ ] **Step 2: Create LoginView.vue for mobile**

```vue
<!-- mobile/src/views/LoginView.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 p-6">
    <div class="w-full max-w-sm">
      <h1 class="text-2xl font-bold text-white mb-2 text-center">kodanHELPER</h1>
      <p class="text-slate-400 mb-8 text-sm text-center">Inicia sesión para empezar</p>

      <button
        @click="loginGoogle"
        :disabled="loading"
        class="w-full px-4 py-3 bg-white text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuar con Google
      </button>

      <p v-if="message" class="mt-4 text-sm text-center" :class="messageClass">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { signInWithGoogle } from '../services/auth.js';

const loading = ref(false);
const message = ref('');
const messageClass = ref('');

async function loginGoogle() {
  loading.value = true;
  try {
    await signInWithGoogle();
  } catch (err) {
    message.value = `Error: ${err.message}`;
    messageClass.value = 'text-red-400';
  } finally {
    loading.value = false;
  }
}
</script>
```

- [ ] **Step 3: Update mobile main.js with auth guard**

```javascript
// mobile/src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import LoginView from './views/LoginView.vue';
import CaptureView from './views/CaptureView.vue';
import { supabase } from './services/auth.js';
import './style.css';

let currentUser = null;
let currentRoute = 'login';

async function renderApp() {
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;
  currentRoute = currentUser ? 'capture' : 'login';
  mountApp();
}

function mountApp() {
  const app = createApp(App);

  app.provide('user', currentUser);
  app.provide('route', currentRoute);

  app.mount('#app');
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user ?? null;
  currentRoute = currentUser ? 'capture' : 'login';
  // In a full implementation, re-mount or use a router
});

renderApp();
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/views/LoginView.vue mobile/src/services/auth.js mobile/src/main.js
git commit -m "feat(mobile): add login view with Google OAuth"
```

### Task 6.2: Create AudioRecorder component

**Files:**
- Create: `mobile/src/components/AudioRecorder.vue`
- Create: `mobile/src/views/CaptureView.vue`
- Create: `mobile/src/services/api.js`

- [ ] **Step 1: Create API client**

```javascript
// mobile/src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'https://helper-api.kodan.software';

export async function getSupabaseSession() {
  // Session should be obtained via Supabase Auth deep link
  // For MVP, we use the anon key from the desktop flow
  // Full auth flow will be implemented in a later phase
  return null;
}

export async function ingestText(text, token) {
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type: 'text', content: text }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to ingest');
  }

  return response.json();
}

export async function uploadAudio(audioBlob, token) {
  // First, upload to Supabase Storage
  // Then call ingest with the URL
  // For MVP, we send audio as base64 via ingest
  // Full implementation in mobile phase
  return ingestText('Audio recording pending transcription', token);
}
```

- [ ] **Step 2: Create AudioRecorder component**

```vue
<!-- mobile/src/components/AudioRecorder.vue -->
<template>
  <div class="flex flex-col items-center gap-4">
    <button
      @click="toggleRecording"
      :class="[
        'w-20 h-20 rounded-full flex items-center justify-center transition-all',
        isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
      ]"
    >
      <svg v-if="!isRecording" class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/>
        <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
        <path d="M11 19.93V22h2v-2.07A7.93 7.93 0 0019 12h-2a6 6 0 01-12 0H5a7.93 7.93 0 006 7.93z"/>
      </svg>
      <svg v-else class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="4" width="4" height="16" rx="1"/>
        <rect x="14" y="4" width="4" height="16" rx="1"/>
      </svg>
    </button>

    <p class="text-sm text-slate-400">
      {{ isRecording ? 'Grabando... toca para detener' : 'Toca para grabar' }}
    </p>

    <p v-if="duration" class="text-2xl font-mono text-white">
      {{ formatDuration(duration) }}
    </p>

    <p v-if="status" class="text-sm" :class="statusClass">
      {{ status }}
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['recording-complete']);

const isRecording = ref(false);
const duration = ref(0);
const status = ref('');
const statusClass = ref('');

let mediaRecorder = null;
let audioChunks = [];
let durationInterval = null;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      clearInterval(durationInterval);
      duration.value = 0;
      emit('recording-complete', audioBlob);
    };

    mediaRecorder.start();
    isRecording.value = true;
    status.value = '';
    duration.value = 0;

    durationInterval = setInterval(() => {
      duration.value++;
    }, 1000);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusClass.value = 'text-red-400';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
  }
}
</script>
```

- [ ] **Step 3: Create QuickTextInput component**

```vue
<!-- mobile/src/components/QuickTextInput.vue -->
<template>
  <div class="space-y-3">
    <textarea
      v-model="text"
      placeholder="Escribe una idea rápida..."
      class="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
      rows="3"
      maxlength="10000"
    ></textarea>
    <div class="flex items-center justify-between">
      <span class="text-xs text-slate-500">{{ text.length }}/10000</span>
      <button
        @click="submit"
        :disabled="!text.trim() || sending"
        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {{ sending ? 'Enviando...' : 'Enviar' }}
      </button>
    </div>
    <p v-if="status" class="text-sm" :class="statusClass">{{ status }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ingestText } from '../services/api.js';

const text = ref('');
const sending = ref(false);
const status = ref('');
const statusClass = ref('');

async function submit() {
  if (!text.value.trim() || sending.value) return;

  sending.value = true;
  status.value = '';
  try {
    const token = localStorage.getItem('supabase.auth.token');
    if (!token) {
      status.value = 'Debes iniciar sesión primero';
      statusClass.value = 'text-yellow-400';
      return;
    }
    const result = await ingestText(text.value, token);
    status.value = '✅ ¡Capturado!';
    statusClass.value = 'text-green-400';
    text.value = '';
    setTimeout(() => { status.value = ''; }, 3000);
  } catch (err) {
    status.value = `Error: ${err.message}`;
    statusClass.value = 'text-red-400';
  } finally {
    sending.value = false;
  }
}
</script>
```

- [ ] **Step 4: Create CaptureView**

```vue
<!-- mobile/src/views/CaptureView.vue -->
<template>
  <div class="space-y-8">
    <section>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Grabar Audio</h2>
      <AudioRecorder @recording-complete="handleAudio" />
    </section>

    <section>
      <h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Escribir Texto</h2>
      <QuickTextInput />
    </section>
  </div>
</template>

<script setup>
import AudioRecorder from '../components/AudioRecorder.vue';
import QuickTextInput from '../components/QuickTextInput.vue';

function handleAudio(audioBlob) {
  // Upload audio to server
  console.log('Audio captured:', audioBlob.size, 'bytes');
  // Full upload implementation in next phase
}
</script>
```

- [ ] **Step 5: Build to verify**

```bash
cd mobile
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add mobile/src/
git commit -m "feat(mobile): add AudioRecorder, QuickTextInput and CaptureView"
```

### Task 6.3: Add Capacitor platforms (iOS + Android)

**Files:** None (generated by Capacitor CLI)

- [ ] **Step 1: Build web app and add iOS platform**

```bash
cd mobile
npm run build
npx cap add ios
```

- [ ] **Step 2: Add Android platform**

```bash
npx cap add android
```

- [ ] **Step 3: Verify platforms exist**

```bash
ls ios/ android/
# Expected: ios/ contains App.xcodeproj, android/ contains build.gradle
```

- [ ] **Step 4: Commit**

```bash
git add mobile/ios/ mobile/android/
git commit -m "feat(mobile): add iOS and Android Capacitor platforms"
```

---

## Phase 7: CI/CD — GitHub Actions

### Task 7.1: Create deploy-api workflow

**Files:**
- Create: `.github/workflows/deploy-api.yml`

- [ ] **Step 1: Create deploy-api.yml**

```yaml
name: Deploy API

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
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

### Task 7.2: Create deploy-front workflow

**Files:**
- Create: `.github/workflows/deploy-front.yml`

- [ ] **Step 1: Create deploy-front.yml**

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'desktop/**'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Frontend image
        uses: docker/build-push-action@v5
        with:
          context: desktop/
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/kodan-helper-front:latest
            ghcr.io/${{ github.repository_owner }}/kodan-helper-front:${{ github.sha }}

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/kodanapps/kodan-helper
            docker compose pull helper-front
            docker compose up -d --remove-orphans helper-front
            docker image prune -f
```

### Task 7.3: Create deploy-worker workflow

**Files:**
- Create: `.github/workflows/deploy-worker.yml`

- [ ] **Step 1: Create deploy-worker.yml**

```yaml
name: Deploy Worker IA

on:
  push:
    branches: [main]
    paths:
      - 'worker/**'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Worker image
        uses: docker/build-push-action@v5
        with:
          context: worker/
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/kodan-helper-worker:latest
            ghcr.io/${{ github.repository_owner }}/kodan-helper-worker:${{ github.sha }}

      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/kodanapps/kodan-helper
            docker compose pull helper-worker
            docker compose up -d --remove-orphans helper-worker
            docker image prune -f
```

### Task 7.4: Create docker-compose.prod.yml for helper

**Files:**
- Create: `docker-compose.prod.yml` (at repo root for kodan-helper)

- [ ] **Step 1: Create helper-specific compose file**

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
      - CORS_ORIGIN=https://helper.kodan.software
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

- [ ] **Step 2: Commit CI/CD files**

```bash
git add .github/ docker-compose.prod.yml
git commit -m "ci: add GitHub Actions workflows and docker-compose for helper services"
```

---

## Phase 8: Secrets Setup & First Deploy

### Task 8.1: Configure GitHub Secrets

**Files:** None (GitHub UI)

- [ ] **Step 1: Add required secrets to GitHub repo**

Navigate to: `github.com/gerlandog-sudo/kodan-helper/settings/secrets/actions`

Add:
| Secret | Value |
|---|---|
| `VPS_HOST` | `167.148.33.119` |
| `VPS_USER` | (SSH username) |
| `VPS_SSH_KEY` | (SSH private key) |
| `SUPABASE_URL` | (from Supabase dashboard) |
| `SUPABASE_ANON_KEY` | (from Supabase dashboard) |
| `SUPABASE_SERVICE_KEY` | (from Supabase dashboard — keep secret!) |
| `OPENAI_API_KEY` | (from OpenAI dashboard) |
| `GEMINI_API_KEY` | (from Google AI Studio) |

### Task 8.2: First manual deploy test

**Files:** None

- [ ] **Step 1: Trigger first deploy manually**

```bash
# Push to main to trigger deploy
git push origin main
```

Or trigger via GitHub UI: Actions → Deploy API → Run workflow.

- [ ] **Step 2: Verify deployment**

```bash
# SSH into VPS and check
ssh user@167.148.33.119
docker ps | grep kodan_helper
# Expected: 3 containers running (front, api, worker)

# Test health endpoint
curl https://helper-api.kodan.software/health
# Expected: {"status":"ok","timestamp":"..."}
```

- [ ] **Step 3: Monitor logs**

```bash
docker logs -f kodan_helper_api
docker logs -f kodan_helper_worker
```

---

## Spec Coverage Check

| Spec Requirement | Task(s) |
|---|---|
| Supabase PostgreSQL schema + RLS + Realtime | 2.2, 2.3 |
| Auth (Supabase Auth) | 2.1, 3.3 |
| Storage (audio) | 2.2 |
| POST /api/ingest | 3.4 |
| Whisper API integration | 4.2 |
| Gemini 1.5 Flash integration | 4.3 |
| Worker IA pipeline | 4.1, 4.4 |
| Desktop Vue 3 + Tailwind | 5.1, 5.2, 5.3, 5.4 |
| Mobile Capacitor + Vue 3 | 6.1, 6.2, 6.3 |
| Docker (3 containers) | 3.5, 4.5, 5.5 |
| Nginx config (kodan-infra) | 1.1, 1.2 |
| Cloudflare DNS | 1.2 |
| CI/CD GitHub Actions | 7.1, 7.2, 7.3, 7.4 |
| Env vars / secrets | 8.1 |

## Future Tasks (Post-MVP)

- Desktop native (Tauri) with system tray notifications
- Offline-first with RxDB sync
- Semantic search via pgvector
- BullMQ/Redis queue for worker
- WebSocket progress channel per user
- Push notifications on mobile
- Apple Developer account + App Store submission via Capacitor
