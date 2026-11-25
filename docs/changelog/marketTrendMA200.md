# Changelog — Market Trend MA200

## 2026-11-25
+ Thêm hook `useMA200(tokenInput)`: 2 query Binance klines (`1d`, `1w`, `limit=200`) → MA200, lastClose, `diffPercent`, `isUpTrend` (useMA200.ts)
+ Symbol = `${tokenInput}USDT` (vd `ETHUSDT`), `enabled: !!symbol`; lỗi/empty → `null` (useMA200.ts)
+ MA tính bằng `BigNumber`, mean 200 close cuối; `< 200` nến → `isEnoughData: false` (useMA200.ts)
+ Query key mới `QUERY_KEY.MA200` (reactQuery.ts)
+ Tách constant ra `constants/`: URL Binance → `BINANCE_API_URL` / `BINANCE_ENDPOINT.Klines` (api.ts), `MA_PERIOD`, `MA_INTERVAL`, `SYMBOL_STABLE_DEFAULT` (app.ts); hook chỉ còn import (useMA200.ts)
+ Trend tổng: 1D + 1W đều trên MA200 → BULL, đều dưới → BEAR, lệch nhau → SIDEWAYS (components/MarketTrend/index.tsx)
+ Refactor, no behaviour change: tách header `/trade-info` thành `components/{Header,PortfolioStats,LoadingSpinner}`, thêm type `PortfolioStatsInfo` (page.tsx, type.ts)
