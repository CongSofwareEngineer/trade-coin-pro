# Changelog — Rebalance Version (Home)

## 2026-11-10
+ Tách logic rebalance khỏi page.tsx → class: `RebalanceHelper` (base) + `RebalanceV1` / `RebalanceV4` / `RebalanceV5 extends RebalanceV4` (helpersBase.ts, helpersV1.ts, helpersV4.ts, helpersV5.ts)
+ `getRebalanceHelper(version, config)` thay toàn bộ `if (isV4)` trong page; page chỉ còn `helper.run(arr)` + `helper.formatPrice(price)` (helpers.ts, page.tsx)
+ Fix: v4/v5 trước đây chạy `checkToSwap` (v1) rồi mới `checkToSwapV4` ghi đè → v1 vẫn ghi rớt `est_*`/`outputSwap` vào hàng. Nay mỗi version chạy 1 lần (helpersBase.ts)
+ State strategy (`amountInput`, `ETHLastSwap`, `ETHLastSwapTemp`, `perETHOriginal`, `ETHOriginalAmount`, `price1Point`) localStorage → field của class, reset mỗi `run()` → không dính state lần chạy trước (helpersBase.ts)
+ Bỏ `setTimeout(500)` khi analyze, `run()` chạy sync (page.tsx)
+ `deepClone` import từ `index.ts` (node sim, import vào browser là chạy luôn sim v1) → `cloneData` của `@/utils/functions` (page.tsx, helpersBase.ts)
+ Log strategy thêm prefix `[v1]/[v4]/[v5]` để tách log từng version khi debug (helpersBase.ts)
+ Verify: V4 class vs `indexV4.ts` trên `DATA_V4` = 11 swap, trùng index; V1 class vs `index.ts` trên `DATA_FAKE` = 30 swap, trùng index
+ Thêm option `v5`: chạy đúng logic v4, nhưng khi load file mỗi ô giá token `+0.05` (`PRICE_OFFSET_V5`) (page.tsx)
+ `isV4` flag: `version === 'v4'` → `version !== 'v1'` nên v5 dùng chung initData/calculateData của v4 (page.tsx)
+ Fix: select version bị lặp 2 `option v4` → `v4` + `v5` (page.tsx)
+ Thêm `getRebalanceSummary(res, config)`: start amount / end amount + giá trị USD 2 đầu (giá item đầu cho token in, item cuối cho token out) → P/L USD + % (helpers.ts, page.tsx)
+ Results Analysis hiện block Summary: Start/End amount kèm $, Profit/Loss USD xanh khi lời đỏ khi lỗ (page.tsx)
