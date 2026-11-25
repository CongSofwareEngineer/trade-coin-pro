# Changelog — MVRV

## 2026-11-25
+ `/api/mvrv?days=90` trả thêm `history` từ CoinMetrics → panel vẽ chart 90 ngày (app/api/mvrv/route.ts)
+ History đã có record cuối → bỏ call `page_size=1`, tiết kiệm 1 request/lần (route.ts)
+ `useMVRV` thêm `history`, `high`, `low`, `changeDay`, `changeWeek` (useMVRV.ts)
+ Cache localStorage cũ không có `history` → coi như hết hạn, tránh chart rỗng sau khi update (useMVRV.ts)
+ Thêm `MVRV_HISTORY_DAYS = 90`, `MVRV_ENDPOINT.CoinMetricsHistory` (app.ts, api.ts)
+ Fallback BGeometrics chỉ có giá trị cuối → chart ẩn, hiện dòng báo thay vì lỗi (MarketMvrv/index.tsx)
+ Thêm API proxy `GET /api/mvrv`: CoinMetrics (chính) → BGeometrics (dự phòng), trả `{ date, mvrv, source }`, cả 2 fail → `status: 500` (app/api/mvrv/route.ts)
+ Gọi qua server để tránh CORS, browser chỉ call `/api/mvrv` (route.ts)
+ Thêm hook `useMVRV()`: đọc cache localStorage trước, chỉ fetch lại khi cache > 30 phút (chống rate limit) (useMVRV.ts)
+ Cache key `LOCAL_STORE_KEY.MvrvData` kèm `updatedAt`; `refetchForce` xoá cache rồi `refetch` (useMVRV.ts, storage.ts)
+ `staleTime = MVRV_CACHE_TIME`, `refetchOnWindowFocus: false` → không gọi lại khi đổi tab (useMVRV.ts)
+ Phân vùng `mvrvZone(mvrv)`: `<1` đáy, `<1.5` tích lũy, `<2.4` trung tính, `<3.5` nóng, còn lại đỉnh (useMVRV.ts, app.ts)
+ Constant mới: `MVRV_CACHE_TIME`, `MVRV_ZONES` (app.ts), `MVRV_ENDPOINT` + `COIN_METRICS_API_URL` / `BGEOMETRICS_API_URL` (api.ts), `QUERY_KEY.Mvrv` (reactQuery.ts)
+ Panel MVRV ở `/trade-info`: value, badge vùng, thanh scale 0→4, source, giờ update + giờ được gọi lại (components/MarketMvrv/index.tsx, page.tsx)
