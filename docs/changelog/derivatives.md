# Changelog — Derivatives (Funding Rate / Open Interest)

## 2026-11-25
+ Thêm proxy `GET /api/funding-rate?symbol&limit` → Binance `premiumIndex` + `fundingRate`, rate `×100` → FE dùng % (app/api/funding-rate/route.ts)
+ Thêm proxy `GET /api/open-interest?symbol&period&limit` → Binance `openInterest` + `openInterestHist` (app/api/open-interest/route.ts)
+ `useFundingRate`: TB 7/30 ngày, `apr = rate × 3 × 365`, đếm kỳ âm, `fundingRateZone()` (useFundingRate.ts)
+ `useOpenInterest`: đỉnh/đáy 30d, TB 7 ngày, % so hôm qua / tuần trước / đỉnh (useOpenInterest.ts)
+ OI `now.value`: Binance không trả notional → suy giá từ record cuối (`value / amount`), `amount = 0` → `0` không ra `NaN` (route.ts)
+ Thêm `QUERY_KEY.FundingRate`, `QUERY_KEY.OpenInterest` (reactQuery.ts)
+ `staleTime` funding/OI = 5', `refetchOnWindowFocus: false` (useFundingRate.ts, useOpenInterest.ts)
+ `/api/open-interest` trả thêm `longShort` từ `globalLongShortAccountRatio`, tỉ lệ `0..1` → `%` (app/api/open-interest/route.ts)
+ Fallback Bybit `account-ratio` cho long/short; `ratio = buyRatio / sellRatio`, `sellRatio = 0` → `0` (utils/bybit/index.ts)
+ `useOpenInterest` thêm `longShort` + `longShortZone()` → nhận định long hay short đang nhiều hơn (useOpenInterest.ts)
+ Thêm `LONG_SHORT_ZONES` theo % tài khoản long: `<40 HeavyShort`, `<48 Short`, `<55 Balanced`, `<65 Long`, `HeavyLong` (app.ts)
