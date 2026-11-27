export type DiscussionFieldRole = 'id' | 'title' | 'content' | 'author' | 'tags' | 'status' | 'link' | 'date' | 'other'

export type DiscussionField = {
  /** Header cell exactly as it appears in the sheet — also the key inside `values` */
  key: string
  /** Column index, 0 based */
  index: number
  role: DiscussionFieldRole
}

export type DiscussionItem = {
  /** 1 based sheet row, used as the identity for update / delete */
  row: number
  values: Record<string, string>
}

export type DiscussionListData = {
  fields: DiscussionField[]
  items: DiscussionItem[]
  sheetUrl: string
  canWrite: boolean
}

export type DiscussionPayload = {
  values: Record<string, string>
}

export type DocTextRun = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  link?: string
}

export type DocBlock =
  | { type: 'heading'; level: number; runs: DocTextRun[] }
  | { type: 'paragraph'; runs: DocTextRun[] }
  | { type: 'listItem'; level: number; ordered: boolean; runs: DocTextRun[] }
  | { type: 'quote'; runs: DocTextRun[] }
  | { type: 'table'; rows: DocTextRun[][][] }

export type KnowledgeSection = {
  /** Stable within one read: heading slug + start index */
  id: string
  title: string
  level: number
  blocks: DocBlock[]
  /** Docs API indexes covering the whole section, heading included */
  startIndex: number
  endIndex: number
  /** Body as plain text, what the edit form shows */
  text: string
}

export type KnowledgeData = {
  title: string
  revisionId: string
  tabId?: string
  /** Blocks before the first heading */
  intro: DocBlock[]
  sections: KnowledgeSection[]
  docUrl: string
  canWrite: boolean
}

export type KnowledgePayload = {
  title: string
  text: string
  level?: number
  revisionId: string
  startIndex?: number
  endIndex?: number
}
