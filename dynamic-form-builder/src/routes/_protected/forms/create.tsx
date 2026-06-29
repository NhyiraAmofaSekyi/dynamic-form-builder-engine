import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Input } from 'antd'
import { Builder } from '#/components/builder.tsx'
import type { FormSchema } from '#/types/schema'
import {createForm} from "#/services/form.ts";
import {ApiError} from "#/lib/axios.ts";
import {toast} from "sonner";

export const Route = createFileRoute('/_protected/forms/create')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation({
    mutationFn: createForm,
    onSuccess: async  (form) =>  {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      toast.success('Form created')
      navigate({ to: '/forms/$id', params: { id: form.id } })

    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Could not create form'),
  })

  const  handleSave =  (schema: FormSchema) => {
    if (!name.trim()) {
      toast.warning('Please enter a form name')
      return
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      schema,
    })
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Input
            size="large"
            placeholder="Form name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-sm"
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Builder
          onSave={handleSave}
          saveLabel="Create form"
          saving={createMutation.isPending}
        />
      </div>
    </div>
  )
}