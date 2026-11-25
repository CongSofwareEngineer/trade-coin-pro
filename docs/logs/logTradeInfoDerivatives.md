# Log — Trade Info Funding Rate / Open Interest / Ví mới

## Route And Entry Points
- Route: `/trade-info` → `app/trade-info/page.tsx`
- 3 panel render dưới panel Fear & Greed, trên `Header`, theo thứ tự: Funding Rate → Open Interest → Ví mới hoạt động.
- API nội bộ:
  - `GET /api/funding-rate` → `app/api/funding-rate/route.ts` (proxy Binance Futures, fallback Bybit)
  - `GET /api/open-interest` → `app/api/open-interest/route.ts` (proxy Binance Futures, fallback Bybit)
  - `GET /api/new-wallets` → `app/api/new-wallets/route.ts` (proxy blockchain.com charts)

## File Map
| File | Vai trò |
|---|---|
| `app/trade-info/components/MarketFundingRate/index.tsx` | Panel funding: rate kỳ hiện tại, badge vùng, TB 7–30 ngày, APR, số kỳ âm, chart lịch sử |
| `app/trade-info/components/MarketOpenInterest/index.tsx` | Panel OI: OI hiện tại (BTC + notional), % so hôm qua / tuần trước / đỉnh 30d, chart lịch sử |
| `app/trade-info/components/MarketNewWallet/index.tsx` | Panel ví mới: số ví hôm nay, badge trên/dưới TB30, TB 7–30 ngày, chart 90 ngày (layout giống Fear & Greed) |
| `hooks/tank-query/useFundingRate.ts` | Query + TB 7/30 ngày + APR + đếm kỳ âm + `fundingRateZone()` |
| `hooks/tank-query/useOpenInterest.ts` | Query + đỉnh/đáy + TB 7 ngày + % thay đổi ngày / tuần / so đỉnh |
| `hooks/tank-query/useNewWallet.ts` | Query + TB 7/30 ngày + đỉnh/đáy + % thay đổi + `isUpTrend` (so TB30) |
| `utils/bybit/index.ts` | `BybitApi.getKlines / getFundingRate / getOpenInterest` — nguồn dự phòng khi Binance chặn IP server |
| `components/LineChart/index.tsx` | Chart SVG dùng chung (band + grid + tooltip hover) |
| `constants/app.ts` | `SYMBOL_FUTURES_DEFAULT`, `FUNDING_RATE_*`, `OPEN_INTEREST_*`, `NEW_WALLET_*` |
| `constants/api.ts` | `BINANCE_FUTURES_API_URL`, `BLOCKCHAIN_API_URL`, `BYBIT_*`, `FUNDING_RATE_ENDPOINT`, `OPEN_INTEREST_ENDPOINT`, `NEW_WALLET_ENDPOINT` |
| `constants/reactQuery.ts` | `QUERY_KEY.FundingRate`, `QUERY_KEY.OpenInterest`, `QUERY_KEY.NewWallet` |

## State And Flow
- 3 panel không nhận props, tự quản data qua hook riêng, mỗi panel có nút reload riêng.
- Funding / OI: `staleTime = 5 phút` (data đổi theo kỳ 8h và theo giờ), `refetchOnWindowFocus: false`.
- Ví mới: `staleTime = 30 phút`, blockchain.com chỉ update 1 lần/ngày.
- Symbol mặc định `SYMBOL_FUTURES_DEFAULT = 'BTCUSDT'` (không theo `tokenInput` của user vì perp chỉ dùng để đọc bối cảnh thị trường BTC).

