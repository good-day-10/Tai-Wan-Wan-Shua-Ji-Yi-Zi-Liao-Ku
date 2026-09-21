# 台灣玩耍記憶資料庫

一個保存台灣童年遊戲、地方故事與跨世代口述記憶的公開瀏覽與編輯網站。

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/taiwan-memory-archive/src/App.tsx` — 單頁網站、資料模型、瀏覽與編輯流程
- `artifacts/taiwan-memory-archive/src/index.css` — archive 視覺主題、響應式樣式與動態效果
- `artifacts/taiwan-memory-archive/public/archive-reference.png` — 使用者提供的概念參考圖

## Architecture decisions

- 第一版採前端單頁架構，不依賴後端 API。
- 記憶內容以 localStorage 保存，讓編輯結果在重新整理後仍保留。
- 編輯入口以密碼 `00000` 保護，解鎖後提供內容管理介面。

## Product

- 公開瀏覽記憶索引、搜尋與分類篩選。
- 開啟故事詳情與口述內容。
- 以密碼解鎖後編輯網站介紹與記憶、新增收藏、刪除內容、保存或取消修改、鎖定編輯模式。

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
