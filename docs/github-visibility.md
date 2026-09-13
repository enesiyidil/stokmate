# GitHub visibility checklist

The local monorepo history has already been rewritten and scanned. It has **not** been force-pushed.

When you explicitly approve overwriting `enesiyidil/stokmate`:

```bash
git push --force-with-lease -u origin main
```

Do this **after** that push lands and a secret scan is clean.

```bash
gh repo edit enesiyidil/stokmate \
  --description "Open-source multi-store inventory, sales and shipment ops — Spring Boot + React" \
  --homepage "https://github.com/enesiyidil/stokmate" \
  --add-topic inventory-management \
  --add-topic warehouse \
  --add-topic spring-boot \
  --add-topic react \
  --add-topic postgresql \
  --add-topic minio \
  --add-topic self-hosted \
  --add-topic pos \
  --add-topic turkish \
  --add-topic mit-license

# Only after the scan is clean:
# gh repo edit enesiyidil/stokmate --visibility public

# Pin on your profile (GitHub UI) and upload docs/screenshots/social-preview.svg
# as the repository social preview image.

# Archive the old UI repo once the monorepo has the frontend history:
# gh repo edit enesiyidil/stokmate-ui --description "Moved to https://github.com/enesiyidil/stokmate"
# gh repo archive enesiyidil/stokmate-ui
```

File the items in [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md) with the `good first issue` label.
