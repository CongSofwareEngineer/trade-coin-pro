# Changelog — Rebalance V4 Node Sim (indexV4.ts)

## 2026-11-13
+ Viết lại `indexV4.ts` theo đúng logic v4 của `app/helpersV4.ts` + `helpersBase.ts`, nhưng standalone: tự khai báo type + hàm, chỉ import `bignumber.js` và `DATA_V4` (để chạy bên server) (indexV4.ts)
+ `normalizeSymbol` uppercase toàn bộ symbol ngay khi nhận data; mọi so sánh / key (`ETHLastSwap`, `perETHOriginal`, `price1Point`) dùng `uppercase(symbol)` (indexV4.ts)
+ Tách `initData` (perETH, perETHChangePercentage, changeByPoint, price1Point) khỏi `calculateData` (point + swap) như base, thay vì interleave trong `formatData` (indexV4.ts)
+ `getTokenETH` nhận `ETH`/`WETH`, `getTokenBTC` nhận `BTC`/`CBBTC`/`WBTC` như base, thay vì so sánh cứng `=== 'ETH'` (indexV4.ts)
+ Swap ghi `isSwap` / `inputSwap` / `outputSwap` / `amountSwap` vào item; output thêm `swaps` + `state` cuối kỳ (indexV4.ts)
+ Verify: trên `DATA_V4` = 11 swap, index `[17,20,22,23,82,87,96,97,104,113,117]` — trùng bản cũ và trùng class `RebalanceV4` (indexV4.ts)
