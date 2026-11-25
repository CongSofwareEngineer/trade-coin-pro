# Log — Trade Info Fear & Greed Index

## Route And Entry Points
- Route: `/trade-info` → `app/trade-info/page.tsx`
- Panel render dưới panel Đỉnh chu kỳ 4 năm, trên `Header`.
- API nội bộ: `GET /api/fear-greed` → `app/api/fear-greed/route.ts` (proxy Alternative.me)

## File Map
| File | Vai trò |
|---|---|
| `app/trade-info/components/MarketFearGreed/index.tsx` | Panel: chỉ số hôm nay, badge vùng, thanh scale 0→100, hôm qua / tuần trước / TB 7–30 ngày, chart lịch sử |
| `hooks/tank-query/useFearGreed.ts` | Query + đảo chiều data + tính TB 7 / 30 ngày + `fearGreedZone()` |
| `app/api/fear-greed/route.ts` | Proxy `GET /api/fear-greed?limit=` → Alternative.me |
| `components/LineChart/index.tsx` | Chart SVG dùng chung (dải màu vùng + grid + tooltip hover) |
| `constants/app.ts` | `FEAR_GREED_LIMIT`, `FEAR_GREED_CACHE_TIME`, `FEAR_GREED_ZONES` |
| `constants/api.ts` | `ALTERNATIVE_API_URL`, `FEAR_GREED_ENDPOINT` |
| `constants/reactQuery.ts` | `QUERY_KEY.FearGreed` |

## State And Flow
- `MarketFearGreed` không nhận props, tự quản data qua `useFearGreed()`, nút `Reload index` riêng.
- `staleTime = FEAR_GREED_CACHE_TIME` (30 phút), `refetchOnWindowFocus: false` — chỉ số chỉ update 1 lần/ngày nên không cần gọi nhiều.
- Không cache localStorage (khác MVRV) vì Alternative.me không bị limit gắt.

## APIs
| API | Mục đích |
|---|---|
| `GET /api/fear-greed?limit=90` | API nội bộ, trả `{ data: { value, classification, timestamp }[] }` (mới nhất trước) |
| `GET https://api.alternative.me/fng/?limit=90&format=json` | Nguồn thật, **chỉ gọi từ server**. Bắt buộc có dấu `/` sau `fng`, thiếu sẽ không trả JSON |

## Flow
1. `MarketFearGreed` mount → `useFearGreed()` gọi `/api/fear-greed?limit=FEAR_GREED_LIMIT`.
2. Route gọi Alternative.me, map `value` → number, `timestamp` (giây) → ms, bỏ record thiếu field.
3. `queryFn` `reverse()` mảng (API trả mới nhất trước) để chart theo thời gian tăng dần; `now` = phần tử cuối.
4. Tính `yesterday` (`-2`), `lastWeek` (`-8`), `average7` (7 điểm cuối), `average30` (30 điểm cuối) bằng `BigNumber`.
5. `fearGreedZone(value)` chọn vùng đầu tiên có `value < zone.max` trong `FEAR_GREED_ZONES`.
6. Render: card số liệu + marker trên thanh gradient (`left = value%`) + `LineChart` 90 ngày, dải màu theo vùng, grid tại `25 / 45 / 56 / 76`.
7. `Thay đổi` = `now - yesterday`, xanh nếu tăng, đỏ nếu giảm.

## Use Cases
- **UC-X1**: Vào `/trade-info` → thấy chỉ số sợ hãi / tham lam hôm nay + nhãn vùng tiếng Việt.
- **UC-X2**: Hover chart → tooltip hiện giá trị + tên vùng + ngày.
- **UC-X3**: So sánh nhanh hôm nay với hôm qua / tuần trước / TB 7–30 ngày để thấy xu hướng tâm lý.
- **UC-X4**: Chỉ số `< 25` (Extreme Fear) → vùng xanh, gợi ý vùng thị trường bán tháo.
- **UC-X5**: Chỉ số `>= 76` (Extreme Greed) → vùng đỏ, cảnh báo vùng đỉnh.
- **UC-X6**: API lỗi → panel hiện `No data`, panel khác không ảnh hưởng.
- **UC-X7**: Bấm `Reload index` → `refetch()`.

## Validation Rules
| # | Rule | Xử lý |
|---|---|---|
| 1 | `limit` query không hợp lệ ở route | Fallback `FEAR_GREED_LIMIT` |
| 2 | Record thiếu `timestamp` / `value` | Bị `filter` bỏ |
| 3 | Danh sách rỗng sau filter | Route trả `500`, hook trả `null` → UI `No data` |
| 4 | Lỗi fetch / parse | `console.error` → trả `null` |
| 5 | `value` `undefined` / `null` ở `fearGreedZone` | Trả `null` → không render badge / label |
| 6 | Chưa đủ 8 / 30 điểm | `yesterday` / `lastWeek` = `null`, `average*` lấy theo số điểm có thật, rỗng → `0` |
| 7 | `value` dùng trực tiếp làm `left%` | Luôn `0..100` theo định nghĩa chỉ số, không cần clamp |

## Constants
| Constant | Giá trị | Nơi khai báo |
|---|---|---|
| `FEAR_GREED_LIMIT` | `90` (ngày) | `constants/app.ts` |
| `FEAR_GREED_CACHE_TIME` | `30 * 60 * 1000` | `constants/app.ts` |
| `FEAR_GREED_ZONES` | `ExtremeFear <25`, `Fear <45`, `Neutral <56`, `Greed <76`, `ExtremeGreed` còn lại (kèm `color` cho chart) | `constants/app.ts` |
| `FEAR_GREED_ENDPOINT` | `Alternative`, `Proxy = '/api/fear-greed'` | `constants/api.ts` |
| `QUERY_KEY.FearGreed` | `'FearGreed'` | `constants/reactQuery.ts` |
