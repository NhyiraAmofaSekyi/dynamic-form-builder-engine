import { createFileRoute, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Form, Spin, Result, Button } from 'antd'
import { toast } from 'sonner'
import axios from 'axios'
import { DynamicForm } from '#/components/dynamic-form'
import { toAntdErrors } from '#/lib/to-antd-errors'
import { getPublicForm, submitResponse } from '#/services/form.ts'
import { ApiError } from '#/lib/axios.ts'
import type { FieldError } from '#/services/schema.ts'

export const Route = createFileRoute('/f/$id')({
  component: PublicFillPage,
})

function PublicFillPage() {
  const { id } = useParams({ from: '/f/$id' })
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['public-form', id],
    queryFn: () => getPublicForm(id),
  })

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true)
    try {
      await submitResponse(id, values)
      toast.success('Response submitted')
      setDone(true)
    } catch (err) {
      // 422 = validation failure: map field errors onto the form fields (a toast
      // can't show per-field errors). Everything else gets an error toast.
      if (axios.isAxiosError(err) && err.response?.status === 422 && data) {
        const fieldErrors = (err.response.data?.errors ?? []) as FieldError[]
        const mapped = toAntdErrors(fieldErrors, data.schemaJson)
        form.setFields(
          mapped.fieldErrors.map((f) => ({ name: f.name, errors: f.errors })),
        )
        if (mapped.formErrors.length > 0) {
          toast.error(mapped.formErrors.join(' '))
        } else {
          toast.error('Please fix the highlighted fields')
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Result
          status="404"
          title="Form unavailable"
          subTitle={error instanceof ApiError ? error.message : 'This form could not be found.'}
        />
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Result
          status="success"
          title="Thank you!"
          subTitle="Your response has been submitted."
          extra={
            <Button
              onClick={() => {
                form.resetFields()
                setDone(false)
              }}
            >
              Submit another response
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{data.name}</h1>
        {data.description && (
          <p className="mt-1 mb-6 text-gray-500">{data.description}</p>
        )}

        <DynamicForm
          schema={data.schemaJson}
          form={form}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  )
}