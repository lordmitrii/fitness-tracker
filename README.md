# Fitness Tracker
A lightweight fitness tracking app with a Go backend (Gin + GORM), Postgres & Redis, and a React (Vite + Tailwind) frontend.

## Overview
Track workouts, exercises, and progress. The backend exposes a REST API with JWT auth, Postgres persists core data, and Redis powers caching/sessions/rate‑limiting. The frontend is a responsive SPA built with React, Vite, and Tailwind.

## Tech Stack
- **Backend:** Go, Gin, GORM, JWT
- **Databases:** Postgres, Redis
- **Frontend:** React, Vite, Tailwind CSS
- **Tooling:** Docker Compose
- **External** APIs: OpenAI

## Project Structure

General Structure

```markdown
.
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── backend/
├── frontend/
│
├── .env.dev
├── .env.prod
├── .gitignore
├── docker-compose.yml
└── docker-compose.prod.yml
```

Backend

```markdown
backend/
├── cmd/server/main.go                        # Entrypoint of the app
├── internal/
│   ├── domain/                                # Domain models, services, use-cases
│   │   ├── email/
│   │   ├── errors/                            # Custom error definitions
│   │   ├── user/
│   │   │   ├── profile.go                     # Domain definition of entity
│   │   │   ├── repository.go                  # Domain definition of repository
│   │   │   └── user.go
|   |   ├── rbac/                             
│   │   └── workout/
│
│   ├── infrastructure/
│   │   ├── db/
│   │   │   ├── postgres/                      # Data layer of the app
│   │   │   │   ├── db.go                      # All migrations and layer assembly
│   │   │   │   ├── seed_rbac.go               # Seeding roles and permissions
│   │   │   │   ├── exercise_repo.go
│   │   │   │   ├── user_repo.go
│   │   │   │   └── ...
│   │   │   └── redis/                         # Rate limiter
│   │   │       └── limiter.go
│   │   ├── email/                             # Email bots, etc.
│   │   │   └── gmail_sender.go
│   │   └── job/                               # Cleanups
│   │       └── cleanup.go
│
│   ├── interface/http/
│   │   ├── handler/                           # Handlers defining routes
│   │   │   ├── ai_handler.go
│   │   │   ├── exercise_handler.go
│   │   │   ├── user_handler.go
│   │   │   └── ...
│   │   ├── middleware/                        # Middlewares of the app
│   │   │   ├── jwt.go
│   │   │   ├── rbac.go
│   │   │   └── rate_limit.go
│   │   └── server.go                          # Server file that registers all handlers
│
│   └── usecase/                               # Service layer of the app
│       ├── contracts.go                       # Definition of service structures
│       ├── user/
│       │   └── service.go
│       ├── ai/
│       │   ├── openai.go
│       │   └── service.go
│       ├── email/
│       │   └── service.go
│       ├── rbac/
│       │   └── service.go
│       └── workout/
│           ├── exercise_service.go
│           └── workout_service.go
│
├── docs/docs.go                               # Swagger, etc.
├── Dockerfile
├── Dockerfile.prod
└── .dockerignore
```

Frontend

```markdown
frontend/
├── public/
│   ├── screenshots/                     # For PWA preview
│   ├── robots.txt
│   ├── favicon.ico
│   └── ...
│
├── src/
│   ├── components/
│   ├── context/
│   │   └── AuthContext.jsx               # Context for authentication
│   ├── forms/
│   │   ├── RegisterForm.jsx
│   │   ├── LoginForm.jsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useConsent.jsx
│   │   ├── useNetworkBanner.jsx
│   │   └── ...
│   ├── icons/
│   │   ├── AddIcon.jsx
│   │   ├── CheckIcon.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── Footer.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx                    # Layout of the pages
│   ├── locales/                          # Translations
│   │   ├── en/
│   │   ├── ru/
│   │   └── zh/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── WorkoutPlans.jsx
│   │   └── ...
│   ├── states/                           # Pages showing states
│   │   ├── ErrorState.jsx
│   │   ├── LoadingState.jsx
│   │   └── GlobalLoadingState.jsx
│   ├── styles/
│   │   └── index.css
│   ├── utils/                            # Helpers
│   ├── api.js                            # Axios interceptors, etc.
│   ├── App.jsx                           # Routes, etc.
│   ├── i18n.js
│   └── main.jsx
│
├── index.html
├── nginx.conf
├── package.json
├── package-lock.json
├── vite.config.js
├── .dockerignore
├── Dockerfile
└── Dockerfile.prod
```