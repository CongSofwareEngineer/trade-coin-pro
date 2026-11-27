'use client'
import { useEffect, useMemo, useState } from 'react'

import ConfirmDelete from '../ConfirmDelete'
import DiscussionForm from '../DiscussionForm'
import DiscussionList from '../DiscussionList'
import DiscussionTable from '../DiscussionTable'
import Pagination from '../Pagination'
import { EmptyState, ErrorState, LoadingState, NoticeState } from '../StateView'

import { SearchIcon } from '@/components/Icons'
import { BREAKPOINT_MOBILE } from '@/constants/app'
import { ECONOMY_PAGE_SIZE } from '@/constants/economy'
import { useEconomyDiscussions } from '@/hooks/tank-query/useEconomy'
import useMedia from '@/hooks/useMedia'
import useModal from '@/hooks/useModal'
import EconomyApi from '@/services/EconomyApi'
import { DiscussionItem } from '@/types/economy'
import { collectTags, hasTag, headlineOf, matchesKeyword } from '@/utils/economy'
import { cn } from '@/utils/functions'

const DiscussionTab = () => {
  const { openModal, closeModal } = useModal()
  // Columns do not fit a phone, so below this width the records stack instead
  const { isMobile } = useMedia(BREAKPOINT_MOBILE)
  const { data, isLoading, isFetching, isError, error, refetch } = useEconomyDiscussions()

  const [keyword, setKeyword] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<number[]>([])

  const fields = useMemo(() => data?.fields || [], [data?.fields])
  const items = useMemo(() => data?.items || [], [data?.items])
  const canWrite = Boolean(data?.canWrite)

  const tags = useMemo(() => collectTags(fields, items), [fields, items])

  const filtered = useMemo(
    () => items.filter((item) => matchesKeyword(item, keyword) && (!tag || hasTag(fields, item, tag))),
    [items, keyword, tag, fields]
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / ECONOMY_PAGE_SIZE))

  // A narrowed filter can leave the current page out of range
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount))
  }, [pageCount])

  useEffect(() => {
    setPage(1)
  }, [keyword, tag])

  const pageItems = useMemo(() => filtered.slice((page - 1) * ECONOMY_PAGE_SIZE, page * ECONOMY_PAGE_SIZE), [filtered, page])

  // The modal store keeps the element it was opened with, so each form owns its own
  // submitting state and closes the modal itself once the write went through.
  const openForm = (item?: DiscussionItem) =>
    openModal({
      title: item ? 'Sửa chủ đề' : 'Chủ đề mới',
      classNames: { container: 'md:w-[640px]' },
      children: <DiscussionForm fields={fields} item={item} refetch={refetch} onCancel={() => closeModal()} onSuccess={() => closeModal()} />,
    })

  const openDelete = (item: DiscussionItem) =>
    openModal({
      title: 'Xác nhận xoá',
      children: (
        <ConfirmDelete
          refetch={refetch}
          subject={headlineOf(fields, item)}
          onCancel={() => closeModal()}
          onConfirm={() => EconomyApi.deleteDiscussion(item.row)}
          onSuccess={() => closeModal()}
        />
      ),
    })

  const toggleRow = (row: number) =>
    setExpandedRows((previous) => (previous.includes(row) ? previous.filter((item) => item !== row) : [...previous, row]))

  const renderToolbar = () => (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col md:flex-row md:items-center gap-3'>
        <label className='flex flex-1 items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5'>
          <SearchIcon className='w-4 h-4 text-gray-400' />
          <input
            className='w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none'
            placeholder='Tìm theo chủ đề, nội dung, người đăng...'
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <span className='whitespace-nowrap text-[11px] text-gray-500'>
            {keyword || tag ? `${filtered.length}/${items.length} chủ đề` : `${items.length} chủ đề`}
          </span>
        </label>

        <div className='flex items-center gap-2'>
          <button
            className='px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-sm text-white transition-colors disabled:opacity-40'
            disabled={isFetching}
            type='button'
            onClick={() => refetch()}
          >
            {isFetching ? 'Đang tải...' : 'Tải lại'}
          </button>
          {canWrite && (
            <button
              className='px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors'
              type='button'
              onClick={() => openForm()}
            >
              + Thêm mới
            </button>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          <button
            className={cn(
              'px-3 py-1.5 border rounded-full text-[11px] uppercase transition-colors',
              tag ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-blue-600 border-blue-500 text-white'
            )}
            type='button'
            onClick={() => setTag('')}
          >
            Tất cả
          </button>
          {tags.map((single) => (
            <button
              key={single}
              className={cn(
                'px-3 py-1.5 border rounded-full text-[11px] transition-colors',
                tag === single ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              )}
              type='button'
              onClick={() => setTag(single)}
            >
              #{single}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderBody = () => {
    if (isLoading) return <LoadingState />

    if (isError) return <ErrorState message={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />

    if (!canWrite) {
      return (
        <NoticeState>
          Chưa cấu hình Google service account trên server nên chưa đọc được file. Thêm GOOGLE_SERVICE_ACCOUNT_EMAIL và GOOGLE_PRIVATE_KEY, rồi chia
          sẻ 2 file cho email đó với quyền Editor.
        </NoticeState>
      )
    }

    return (
      <>
        {renderToolbar()}

        {fields.length === 0 && (
          <NoticeState>Sheet chưa có dòng tiêu đề. Khi bạn thêm chủ đề đầu tiên, hệ thống sẽ tự tạo các cột mặc định.</NoticeState>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            action={
              items.length === 0 ? (
                <button
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors'
                  type='button'
                  onClick={() => openForm()}
                >
                  + Thêm mới
                </button>
              ) : undefined
            }
            message={items.length === 0 ? 'Chưa có chủ đề nào. Bắt đầu bằng một câu hỏi của bạn.' : 'Không có chủ đề nào khớp với bộ lọc.'}
          />
        ) : (
          <div className='flex flex-col gap-5'>
            {isMobile ? (
              <DiscussionList
                activeTag={tag}
                canWrite={canWrite}
                fields={fields}
                items={pageItems}
                onDelete={openDelete}
                onEdit={openForm}
                onTagClick={setTag}
              />
            ) : (
              <DiscussionTable
                activeTag={tag}
                canWrite={canWrite}
                expandedRows={expandedRows}
                fields={fields}
                items={pageItems}
                onDelete={openDelete}
                onEdit={openForm}
                onTagClick={setTag}
                onToggleRow={toggleRow}
              />
            )}

            <Pagination page={page} pageCount={pageCount} pageSize={ECONOMY_PAGE_SIZE} total={filtered.length} onChange={setPage} />
          </div>
        )}
      </>
    )
  }

  return (
    <section className='flex flex-col gap-5'>
      {data?.sheetUrl && (
        <a
          className='self-start text-[11px] text-gray-500 hover:text-blue-400 transition-colors'
          href={data.sheetUrl}
          rel='noopener noreferrer'
          target='_blank'
        >
          Nguồn dữ liệu · google sheets ↗
        </a>
      )}

      {renderBody()}
    </section>
  )
}

export default DiscussionTab
