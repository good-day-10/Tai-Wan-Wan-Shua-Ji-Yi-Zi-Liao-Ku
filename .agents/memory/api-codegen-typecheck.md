---
name: API code generation type checks
description: Environment-specific type-checking constraints for generated API clients and shared database schemas.
---

Generated API clients can use `Headers.entries()`, so the consuming package's TypeScript library list must include DOM iterable definitions. Database schema packages should prefer Drizzle's inferred insert types when `drizzle-zod` and the workspace's Zod major version are not aligned.

**Why:** Code generation can succeed while the workspace type build fails on generated browser types or incompatible Zod internals.

**How to apply:** When changing the OpenAPI contract, run codegen and `typecheck:libs` before consumer package checks so declaration output is fresh; resolve generated-client lib requirements in the package tsconfig and keep schema typing independent of a mismatched Zod runtime.