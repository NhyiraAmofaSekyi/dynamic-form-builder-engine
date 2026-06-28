import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Table, Button, Alert, Empty, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Form } from '#/types/schema'
import { ApiError } from '#/lib/axios.ts'
import { listForms } from '#/services/form.ts'
import { ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/_protected/forms/')({
  component: FormsPage,
})

function FormsPage() {
  const navigate = useNavigate()

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['forms'],
    queryFn: () => listForms(),
  })

  const columns: ColumnsType<Form> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-medium text-sea-ink">{name}</span>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug?: string) =>
        slug?.trim() ? (
          <code className="rounded-md border-0 bg-lagoon-500/10 px-2 py-0.5 font-mono text-xs text-lagoon-500">
            {slug}
          </code>
        ) : (
          <span className="text-sea-ink/35">—</span>
        ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d?: string) =>
        d?.trim() ? d : <span className="text-sea-ink/35">—</span>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (iso: string) => (
        <span className="text-sea-ink/60">
          {new Date(iso).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, form) => (
        <Space>
          <Button
            size="small"
            type="text"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            disabled={!form.currentVersionId}
            className="text-lagoon-500 hover:bg-lagoon-500/10"
            onClick={(e) => {
              e.stopPropagation()
              window.open(`/f/${form.id}`, '_blank', 'noopener,noreferrer')
            }}
          >
            Open
          </Button>
          <Button
            size="small"
            type="text"
            className="text-sea-ink/70 hover:bg-lagoon-500/10"
            onClick={(e) => {
              e.stopPropagation()
              navigate({ to: '/forms/$id/responses', params: { id: form.id } })
            }}
          >
            Responses
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-sea-ink">Your Forms</h1>
        <Button type="primary" onClick={() => navigate({ to: '/forms/create' })}>
          New form
        </Button>
      </div>

      {isError && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={error instanceof ApiError ? error.message : 'Failed to load forms'}
        />
      )}

      <Table<Form>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isPending}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: <Empty description="No forms yet. Create your first one." />,
        }}
        onRow={(form) => ({
          onClick: () => navigate({ to: '/forms/$id', params: { id: form.id } }),
          className: 'cursor-pointer',
        })}
        pagination={false}
      />
    </div>
  )
}