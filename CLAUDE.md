# Trade Coin Pro — Agent Context

Next.js 15 (App Router, Turbopack) + React 19 + TypeScript tool for **backtesting and monitoring crypto trading
strategies**: multi-token rebalance simulation (v1 / v4), DCA strategy simulators (v1 / v2 / v3), a live DCA bot
dashboard, and Uniswap v4 pool quoting on Base.

There is no `docs/RULE.md` in this repo. **This file is the single source of truth** for project context, conventions
and rules. `AGENTS.md` in the repo root was copied from another project (KeyringOne / CoinPool) and does **not**
describe this codebase — ignore it unless it is rewritten for Trade Coin Pro.

---

## 0. Priority Order (when sources disagree)

1. **The existing code around the change**: same file, then same route folder, then the closest similar route.
2. **This file.**
3. Your own preferences or "best practices": **never**, unless the user explicitly asks for them.

Before writing code, open 1–2 existing files that do the same kind of thing (see §2) and copy their shape.

## 1. Commands

```bash
npm run dev      # next dev --turbopack
npm run build    # next build --turbopack (ESLint is skipped during build: next.config.ts)
npm run start
npm run lint     # eslint
npm run test     # tsx index.ts    → v1 rebalance simulation over dataDake.ts
npm run testV4   # tsx indexV4.ts  → v4 rebalance simulation over DATA_V4.ts
npx tsc --noEmit # type check (no npm script for it)
```

Package manager: **npm** (`package-lock.json` is the real lockfile; `yarn.lock` is stale — do not regenerate it).

## 2. Map Of The Code

Path alias: `@/*` → repo root (`tsconfig.json`). There is no `src/`.

| Area | Where |
|---|---|
| Routes (App Router) | `app/*/page.tsx` |
| Route-local logic | `app/<route>/helpers.ts` \| `hepers.ts` (typo is pre-existing) + `app/<route>/type.ts` |
| API route handlers | `app/api/token/[...params]/route.ts`, `app/api/secure/{encrypt,decrypt}/route.ts` |
| React Query hooks | `hooks/tank-query/*` (`useUserConfig`, `useTradeHistory`, `useTokenPrice`) |
| HTTP client | `configs/fetcher/index.ts` (+ `type.ts`) |
| Services | `services/SecureApi`, `services/Storage` (localStorage), `services/ClientApi` (empty stub) |
| Server cookies | `Cookie/index.ts` (`'use server'`, `next/headers`) |
| Constants | `constants/{app,reactQuery,storage,cookie}.ts` |
| Config | `configs/{app,fonts,images}.ts` |
| Shared types | `types/app.ts` (`Token`, `PoolToken`, `ETHLastSwapTemp`) |
| Utils | `utils/functions` (`lowercase`, `cloneData`), `utils/crypto` (AES/PBKDF2 via crypto-js) |
| Components | `components/ReactQueryProvider`, `components/ShowCode` (Monaco viewer) |
| Uniswap v4 web3 | `app/uni/utils.ts` (`PoolV4Web3` class) + `app/uni/constants.ts` (ABIs, addresses) |
| Node simulations | `index.ts` (v1, exports `deepClone`), `indexV4.ts` (v4) |
| Fixture data | `dataDake.ts` (`DATA_FAKE`), `DATA_V4.ts` (`DATA_V4`) — ~12.6k lines each, never reformat |

### Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Multi-token rebalance backtest (v1 / v4), xlsx upload, localStorage state |
| `/dca` | `app/dca/page.tsx` | DCA backtest v1 |
| `/dca-v2` | `app/dca-v2/page.tsx` | DCA backtest v2 |
| `/dca-v3` | `app/dca-v3/page.tsx` | DCA backtest v3 (`DcaHelper` class) |
| `/trade-info` | `app/trade-info/page.tsx` | Live DCA bot dashboard (user configs, trade history, PnL) |
| `/get-histories` | `app/get-histories/page.tsx` | Pull historical prices through `/api/token/*` |
| `/uni` | `app/uni/page.tsx` + `client.tsx` | Uniswap v4 pool state / quotes on Base (client-only gate) |
| `/secure` | `app/secure/page.tsx` | Encrypt / decrypt helper UI on top of `/api/secure/*` |

### Reference Implementations (copy these shapes)

