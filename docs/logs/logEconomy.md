# Log — `/economy` (Thảo luận + Kiến thức)

Trang Kinh tế: 2 tab đọc / ghi trực tiếp vào 1 Google Sheet (thảo luận) và 1 Google Doc (kiến thức), qua proxy
`/api/economy/*`. Logic + nội dung port từ source `hodiencong-info`, UI viết lại theo style `trade-coin-pro`
(Tailwind inline, dark `bg-gray-900/800`, không daisyUI, không i18n, không toast store).

## Route And Entry Points

| Route | File |
|---|---|
| `/economy` | `app/economy/page.tsx` (`'use client'`, tab state local) |
| `GET/POST/PUT/DELETE /api/economy/discussions` | `app/api/economy/discussions/route.ts` |
| `GET/POST/PUT/DELETE /api/economy/knowledge` | `app/api/economy/knowledge/route.ts` |

## File Map

| Vai trò | File |
|---|---|
| Page + tabs | `app/economy/page.tsx` |
| Tab thảo luận | `app/economy/Components/DiscussionTab/index.tsx` |
| Tab kiến thức | `app/economy/Components/KnowledgeTab/index.tsx` |
| Bảng desktop / list mobile | `app/economy/Components/DiscussionTable`, `DiscussionList` |
| 1 ô theo role cột | `app/economy/Components/FieldValue/index.tsx` |
| Render block Google Docs | `app/economy/Components/DocBlocks/index.tsx` |
| Form thêm / sửa | `app/economy/Components/DiscussionForm`, `KnowledgeForm` |
| Modal / confirm / state / pagination / icons | `app/economy/Components/{Modal,ConfirmDelete,StateView,Pagination,Icons}` |
| React Query hooks | `hooks/tank-query/useEconomy.ts` |
| Client API wrapper | `services/EconomyApi/index.ts` |
| Google auth (JWT RS256, `node:crypto`) | `services/Google/auth.ts` |
| Google Sheets đọc / ghi | `services/Google/sheets.ts` |
| Google Docs đọc / ghi | `services/Google/docs.ts` |
| Guard origin + json response | `utils/apiGuard.ts` |
| Helper role cột, tag, status | `utils/economy.ts` |
| Types | `types/economy.ts` |
| Constants | `constants/economy.ts` |
| Breakpoint mobile | `hooks/useMedia.ts`, `constants/app.ts` |

## State And Flow

- Tab active: `useState` trong `app/economy/page.tsx` (không đẩy lên URL như bên source cũ).
- Tab thảo luận: `keyword`, `tag`, `page`, `expandedRows`, `formItem`/`isFormOpen`, `deleteItem`.
- Tab kiến thức: `keyword`, `activeId` (mục lục), `formSection`/`isFormOpen`, `deleteSection`.
- Form giữ pending state riêng (`isPending`) và báo lỗi inline; ghi xong gọi `refetch()` rồi tự đóng modal.
- `useMedia(1024)`: dưới 1024px bảng đổi sang list dọc.

## APIs

| Method | Endpoint | Việc |
|---|---|---|
| GET | `/api/economy/discussions` | Đọc header row → `fields`, data rows → `items`, kèm `sheetUrl`, `canWrite` |
| POST | `/api/economy/discussions` | Append 1 dòng (`INSERT_ROWS`, `valueInputOption=RAW`) |
| PUT | `/api/economy/discussions` | Ghi lại dòng `row` |
| DELETE | `/api/economy/discussions` | `deleteDimension` dòng `row` |
| GET | `/api/economy/knowledge` | Đọc doc (`includeTabsContent=true`) → `intro`, `sections`, `revisionId` |
| POST | `/api/economy/knowledge` | Append heading + body cuối doc |
| PUT | `/api/economy/knowledge` | Xoá range cũ rồi ghi lại section |
| DELETE | `/api/economy/knowledge` | `deleteContentRange` của section |

Proxy giữ service account key ở server; mọi request đi qua `guardApi` (allow-list origin → 403).

## Flow

