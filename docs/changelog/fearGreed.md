# Changelog — Fear & Greed Index

## 2026-11-25
+ Thêm API proxy `GET /api/fear-greed?limit=`: gọi Alternative.me từ server, trả `{ value, classification, timestamp(ms) }[]`, rỗng → `500` (app/api/fear-greed/route.ts)
+ URL nguồn phải là `/fng/` (có `/` cuối), thiếu `/` API không trả JSON (api.ts)
+ Thêm hook `useFearGreed(limit)`: đảo mảng về thứ tự thời gian tăng, lấy `now` / `yesterday` / `lastWeek`, TB 7 và 30 ngày (useFearGreed.ts)
+ `fearGreedZone(value)`: `<25` sợ hãi tột độ, `<45` sợ hãi, `<56` trung tính, `<76` tham lam, còn lại tham lam tột độ (useFearGreed.ts, app.ts)
+ `staleTime = 30'`, `refetchOnWindowFocus: false` → chỉ số update 1 lần/ngày nên không gọi lại liên tục (useFearGreed.ts)
+ Constant mới: `FEAR_GREED_LIMIT = 90`, `FEAR_GREED_CACHE_TIME`, `FEAR_GREED_ZONES` (app.ts), `ALTERNATIVE_API_URL` + `FEAR_GREED_ENDPOINT` (api.ts), `QUERY_KEY.FearGreed` (reactQuery.ts)
+ Panel `/trade-info`: chỉ số hôm nay + vùng, thanh scale 0→100, so sánh hôm qua/tuần trước/TB, chart 90 ngày có dải màu vùng (MarketFearGreed/index.tsx, page.tsx)