| Task | Look at |
|---|---|
| New route | `app/trade-info/page.tsx` (`'use client'` page) or `app/uni/page.tsx` (client gate + `client.tsx`) |
| Route with heavy logic | `app/dca-v3/page.tsx` + `app/dca-v3/hepers.ts` + `app/dca-v3/type.ts` |
| React Query hook | `hooks/tank-query/useTokenPrice.ts`, `hooks/tank-query/useTradeHistory.ts` |
| API route | `app/api/secure/encrypt/route.ts` (origin allow-list + try/catch + `new Response`) |
| On-chain read | `app/uni/utils.ts` (`PoolV4Web3.getClient`, `readContract`) |
| Node-side strategy run | `indexV4.ts` |

## 3. Code Style — Measured From This Codebase

49 tracked `.ts/.tsx` files. Follow the majority pattern.

### 3.1 Formatting

- Prettier runs **through ESLint** (`prettier/prettier` rule in `eslint.config.mjs`), there is no `.prettierrc`:
  `printWidth: 150`, **no semicolons**, single quotes, `jsxSingleQuote`, `trailingComma: es5`, 2 spaces, `endOfLine: lf`.
- `eslint.config.mjs` itself is double-quoted and semicolon'd; leave it that way.
- `import/order` is enforced with `newlines-between: always`: type → builtin → object → external → internal → parent →
  sibling → index. Route-local imports (`./type`, `./hepers`) come before `@/` imports in existing files.
- `padding-line-between-statements`: blank line before every `return`, and after a `const`/`let` block.
- `react/jsx-sort-props` is on (reserved first, shorthand first, callbacks last, alphabetical).
- **Do not reformat whole files.** Format only new files and the lines you change. Never touch `dataDake.ts` / `DATA_V4.ts`.
- TypeScript only. No new `.js` files (`stubs/empty.js` is a webpack stub).

### 3.2 Declarations

- Components and hooks: `const Name = (...) => {}` + `export default Name` is the dominant shape
  (`useUserConfig`, `useTokenPrice`, `DCA`, `TradeInfoPage`, `UniPage`, `ReactQueryProvider`).
  `export default function Home()` also exists; match the neighbouring file. No `React.FC`.
- A named export hook exists too (`export const useTradeHistory`). Either is accepted.
- Helpers inside a component: `const handleX = async () => {}`.
- Types: `interface` (29) and `type` (12) are both used. Props/params are typed inline:
  `({ idUser, page = 1, limit = 20 }: UseTradeHistoryParams)`. Route-local types live in `app/<route>/type.ts`.
- Pure-logic helper collections are `class X { static ... }` (`DcaHelper`, `PoolV4Web3`, `SecureApi`).
- `any` is used freely (28 annotations); `@typescript-eslint/no-explicit-any` is not enabled. Do not add
  `eslint-disable` comments for it, and do not "fix" existing `any` in code you were not asked to touch.
- Use `BigNumber(x)`, not `new BigNumber(x)` (286 vs 0). Import as `import { BigNumber } from 'bignumber.js'`.

### 3.3 Control Flow

- **Early return / guard clauses** dominate, braceless single-line guards included:
  ```ts
  if (!idUser) return null
  ```
- Money/price math is **always** `BigNumber` (`.lt`, `.gt`, `.plus`, `.minus`, `.div`, `.multipliedBy`,
  `.toFixed(DECIMAL)`), never raw `number` arithmetic.
- Fallbacks use `||` (`res?.data || []`, `data?.pagination?.totalPages || 1`). Optional chaining everywhere for
  API shapes. Use `??` only where `0` or `''` must be kept.
- Derived values use `useMemo`; mutable loop/iteration state uses `useRef` (`arrCloneRef`, `indexCurrentRef`).
- JSX conditionals: `cond && <X />` and `cond ? <A /> : <B />`. Avoid nested ternaries.

### 3.4 Async & Errors

- `async/await` with `try { } catch (error) { }` (28). `.then()` is effectively unused.
- Service / read helpers catch, `console.error(...)` or `console.log(...)`, and return a safe value
  (`null`, `''`, `[]`, `false`) — see `Cookie/index.ts`, `services/SecureApi`, `utils/crypto`.
- API routes return `new Response(JSON.stringify({ ... }), { status })`; errors → `status: 500`, blocked origin → `403`.
- `fetcher` returns `null` on failure unless `throwError: true`.

### 3.5 Comments & Logging

- Comments are sparse, English or Vietnamese — both exist. No JSDoc habit (except `services/SecureApi`).
- `console.log` is used heavily for debugging strategy runs (109 uses) and `no-console` is commented out in ESLint.
  Still: do not add new noisy `console.log` in code you were not asked to touch, and do not remove existing logs
  or commented-out blocks you were not asked to touch.

