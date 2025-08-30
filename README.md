# Fitness Tracker
A lightweight fitness-tracking app with a Go backend (Gin + GORM), Postgres & Redis, and a React (Vite + Tailwind) frontend.

## Overview
Track workouts, exercises, and progress. The backend exposes a REST API with JWT auth; Postgres persists core data, and Redis powers caching, sessions, and rate limiting. The frontend is a responsive SPA built with React, Vite, and Tailwind.

## Tech Stack
- **Backend:** Go, Gin, GORM, JWT
- **Databases:** Postgres, Redis
- **Frontend:** React, Vite, Tailwind CSS
- **Tooling:** Docker Compose
- **External APIs:** OpenAI

## Project Structure

General structure

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
│   │   ├── rbac/
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
│   │   ├── dto/                               # DTOs
│   │   │   ├── mappers.go
│   │   │   ├── ai_dto.go
│   │   │   ├── user_handler.go
│   │   │   └── ...
│   │   ├── handler/                           # Handlers defining routes
│   │   │   ├── helpers.go
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
│       │   ├── service.go                     # Service initialization
│       │   ├── user_service.go                # Service functions
│       │   ├── consent_service.go
│       │   └── ...
│       ├── ai/
│       │   ├── ai_service_test.go             # Go tests
│       │   ├── helpers_test.go
│       │   ├── service.go
│       │   ├── openai.go                      # Callers to OpenAI
│       │   ├── ai_service.go
│       │   └── helpers.go
│       ├── email/
│       │   ├── service.go
│       │   ├── email_service.go
│       │   └── helpers.go
│       ├── rbac/
│       │   ├── service.go
│       │   └── rbac_service.go
│       ├── exercise/
│       │   ├── service.go
│       │   ├── muscle_group_service.go
│       │   └── exercise_service.go
│       └── workout/
│           ├── service.go
│           ├── workout_plan_service.go
│           ├── workout_cycle_service.go
│           └── ...
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
│   │   ├── admin/
│   │   ├── workout/
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx               # Context for authentication
│   ├── forms/
│   │   ├── login/
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── ...
│   │   ├── workout/
│   │   ├── profile/
│   │   ├── admin/
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
│   ├── modals/
│   │   ├── admin/
│   │   ├── workout/
│   │   └── ...
│   ├── pages/
│   │   ├── admin/
│   │   ├── policies/
│   │   ├── workout/
│   │   │   ├── WorkoutPlans.jsx
│   │   │   └── ...
│   │   ├── Home.jsx
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
│   ├── sw.js                             # Service worker (Vite PWA)
│   └── main.jsx
│
├── tests/
│   ├── __mocks__/
│   ├── utils/
│   ├── useWorkoutData.basic.test.jsx
│   └── ...                               # Other tests
│
├── index.html
├── nginx.conf
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js
├── .dockerignore
├── Dockerfile
└── Dockerfile.prod
```

## Constraints

### Workout Plan
- Only one active workout plan per user.
- When a user creates a new plan, it becomes active and other plans are deactivated.

### Workout Cycle
- Structure is essentially a linked list.
- A cycle is considered current if next_cycle_id is nil.
- The first cycle cannot be deleted.
- When a cycle is between two cycles, the service layer bridges prev <-> next.
- If a cycle is the last one, detach next from prev and delete the node.

### Workout
- If the opened cycle has no workouts but the previous cycle does, copy the workouts from the previous cycle into the opened (subject for change - better to move copying to the new cycle creation)

### Workout Exercise


### Workout Set
- Allowed to be empty and may be sent as an empty field to the backend on blur.
- Can be checked only if not null (weight can be 0) and if reps and weight are within the limits.
- When the user changes a value, it should only update the cache and perform soft checks.
- If it's currently checked, send a request to the backend to uncheck it.
- When the user blurs the field, send a request to the backend to update the value (reps or weight); the backend should perform a soft check.
- When an update happens, the backend automatically sets skipped = false and completed = false.
- When the user toggles the checkbox to check it, perform a hard validation.
- Unchecking should happen regardless and be followed by a request to the backend.
