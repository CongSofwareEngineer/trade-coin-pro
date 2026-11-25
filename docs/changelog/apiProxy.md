# Changelog — API Proxy

## 2026-11-25
+ Thêm proxy `GET /api/klines?symbol&interval&limit` → Binance `api/v3/klines`, fix CORS khi browser gọi trực tiếp (app/api/klines/route.ts)
+ `useMA200` + `useCycleHigh` đổi sang `BINANCE_ENDPOINT.KlinesProxy`, không còn call `api.binance.com` từ browser (useMA200.ts, useCycleHigh.ts)
+ Thêm `BINANCE_ENDPOINT.KlinesProxy = '/api/klines'`; `BINANCE_ENDPOINT.Klines` chỉ dùng phía server (api.ts)
+ Mảng kline rỗng → route trả `500` thay vì `200` với data rỗng (route.ts)
+ `DCA_BOT_API_URL` (Koyeb) giữ nguyên gọi trực tiếp từ hook — không bị CORS (useTokenPrice.ts, useTradeHistory.ts, useUserConfig.ts)
