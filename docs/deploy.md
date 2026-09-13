# Deploying StokMate

This guide stays generic on purpose. It does not include private hosts, LAN addresses, or operator accounts.

## Docker Compose (recommended)

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

- UI: http://localhost:8080
- API / Swagger: http://localhost:9090/swagger-ui/index.html
- MinIO console: http://localhost:9001

Change `JWT_SECRET`, `ADMIN_PASSWORD`, and database credentials in `.env` before any shared environment.

## Kubernetes

Build and push the images, then create:

1. A namespace
2. Secrets for `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_PASSWORD`, MinIO keys, and optional SMTP
3. Deployments for `stokmate-backend` (port 9090) and `stokmate-frontend` (port 80)
4. A Service so the frontend can reach the backend as `http://<backend-service>:9090`
5. Ingress or a load balancer in front of the frontend

The frontend nginx config in this repository proxies `/api/` to the Compose service name `backend`. For Kubernetes, rebuild the image with a matching upstream (ConfigMap + envsubst, or a small nginx template).

## Existing databases

Flyway is **off** by default (`FLYWAY_ENABLED=false`) because the app also uses Hibernate `ddl-auto=update`. If you enable Flyway against a database that still stores the old brand codes (`DOGTAS`, `LOVA`, `KELEBEK`), migration `V22__rename_sample_brands.sql` maps them to `OAK`, `PINE`, and `MAPLE`.
