# StokMate HTTP Examples

Use `Authorization: Bearer <token>` for protected endpoints.

## Auth
- `POST /api/auth/login` body:
```json
{"email":"admin@stokmate.local","password":"admin123"}
```
- `POST /api/auth/register` body:
```json
{"email":"user@stokmate.local","role":"USER"}
```
- `POST /api/auth/login-otp` body:
```json
{"email":"user@stokmate.local","code":"123456"}
```
- `POST /api/auth/me/password` (Bearer zorunlu):
```json
{"newPassword":"StrongPass123"}
```
- `POST /api/auth/forgot-password`:
```json
{"email":"user@stokmate.local"}
```
- `GET /api/users/me` (Bearer)
- `PUT /api/users/me`:
```json
{
  "firstName": "Test",
  "lastName": "User",
  "phone": "+90500...",
  "address": "Street 1, City"
}
```

## Products
- `POST /api/products` (ADMIN/DEPO):
```json
{
  "name":"Sample Product",
  "code":"P-1001",
  "description":"Demo",
  "brand":"BrandX",
  "activeForSale":true,
  "stockQuantity":10,
  "vatRate":20,
  "unitPrice":150,
  "customerOwned":false,
  "currency":"TRY",
  "keywords":["demo","sample"]
}
```
- `POST /api/products/{id}/stock/increase`:
```json
{"quantity":5,"reason":"New shipment"}
```
- `GET /api/products/search?q=demo`

## Invoices
- `POST /api/invoices/upload` multipart: `file=@invoice.pdf`
- `GET /api/invoices/{invoiceId}/lines`
- `POST /api/invoices/{invoiceId}/lines/{lineId}/match-product/{productId}`
- `POST /api/invoices/{invoiceId}/lines/{lineId}/create-product-and-match`:
```json
{"name":"New Product","code":"NP-1","vatRate":20,"unitPrice":100,"customerOwned":false}
```

## Sales
- `POST /api/sales`:
```json
{
  "customerId": null,
  "note":"POS sale",
  "items":[{"productCode":"P-1001","quantity":2}]
}
```
- `GET /api/sales?start=2025-01-01&end=2025-01-31`

## Customers
- `POST /api/customers`:
```json
{"firstName":"Ali","lastName":"Veli","phone":"+905001112233","email":"customer@test.com"}
```

## Requests
- `POST /api/requests`:
```json
{"type":"GENERAL","message":"Need stock review"}
```
- `PUT /api/requests/{id}/status` (ADMIN):
```json
{"status":"IN_PROGRESS"}
```

## Reports
- `GET /api/reports/sales?start=2025-01-01&end=2025-02-01`

## WhatsApp Integration
- `POST /api/integrations/whatsapp/query`:
```json
{"text":"show me brandx"}
```
