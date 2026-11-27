# Changelog — Economy

## 2026-11-27
+ Thêm trang `/economy` 2 tab Thảo luận / Kiến thức, port logic từ source `hodiencong-info` (app/economy/*)
+ Thêm proxy `/api/economy/discussions` + `/api/economy/knowledge`, CRUD Google Sheets / Docs, key chỉ ở server (route.ts)
+ Google auth tự ký JWT RS256 bằng `node:crypto` thay `google-auth-library` → không thêm dependency, token cache tới khi gần hết hạn (services/Google/auth.ts)
+ `fields` của bảng thảo luận dựng từ dòng tiêu đề sheet, map role bằng regex → đổi tên / thêm cột không cần sửa code (services/Google/sheets.ts)
+ Ghi Sheets dùng `valueInputOption=RAW` + `INSERT_ROWS`; cột "Ngày tạo" / "Cập nhật" do server tự stamp (services/Google/sheets.ts)
+ Write Docs kèm `requiredRevisionId` → doc bị người khác sửa thì reject, form báo tải lại (services/Google/docs.ts)
+ Guard origin allow-list cho 2 route economy, sai origin → 403 (utils/apiGuard.ts)
+ Thêm `QUERY_KEY.EconomyDiscussion` / `EconomyKnowledge`, hook staleTime 30s, `refetchOnWindowFocus: false` (useEconomy.ts)
+ Thay `useMutation` + toast store bằng handler async + `isPending` + lỗi inline, theo convention repo (DiscussionForm.tsx, KnowledgeForm.tsx, ConfirmDelete.tsx)
+ Thêm `cn()` gộp class (utils/functions/index.ts) và `useMedia` đổi bảng → list dưới 1024px (hooks/useMedia.ts)
