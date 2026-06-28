import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {Table, Button, Alert, Empty, Tag, Space} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Form } from '#/types/schema'
import {ApiError} from "#/lib/axios.ts";
import {listForms} from "#/services/form.ts";
import {ExternalLink} from "lucide-react";

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
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string) => <code className="text-gray-500">{slug}</code>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d?: string) => d || <span className="text-gray-400">—</span>,
    },
    {
      title: 'Version',
      dataIndex: 'currentVersionId',
      key: 'currentVersionId',
      render: (v?: string) =>
        v ? <Tag color="green">live</Tag> : <Tag color="default">no version</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (iso: string) => new Date(iso).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, form) => (
        <Space>
          {/* Open the PUBLIC fill page in a new tab. stopPropagation so the
              row's onClick (edit) doesn't also fire. Disabled if no live version. */}
          <Button
            size="small"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            disabled={!form.currentVersionId}
            onClick={(e) => {
              e.stopPropagation()
              window.open(`/f/${form.id}`, '_blank', 'noopener,noreferrer')
            }}
          >
            Open
          </Button>
          <Button
            size="small"
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your forms</h1>
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