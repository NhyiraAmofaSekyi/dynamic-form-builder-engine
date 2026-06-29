import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Button, Spin, Alert } from 'antd'
import { Builder } from '#/components/builder.tsx'

import type { FormSchema } from '#/types/schema'
import {ApiError} from "#/lib/axios.ts";
import {schemaToFields} from "#/services/fields.ts";
import {createVersion, getCurrentVersion, getForm} from "#/services/form.ts";
import {toast} from "sonner";
import { LinkIcon} from "lucide-react";

export const Route = createFileRoute('/_protected/forms/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = useParams({ from: '/_protected/forms/$id/' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const formQuery = useQuery({
    queryKey: ['forms', id],
    queryFn: () => getForm(id),
  })
  const versionQuery = useQuery({
    queryKey: ['forms', id, 'current-version'],
    queryFn: () => getCurrentVersion(id),
  })

  // convert the stored schema -> builder fields
  const initialFields = useMemo(() => {
    if (!versionQuery.data) return []
    return schemaToFields(versionQuery.data.schemaJson)
  }, [versionQuery.data])

  // saving = creating a NEW version (append-only; never mutate the old one).
  const saveMutation = useMutation({
    mutationFn: (schema: FormSchema) => createVersion(id, schema),
    onSuccess: () => {
      // the current version changed — refresh both queries.
      queryClient.invalidateQueries({ queryKey: ['forms', id] })
      queryClient.invalidateQueries({ queryKey: ['forms', id, 'current-version'] })
      toast.success('New version saved')
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Could not save changes'),
  })

  const isLoading = formQuery.isPending || versionQuery.isPending
  const loadError =
    (formQuery.isError && formQuery.error) ||
    (versionQuery.isError && versionQuery.error)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-8">
        <Button className="mb-4" onClick={() => navigate({ to: '/forms' })}>
          ← Back
        </Button>
        <Alert
          type="error"
          showIcon
          title={loadError instanceof ApiError ? loadError.message : 'Failed to load form'}
        />
      </div>
    )
  }

  return (
    <div className="flex  flex-col bg-gray-50 ">
      <div className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{formQuery.data?.name}</h1>

          <button
            onClick={() => {
              const url = `${window.location.origin}/f/${id}`
              navigator.clipboard.writeText(url)
              toast.success('Link copied')
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-lagoon-500/20 bg-lagoon-400/10 px-4 py-1 text-xs font-medium text-lagoon-600 transition hover:bg-lagoon-400/20"
          >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lagoon-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lagoon-500" />
      </span>
            Copy link
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Editing creates a new version. Past responses stay pinned to the
          version that produced them.
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Builder
          initialFields={initialFields}
          onSave={(schema) => saveMutation.mutate(schema)}
          saveLabel="Save new version"
          saving={saveMutation.isPending}
        />
      </div>
    </div>
  )
}