### 3.6 Imports

- Use `@/` for anything outside the current route folder. Relative `./` / `../` inside a route folder.
- Import only the React hooks you need: `import { useMemo, useState } from 'react'`.
- Images are plain public paths from `configs/images.ts` (`/assets/images/...`), not imported modules.

## 4. Data Fetching & API

- The HTTP client is **`fetcher()` from `@/configs/fetcher`**, including external APIs (full URL is allowed and used).
  Options: `url`, `baseUrl`, `method`, `query`, `body`, `auth` (`true` → access-token cookie, or a token string),
  `throwError`, `headers`, `fromBacoor`. It returns `{ statusCode, data, message } | null`; read `res?.data`.
  Only `services/SecureApi` uses raw `fetch` (same-origin `/api/secure/*`) — keep that as is.
- React Query hooks live in `hooks/tank-query/` and are the only data-fetching layer. `useMutation` is **never** used.
  ```ts
  const getData = async ({ queryKey }: { queryKey: any }) => {
    const [, idUser, page, limit] = queryKey
    if (!idUser) return null

    const res = await fetcher({ url: `${BASE}/dca/all?idUser=${idUser}&page=${page}&limit=${limit}` })

    return res?.data?.data || null
  }

  const useXxx = ({ idUser }: { idUser?: string }) => {
    const { data, isLoading, refetch } = useQuery({ queryKey: [QUERY_KEY.Xxx, idUser], queryFn: getData, enabled: !!idUser })

    return { data, isLoading, refetch }
  }
  ```
  - `queryKey[0]` is **always** a `QUERY_KEY.*` constant from `@/constants/reactQuery` — add new keys there, never inline strings.
  - Destructure params back from `queryKey` inside the query fn, or close over them (`useTokenPrice` does the latter).
  - Hooks return a **flattened object** (`{ data, isLoading, refetch, ...helpers }`), not the raw `useQuery` result.
  - `enabled: !!param` for every dependent query. Writes are plain async handlers; refresh with `refetch()`.
- `QueryClient` defaults live in `components/ReactQueryProvider` (`retry: 1`, `networkMode: 'online'`).
- The DCA bot backend is the Koyeb host hard-coded in `hooks/tank-query/*`
  (`https://exuberant-jade-diencong-6e4aa722.koyeb.app`, endpoints `/dca/all`, `/dca/price`, `/user-dca/all`).
  There is no API base-URL config yet; if you add one, put it in `configs/app.ts` and update all three hooks.
- CoinMarketCap-style price history is proxied through `app/api/token/[...params]/route.ts` to Binance's public
  `bapi/composite/...` endpoint — the browser must call `/api/token/...`, never the upstream directly.
- Env vars: typed in `environment.d.ts` (`NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`,
  `NEXT_PUBLIC_PRIVATE_KEY`). `utils/crypto` also reads server-only `KEY_CRYPTO_IV_ENCODE`. Never log or expose
  secret env values, and never move crypto code out of the server (`app/api/secure/*`, `utils/crypto`).

## 5. Web3

- Library stack: **viem** + `@uniswap/sdk-core`, `@uniswap/v3-sdk`, `@uniswap/v4-sdk`, `@uniswap/smart-order-router`.
  No wagmi, no ethers, no wallet connector — everything is read-only public-client work.
- Reads go through `PoolV4Web3` in `app/uni/utils.ts`: `createPublicClient({ batch: { multicall: true }, chain, transport: http(rpc) })`,
  then `readContract(client, { abi, address, functionName, args })`. Chain is **Base** (`viem/chains`), RPC
  `https://base-rpc.publicnode.com`. `CHAIN_ID_DEFAULT = 56` in `constants/app.ts` is used by the non-Uniswap parts.
- ABIs and pool/router addresses live in `app/uni/constants.ts` (`POOL_MANAGER_ABI`, `QUOTER_V4_ABI`, `UNI_V4`).
- Amounts: `parseUnits` / `formatUnits` from viem, `BigNumber` for comparisons. Never native `number` for token amounts.
- Addresses are typed `` `0x${string}` `` / viem `Address`.

## 6. UI

- **Tailwind v4** via `@import "tailwindcss"` in `app/globals.css` — there is no `tailwind.config.ts`. Theme tokens are
  CSS variables in `@theme inline` (`--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`).
- The app is dark-only: `<body className='antialiased !bg-black'>` plus a global `div { color: white !important }` in
  `globals.css`. Custom scrollbar helpers (`.custom-scrollbar`) live there too.
