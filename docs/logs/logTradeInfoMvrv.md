# Log — Trade Info MVRV (BTC)

## Route And Entry Points
- Route: `/trade-info` → `app/trade-info/page.tsx`
- Panel MVRV render ngay dưới panel MA200, trên `Header`.
- API nội bộ: `GET /api/mvrv` → `app/api/mvrv/route.ts`

## File Map
| File | Vai trò |
|---|---|
| `app/trade-info/components/MarketMvrv/index.tsx` | Panel MVRV: value, badge vùng, thanh scale, source, giờ update / next call |
| `hooks/tank-query/useMVRV.ts` | Query + cache localStorage 30 phút + `mvrvZone()` |
| `app/api/mvrv/route.ts` | Proxy 2 nguồn MVRV (CoinMetrics → BGeometrics) |
| `constants/api.ts` | `COIN_METRICS_API_URL`, `BGEOMETRICS_API_URL`, `MVRV_ENDPOINT` |
| `constants/app.ts` | `MVRV_CACHE_TIME` (30 phút), `MVRV_ZONES` |
| `constants/storage.ts` | `LOCAL_STORE_KEY.MvrvData` |
| `constants/reactQuery.ts` | `QUERY_KEY.Mvrv` |

## State And Flow
- `MarketMvrv` không nhận props, tự quản data qua `useMVRV()` (giống `MarketTrend`), có nút `Reload MVRV` riêng.
- Cache là nguồn sự thật: `{ date, mvrv, source, updatedAt }` trong localStorage key `MvrvData`.
- React Query chỉ là lớp bọc: `staleTime = MVRV_CACHE_TIME`, `refetchOnWindowFocus: false`.

## APIs
| API | Mục đích |
|---|---|
| `GET /api/mvrv` | API nội bộ, trả `{ data: { date, mvrv, source } }` |
| `GET https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&page_size=1&paging_from=end` | Nguồn chính (free, 10 req / 6s). Lấy row cuối: `time`, `CapMVRVCur` |
| `GET https://bitcoin-data.com/v1/mvrv/last` | Nguồn dự phòng (free, ~8 req/giờ). Shape `{ d, mvrv }` |

## Flow
1. `MarketMvrv` mount → `useMVRV()` chạy `queryFn`.
2. `queryFn` đọc `LOCAL_STORE_KEY.MvrvData`. Còn hạn (`Date.now() - updatedAt <= 30 phút`) → trả cache, **không** gọi API.
3. Hết hạn / không có cache → `fetcher({ url: '/api/mvrv' })`.
4. Route thử CoinMetrics; lỗi hoặc shape sai → thử BGeometrics; cả 2 fail → `500`.
5. Có data → lưu cache kèm `updatedAt` mới → render.
6. `mvrvZone(mvrv)` chọn vùng đầu tiên có `mvrv < zone.max` trong `MVRV_ZONES`.
7. Nút `Reload MVRV` → `refetchForce()`: xoá cache rồi `refetch()` (bỏ qua 30 phút).

## Use Cases
- **UC-X1**: Vào `/trade-info` lần đầu → gọi `/api/mvrv`, hiện MVRV + vùng, lưu cache.
- **UC-X2**: Reload trang trong vòng 30 phút → đọc cache, không gọi API (tránh limit).
- **UC-X3**: Reload trang sau 30 phút → gọi API lại, cache ghi đè.
- **UC-X4**: CoinMetrics lỗi / limit → data về từ BGeometrics, cột `Source` hiện `BGeometrics`.
- **UC-X5**: Cả 2 nguồn fail → panel hiện `No data`, cache cũ không bị xoá (trừ khi bấm `Reload MVRV`).
- **UC-X6**: Bấm `Reload MVRV` → luôn gọi API thật, kể cả cache còn hạn.

## Validation Rules
| # | Rule | Xử lý |
|---|---|---|
| 1 | Cache thiếu `updatedAt` hoặc `mvrv` | Coi như không có cache → gọi API |
| 2 | `Date.now() - updatedAt > MVRV_CACHE_TIME` | Cache hết hạn → gọi API |
| 3 | `JSON.parse` cache lỗi | `console.error` → trả `null`, gọi API |
| 4 | CoinMetrics thiếu `time` / `CapMVRVCur` | Trả `null` → fallback BGeometrics |
| 5 | BGeometrics thiếu `d` / `mvrv` | Trả `null` → route trả `500` |
| 6 | `/api/mvrv` không trả `mvrv` | Hook trả `null` → UI `No data`, không ghi cache |
| 7 | `mvrv` falsy ở `mvrvZone` | Trả `null` → không render badge / label vùng |
| 8 | Marker thanh scale ngoài `0..100%` | Clamp về `0` / `100` |

## Constants
| Constant | Giá trị | Nơi khai báo |
|---|---|---|
| `MVRV_CACHE_TIME` | `30 * 60 * 1000` | `constants/app.ts` |
| `MVRV_ZONES` | `Bottom <1`, `Low <1.5`, `Neutral <2.4`, `Hot <3.5`, `Top` còn lại | `constants/app.ts` |
| `MVRV_ENDPOINT` | `CoinMetrics`, `BGeometrics`, `Proxy = '/api/mvrv'` | `constants/api.ts` |
| `LOCAL_STORE_KEY.MvrvData` | `'MvrvData'` | `constants/storage.ts` |
| `QUERY_KEY.Mvrv` | `'Mvrv'` | `constants/reactQuery.ts` |
| `MVRV_MAX_SCALE` | `4` (chỉ để vẽ thanh scale) | `components/MarketMvrv/index.tsx` |
