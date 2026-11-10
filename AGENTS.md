# AGENTS.md — KeyringOne Client

Instructions for every AI coding tool used on this repo (Claude Code, Codex, Cursor, Copilot, Windsurf, Gemini CLI, …) and for the humans driving them.

This codebase was built by another team and handed over to us. **Our job is to continue it in their style, not ours.** Every change must look like the previous team wrote it.

---

## 0. Priority Order (when sources disagree)

1. **The existing code around the change**: same file, then same feature folder, then the closest similar feature.
2. **Section 9 of this file** ("RULE.md vs code"), where `docs/RULE.md` has been verified to be wrong.
3. **`docs/RULE.md`**: architecture and conventions written by the previous team.
4. **`docs/logs/<feature>.md`**: feature handoff logs (flows, use cases, validation order, locale keys).
5. Your own preferences or "best practices": **never**, unless the user explicitly asks for them.

Before writing code, open 2–3 existing files that do the same kind of thing (see §2) and copy their shape.

## 1. Read First

- `docs/RULE.md`: full conventions (architecture, hooks, API, web3, Steps/ProcessStepModal, feature module patterns §18, design tokens §18.10).
- The handoff log for the area you touch, in `docs/logs/`:
  - `logLogin.md` (login / wallet auth), `logicCancelWallet.md` (WalletConnect cancel/fail)
  - `multisigPage.md` (multisig), `logDistribute.md` (Distribution Settings), `logAutoDistribute.md` (Auto Swap & Distribution)
  - `logPortfolioMetadata.md` (portfolio metadata), `logHomepage.md` (landing page)
  - `logAddChainRobinhood.md` (adding chain 4663), `logAddChainArc.md` (adding chain 5042), `logRemoveChainAvaxPolygon.md` (removing chains 43114, 137), `logWeb3.md` (RPC fallback), `logNotiAndMaintance.md` (notification & maintenance)
  - `logLending.md` (manual lending page `/lending`)
  - `logManualLimitOrder.md` (Trading page `/trading`: manual limit order, Uniswap v4 hook; not the multisig CoW limit order)

## 2. Reference Implementations (copy these shapes)

| Task | Look at |
|---|---|
| New page / route | `src/app/(auth)/distribution-settings/page.tsx` + `page.client.tsx` |
| Feature folder layout (form + side list + detail) | `src/app/(auth)/distribution-settings/components/` (RULE §18.1) |
| Feature hooks grouped by domain | `src/hooks/distribute/*` |
| API query hook | `src/hooks/distribute/useDistributionSettings.ts`, `src/hooks/useAutoSupplyContracts.ts` |
| On-chain read hook | `src/hooks/useTokenAllowance.ts`, `src/hooks/useHasRequestedLendingAccount.ts` |
| Multi-step transaction (modal) | `src/components/ProcessStepModal` + `src/hooks/distribute/useSetDistributionInfo.ts` |
| Send a transaction | `src/hooks/useSendTransaction.ts` (callbacks: `callbackError` / `callbackPending` / `callbackSuccess`) |
| Public client / contract read | `src/services/web3/index.ts` (`Web3Service.getPublicClient(chainId)`) |
| Modal | `src/components/ModalWrapper` + `usePopup().openPopup({ id, content })` |
| Lending partners / vault data (Aave, Compound, Spark, Morpho) | `src/hooks/useUsdcLendingData.ts` (KeyringOne endpoints `/lending/vaults`, `/lending/rate-history`) + `src/app/(auth)/multisig/components/VaultsList` |
| Lending token address per chain | `config?.addresses?.supplyToken?.[chainId]?.[0]` from `useGlobalConfig()` (CoinPool used `config?.USDC?.[chainId]`, which does not exist here) |

## 3. Code Style — Measured From This Codebase

The numbers below come from `origin/develop` (448 `.ts/.tsx` files). Follow the majority pattern.

### 3.1 Formatting

