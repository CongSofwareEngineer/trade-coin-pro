# Changelog — formatTime

## 2026-11-11
+ Fix: chuỗi `dd/mm/yyyy` bị `new Date()` đọc thành `mm/dd` → tự parse bằng `Date.UTC`, hết ngược ngày/tháng (utils/functions/index.ts)
+ Output bỏ giây: `dd/mm/yyyy HH:mm:ss` → `dd/mm/yyyy HH:mm` (utils/functions/index.ts)
+ `excelDateToJSDate` trả `toISOString()` → `formatTime(date)`, ra `dd/mm/yyyy HH:mm` (app/page.tsx)
+ `excelDateToJSDate` tự format từ `getUTC*` → hiện đúng giờ ghi trong file Excel, không cộng/trừ múi giờ máy; làm tròn về phút cho hết sai số serial (app/page.tsx)