## APIs
| API | Mục đích |
|---|---|
| `GET /api/funding-rate?symbol&limit` | Trả `{ data: { symbol, source, now, history } }`, rate đã đổi sang **%** |
| `GET /api/open-interest?symbol&period&limit` | Trả `{ data: { symbol, period, source, now, history } }`, `amount` = BTC, `value` = USD |
| `GET /api/new-wallets?days` | Trả `{ data: { value, timestamp }[] }` tăng dần theo thời gian |
| `https://fapi.binance.com/fapi/v1/premiumIndex` | Funding rate kỳ hiện tại + mark / index price, **chỉ gọi từ server** |
| `https://fapi.binance.com/fapi/v1/fundingRate` | Lịch sử funding (cũ nhất trước), **chỉ gọi từ server** |
| `https://fapi.binance.com/fapi/v1/openInterest` | OI hiện tại (BTC), **chỉ gọi từ server** |
| `https://fapi.binance.com/futures/data/openInterestHist` | Lịch sử OI, Binance chỉ giữ **30 ngày**, **chỉ gọi từ server** |
| `https://fapi.binance.com/futures/data/globalLongShortAccountRatio` | Tỉ lệ tài khoản long / short, **chỉ gọi từ server** |
| `https://api.bybit.com/v5/market/*` | Dự phòng khi Binance trả `451 restricted location` (Vercel US) |
| `https://api.blockchain.info/charts/n-unique-addresses` | Số địa chỉ ví hoạt động / ngày, **chỉ gọi từ server** |

## Flow
1. Panel mount → hook gọi proxy nội bộ tương ứng.
2. Route gọi Binance (song song `now` + `history` bằng `Promise.all`).
3. Binance chặn theo vùng trả object `{ code, msg }` chứ không phải array / không có `lastFundingRate` / `openInterest` → route chuyển sang `BybitApi`, trả thêm `source` để UI ghi nguồn.
4. Bybit trả list **mới nhất trước** → `BybitApi` luôn `reverse()` về tăng dần, khớp thứ tự Binance. Kline Bybit cùng layout index `0..5` với Binance nên consumer không đổi.
5. Funding: Binance/Bybit trả tỉ lệ (`0.0001`), route `× 100` → FE luôn làm việc với **%**.
6. Funding: `apr = rate × 3 × 365` (`FUNDING_RATE_PERIOD_PER_DAY = 3`, 1 kỳ = 8h); `average7` = 21 kỳ cuối, `average30` = 90 kỳ cuối.
7. `fundingRateZone(value)` chọn vùng đầu tiên có `value < zone.max` trong `FUNDING_RATE_ZONES`.
8. OI: `now.value` của Binance tính bằng giá suy ra từ record cuối (`value / amount`) vì endpoint `openInterest` không trả notional.
9. OI: Bybit không trả notional theo từng mốc → quy đổi `amount × markPrice` hiện tại, chart `amount` (BTC) nên không bị méo.
10. Ví mới: `isUpTrend = now > average30`, grid chart đặt tại `average30` để thấy ngay trên/dưới trung bình.

## Use Cases
- **UC-X1**: Vào `/trade-info` → thấy funding rate kỳ hiện tại + nhãn vùng, biết long hay short đang trả phí.
- **UC-X2**: Funding `Extreme` (≥ 0.05%) + OI gần đỉnh 30d → long dồn đòn bẩy, cảnh báo rủi ro long squeeze.
- **UC-X3**: Funding âm nhiều kỳ → short trả phí, tâm lý bearish, thường là vùng mua.
- **UC-X4**: OI giảm mạnh so hôm qua → vừa có đợt thanh lý, đòn bẩy đã được rũ bớt.
- **UC-X5**: Ví mới trên TB30 và tăng so tuần trước → nhu cầu on-chain cải thiện.
- **UC-X6**: Deploy Vercel (IP US) → Binance trả 451, panel vẫn có data, phần nguồn ghi `Bybit`.
- **UC-X7**: Xem thanh Long / Short trong panel OI → biết đám đông đang long nhiều hay short nhiều, kèm nhãn vùng.
- **UC-X8**: Long ≥ 65% (`HeavyLong`) + funding cao → đám đông kẹt lệnh long, dễ bị quét.
- **UC-X9**: Long < 40% (`HeavyShort`) → short quá đông, dễ có short squeeze.
- **UC-X10**: Bấm reload từng panel → chỉ refetch panel đó, không ảnh hưởng bảng trade history.

