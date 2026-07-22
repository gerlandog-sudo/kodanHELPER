# kodan-helper

Organizador Inteligente de Ideas, Tareas y Reuniones.
Captura móvil → IA → Panel desktop en tiempo real.

## Repositorios

| Repo | Descripción |
|---|---|
| **kodan-helper** (este) | App monorepo: API, Worker IA, Frontend Desktop y Mobile |
| [kodan-infra](https://github.com/gerlandog-sudo/kodan-infra) | Infraestructura compartida: nginx, Cloudflare tunnel, Docker compose |

## Stack

| Capa | Tecnología |
|---|---|
| **Mobile** | Capacitor + Vue 3 + Tailwind CSS |
| **Desktop** | Vue 3 + Tailwind CSS |
| **Backend API** | Node.js + Express |
| **Worker IA** | Node.js (Whisper + Gemini 1.5 Flash) |
| **Base de Datos** | Supabase (PostgreSQL + Auth + Realtime + Storage) |

## Desarrollo

```bash
# API
cd api && npm install && npm run dev

# Desktop
cd desktop && npm install && npm run dev

# Mobile
cd mobile && npm install && npm run dev
```

## Despliegue

3 contenedores Docker en VPS con `kodan_net`:

```
helper-front:80   → Vue 3 SPA (nginx:alpine)
helper-api:3000   → Node.js API REST
helper-worker     → Node.js IA pipeline
```