- Utility classes are written inline, arbitrary values included (`text-[14px] gap-[8px] rounded-[16px]`).
  There is no `classnames` dependency — build conditional classes with template strings / arrays, as existing pages do.
- No component library (no antd, no styled-components). Inputs, tables and modals are hand-rolled per page with
  local `useState` (`isSettingsModalOpen` in `/trade-info`). Keep shared pieces in `components/<Name>/index.tsx`.
- Fonts come from `configs/fonts.ts` (`rubik`, `dinBlack`); `globals.css` currently forces Arial on `body`.
- No i18n layer: user-visible strings are written inline in JSX (English and Vietnamese both appear). Do not
  introduce a translation library unless asked.

## 7. Scope Discipline

- Change only what the task needs. No drive-by refactors, renames, reformatting, dependency upgrades or dead-code
  cleanup. The repo still holds experiments and stale code (`services/ClientApi` empty class, unused keys in
  `constants/storage.ts`, KeyringOne leftovers in `configs/images.ts`, the `hepers.ts` filename typo) — leave them
  unless removing them is the task.
- Do not add new libraries. Already available: `bignumber.js`, `lodash`, `viem`, `@tanstack/react-query`, Uniswap SDKs,
  `xlsx` (SheetJS CDN tarball), `crypto-js`, `@monaco-editor/react`, `next-sitemap`.
- There is no test framework in this repo (`npm run test` runs the `index.ts` simulation). Do not add one unless asked.
- `index.ts` / `indexV4.ts` and the matching page logic are **parallel implementations** of the same strategy. If a
  task changes strategy rules, say explicitly which side you changed and whether the other side still matches.

## 8. Git & Delivery

- Base branch: **`main`** (remote `github.com:CongSofwareEngineer/trade-coin-pro`). There is no `develop` here.
- Branch names: `func/<camelCase>`, `feat/<kebab>`, `hotfix/<camelCase>`.
- Commit messages are short English phrases (`fix ui`, `fix dca`, `fix get price`). Be a bit more specific:
  `fix dca v3 step size`, `add trade history pagination`.
- Commit or push only when asked. Before handing off, both must pass: `npm run lint` and `npx tsc --noEmit`
  (`npm run build` skips ESLint but must also succeed for build-affecting changes).
- **Feature log** (team convention): when you add or substantially change a feature, create or update
  `docs/logs/log<Feature>.md` in the same change (create `docs/logs/` if missing), and list it in §9 below.
  Sections: Route And Entry Points → File Map → State And Flow → APIs → Flow → Use Cases (`UC-X1…`) →
  Validation Rules (ordered table) → Constants.

## 9. Feature Logs

None yet. Add entries here as `docs/logs/log<Feature>.md` files are created.

## 10. Logic Changelog (required)

Every change to **logic** must be recorded in `docs/changelog/` (create the folder if it does not exist).

- **Logic only.** Hooks, services, constants, data flow, validation, web3 calls, query keys / refetch, strategy and
  business rules. Pure UI changes (layout, styling, text, icons) do **not** need an entry.
- **One file per logic area**, named after that logic in camelCase: `docs/changelog/<logicName>.md`
  (e.g. `reactQuery.md`, `dcaV3Strategy.md`, `uniV4Quote.md`). If the file already exists, append to it; otherwise create it.
- **One section per day**: `## YYYY-MM-DD`. If the logic is changed several times on the same day, add lines to that
  day's existing section. Never create a second section for the same date. Newest day on top.
- **One short `+` line per change**: a brief, plain explanation the team can read in seconds: what changed and its
  effect. Short but complete; no long sentences.
  - Use abbreviations or a tiny code snippet whenever that is clearer or shorter (`10s → 3s`, `` `refetch` ``, `tx`).
  - End with the file in brackets: `(useX.ts)`.
  - Bad (raw diff): `` + `useX.ts`: refetchInterval 10 * 1000 → TIME_REFETCH_INTERVAL.X ``
  - Bad (too long): a multi-sentence paragraph explaining the whole flow.
  - Good: `+ Trade history poll 10s → 3s, dashboard sees new trades faster (useTradeHistory.ts)`
- Pure refactors with no behaviour change: one grouped line starting with `Refactor, no behaviour change:`.

Template:

```md
# Changelog — <Logic Name>

## 2026-11-10
+ <what changed> → <effect> (<file.ts>)
+ Fix: <what was wrong> → <now> (<file.ts>)

## 2026-11-08
+ ...
```
