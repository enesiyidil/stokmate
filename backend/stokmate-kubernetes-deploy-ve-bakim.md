# Stokmate – Kubernetes (k3s) Deploy & Bakım Dokümantasyonu

Bu doküman, **Stokmate** uygulamasının **k3s (Kubernetes)** üzerinde deploy edilmesi, GitHub build sonrası rollout alınması, log/debug işlemleri ve **test ortamı için DB reset / SQL çalıştırma** süreçlerini kapsar.

---

## 🔹 Ortam Bilgileri

- **Node IP:** `192.168.1.124`
- **Host:** `tp1k8snode1`
- **SSH User:** `enes`
- **Kubernetes:** k3s
- **Namespace:** `stokmate`

### Deployment’lar
- `stokmate-api` → container: `api`
- `stokmate-frontend` → container: `frontend`
- `stokmate-postgres`
- `stokmate-minio`

---

## 🔹 SSH ile Sunucuya Bağlanma

```bash
ssh enes@192.168.1.124
```

### SSH config (opsiyonel)

```bash
nano ~/.ssh/config
```

```text
Host tp1k8s
  HostName 192.168.1.124
  User enes
```

Bağlanma:
```bash
ssh tp1k8s
```

---

## 🔹 Genel Durum Kontrolleri

```bash
kubectl -n stokmate get all
kubectl -n stokmate get pods -o wide
kubectl -n stokmate get svc
kubectl -n stokmate get deploy
kubectl -n stokmate get pvc
kubectl get nodes -o wide
```

Canlı takip:
```bash
kubectl -n stokmate get pods -w
```

---

## 🔹 Rollout (API & Frontend)

### API

```bash
kubectl -n stokmate set image deployment/stokmate-api api=ghcr.io/enesiyidil/stokmate:latest
kubectl -n stokmate rollout restart deployment/stokmate-api
kubectl -n stokmate rollout status deployment/stokmate-api
```

### Frontend

```bash
kubectl -n stokmate set image deployment/stokmate-frontend frontend=ghcr.io/enesiyidil/stokmate-ui:latest
kubectl -n stokmate rollout restart deployment/stokmate-frontend
kubectl -n stokmate rollout status deployment/stokmate-frontend
```

---

## 🔹 Log & Debug

```bash
kubectl -n stokmate logs deploy/stokmate-api --tail=200
kubectl -n stokmate logs deploy/stokmate-frontend --tail=200
kubectl -n stokmate logs deploy/stokmate-postgres --tail=200
```

Canlı:
```bash
kubectl -n stokmate logs -f deploy/stokmate-api
```

---

## 🔹 PostgreSQL – SQL / Reset

```bash
kubectl -n stokmate exec -it deploy/stokmate-postgres -- psql -U stokmate -d stokmate
```

⚠️ Tüm DB sıfırlama (test):
```bash
kubectl -n stokmate exec -it deploy/stokmate-postgres -- psql -U stokmate -d stokmate -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 🔹 PVC / PV

```bash
kubectl -n stokmate get pvc
kubectl get pv | grep -i stokmate
```

---

## 🔹 Port Forward

```bash
kubectl -n stokmate port-forward svc/stokmate-api 9090:9090
kubectl -n stokmate port-forward svc/stokmate-postgres 5432:5432
```

---

## 🔹 Rollback

```bash
kubectl -n stokmate rollout history deploy/stokmate-api
kubectl -n stokmate rollout undo deploy/stokmate-api
```

---

## 🔹 Günlük Hızlı Akış

```bash
kubectl -n stokmate set image deploy/stokmate-api api=ghcr.io/enesiyidil/stokmate:latest
kubectl -n stokmate rollout restart deploy/stokmate-api
kubectl -n stokmate get pods
kubectl -n stokmate logs deploy/stokmate-api --tail=100
```
