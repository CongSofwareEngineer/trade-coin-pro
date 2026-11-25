# Changelog — Cycle High (đỉnh chu kỳ 4 năm)

## 2026-11-25
+ Thêm hook `useCycleHigh()`: 200 nến tuần (`1w`) ~ 4 năm, tìm `high` / `low` + ngày đạt đỉnh/đáy (useCycleHigh.ts)
+ Tính `fromHighPercent` / `fromLowPercent` = % lệch của `lastClose` so với đỉnh / đáy chu kỳ, dùng `BigNumber` (useCycleHigh.ts)
+ Mặc định token `BTC`, truyền `tokenInput` để đổi token; `refetchOnWindowFocus: false` (useCycleHigh.ts)
+ Constant mới: `TOKEN_CYCLE_DEFAULT`, `CYCLE_INTERVAL = '1w'`, `CYCLE_WEEKS = 200` (app.ts), `QUERY_KEY.CycleHigh` (reactQuery.ts)
+ Panel `/trade-info`: ATH chu kỳ + ngày, giá hiện tại, % so với đỉnh/đáy, badge `GẦN ĐỈNH` khi cách đỉnh < 10%, chart giá đóng tuần (MarketCycleHigh/index.tsx, page.tsx)
