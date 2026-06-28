import { createFileRoute } from '@tanstack/react-router'
import {Alert, Button, Form, message, Spin} from "antd";
import {useExampleSchema, useValidateSubmission} from "#/hooks/example.ts";
import {toAntdErrors} from "#/lib/to-antd-errors.ts";
import {DynamicForm} from "#/components/dynamic-form.tsx";

export const Route = createFileRoute('/test/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [form] = Form.useForm()
  const { data: schema, isLoading, isError, refetch } = useExampleSchema()
  const validate = useValidateSubmission()

  const handleSubmit = async (data: Record<string, unknown>) => {
    const result = await validate.mutateAsync(data)
    if (result.valid) {
      message.success('Submission is valid!')
      return
    }
    // server said invalid — push field errors back onto the form
    const { fieldErrors, formErrors } = toAntdErrors(result.errors ?? [], schema!)
    form.setFields(fieldErrors)
    if (formErrors.length) message.error(formErrors.join('; '))
  }

  return (
    <div className="mx-auto my-10 max-w-md px-4">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Application form
      </h1>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        )}

        {isError && (
          <Alert
            type="error"
            title="Couldn't load the form"
            description="The form schema failed to load."
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        )}

        {schema && (
          <DynamicForm
            form={form}
            schema={schema}
            onSubmit={handleSubmit}
            submitting={validate.isPending}
          />
        )}
      </div>
    </div>
  )
}