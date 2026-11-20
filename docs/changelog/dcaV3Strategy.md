# Changelog — DCA v3 Strategy

## 2026-11-20
+ Sync với `DcaUtil` (server-dca-nestjs) ↓ (hepers.ts)
+ Giá ≥ maxPrice → sell-only: chặn TH1–TH5, vẫn qua Gate 1 và được bán TH6 (trước đây skip hết) (hepers.ts)
+ Bỏ check `lastHistoryPrice` NaN ở Gate 0; giá trị không phải số vẫn bị skip vì ratio Gate 1 = NaN (hepers.ts)
+ TH2: `lastHistoryPrice < price < avgPrice` → chỉ mua 50% (`TH2_BUY_RATIO_ABOVE_LAST_PRICE`), trước khi cap theo capital; ghi `infoSwap.buyRatio` (hepers.ts)
+ Bỏ đường cong `ratio ≤ 0.35 → ratio²/0.35` ở buy sizing, giờ tuyến tính như server (hepers.ts)
+ Sell: `usd = stepSize × r` (6 dp) rồi `token = usd / price`, thay vì làm tròn token về 6 dp → không mất token lẻ (hepers.ts)
+ Làm tròn: token theo decimals on-chain (ETH 18, BTC 8, fallback 6), avgPrice/USD 6 dp (hepers.ts)
