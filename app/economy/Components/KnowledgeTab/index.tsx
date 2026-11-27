'use client'
import { useMemo, useState } from 'react'

import ConfirmDelete from '../ConfirmDelete'
import DocBlocks from '../DocBlocks'
import { EditIcon, SearchIcon } from '../Icons'
import KnowledgeForm from '../KnowledgeForm'
import Modal from '../Modal'
import { EmptyState, ErrorState, LoadingState, NoticeState } from '../StateView'

import { ECONOMY_WORDS_PER_MINUTE } from '@/constants/economy'
import { useEconomyKnowledge } from '@/hooks/tank-query/useEconomy'
import EconomyApi from '@/services/EconomyApi'
import { DocBlock, KnowledgeSection } from '@/types/economy'
import { cn } from '@/utils/functions'

const sectionText = (section: KnowledgeSection) => `${section.title}\n${section.text}`.toLowerCase()

const countWords = (blocks: DocBlock[]): number =>
  blocks.reduce((total, block) => {
    if (block.type === 'table') return total + block.rows.flat(2).reduce((cells, run) => cells + run.text.split(/\s+/).length, 0)

    return total + block.runs.reduce((runs, run) => runs + run.text.split(/\s+/).filter(Boolean).length, 0)
  }, 0)

const KnowledgeTab = () => {
  const { data, isLoading, isFetching, isError, error, refetch } = useEconomyKnowledge()

  const [keyword, setKeyword] = useState('')
  const [activeId, setActiveId] = useState('')
  const [formSection, setFormSection] = useState<KnowledgeSection | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteSection, setDeleteSection] = useState<KnowledgeSection | null>(null)

  const sections = useMemo(() => data?.sections || [], [data?.sections])
  const canWrite = Boolean(data?.canWrite)

  const filtered = useMemo(() => {
    const needle = keyword.trim().toLowerCase()

    if (!needle) return sections

    return sections.filter((section) => sectionText(section).includes(needle))
  }, [sections, keyword])

  const readingMinutes = useMemo(() => {
    const words = countWords(data?.intro || []) + sections.reduce((total, section) => total + countWords(section.blocks), 0)

    return Math.max(1, Math.round(words / ECONOMY_WORDS_PER_MINUTE))
  }, [data?.intro, sections])

  // The revision captured when the form opens is exactly what the user saw
  const openForm = (section?: KnowledgeSection) => {
    setFormSection(section || null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setFormSection(null)
  }

  const scrollTo = (id: string) => {
    setActiveId(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const renderToc = () => (
    <aside className='hidden lg:block w-64 shrink-0'>
      <div className='sticky top-6 flex max-h-[70vh] flex-col gap-3 overflow-y-auto custom-scrollbar bg-gray-800 border border-gray-700 rounded-lg p-5'>
        <span className='text-[11px] uppercase text-gray-500'>Mục lục</span>
        <nav className='flex flex-col gap-1'>
          {sections.map((section) => (
            <button
              key={section.id}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-sm transition-colors',
                section.level > 1 && 'pl-6 text-[13px]',
                activeId === section.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
              type='button'
              onClick={() => scrollTo(section.id)}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )

  const renderSection = (section: KnowledgeSection, index: number) => (
    <div key={section.id} className='scroll-mt-6' id={section.id}>
      <article className='flex flex-col gap-3 bg-gray-800 border border-gray-700 rounded-lg p-5 md:p-6'>
        <div className='flex items-start gap-4'>
          <div className='flex flex-1 items-baseline gap-3'>
            <span className='text-xs text-gray-500'>{String(index + 1).padStart(2, '0')}</span>
            <h3 className={cn('font-semibold text-white', section.level === 1 ? 'text-xl md:text-2xl' : 'text-lg md:text-xl')}>{section.title}</h3>
          </div>

          {canWrite && (
            <div className='flex items-center gap-2'>
              <button
                aria-label='Sửa'
                className='flex items-center justify-center w-8 h-8 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors'
                type='button'
                onClick={() => openForm(section)}
              >
                <EditIcon />
              </button>
              <button
                className='px-3 py-1.5 bg-gray-700 hover:bg-red-600 border border-gray-600 rounded-lg text-[11px] uppercase text-gray-300 transition-colors'
                type='button'
                onClick={() => setDeleteSection(section)}
              >
                Xoá
              </button>
            </div>
          )}
        </div>

        <DocBlocks blocks={section.blocks} />
      </article>
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
      <div className='flex gap-8'>
        {sections.length > 0 && renderToc()}

        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          {(data?.intro?.length || 0) > 0 && (
            <div className='bg-gray-800 border border-gray-700 rounded-lg p-5 md:p-6'>
              <DocBlocks blocks={data?.intro || []} />
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              action={
                canWrite ? (
                  <button
                    className='px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors'
                    type='button'
                    onClick={() => openForm()}
                  >
                    + Thêm mới
                  </button>
                ) : undefined
              }
              message='Tài liệu chưa có mục nào. Thêm mục đầu tiên để bắt đầu.'
            />
          ) : (
            filtered.map(renderSection)
          )}
        </div>
      </div>
    )
  }

  return (
    <section className='flex flex-col gap-5'>
      <div className='flex flex-col md:flex-row md:items-center gap-3'>
        <label className='flex flex-1 items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2'>
          <SearchIcon className='w-4 h-4 text-gray-400' />
          <input
            className='w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none'
            placeholder='Tìm kiếm'
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <span className='whitespace-nowrap text-[11px] text-gray-500'>{filtered.length} mục</span>
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

      <div className='flex flex-wrap items-center gap-4 text-[11px] text-gray-500'>
        {sections.length > 0 && <span>Đọc khoảng {readingMinutes} phút</span>}
        {data?.docUrl && (
          <a className='hover:text-blue-400 transition-colors' href={data.docUrl} rel='noopener noreferrer' target='_blank'>
            Nguồn dữ liệu · google docs ↗
          </a>
        )}
      </div>

      {renderBody()}

      {isFormOpen && (
        <Modal title={formSection ? 'Sửa mục kiến thức' : 'Mục kiến thức mới'} onClose={closeForm}>
          <KnowledgeForm
            refetch={refetch}
            revisionId={data?.revisionId}
            section={formSection || undefined}
            onCancel={closeForm}
            onSuccess={closeForm}
          />
        </Modal>
      )}

      {deleteSection && (
        <Modal className='max-w-md' title='Xác nhận xoá' onClose={() => setDeleteSection(null)}>
          <ConfirmDelete
            refetch={refetch}
            subject={deleteSection.title}
            onCancel={() => setDeleteSection(null)}
            onConfirm={() =>
              EconomyApi.deleteSection({ startIndex: deleteSection.startIndex, endIndex: deleteSection.endIndex, revisionId: data?.revisionId })
            }
            onSuccess={() => setDeleteSection(null)}
          />
        </Modal>
      )}
    </section>
  )
}

export default KnowledgeTab
