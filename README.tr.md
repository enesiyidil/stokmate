# StokMate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

**Açık kaynak çok mağazalı stok, satış ve sevkiyat uygulaması — Spring Boot + React.**

[English README](README.md)

StokMate, birden fazla mağaza veya depo işleten perakendeciler için self-hosted bir operasyon konsoludur. Stok, müşteri siparişleri, ürün kabul, sevkiyat, tezgah satışı, araçlar, role göre panolar, isteğe bağlı 2FA ile JWT, MinIO üzerinde fatura dosyaları ve PDF teslim tutanaklarını kapsar.

Yaklaşık altı ay üretimde kullanıldı. Müşteriye özel markalar, çatallamanız için jenerik örnek katalogla (`Oak`, `Pine`, `Maple`) değiştirildi.

![Giriş](docs/screenshots/login.svg)

## Özellikler

- Yeniden adlandırabileceğiniz örnek markalarla çok mağazalı stok
- Müşteri siparişleri, depo kabulü, sevkiyat planlama ve teslim
- Tezgah satışı ve ürün arama
- Araçlar, raporlar, notlar ve uygulama içi bildirimler
- Role göre panolar (admin, yönetici, direktör, mağaza, operasyon, lojistik)
- JWT kimlik doğrulama ve isteğe bağlı TOTP 2FA
- MinIO faturaları ve PDF sevkiyat / teslim raporları

## Hızlı başlangıç

Docker ve Docker Compose gerekir.

```bash
git clone https://github.com/enesiyidil/stokmate.git
cd stokmate
cp .env.example .env
docker compose up --build
```

**http://localhost:8080** adresini açın:

- E-posta: `admin@stokmate.local`
- Şifre: `.env` içindeki `ADMIN_PASSWORD` (örnek değeri değiştirin)

Compose varsayılanında `demo` profili boş veritabanına iki örnek mağaza ve üç ürün ekler.

| Servis | Adres |
| --- | --- |
| Arayüz | http://localhost:8080 |
| API / Swagger | http://localhost:9090/swagger-ui/index.html |
| MinIO konsolu | http://localhost:9001 |

**Paylaşılan veya internete açık bir kurulumdan önce `JWT_SECRET`, `ADMIN_PASSWORD` ve veritabanı şifrelerini değiştirin.** SMTP isteğe bağlıdır.

## Yerel geliştirme

**Backend** (Java 17, Maven):

```bash
cd backend
cp .env.example .env
docker compose up -d
mvn spring-boot:run
```

**Frontend** (Node 20+):

```bash
cd frontend
cp .env.development.example .env.development
npm install
npm run dev
```

Vite http://localhost:5173 üzerinden `/api` isteklerini http://localhost:9090 adresine iletir.

## Güvenlik

`.env` dosyalarını ve veritabanı dökümlerini commit etmeyin. Gerçek bir posta şifresi veya JWT sırrı commit edildiyse hemen rotate edin. [SECURITY.md](SECURITY.md).

## Katkı

Katkılar memnuniyetle karşılanır. [CONTRIBUTING.tr.md](CONTRIBUTING.tr.md) ve [davranış kuralları](CODE_OF_CONDUCT.md) dosyalarına bakın. `good first issue` etiketli işler başlangıç için uygundur.

## Lisans

[MIT](LICENSE) © 2026 Enes İyidil
