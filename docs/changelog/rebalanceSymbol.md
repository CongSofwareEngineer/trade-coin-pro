# Changelog — Rebalance Symbol

## 2026-11-13
+ Rename `UserConfig.outputStart` / `RebalanceConfig.outputStart` → `inputStart`, đúng nghĩa "token bỏ vào lúc đầu" và khớp label UI `Input Token` + `tokenInput` của các page DCA (type.ts, helpersBase.ts, helpers.ts, page.tsx, indexV4.ts)
+ `index.ts` (v1 node sim) vốn đã dùng `inputStart` → giờ 2 bản node sim và bản app cùng một tên field (indexV4.ts)
+ Thêm `isSymbolETHOrBTC(symbol, 'eth' | 'btc')` dùng chung: ETH/WETH/CBETH = ETH, BTC/WBTC/CBBTC = BTC (utils/functions/index.ts)
+ Thêm `isSameSymbol(a, b)`: bằng nhau hoặc cùng họ ETH/BTC → true, dùng cho so khớp `outputStart` / `outputSwap` với symbol trong data (utils/functions/index.ts)
+ Mọi check ETH/BTC bỏ so sánh cứng `=== 'ETH'` / `=== 'BTC'` → `isSymbolETHOrBTC`: find tokenETH/tokenBTC, `isETH` của `initFirstItem`, `perETH = '1'` ở `initFirstItem`/`initItem`, 2 nhánh `symbolOutput` trong `checkToSwap` (helpersBase.ts)
+ `updatePerETHOriginal`: 2 nhánh `symbol === 'ETH' || 'BTC'` → `isSymbolETHOrBTC` (helpersV4.ts)
+ Fix: `initFirstItem` so `symbol === outputStart` → `isSameSymbol`, config `ETH` mà data là `WETH`/`CBETH` thì `ETHOriginalAmount` không còn kẹt `'0'` (helpersBase.ts)
+ Fix: `checkToSwap` tìm `tokenInput` theo `=== state.outputSwap` → `isSameSymbol`, hết `undefined` ở vòng đầu khi symbol thật là `WETH`/`WBTC` (helpersBase.ts)
+ Summary: find token theo `priceStart` / `priceEnd` / `priceStartLastRow` / `priceHold` / `priceInput` dùng `isSameSymbol` (helpers.ts)
+ Không đổi kết quả: v1 (DATA_FAKE) 17 swap và v4 (DATA_V4) 11 swap, index + outputSwap + amount y như trước

## 2026-11-11
+ Thêm `uppercase(value)` (trim + toUpperCase) dùng chung cho symbol token (utils/functions/index.ts)
+ `run()` chuẩn hoá symbol token về uppercase ngay sau clone data → mọi so sánh / key state đồng nhất (helpersBase.ts)
+ Mọi so sánh symbol (`ETH`, `BTC`, outputSwap, outputStart) và key `ETHLastSwap` / `ETHLastSwapTemp` / `perETHOriginal` / `est_<symbol>` dùng `uppercase()` (helpersBase.ts)
+ `price1Point`, `perETHOriginal`, so sánh tokenOutput/tokenInput theo symbol dùng `uppercase()` (helpersV4.ts)
+ Summary: `symbolStart` / `symbolEnd` + find token theo symbol dùng `uppercase()` (helpers.ts)
+ Symbol từ cột file xlsx và input `outputStart` được uppercase khi nhập (page.tsx)
+ Không đổi kết quả: v1 (DATA_FAKE) và v4 (DATA_V4) ra swap count / outputSwap / amount y như trước
