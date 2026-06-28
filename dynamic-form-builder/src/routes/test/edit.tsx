import { createFileRoute } from "@tanstack/react-router";
import { Alert, Button, Spin, message } from "antd";

import { useExampleSchema, useUpdateSchema } from "#/hooks/example.ts";
import type { FormSchema } from "#/types/schema.ts";
import {schemaToFields} from "#/services/fields.ts";
import {Builder} from "#/components/create-form.tsx";

export const Route = createFileRoute("/test/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: schema, isLoading, isError, refetch } = useExampleSchema();
  const updateSchema = useUpdateSchema();

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
          action={<Button size="small" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const handleSave = async (next: FormSchema) => {
    try {
      await updateSchema.mutateAsync(next);
      message.success("Form updated");
    } catch {
      message.error("Couldn't save the form");
    }
  };

  return (
    <Builder
      // parse the stored schema into editable fields (the inverse of save)
      initialFields={schemaToFields(schema)}
      onSave={handleSave}
      saveLabel="Save changes"
      saving={updateSchema.isPending}
    />
  );
}