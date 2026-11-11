# Changelog — Rebalance Summary

## 2026-11-11
+ Thêm `declinePercentage` vào summary = (giá input token dòng 1 − giá input token dòng cuối của data) / giá dòng 1 (helpers.ts, type.ts)
+ Dòng cuối lấy từ `arrData[arrData.length - 1]`, không phải dòng swap cuối → đo biến động giá input token trên toàn bộ data từ file xlsx (helpers.ts)
+ Hiện cạnh `Price:` của Start Amount: `⬇︎` đỏ khi giảm, `⬆︎` xanh khi tăng, `.abs()` + tối đa 4 số thập phân (page.tsx)
+ Quy đổi holding từng dòng về input token: `amountHold × price(holding) / price(input)` → base cho max/min (helpers.ts)
+ Thêm `maxUnrealizedGain(Percentage)` = MAX(quy đổi) − amount ban đầu, `maxUnrealizedLoss(Percentage)` = MIN(quy đổi) − amount ban đầu (helpers.ts, type.ts)
+ Thêm `endInputTokenBalance` = quy đổi của dòng CUỐI CÙNG, `totalSwaps`, `timeStart/timeEnd`, `priceChangePercentage` = (giá cuối − giá đầu)/giá đầu, `trend` Up/Down (helpers.ts, type.ts)
+ UI: `Profit / Loss (USD)` → bảng Time / Start-End Price / Price Change / Trend / Start-End Amount / Max Unrealized Gain-Loss / Number of Swaps, % hiển thị 4 số thập phân (page.tsx)
+ Fix: `End Price of Input Token` đang lấy `priceEndUsd` (giá output token ở dòng swap cuối) → thêm `priceEndInputUsd` = giá input token ở dòng CUỐI của data (helpers.ts, type.ts, page.tsx)