## Validation Rules
| # | Rule | Xử lý |
|---|---|---|
| 1 | `limit` / `days` không phải số > 0 | Dùng mặc định `FUNDING_RATE_LIMIT` / `OPEN_INTEREST_LIMIT` / `NEW_WALLET_LIMIT` |
| 2 | Binance trả `{ code, msg }` (chặn vùng) | `Array.isArray` / thiếu field bắt buộc → fallback Bybit |
| 3 | Cả Binance và Bybit fail | Route trả `500` với `error`, hook trả `null`, panel hiện `No data` |
| 4 | Record thiếu `fundingTime` / `timestamp` / giá trị | `filter` bỏ record đó trước khi map |
| 5 | Chia cho 0 (`before = 0`, `amount = 0`) | `percentChange` / `priceNow` trả `0`, không ra `NaN` / `Infinity` |
| 6 | `history` rỗng nhưng có `now` | OI lấy `high` / `low` = `now.amount`, chart không render |
| 7 | Mọi phép tính % / tiền | Dùng `BigNumber`, không dùng số thuần |
| 8 | Không lấy được long / short | `longShort = null`, panel hiện "Không lấy được tỉ lệ long / short" |
| 9 | Bybit `sellRatio = 0` | `ratio = 0`, không chia cho 0 |
| 10 | Class màu chữ trên `div` | Phải dùng prefix `!` (`!text-red-400`) vì `globals.css` có `div { color: white !important }` |

## Constants
| Tên | Giá trị | Ý nghĩa |
|---|---|---|
| `SYMBOL_FUTURES_DEFAULT` | `'BTCUSDT'` | Symbol perp mặc định |
| `FUNDING_RATE_PERIOD_PER_DAY` | `3` | 1 kỳ funding = 8h |
| `FUNDING_RATE_LIMIT` | `90` | 90 kỳ ~ 30 ngày |
| `FUNDING_RATE_CACHE_TIME` | `5 * 60 * 1000` | `staleTime` funding |
| `FUNDING_RATE_ZONES` | `Negative < 0`, `Low < 0.005`, `Neutral < 0.02`, `High < 0.05`, `Extreme` | Mốc **% / 8h**, baseline Binance `0.01%` |
| `OPEN_INTEREST_PERIOD` | `'1d'` | Period nến OI |
| `OPEN_INTEREST_LIMIT` | `30` | Binance chỉ giữ 30 ngày `openInterestHist` |
| `OPEN_INTEREST_CACHE_TIME` | `5 * 60 * 1000` | `staleTime` OI |
| `NEW_WALLET_LIMIT` | `90` | Số ngày lịch sử ví mới |
| `NEW_WALLET_CACHE_TIME` | `30 * 60 * 1000` | `staleTime` ví mới |
| `LONG_SHORT_ZONES` | `HeavyShort < 40`, `Short < 48`, `Balanced < 55`, `Long < 65`, `HeavyLong` | Mốc theo **% tài khoản long** |
| `BYBIT_INTERVAL_MAP` | `1d → D`, `1w → W`, … | Map interval Binance → Bybit |
| `BYBIT_OI_INTERVAL_MAP` | `1d → 1d`, `4h → 4h`, … | Map period OI Binance → Bybit |

## Ghi Chú Nguồn Dữ Liệu
- Binance **không** có metric "số ví mới được tạo" — đó là dữ liệu on-chain, không phải sàn.
- Metric "ví mới tạo" thật (new addresses) chỉ có ở nguồn trả phí (Glassnode). Nguồn free đã thử và **không dùng được**:
  `bitcoin-data.com/v1/new-addresses` → 404, `api.blockchain.info/charts/my-wallet-n-users` → `values` rỗng.
- Đang dùng `n-unique-addresses` (số địa chỉ hoạt động / ngày) làm proxy, UI ghi rõ "BTC unique addresses / ngày" để không gây hiểu sai.
