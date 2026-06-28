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
      render: (name: string) => (
        <span className="font-medium text-[#173a40]">{name}</span>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug: string) => (
        <code className="rounded-md  bg-[rgba(79,184,178,0.1)] px-2 py-0.5 font-mono text-xs text-[#328f97]">
          {slug}
        </code>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (d?: string) =>
        d || <span className="text-[rgba(23,58,64,0.35)]">—</span>,
    },
    {
      title: 'Version',
      dataIndex: 'currentVersionId',
      key: 'currentVersionId',
      render: (v?: string) =>
        v ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(47,106,74,0.12)] px-2.5 py-0.5 text-xs font-medium text-[#2f6a4a]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2f6a4a]" />
          live
        </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-[rgba(23,58,64,0.06)] px-2.5 py-0.5 text-xs font-medium text-[rgba(23,58,64,0.5)]">
          no version
        </span>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (iso: string) => (
        <span className="text-[rgba(23,58,64,0.6)]">
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
            className="text-[#328f97] hover:bg-[rgba(79,184,178,0.1)]"
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
            className="text-[rgba(23,58,64,0.7)] hover:bg-[rgba(79,184,178,0.1)]"
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
      <div className="mb-6 pb-4 flex items-center justify-between border-b border-gray-200= ">
        <h1 className="text-3xl font-bold">Your Forms</h1>
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