- Prettier config is in `.prettierrc`: `printWidth: 160`, single quotes, `jsxSingleQuote`, **no semicolons**, 2 spaces, `trailingComma: es5`, `arrowParens: always`.
- Existing files are **not** consistently formatted (about 120 double-quoted imports, about 480 lines ending in `;`). **Do not reformat whole files.** Format only new files and the lines you change, so diffs stay reviewable.
- TypeScript only (`.ts` / `.tsx`). No new `.js` files.

### 3.2 Declarations

- Components and hooks: `export default function Name(...) {}` (288 uses). Avoid `const Name = () => {}; export default Name` (16) and `React.FC` (0).
- Helpers inside a component or hook: `const handleX = async () => {}` arrow functions.
- Types: `type` (153) not `interface` (5). Domain types use an `I` prefix (`IToken`, `IStep`, `IProcessStep`); some local types use a `T` prefix (`TUsdcLending`). Match the neighbouring file.
- Props are typed inline in the signature: `({ data, reset }: { data: TUsdcLending; reset: () => void })`.
- `any` is allowed. ESLint turns `@typescript-eslint/no-explicit-any` off and the code uses it about 750 times. Do not add `eslint-disable` comments for `any`, and do not "fix" existing `any` in code you were not asked to touch.
- Use `BigNumber(x)`, not `new BigNumber(x)` (430 vs 5).

### 3.3 Control Flow

- **Early return / guard clauses** are the dominant style. A braceless single-line guard is common and accepted:
  ```ts
  if (!usdcBalance || !usdcToken) return '0'
  ```