1. Page render tab → hook `useEconomyDiscussions` / `useEconomyKnowledge` (staleTime 30s, không refetch on focus).
2. Hook gọi `EconomyApi` → `fetch('/api/economy/...')`.
3. Route check origin → `isGoogleConfigured()` → `services/Google/*` → `googleFetch` (token cache, timeout 12s).
4. Sheets: `fields` dựng từ dòng tiêu đề, role map bằng regex nên đổi tên cột không cần sửa code.
5. Docs: heading cấp 1–2 mở section mới, phần trước heading đầu là `intro`; write dùng `requiredRevisionId` để chặn ghi đè.

## Use Cases

- **UC-X1** Xem danh sách thảo luận, tìm theo từ khoá, lọc theo tag, phân trang 15 dòng / trang.
- **UC-X2** Mở rộng 1 dòng để xem đủ nội dung (desktop) hoặc xem dạng block (mobile).
- **UC-X3** Thêm / sửa / xoá 1 chủ đề; cột ngày "Ngày tạo" / "Cập nhật" do server tự ghi.
- **UC-X4** Xem tài liệu kiến thức theo mục lục, ước lượng thời gian đọc, tìm trong tiêu đề + nội dung.
- **UC-X5** Thêm / sửa / xoá 1 mục kiến thức; nếu doc vừa bị người khác sửa → báo tải lại.
- **UC-X6** Chưa cấu hình service account → `canWrite: false`, hiện `NoticeState` hướng dẫn thêm env.

## Validation Rules

| # | Rule | Nơi check |
|---|---|---|
| 1 | Origin phải nằm trong allow-list (hoặc localhost khi không phải production) | `utils/apiGuard.ts` |
| 2 | `values` phải là object, không phải array | `app/api/economy/discussions/route.ts` |
| 3 | `row` phải là integer và `>= 2` | route + `services/Google/sheets.ts` |
| 4 | Dòng cần sửa phải còn dữ liệu, nếu rỗng → `Row no longer exists` | `services/Google/sheets.ts` |
| 5 | Cột headline (title, hoặc content đầu tiên) không được rỗng | `DiscussionForm` |
| 6 | Mỗi ô tối đa 5000 ký tự | `ECONOMY_MAX_CELL_LENGTH` |
| 7 | `startIndex` / `endIndex` phải là integer | `app/api/economy/knowledge/route.ts` |
| 8 | Tiêu đề mục không rỗng, tối đa 300 ký tự, bỏ newline | `services/Google/docs.ts` |
| 9 | Nội dung mục tối đa 20000 ký tự | `ECONOMY_MAX_DOC_TEXT_LENGTH` |
| 10 | Section phải còn tồn tại (`startIndex` khớp) khi sửa / xoá | `services/Google/docs.ts` |
| 11 | Write Docs kèm `requiredRevisionId`, revision lệch → reject | `services/Google/docs.ts` |
| 12 | Ghi Sheets luôn `valueInputOption=RAW` để text bắt đầu bằng `=` không chạy thành formula | `services/Google/sheets.ts` |

## Constants

`constants/economy.ts`: `GOOGLE_SHEETS_API_URL`, `GOOGLE_DOCS_API_URL`, `GOOGLE_OAUTH_TOKEN_URL`, `GOOGLE_SCOPES`,
`GOOGLE_TOKEN_TTL` (3600s), `GOOGLE_TIMEOUT_MS` (12000), `ECONOMY_CACHE_TIME` (30s), `ECONOMY_SHEET_ID`,
`ECONOMY_DOC_ID`, `ECONOMY_SHEET_READ_RANGE` (`A1:Z2000`), `ECONOMY_HEADER_ROW`, `ECONOMY_FIRST_DATA_ROW`,
`ECONOMY_MAX_CELL_LENGTH`, `ECONOMY_MAX_DOC_TEXT_LENGTH`, `ECONOMY_MAX_TITLE_LENGTH`, `ECONOMY_DEFAULT_HEADERS`,
`ECONOMY_FIELD_ROLES`, `ECONOMY_AUTO_DATE_PATTERN`, `ECONOMY_PAGE_SIZE` (15), `ECONOMY_LONG_TEXT_LENGTH` (80),
`ECONOMY_WORDS_PER_MINUTE` (200), `ECONOMY_STATUS_TONE`, `ECONOMY_TAB`.

Env (server only): `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, tuỳ chọn `GOOGLE_ECONOMY_SHEET_ID`,
`GOOGLE_ECONOMY_DOC_ID`. Phải share cả 2 file Google cho email service account với quyền Editor.
