# Good first issues

File these on GitHub after the public monorepo is live. Suggested labels: `good first issue`, `help wanted`.

## 1. Use `getBrandLabel` in OrderDetailsPage selects consistently

Some brand dropdowns still show the raw enum key. Use `getBrandLabel` everywhere.

## 2. Add a Vitest smoke test for `brandConstants`

No frontend tests yet. A single test that `BRANDS` has three entries and labels resolve is enough to start the suite.

## 3. Extract remaining hardcoded Turkish copy behind a small i18n map

Start with Login + About. Do not take on the whole app.

## 4. Expand the `demo` profile

`DemoDataLoader` creates two stores and three products. Add one sample customer and one open order so new clones see a populated dashboard.

## 5. README typo / screenshot pass

After running Compose locally, replace any stale screenshot and fix wording you trip over as a first-time reader.

## 6. Make frontend nginx upstream configurable

Compose uses `backend:9090`. Kubernetes needs a different hostname. An envsubst template would help operators.

## 7. Document role permissions in a table

`Role.java` already encodes capabilities. A `docs/roles.md` table would help contributors.

## 8. Remove unused Vite template leftovers

Hunt leftover example pages such as `ProductsPageExample.tsx` if they are not routed.
