import {createFileRoute, Link, useParams} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Table, Alert, Empty, Spin, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getForm, getCurrentVersion, listSubmissions } from '#/services/form.ts'
import type {FormSchema, FieldValue , Submission} from '#/types/schema'
import { ApiError } from '#/lib/axios.ts'

export const Route = createFileRoute('/_protected/forms/$id/responses/')({
  component: ResponsesPage
})

const PAGE_SIZE = 20

// format one stored value for a cell (arrays joined, bool -> Yes/No, empty -> —)
function formatValue(v: FieldValue | undefined): React.ReactNode {
  if (v === null || v === undefined || v === '') return <span className="text-gray-400">—</span>
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function ResponsesPage() {
  const { id } = useParams({ from: '/_protected/forms/$id/responses/' })
  const [page, setPage] = useState(1)

  // form (name) + its current version (to know which columns to show)
  const formQuery = useQuery({ queryKey: ['forms', id], queryFn: () => getForm(id) })
  const versionQuery = useQuery({
    queryKey: ['forms', id, 'current-version'],
    queryFn: () => getCurrentVersion(id),
  })
  const subsQuery = useQuery({
    queryKey: ['forms', id, 'submissions', page],
    queryFn: () => listSubmissions(id, page, PAGE_SIZE),
  })

  // build columns dynamically from the schema's field order (x-order).
  const columns: ColumnsType<Submission> = useMemo(() => {
    const schema = versionQuery.data?.schemaJson as FormSchema | undefined
    if (!schema) return []

    const order = schema['x-order'] ?? Object.keys(schema.properties ?? {})
    const fieldCols: ColumnsType<Submission> = order.map((key) => ({
      title: schema.properties?.[key]?.['x-label'] ?? key,
      key,
      render: (_, row) => formatValue(row.data?.[key] as FieldValue),
    }))

    return [
      ...fieldCols,
      {
        title: 'Submitted',
        key: 'createdAt',
        width: 160,
        render: (_, row) => new Date(row.createdAt).toLocaleString(),
      },
      {
        title: 'By',
        key: 'submittedBy',
        width: 110,
        render: (_, row) =>
          row.submittedBy ? <Tag>user</Tag> : <Tag color="default">anonymous</Tag>,
      },
      {
        title: '',
        key: 'actions',
        width: 80,
        render: (_, row) => (
          <Link to="/forms/$id/responses/$submissionId" params={{ id, submissionId: row.id }}>
            View
          </Link>
        ),
      },
    ]
  }, [versionQuery.data])

  const isLoading = formQuery.isPending || versionQuery.isPending || subsQuery.isPending
  const loadError =
    (formQuery.isError && formQuery.error) ||
    (versionQuery.isError && versionQuery.error) ||
    (subsQuery.isError && subsQuery.error)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{formQuery.data?.name}</h1>
          <p className="text-sm text-gray-500">
            {subsQuery.data?.total_items ?? 0} response
            {(subsQuery.data?.total_items ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {loadError && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={loadError instanceof ApiError ? loadError.message : 'Failed to load responses'}
        />
      )}

      <Table<Submission>
        columns={columns}
        dataSource={subsQuery.data?.items ?? []}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="No responses yet." /> }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: subsQuery.data?.total_items ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  )
}