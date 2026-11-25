# Changelog — New Wallet (ví mới hoạt động)

## 2026-11-25
+ Thêm proxy `GET /api/new-wallets?days` → blockchain.com `n-unique-addresses`, `x` giây → ms (app/api/new-wallets/route.ts)
+ `useNewWallet`: TB 7/30 ngày, đỉnh/đáy, % so hôm qua / tuần trước, `isUpTrend = now > TB30` (useNewWallet.ts)
+ Thêm `QUERY_KEY.NewWallet`, `NEW_WALLET_LIMIT = 90`, `NEW_WALLET_CACHE_TIME = 30'` (reactQuery.ts, app.ts)
+ Dùng `n-unique-addresses` làm proxy cho "ví mới": `bitcoin-data.com/v1/new-addresses` 404, `my-wallet-n-users` trả rỗng, new addresses thật chỉ có ở nguồn trả phí (api.ts)
