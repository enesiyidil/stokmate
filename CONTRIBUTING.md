# Contributing to StokMate

Thanks for helping. This repository is a monorepo: `backend/` (Java 17 / Spring Boot) and `frontend/` (React / Vite).

## How to work

1. Fork the repo and create a branch from `main`.
2. Use a descriptive branch name (`fix/login-timeout`, `docs/readme-typo`).
3. Keep pull requests focused. One concern per PR.
4. Open a draft PR early if you want feedback.

## Backend

```bash
cd backend
cp .env.example .env
docker compose up -d
mvn test
mvn spring-boot:run
```

- Java 17
- Do not add real secrets to `application.properties`
- Prefer constructor injection and existing package layout (`controller` / `service` / `domain`)

## Frontend

```bash
cd frontend
cp .env.development.example .env.development
npm install
npm run lint
npm run build
npm run dev
```

- Brand labels and colors belong in `src/constants/brandConstants.ts`
- Role labels belong in `src/constants/roles.ts`

## Commit messages

Write the reason, not a file list. Examples: `fix login redirect on expired JWT`, `docs: add compose ports to README`.

## Pull requests

Use the PR template. Describe what you changed, how you tested it, and any follow-up. Maintainers may ask for a screenshot when the UI changes.

## Issues

Bugs and features go through GitHub Issues. Security problems go through [SECURITY.md](SECURITY.md), not a public issue.
