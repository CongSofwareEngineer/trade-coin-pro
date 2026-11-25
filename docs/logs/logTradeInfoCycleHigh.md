# Log — Trade Info Đỉnh Chu Kỳ 4 Năm (BTC)

## Route And Entry Points
- Route: `/trade-info` → `app/trade-info/page.tsx`
- Panel render dưới panel MVRV, trên panel Fear & Greed.
- API nội bộ: `GET /api/klines` → `app/api/klines/route.ts` (proxy Binance, tránh CORS)

## File Map
| File | Vai trò |
|---|---|
| `app/trade-info/components/MarketCycleHigh/index.tsx` | Panel: ATH chu kỳ, đáy chu kỳ, % so với đỉnh / đáy, chart giá đóng tuần |
| `hooks/tank-query/useCycleHigh.ts` | Query 200 nến tuần + tính high / low / % lệch |
| `app/api/klines/route.ts` | Proxy `GET /api/klines?symbol&interval&limit` → Binance klines |
| `components/LineChart/index.tsx` | Chart SVG dùng chung (line + area + grid + highlight + tooltip hover) |
| `constants/app.ts` | `TOKEN_CYCLE_DEFAULT`, `CYCLE_INTERVAL`, `CYCLE_WEEKS` |
| `constants/api.ts` | `BINANCE_ENDPOINT.KlinesProxy` |
| `constants/reactQuery.ts` | `QUERY_KEY.CycleHigh` |

## State And Flow
- `MarketCycleHigh` không nhận props bắt buộc, mặc định token `BTC` (`TOKEN_CYCLE_DEFAULT`), có thể truyền `tokenInput` để xem token khác.
- Data lấy 1 lần qua `useCycleHigh()`, `refetchOnWindowFocus: false`, nút `Reload cycle` gọi `refetch()`.
- Toàn bộ tính toán nằm trong `queryFn` (không tính lại ở component), component chỉ `useMemo` để map data cho chart.

## APIs
| API | Mục đích |
|---|---|
| `GET /api/klines?symbol=BTCUSDT&interval=1w&limit=200` | API nội bộ, trả `{ data: kline[] }` |
| `GET https://api.binance.com/api/v3/klines` | Nguồn thật, **chỉ gọi từ server** |

- kline: `[openTime, open, high, low, close, volume, ...]`

## Flow
1. `MarketCycleHigh` mount → `useCycleHigh()` gọi `/api/klines` với `interval = 1w`, `limit = CYCLE_WEEKS (200)`.
2. Route proxy forward sang Binance, trả nguyên mảng kline.
3. `queryFn` map kline → `points: { time, close, high, low }[]`.
4. Quét 1 vòng tìm `highIndex` (high lớn nhất) và `lowIndex` (low nhỏ nhất) bằng `BigNumber`.
5. Tính `fromHighPercent = (lastClose - high) / high * 100`, `fromLowPercent = (lastClose - low) / low * 100`.
6. Render: card số liệu + `LineChart` giá đóng tuần, vạch vàng tại `highIndex`, grid tại `high` / `low`.
7. Badge `GẦN ĐỈNH` khi `fromHighPercent > -10`, ngược lại `XA ĐỈNH`.

## Use Cases
- **UC-X1**: Vào `/trade-info` → thấy giá BTC cao nhất 200 tuần, ngày đạt đỉnh, giá hiện tại và % cách đỉnh.
- **UC-X2**: Hover chart → tooltip hiện giá đóng và ngày của tuần đó.
- **UC-X3**: Giá đang trong vòng 10% so với đỉnh → badge `GẦN ĐỈNH` (đỏ) để cảnh báo vùng rủi ro.
- **UC-X4**: Binance lỗi / proxy trả 500 → panel hiện `No data`, các panel khác không ảnh hưởng.
- **UC-X5**: Token mới list, chưa đủ 200 tuần → hiện cảnh báo số nến thực tế.
- **UC-X6**: Bấm `Reload cycle` → gọi lại `/api/klines`.

## Validation Rules
| # | Rule | Xử lý |
|---|---|---|
| 1 | `symbol` rỗng | `queryFn` trả `null` |
| 2 | `limit` query không hợp lệ ở route | Fallback `MA_PERIOD` |
| 3 | Mảng kline rỗng | Route trả `500`, hook trả `null` → UI `No data` |
| 4 | Kline thiếu `openTime` / `close` | Bị `filter` bỏ |
| 5 | `points.length < CYCLE_WEEKS` | `isEnoughData = false` → hiện cảnh báo |
| 6 | Lỗi fetch / parse | `console.error` → trả `null` |
| 7 | Chart không có data | `LineChart` hiện `No chart data` |

## Constants
| Constant | Giá trị | Nơi khai báo |
|---|---|---|
| `TOKEN_CYCLE_DEFAULT` | `'BTC'` | `constants/app.ts` |
| `CYCLE_INTERVAL` | `'1w'` | `constants/app.ts` |
| `CYCLE_WEEKS` | `200` (~3.8 năm) | `constants/app.ts` |
| `BINANCE_ENDPOINT.KlinesProxy` | `'/api/klines'` | `constants/api.ts` |
| `QUERY_KEY.CycleHigh` | `'CycleHigh'` | `constants/reactQuery.ts` |
| Ngưỡng `GẦN ĐỈNH` | `fromHighPercent > -10` | `components/MarketCycleHigh/index.tsx` |
