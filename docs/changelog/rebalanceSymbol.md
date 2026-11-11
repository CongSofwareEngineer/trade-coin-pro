# Changelog — Rebalance Symbol

## 2026-11-11
+ Thêm `uppercase(value)` (trim + toUpperCase) dùng chung cho symbol token (utils/functions/index.ts)
+ `run()` chuẩn hoá symbol token về uppercase ngay sau clone data → mọi so sánh / key state đồng nhất (helpersBase.ts)
+ Mọi so sánh symbol (`ETH`, `BTC`, outputSwap, outputStart) và key `ETHLastSwap` / `ETHLastSwapTemp` / `perETHOriginal` / `est_<symbol>` dùng `uppercase()` (helpersBase.ts)
+ `price1Point`, `perETHOriginal`, so sánh tokenOutput/tokenInput theo symbol dùng `uppercase()` (helpersV4.ts)
+ Summary: `symbolStart` / `symbolEnd` + find token theo symbol dùng `uppercase()` (helpers.ts)
+ Symbol từ cột file xlsx và input `outputStart` được uppercase khi nhập (page.tsx)
+ Không đổi kết quả: v1 (DATA_FAKE) và v4 (DATA_V4) ra swap count / outputSwap / amount y như trước
