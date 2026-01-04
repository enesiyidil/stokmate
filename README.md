# StokMate Backend

Java 17 / Spring Boot 3 service for stock and sales management.

## Quick start
- Copy `.env.example` to `.env` and update secrets.
- Run `docker-compose up -d` to start PostgreSQL and MinIO.
- Start the app: `mvn spring-boot:run`.
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`.

## Notes
- Admin user auto-created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if no admin exists.
- JWT auth with role-based access (ADMIN, DEPO, USER).
- Storage uses MinIO; invoices are uploaded as objects and parsed with PDFBox.

Further documentation is provided in `docs/http-examples.md`.
