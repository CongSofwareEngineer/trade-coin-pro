# Changelog — Rebalance Summary

## 2026-11-11
+ Thêm `declinePercentage` vào summary = (giá input token dòng 1 − giá input token dòng cuối của data) / giá dòng 1 (helpers.ts, type.ts)
+ Dòng cuối lấy từ `arrData[arrData.length - 1]`, không phải dòng swap cuối → đo biến động giá input token trên toàn bộ data từ file xlsx (helpers.ts)
+ Hiện cạnh `Price:` của Start Amount: `⬇︎` đỏ khi giảm, `⬆︎` xanh khi tăng, `.abs()` + tối đa 4 số thập phân (page.tsx)
