# Velocis

![Velocis Logo](frontend/LightLogo.png)

![Status](https://img.shields.io/badge/status-active_development-0a7ea4)
![Monorepo](https://img.shields.io/badge/monorepo-frontend%2Fbackend%2Finfra-1f6feb)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-proprietary-red)

Live Demo (configured production origin): https://app.velocis.dev  
API Base URL (from API contract): https://api.velocis.dev/v1

## 1. The Header: Brand and Status

Velocis is an autonomous AI engineering platform that plugs into your GitHub repositories and continuously improves quality, reliability, and delivery speed.

## 2. The Elevator Pitch (Description)

Velocis is a full-stack platform for repository intelligence and autonomous engineering workflows. It connects to GitHub, analyzes code and architecture, runs AI-assisted review and QA loops, and gives teams an operational cockpit across risk, pipeline status, service topology, and infrastructure forecasts.  
It is built for teams that want senior-engineer level feedback and automation directly in their SDLC without adding manual process overhead.

Target audience:
- Startup and product engineering teams using GitHub.
- Engineering managers and tech leads responsible for velocity and quality.
- Platform teams building internal developer tooling with AWS serverless patterns.

## 3. Core Features

- GitHub OAuth onboarding with repository discovery and one-click install flow.
- Sentinel agent for PR risk analysis, findings, and multilingual mentor chat.
- Fortress pipeline view with AI-generated QA plans and API documentation flows.
- Cortex service map and timeline for repository topology and dependency visibility.
- Workspace with Monaco editor, repo file explorer, annotations, and AI chat.
- Infrastructure prediction with Terraform output and cost forecast views.
- Dashboard with cross-repo health, activity feed, and system metrics.
- Automation controls per repository (settings, trigger, report).
- GitHub webhook ingestion for push and PR driven event automation.
- Local Lambda-style backend execution through an Express adapter for rapid dev.

## 4. Tech Stack

Frontend:
- React 18 + TypeScript + Vite 6
- React Router 7
- Tailwind CSS v4
- Radix UI primitives + custom UI layer
- Framer Motion + GSAP animations
- Monaco Editor, React Three Fiber / Three.js

Backend:
- Node.js + TypeScript
- Express (local adapter around Lambda handlers)
- AWS SDK v3
- Zod config validation
- Pino logging

Database:
- Amazon DynamoDB (multiple tables for repos, activity, pipeline, cortex, chat, infra, health)

Infrastructure:
- AWS SAM (`backend/template.yaml`) for backend functions and API routes
- AWS CDK TypeScript (`velocis-cdk-infra/`) for infra stack experimentation

Third-party services:
- GitHub OAuth + GitHub API
- Amazon Bedrock (DeepSeek V3 / Llama 3 / Titan embeddings in current backend code)
- Amazon Translate
- AWS API Gateway, Lambda, Step Functions

## 5. Getting Started (Local Development)

### Prerequisites

- Node.js 20+ and npm
- Docker (for local DynamoDB)
- AWS credentials with access to required services
- GitHub OAuth app credentials

### Installation

```bash
git clone https://github.com/yourstartup/repo.git
cd Velocis

cd backend && npm install
cd ../frontend && npm install
cd ../velocis-cdk-infra && npm install
cd ..
```

### Configure environment files

```bash
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env
```

PowerShell equivalent:

```powershell
Copy-Item backend\.env.example backend\.env.development
Copy-Item frontend\.env.example frontend\.env
```

### Start local DynamoDB

```bash
docker run --name velocis-dynamodb -p 8000:8000 amazon/dynamodb-local
```

### Initialize backend tables

```bash
cd backend
npm run init:tables
```

### Run the app

Terminal 1 (backend):

```bash
cd backend
npm run dev
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Default local endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 6. Environment Variables

Use example files:
- `backend/.env.example`
- `frontend/.env.example`

Core variables you must set:

Frontend:
- `VITE_BACKEND_URL` (backend base URL, usually `http://localhost:3001`)

Backend (required for auth/security):
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_OAUTH_REDIRECT_URI`
- `GITHUB_WEBHOOK_SECRET`
- `TOKEN_ENCRYPTION_KEY` (64 hex chars)

Backend (strongly recommended):
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ALLOWED_ORIGINS`
- `FRONTEND_URL`
- `JWT_SECRET`

Notes:
- Main typed env schema lives in `backend/src/utils/config.ts`.
- Some handlers also read legacy table/env names directly (`REPOS_TABLE`, `USERS_TABLE`, etc.), which are included in `backend/.env.example`.

## 7. Project Structure

```text
Velocis/
|-- frontend/                  # React + Vite client app
|   |-- src/app/pages/         # Product pages (dashboard, repo, cortex, workspace, pipeline)
|   |-- src/app/components/    # Shared and feature UI components
|   `-- src/lib/               # API client, auth, theme, helpers
|-- backend/                   # Node/TypeScript API and Lambda handlers
|   |-- src/handlers/api/      # API route handlers
|   |-- src/handlers/webhooks/ # GitHub webhook handlers
|   |-- src/functions/         # Agent logic (sentinel, fortress, cortex, predictor)
|   |-- src/services/          # AWS, GitHub, DB integrations
|   |-- src/utils/             # Config, logging, helpers
|   |-- tests/                 # Backend test files
|   |-- API_CONTRACT.md        # Backend contract doc
|   `-- template.yaml          # AWS SAM template
|-- velocis-cdk-infra/         # CDK stack package
|-- scripts/                   # Utility scripts and asset fetch/generation scripts
`-- CORTEX_IMPROVEMENTS.md     # Product/engineering improvement notes
```

## 8. Testing

Current state:
- `velocis-cdk-infra` has a working Jest setup.
- `backend/tests` contains Jest-style test suites, but backend `npm test` is not wired yet in `backend/package.json`.
- `frontend` currently has no configured automated test runner.

Run available tests/checks:

```bash
cd velocis-cdk-infra
npm test
```

```bash
cd backend
npm run build
```

```bash
cd frontend
npm run build
```

## 9. Contributing Guidelines

Recommended team workflow:

1. Create a branch from `main`:
   - `feature/<short-name>`
   - `fix/<short-name>`
2. Keep commits focused and use conventional-style messages:
   - `feat: add repo settings mutation`
   - `fix: prevent oauth callback loop`
   - `docs: update api contract`
3. Before opening a PR:
   - Build changed packages.
   - Add/update tests where behavior changes.
   - Confirm no secrets are committed.
4. PR process:
   - Open PR to `main`.
   - Include summary, risk level, and test evidence.
   - Require at least one reviewer from affected area (frontend/backend/infra).

## 10. License & Contact

License:
- No top-level `LICENSE` file is currently present.
- Treat this repository as proprietary/closed-source unless a project owner defines otherwise.

Contact:
- Primary path: your internal engineering Slack channel (suggested: `#velocis-eng`).
- Fallback: open an issue in this repo and tag the owning team for the touched area.
