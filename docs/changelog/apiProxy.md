# Changelog — API Proxy

## 2026-11-25
+ Fix deploy Vercel: Binance chặn IP US trả 451 → `/api/klines` fallback sang Bybit, response thêm `source` (app/api/klines/route.ts)
+ Thêm `BybitApi.getKlines / getFundingRate / getOpenInterest` làm nguồn dự phòng; Bybit trả mới nhất trước → luôn `reverse()` (utils/bybit/index.ts)
+ Kline Bybit cùng layout index `0..5` với Binance nên `useMA200` / `useCycleHigh` không đổi (utils/bybit/index.ts)
+ Binance chặn vùng trả `{ code, msg }` không phải array → check `Array.isArray` trước khi dùng (app/api/klines/route.ts)
+ Thêm `BYBIT_ENDPOINT`, `BYBIT_INTERVAL_MAP`, `BYBIT_OI_INTERVAL_MAP`, `BINANCE_FUTURES_API_URL`, `BLOCKCHAIN_API_URL` (api.ts)
+ Thêm proxy `GET /api/klines?symbol&interval&limit` → Binance `api/v3/klines`, fix CORS khi browser gọi trực tiếp (app/api/klines/route.ts)
+ `useMA200` + `useCycleHigh` đổi sang `BINANCE_ENDPOINT.KlinesProxy`, không còn call `api.binance.com` từ browser (useMA200.ts, useCycleHigh.ts)
+ Thêm `BINANCE_ENDPOINT.KlinesProxy = '/api/klines'`; `BINANCE_ENDPOINT.Klines` chỉ dùng phía server (api.ts)
+ Mảng kline rỗng → route trả `500` thay vì `200` với data rỗng (route.ts)
+ `DCA_BOT_API_URL` (Koyeb) giữ nguyên gọi trực tiếp từ hook — không bị CORS (useTokenPrice.ts, useTradeHistory.ts, useUserConfig.ts)