- Use `if` / `else` with braces for two branches. `else if` chains are rare (46 in 448 files); prefer early returns.
- **`switch` is rare (9 uses).** For type dispatch, use a sequence of `if (...) return` (see the `step.type === 'tx'` checks in `ProcessStepModal`, or CoinPool's `lending/components/SupplyUsdc/index.tsx`):
  ```tsx
  if (props.data.type === 'spark') {
    return <SparkSupplyUsdc {...props} />
  }
  if (props.data.type === 'aave-v3') {
    return <AaveSupplyUsdc {...props} />
  }
  return null
  ```
- For per-chain values, use a lookup object keyed by chainId (`Record<number, ...>`), e.g. `ExtraGasLimit[chainId] || 1`.
- JSX conditionals use `cond && <X />` and `cond ? <A /> : <B />`. Avoid nested ternaries.
- Fallbacks use `||` (538) far more than `??` (85): `res?.data || []`, `decimals || 18`. Use `??` only where `0` or `''` must be kept.
- Optional chaining is everywhere (`config?.USDC?.[chainId]`). Keep that defensive style for API and config data.
- Derived values use `useMemo`, and validation is a `useMemo` returning the first error (RULE §18.5).

### 3.4 Async & Errors

- `async/await` with `try { } catch (error) { }` (184). `.then()` is almost unused (6).
- For an inline await that may fail without breaking the flow, use `.catch(() => null)`.
- Service / read helpers catch errors and return a safe value (`'0'`, `null`, `[]`) after `console.log(error, 'functionName-err')`.
- User-facing errors go through `detectErrorText(error, 'defaultTransactionError')` or `callbackErrorNotification(error)` from `@/common/function`.

### 3.5 Comments & Logging

- Comments are sparse and in English. No JSDoc habit. Do not add comments that narrate the code.
- Do not commit new commented-out code or debug `console.log({ ... })`. Do not remove existing logs or comments in code you were not asked to touch.

### 3.6 Imports

- Use the `@/` alias for everything outside the feature folder (about 1,280 uses). Relative `./` and `../` are fine inside a feature folder.
- Import images as modules via `@/assets/...` (which maps to `public/`), never as string paths (RULE §18.8).
- Import only the React hooks you need: `import { useMemo, useState } from 'react'`.

## 4. Data Fetching & API

- The HTTP client is **always** `fetcher()` from `@/services/api`, including external GraphQL/REST (e.g. `fetcher({ url: 'https://api.v3.aave.com/graphql', method: 'POST', body })`). No `axios`, no raw `fetch` in client code.
- Hook pattern (about 120 hook files use `useQuery`; `useMutation` is **never** used):
  ```ts
  export default function useXxx({ chainId, address }: { chainId?: ChainId; address?: string }) {
    return useQuery({
      queryKey: ['xxx-detail', chainId, address],
      queryFn: async ({ queryKey }) => {
        const [, chainId, address] = queryKey as [string, ChainId, string]
        const res = await fetcher({ url: '/xxx', query: { chainId, address }, auth: true })
        return res?.data || []
      },
      enabled: !!chainId && !!address,
    })
  }
  ```
  - `queryKey[0]` is a kebab-case string (101 of 135), followed by every param the query depends on.
  - Destructure params back from `queryKey` inside `queryFn` (87 uses).
  - Return the `useQuery` result directly.
  - Backend responses are read as `res?.data`. Some newer endpoints also check `statusCode === 200`.
- Writes are plain async handlers plus `useSendTransaction` or `ProcessStepModal`, not mutations. After success, refresh with `queryClient.invalidateQueries` (a `predicate` on `queryKey[0]` is common). Use optimistic `setQueriesData` for indexer-backed lists (RULE §18.6).
- Backend base URL comes from `AppConfig.apiUrl`. **KeyringOne has its own backend** (`keyring-one-api…` / `one-api.keyring.app`), which is **not** the CoinPool API. Never assume a CoinPool endpoint exists here; confirm with the backend team.
- Config: `import AppConfig from '@/config'`. Never read `process.env.*` in app code. Environment check: `AppConfig.env === 'production'`.

## 5. Web3

- Reads: `const client = Web3Service.getPublicClient(chainId)`, then `readContract(client, { abi, address: getAddress(x), functionName, args })` from `viem/actions`.
- Writes: `useSendTransaction().sendTransaction({ account, chainId, tx: { to: getAddress(x), data: encodeFunctionData({ abi, functionName, args }) }, callbackError, callbackPending, callbackSuccess, additionalData, traceData })`.
- New multi-step flows use `ProcessStepModal` (RULE §10.1). Existing inline `Steps` flows stay as they are.
- ABIs live in `src/common/constants/abis/*.ts`. Chain and token constants live in `src/common/constants/chain.ts` and `token.ts`.
- Amounts: `parseUnits` / `formatUnits` from viem and `BigNumber` for comparisons. Never use native `number` for token amounts.
- Addresses: always `getAddress()`.
- Use `useAuth()` for `chainId`, `account`, `userAddress`, `activeAddress`, `isDelegatedMode`.

## 6. UI

- Tailwind with arbitrary values (`text-[14px] gap-[8px] rounded-[16px]`), and `classNames()` for conditional classes.
- Prefer the semantic tokens in `tailwind.config.ts` (`text-brand`, `text-muted`, `bg-surface-card`, …) and the design tokens in RULE §18.10. The primary accent is **`#EB2688` (pink)**; the old CoinPool green `#00FFAD` belongs to the previous product.
- Project wrappers: `@/components/Button` (no `variant` prop, pink default, `height='40px'`), `@/components/Image`, `@/components/Loading`, `@/components/PageContainer` (`side` + children), `@/components/ModalWrapper`.
- Antd is imported directly only for small primitives: `Tooltip`, `Dropdown`, `Select`, `Input`, `InputNumber`, `Table`, `Popover`, `Drawer`, `Pagination`, `ConfigProvider`. Buttons always go through `@/components/Button`.
- `styled-components` only for prop-driven styles that Tailwind cannot express. No inline `style={{}}` unless necessary.
- Fonts are locale-aware: never hard-code a font family (RULE §4.4).
- Modals: `openPopup({ id: 'kebab-id', content: <XModal ... /> })`. Never render a modal inline with a condition.
- Clickable cards that contain buttons: `<div role='button' tabIndex={0}>` (RULE §18.4).

## 7. i18n

- Every user-visible string goes through `const { translate } = useTranslate()`, as `translate('feature.key', { variable })`.
- One top-level namespace per feature.
- **Add new keys to all 16 locale files** (`src/locale/languages/en.json` and every file in `sub-languages/`) in the same change.
- HTML in translations is rendered with `dangerouslySetInnerHTML={{ __html: translate(...) }}`, as existing code does.
- Translation round-trip: use `npm run lang:export-v2 -- all` / `npm run lang:import-v2 -- all` (RULE §11.1). The v1 scripts (`generate-language` / `import-language`) silently drop rows containing a real comma and fill them with another locale's text.

## 8. Scope Discipline (hand-over rules)

- Change only what the task needs. No drive-by refactors, renames, reformatting, dependency upgrades, or dead-code cleanup. The repo still contains many legacy CoinPool hooks and components; leave them unless the task is to remove them.
- Do not add new libraries. What already exists: `bignumber.js`, `decimal.js`, `dayjs`, `lodash`, `yup`, `classnames`, `usehooks-ts`, `react-hot-toast`, `chart.js` / `react-chartjs-2`, `motion`, `antd`, `styled-components`.
- There is no test framework in this repo. Do not add one unless asked.
- Package manager: **npm** (the deploy scripts run `npm install --force`). Do not regenerate `yarn.lock` or `bun.lockb`.
- **Porting code from CoinPool** (`bitbucket.org/bacoorteam/coinpool-v2`, the same lineage):
  1. Copy the feature files as-is first.
  2. Adapt only the integration points: shared components that differ here (`Button`, `Steps`, `Explain`, …), backend endpoints and response shapes, the `useGlobalConfig` shape (`/app/template` here vs `/config/addresses` in CoinPool), locale keys (all 16 files), and routes / navigation.
  3. Never overwrite a whole shared file (`chain.ts`, `token.ts`, `en.json`, `useAuth.ts`, `function.ts`, …) with the CoinPool version. Add only the missing symbols or keys.
  4. Record every adaptation in the feature's `docs/logs/` file.

## 9. RULE.md vs Code — Verified Corrections (code wins)

| RULE.md says | Actual code |
|---|---|
| §6.3 `useQueryState<string>('tab', 'overview')` | `useQueryState<T>({ queryKey: 'tab', initialValue: 'overview' })` |
| §7 add `eslint-disable … no-explicit-any` per line | The rule is **off** in `eslint.config.mjs`. Do not add disables. |
| §13 `AppConfig.isProduction` / `isDevelopment` | These do not exist. Use `AppConfig.env === 'production'`. |
| §17 `getTxHashUrl(chainId, txHash)` | `getTxHashUrl(txHash, chainId)` |
| §4.1 `Button` `variant` prop, green `#00FFAD` default | No `variant`. Default background `#EB2688`, `radius` `1000px`. |
| §4.1 "never use raw Ant Design" | Direct imports exist for small primitives (Tooltip, Dropdown, Select, Table, …). Follow §6 above. |
| §4.2 `page.tsx` is always a server component | Mostly true; `portfolio/page.tsx` is `'use client'`. Follow the pattern for new pages. |
| §10 `IStep.status` is `success` / `failed` / `waiting` | Also `completed`. |
| §11 "run locale export/import scripts" | Use the v2 script (`lang:export-v2` / `lang:import-v2`, RULE §11.1). v1's `format-language` needs `prettier` installed globally; it is not in `package.json`. |

When you find another mismatch, fix this table in the same change.

## 10. Git & Delivery

- Base branch: **`develop`**. `main` is stale (last updated 2026-06-26); never branch from it. Release branch: `production`.
- Branch names follow the existing ones: `func/<camelCase>` (e.g. `func/addRobinhoodChain`), `feat/<kebab>`, `hotfix/<camelCase>`.
- Pushing to `develop` / `staging` triggers a deploy (`bitbucket-pipelines.yml`). Never push to them directly without the team lead's approval.
- Commit messages are short English phrases (`fix bug`, `update UI`, `add Top page`). Be a bit more specific: `add lending page`, `fix supply amount validation`.
- Before handing off, all three must succeed: `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- **Feature handoff log** (team convention): create or update `docs/logs/log<Feature>.md` in the same change. Follow the sections of `logDistribute.md`: Route And Entry Points → File Map → State And Flow → APIs → Create/Update Flow → Use Cases (`UC-X1…`) → Validation Rules (ordered table) → Constants → Locale Keys. Add the log to the list in `CLAUDE.md` and §1 of this file.
