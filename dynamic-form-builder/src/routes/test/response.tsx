import { createFileRoute } from '@tanstack/react-router'
import { Form, Spin, Alert, Button } from "antd";
import { useState } from "react";

import { DynamicForm } from "#/components/dynamic-form";
import { ResponseView } from "#/components/response-view";
import { useExampleSchema } from "#/hooks/example.ts";
import type { Response } from "#/types/schema.ts";

export const Route = createFileRoute('/test/response')({
  component: RouteComponent,
})


function RouteComponent() {
  const [form] = Form.useForm();
  const { data: schema, isLoading, isError, refetch } = useExampleSchema();
  const [responses, setResponses] = useState<Response[]>([]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (isError || !schema) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Alert
          type="error"
          message="Couldn't load the form"
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const handleSubmit = (data: Record<string, unknown>) => {
    setResponses((prev) => [...prev, data as Response]);
    form.resetFields();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ---------------- LEFT: FORM ---------------- */}
      <div className="w-1/2 border-r border-gray-100 bg-white p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Form</h2>
          <p className="text-sm text-gray-500">
            Submit to see the response on the right.
          </p>
        </div>
        <DynamicForm form={form} schema={schema} onSubmit={handleSubmit} />
      </div>

      {/* ---------------- RIGHT: RESPONSES ---------------- */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Responses</h2>
            <p className="text-sm text-gray-500">{responses.length} submitted</p>
          </div>
          {responses.length > 0 && (
            <Button size="small" onClick={() => setResponses([])}>
              Clear
            </Button>
          )}
        </div>

        <ResponseView responses={responses} order={schema["x-order"]} />
      </div>
    </div>
  );
}