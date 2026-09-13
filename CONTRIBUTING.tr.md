# StokMate’e katkı

Katkın için teşekkürler. Bu depo bir monorepo: `backend/` (Java 17 / Spring Boot) ve `frontend/` (React / Vite).

## Nasıl çalışılır

1. Repoyu fork’layın ve `main` üzerinden bir dal açın.
2. Dal adı işi anlatsın (`fix/login-timeout`, `docs/readme-typo`).
3. Pull request’leri dar tutun. Her PR tek bir konu.
4. Erken geri bildirim için taslak PR açabilirsiniz.

## Backend

```bash
cd backend
cp .env.example .env
docker compose up -d
mvn test
mvn spring-boot:run
```

- Java 17
- `application.properties` içine gerçek sır koymayın
- Mevcut paket düzenine uyun (`controller` / `service` / `domain`)

## Frontend

```bash
cd frontend
cp .env.development.example .env.development
npm install
npm run lint
npm run build
npm run dev
```

- Marka etiketleri ve renkler `src/constants/brandConstants.ts` içinde kalmalı
- Rol etiketleri `src/constants/roles.ts` içinde kalmalı

## Commit mesajları

Dosya listesi değil, nedeni yazın. Örnek: `fix login redirect on expired JWT`.

## Pull request

PR şablonunu doldurun. Ne değişti, nasıl denendi, devamı var mı yazın. Arayüz değişince ekran görüntüsü isteyebiliriz.

## Issue

Hata ve özellikler GitHub Issues üzerinden gider. Güvenlik açıkları için [SECURITY.md](SECURITY.md) kullanın, herkese açık issue açmayın.
