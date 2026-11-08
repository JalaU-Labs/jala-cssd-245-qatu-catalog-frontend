# Qatu Marketplace — Catalog Frontend

Frontend catalog page for the Qatu Marketplace that consumes a backend REST API to provide server-side product search and page-based pagination (Previous / Next), with responsive layout for mobile, tablet, and desktop. Built as Activity #2 of Week 6 for Jala University course CSSD-245 (Software Development 4).

## Table of Contents

- [Status](#status)
- [Features](#features)
- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Containerization](#containerization)
- [CI](#ci)
- [Documentation](#documentation)
- [Repositories](#repositories)
- [License](#license)

## Status

Complete. Activity #2 of Week 6 delivered.

## Features

- Server-side product search with a 500 ms debounce.
- Page-based pagination with Previous and Next controls, showing 12 products per page.
- Loading skeletons, an empty state, and an error state with Retry.
- Responsive product grid with one, two, or three columns across mobile, tablet, and desktop layouts.
- Accessibility practices aligned with WCAG 2.1 AA, including semantic landmarks, live regions, keyboard support, and visible focus indicators.

## Stack

| Tool                        | Version      |
| --------------------------- | ------------ |
| Node.js                     | `>=22.0.0`   |
| pnpm                        | `12.17.0`    |
| JavaScript                  | ES2022+      |
| TypeScript (JSDoc checking) | `^5.7.0`     |
| Vite                        | `^7.0.0`     |
| Biome                       | `^2.3.0`     |
| Vitest                      | `^3.2.4`     |
| Vitest coverage (V8)        | `^3.2.4`     |
| Playwright                  | `^1.56.0`    |
| Testing Library DOM         | `^10.4.1`    |
| jsdom                       | `^25.0.1`    |
| Docker                      | `29+`        |
| Docker Compose              | `5+`         |
| Nginx                       | Alpine image |

## Prerequisites

- Node.js 22 or later, as specified by `.nvmrc`.
- pnpm 12.
- Docker 29 or later and Docker Compose 5 or later for a containerized run (optional).
- Access to the Qatu Marketplace backend for live catalog data. The default API URL is `http://localhost:3000`.

## Quick Start

### With pnpm

```bash
pnpm install
pnpm dev
```

The development server is available at `http://localhost:5173`.

### With Docker

```bash
pnpm build
docker build --build-arg VITE_API_BASE_URL=http://localhost:3000 -t qatu-catalog:local .
docker run --rm -p 8080:80 qatu-catalog:local
```

The container serves the catalog at `http://localhost:8080`.

### With Docker Compose

```bash
VITE_API_BASE_URL=http://localhost:3000 docker compose up -d
```

Open `http://localhost:8080`. Stop the service with `docker compose down`.

## Scripts

| Script                 | Description                                                          | When to use                                |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `pnpm dev`             | Starts the Vite development server.                                  | Local development.                         |
| `pnpm build`           | Creates the production static build in `dist/`.                      | Before previewing or containerizing.       |
| `pnpm preview`         | Serves the production build at port 4173.                            | Verify a production build locally.         |
| `pnpm typecheck`       | Checks JSDoc JavaScript types in the app and E2E configuration.      | Before submitting changes.                 |
| `pnpm lint`            | Runs Biome lint checks.                                              | Validate code quality.                     |
| `pnpm lint:fix`        | Applies safe Biome lint fixes.                                       | Resolve automatically fixable lint issues. |
| `pnpm format`          | Formats project files with Biome.                                    | After editing files.                       |
| `pnpm format:check`    | Checks formatting without writing changes.                           | CI and pre-submission verification.        |
| `pnpm check`           | Runs Biome's combined lint and format checks.                        | One-command quality verification.          |
| `pnpm check:fix`       | Runs Biome checks and applies safe fixes.                            | Apply supported combined fixes.            |
| `pnpm test`            | Runs the Vitest suite once.                                          | Unit and integration verification.         |
| `pnpm test:watch`      | Runs Vitest in watch mode.                                           | Iterative test-driven development.         |
| `pnpm test:coverage`   | Runs Vitest with V8 coverage reporting.                              | Review test coverage.                      |
| `pnpm test:e2e`        | Runs the Playwright browser suite.                                   | Verify user-facing flows.                  |
| `pnpm test:e2e:ui`     | Opens the Playwright UI runner.                                      | Inspect and debug E2E tests.               |
| `pnpm test:e2e:report` | Opens the most recent Playwright HTML report.                        | Review E2E results.                        |
| `pnpm screenshots`     | Generates the documentation screenshots from the production preview. | Regenerate report images.                  |

### Deliverable PDF

The lab deliverable PDF is generated from `docs/lab-report.md` using `pandoc` (Markdown to HTML) and Playwright's Chromium (HTML to PDF). It is not committed to the repository; `*.pdf` is gitignored.

```bash
pnpm screenshots   # regenerate the 9 screenshots
pnpm pdf           # regenerate the PDF from the current report
# or in one step:
pnpm screenshots:pdf
```

The output path is `docs/individual-lab-week-6-diego-alejandro-botina-software-development-4.pdf`.

## Environment Variables

| Variable            | Default                 | Applies when           | Notes                                                                                                              |
| ------------------- | ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Build time             | Vite embeds this value into the static bundle. Set it before `pnpm build` or pass it as the Docker build argument. |
| `HOST_PORT`         | `8080`                  | Docker Compose runtime | Optional host port mapped to the container's port 80.                                                              |

## Project Structure

```text
.
├── src/
│   ├── api/
│   ├── components/
│   ├── state/
│   ├── styles/
│   ├── types/
│   └── utils/
├── e2e/
│   ├── helpers/
│   └── app, catalog-search, catalog-pagination, catalog-states, responsive specs
├── docs/
│   ├── lab-report.md
│   └── screenshots/
├── scripts/
│   └── generate-screenshots.js
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── tsconfig.json
├── tsconfig.e2e.json
└── vite.config.js
```

Project configuration also includes Biome, Vitest, Playwright, pnpm, and environment example files.

## Testing

The project has 107 Vitest unit and integration tests covering utilities, API access, components, catalog state, and app composition. Its 16 Playwright E2E tests cover the shell, search, pagination, error states, and responsive layouts. E2E API requests are intercepted with `page.route()` so these tests are deterministic and do not depend on backend availability.

## Accessibility

The interface uses semantic page landmarks, accessible search controls, status and alert live regions, keyboard-operable actions, and visible focus indicators. The project aims to follow WCAG 2.1 AA practices; this is not a formal conformance certification.

## Containerization

The multi-stage Dockerfile builds the static site with Node 22 and serves it using Nginx. Docker Compose maps the container's port 80 to `http://localhost:8080`; Nginx provides a `/healthz` health check. `VITE_API_BASE_URL` is supplied at build time and baked into the bundle.

## CI

Equivalent GitHub Actions and GitLab CI pipelines are planned for the next commit. They will run lint, format checks, type checking, tests, and the production build.

## Documentation

See the [Spanish lab report](docs/lab-report.md) for the Jala University deliverable, architecture decisions, test coverage, and screenshots.

## Repositories

- GitLab (primary): [Jala University, cohort-5, week-06](https://gitlab.com/cohort-5/ES.CSSD-245.GA.T2.26.M2/SD/group-b/individual-laboratories/alejandro-botina/week-06/jala-cssd-245-qatu-catalog-frontend).
- GitHub (mirror): [JalaU-Labs/jala-cssd-245-qatu-catalog-frontend](https://github.com/JalaU-Labs/jala-cssd-245-qatu-catalog-frontend).

## License

MIT © 2026 Diego Alejandro Botina.
