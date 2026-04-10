---
name: Admin Panel — build decisions
description: Key decisions made while building /admin/* — resolver compatibility, shadcn+Tailwind v4 integration, Zod v4 issues
type: project
---

Admin panel built at `/admin/*`. Key decisions:

**Why:** Full CMS for orders, products, users, hub stats, analytics, system health.

**Shadcn + Tailwind v4 conflict:** shadcn components use oklch CSS variables that conflict with H&S design tokens. Solution: use inline `style` props for all color overrides instead of Tailwind classes in admin components.

**Zod v4 + react-hook-form:** `z.coerce.number()` in Zod v4 infers `unknown` input type, causing `@hookform/resolvers` type errors. Solution: cast resolver as `Resolver<ProductFormValues, any>`. Use `standardSchemaResolver` from `@hookform/resolvers/standard-schema` (Zod v4 is Standard Schema compliant).

**shadcn Select `onValueChange`:** Latest shadcn Select passes `string | null` to `onValueChange`. Always use `(v) => v && setState(v)` pattern.

**Recharts formatter types:** Recharts `Tooltip` formatter receives `ValueType | undefined`. Always use `Number(v)` cast inside formatter functions.

**How to apply:** These patterns apply to all future admin UI components. Check these when adding new forms or charts.
