# Changelog — UI Color (chữ màu trên div)

## 2026-11-25
+ Fix: `globals.css` có `div { color: white !important }` nuốt mọi class `text-*` trên `div` → số âm/dương đều ra trắng (globals.css)
+ `So với đỉnh` dùng `!text-red-400` / `!text-green-400` để thắng rule `!important` — giảm đỏ, tăng xanh (MarketCycleHigh/index.tsx)
+ Các panel Funding / OI / Ví mới dùng prefix `!` cho class màu chữ, cùng lý do (MarketFundingRate, MarketOpenInterest, MarketNewWallet)
+ Không sửa `globals.css` vì rule đó ảnh hưởng toàn bộ route khác (globals.css)
