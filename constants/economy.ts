import { DiscussionFieldRole } from '@/types/economy'

// Google API endpoints (server side only)
export const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets' as const
export const GOOGLE_DOCS_API_URL = 'https://docs.googleapis.com/v1/documents' as const
export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/documents'].join(' ')
export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token' as const

// Lifetime asked for in the service account JWT, Google caps it at 3600s
export const GOOGLE_TOKEN_TTL = 3600 as number

// The two source files of the Economy page. Not secrets, only the service account key is.
export const ECONOMY_SHEET_ID = '16YKbiF1WxbvjU5eH5vwFQibWGRHiZMMHNB7SSWWDX9I' as const
export const ECONOMY_DOC_ID = '1A9TQPmELQS0mBDN9kUT7uUstGQCcbbIhYLWCCih9Pa8' as const

// Không đọc GOOGLE_SHEETS_ID: env đó là sheet log chat của project khác, không phải sheet Kinh tế
export const getEconomySheetId = () => process.env.GOOGLE_ECONOMY_SHEET_ID || ECONOMY_SHEET_ID
export const getEconomyDocId = () => process.env.GOOGLE_ECONOMY_DOC_ID || ECONOMY_DOC_ID

export const getEconomySheetUrl = () => `https://docs.google.com/spreadsheets/d/${getEconomySheetId()}/edit`
export const getEconomyDocUrl = () => `https://docs.google.com/document/d/${getEconomyDocId()}/edit`

// Read window. Columns past Z and rows past 2000 are ignored on purpose, so one broken
// cell far away from the data cannot blow up the payload.
export const ECONOMY_SHEET_READ_RANGE = 'A1:Z2000' as const
export const ECONOMY_HEADER_ROW = 1 as number
export const ECONOMY_FIRST_DATA_ROW = 2 as number

export const GOOGLE_TIMEOUT_MS = 12000 as number
export const ECONOMY_CACHE_TIME = 30 * 1000
export const ECONOMY_MAX_CELL_LENGTH = 5000 as number
export const ECONOMY_MAX_DOC_TEXT_LENGTH = 20000 as number
export const ECONOMY_MAX_TITLE_LENGTH = 300 as number

// Headers written the first time, only when the sheet has no header row yet.
export const ECONOMY_DEFAULT_HEADERS = ['Chủ đề', 'Nội dung', 'Người đăng', 'Thẻ', 'Trạng thái', 'Ngày tạo', 'Cập nhật'] as const

// Maps a header cell to the role it plays in the UI, so the page keeps working
// whatever the owner renames the columns to. First match wins, order matters.
export const ECONOMY_FIELD_ROLES: { role: DiscussionFieldRole; pattern: RegExp }[] = [
  { role: 'id', pattern: /^\s*(id|mã|ma|stt)\s*$/i },
  { role: 'title', pattern: /chủ\s*đề|chu\s*de|tiêu\s*đề|tieu\s*de|title|topic|subject|câu\s*hỏi|cau\s*hoi|vấn\s*đề|van\s*de|question/i },
  {
    role: 'content',
    pattern:
      /nội\s*dung|noi\s*dung|content|body|chi\s*tiết|chi\s*tiet|mô\s*tả|mo\s*ta|description|ý\s*kiến|y\s*kien|trả\s*lời|tra\s*loi|answer|note|ghi\s*chú|ghi\s*chu|tình\s*hình|tinh\s*hinh|nhận\s*định|nhan\s*dinh|diễn\s*biến|dien\s*bien|phân\s*tích|phan\s*tich|bình\s*luận|binh\s*luan|kết\s*luận|ket\s*luan|tóm\s*tắt|tom\s*tat/i,
  },
  { role: 'author', pattern: /người|nguoi|tác\s*giả|tac\s*gia|author|tên|ten|name|user|email/i },
  { role: 'tags', pattern: /thẻ|the\b|tag|nhãn|nhan|danh\s*mục|danh\s*muc|category|nhóm|nhom|loại|loai|lĩnh\s*vực|linh\s*vuc/i },
  { role: 'status', pattern: /trạng\s*thái|trang\s*thai|status|tình\s*trạng|tinh\s*trang|state/i },
  { role: 'link', pattern: /link|url|nguồn|nguon|source|tham\s*khảo|tham\s*khao|reference/i },
  { role: 'date', pattern: /ngày|ngay|date|thời\s*gian|thoi\s*gian|time|created|updated|cập\s*nhật|cap\s*nhat/i },
]

// Only these date columns are filled in by the server. Any other date column ("Ngày")
// is the owner's own data, so it stays editable in the form instead.
export const ECONOMY_AUTO_DATE_PATTERN = /tạo|tao\b|created|cập\s*nhật|cap\s*nhat|updated|sửa|sua\b|modified/i

// Số từ / phút dùng để ước lượng thời gian đọc tab Kiến thức
export const ECONOMY_WORDS_PER_MINUTE = 200 as number

// Rows per page in the discussion table
export const ECONOMY_PAGE_SIZE = 15 as number

// A cell longer than this gets a textarea rather than a single line input
export const ECONOMY_LONG_TEXT_LENGTH = 80 as number

export const ECONOMY_STATUS_TONE: { pattern: RegExp; className: string }[] = [
  {
    pattern: /xong|done|closed|đóng|dong|resolved|giải\s*quyết|giai\s*quyet/i,
    className: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-200',
  },
  { pattern: /đang|dang|open|mở|mo\b|progress|pending|chờ|cho\b/i, className: 'border-amber-300/40 bg-amber-400/10 text-amber-200' },
  { pattern: /hủy|huy|cancel|reject|từ\s*chối|tu\s*choi/i, className: 'border-rose-300/40 bg-rose-400/10 text-rose-200' },
]

export enum ECONOMY_TAB {
  Discussion = 'discussion',
  Knowledge = 'knowledge',
}
