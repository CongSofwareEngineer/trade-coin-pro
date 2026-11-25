# Log — Trade Info Market Trend (MA200)

## Route And Entry Points
- Route: `/trade-info` → `app/trade-info/page.tsx`
- MA200 panel render ở đầu trang, trên `Header`.

## File Map
| File | Vai trò |
|---|---|
| `app/trade-info/page.tsx` | Page, state chung, bảng history + modal settings |
| `app/trade-info/components/MarketTrend/index.tsx` | Panel MA200 1D / 1W + trend tổng, tự gọi hook |
| `app/trade-info/components/Header/index.tsx` | Title, nút Settings / Refresh, chọn user, dòng total trades |
| `app/trade-info/components/PortfolioStats/index.tsx` | Dải thống kê portfolio (capital, P&L, avg price, slippage) |
| `app/trade-info/components/LoadingSpinner/index.tsx` | Spinner dùng chung trong route |
| `app/trade-info/type.ts` | `UserConfig`, `PortfolioStatsInfo` |
| `hooks/tank-query/useMA200.ts` | Fetch klines Binance + tính MA200 |
| `constants/api.ts` | `BINANCE_API_URL`, `BINANCE_ENDPOINT.Klines` |
| `constants/app.ts` | `MA_PERIOD`, `MA_INTERVAL`, `SYMBOL_STABLE_DEFAULT` |

## State And Flow
- `page.tsx` giữ `userConfigCurrent`, `currentPage`, `settingsForm`, `isSettingsModalOpen`.
- `MarketTrend` nhận duy nhất `tokenInput`, tự quản data MA (có nút `Reload MA` riêng), không phụ thuộc `refreshData` của page.

## APIs
| API | Mục đích |
|---|---|
| `GET https://api.binance.com/api/v3/klines?symbol=<TOKEN>USDT&interval=1d&limit=200` | 200 nến ngày |
| `GET https://api.binance.com/api/v3/klines?symbol=<TOKEN>USDT&interval=1w&limit=200` | 200 nến tuần |

Kline shape: `[openTime, open, high, low, close, volume, ...]` → dùng index `4` (close).

## Flow
1. `userConfigCurrent?.tokenInput` → `symbol = TOKEN + 'USDT'`.
2. 2 query song song (`1d`, `1w`), key `[QUERY_KEY.MA200, symbol, interval]`, `enabled: !!symbol`.
3. Mỗi query: lấy mảng close → `MA200 = mean(200 close cuối)` bằng `BigNumber`.
4. `diffPercent = (lastClose - MA200) / MA200 * 100`, `isUpTrend = lastClose > MA200`.
5. Panel hiện 2 card (1D, 1W) + 1 dòng trend tổng.

## Use Cases
- **UC-X1**: Có `tokenInput` → panel hiện MA200 1D và 1W, badge UPTREND / DOWNTREND theo từng khung.
- **UC-X2**: 1D và 1W đều trên MA200 → `BULL`; đều dưới → `BEAR`; lệch nhau → `SIDEWAYS`.
- **UC-X3**: Chưa chọn user (`tokenInput` undefined) → panel không render.
- **UC-X4**: Token chưa đủ 200 nến (coin mới) → vẫn tính MA theo số nến có, hiện cảnh báo vàng.
- **UC-X5**: API lỗi hoặc trả rỗng → card hiện `No data`, page không crash.
- **UC-X6**: Bấm `Reload MA` → refetch cả 2 khung.

## Validation Rules
| # | Rule | Kết quả |
|---|---|---|
| 1 | `!symbol` | query `disabled`, panel không render |
| 2 | `klines.length === 0` | trả `null` → card `No data` |
| 3 | close rỗng / falsy | bị filter khỏi mảng tính MA |
| 4 | `closes.length < 200` | `isEnoughData: false`, MA tính theo số nến có |
| 5 | fetch throw | `console.error` + trả `null` |

## Constants
| Constant | File |
|---|---|
| `BINANCE_API_URL = 'https://api.binance.com'` | `constants/api.ts` |
| `BINANCE_ENDPOINT.Klines` | `constants/api.ts` |
| `MA_PERIOD = 200` | `constants/app.ts` |
| `MA_INTERVAL = { Daily: '1d', Weekly: '1w' }` | `constants/app.ts` |
| `SYMBOL_STABLE_DEFAULT = 'USDT'` | `constants/app.ts` |
| `QUERY_KEY.MA200` | `constants/reactQuery.ts` |
