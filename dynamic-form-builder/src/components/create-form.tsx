import {Button, Dropdown, Form} from "antd";
import {useState} from "react";
import {DynamicForm} from "#/components/dynamic-form";
import {TextFieldBuilderEditor} from "#/components/text-field-builder";
import {SelectFieldBuilderEditor} from "#/components/select-field-builder.tsx";
import {MultiSelectFieldBuilderEditor} from "#/components/multi-select-field-builder.tsx";
import {NumberFieldBuilderEditor} from "#/components/number-field-builder.tsx";
import {DateFieldBuilderEditor} from "#/components/date-field-builder.tsx";
import {BooleanFieldBuilderEditor} from "#/components/boolean-field-editor.tsx";
import {Clipboard} from "lucide-react";

import type {FormFieldBuilder} from "#/types/fields.ts";
import type {FormSchema} from "#/types/schema.ts";
import type {BuilderItem} from "#/types/builder.ts";
import {fieldsToSchema} from "#/services/fields.ts";

type FieldType = FormFieldBuilder["type"];

const ADD_OPTIONS: { type: FieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "select", label: "Single select" },
  { type: "multiselect", label: "Multi select" },
  { type: "number", label: "Number" },
  { type: "date", label: "Date" },
  { type: "boolean", label: "Yes / No" },
];

function blankField(type: FieldType): FormFieldBuilder {
  const base = { name: "", label: "", required: false, description: "", placeholder: "" };
  switch (type) {
    case "text":
    case "textarea":
      return { ...base, type: "text", minLength: undefined, maxLength: undefined };
    case "select":
      return { ...base, type: "select", options: [] };
    case "multiselect":
      return { ...base, type: "multiselect", options: [], minItems: undefined, maxItems: undefined };
    case "number":
      return { ...base, type: "number", minimum: undefined, maximum: undefined };
    case "date":
      return { ...base, type: "date" };
    case "boolean":
      return { ...base, type: "boolean" };
  }
}

function typeLabel(type: FieldType): string {
  switch (type) {
    case "text":
    case "textarea":
      return "Text";
    case "select":
      return "Single select";
    case "multiselect":
      return "Multi select";
    case "number":
      return "Number";
    case "date":
      return "Date";
    case "boolean":
      return "Yes / No";
  }
}

type BuilderProps = {
  // Seed the builder with existing fields (update mode). Empty => create mode.
  initialFields?: FormFieldBuilder[];
  // What the primary button does with the derived schema. Defaults to logging.
  onSave?: (schema: FormSchema) => void;
  saveLabel?: string;
  saving?: boolean;
};

export function Builder({
                          initialFields = [],
                          onSave,
                          saveLabel = "Log Schema",
                          saving = false,
                        }: BuilderProps) {
  const [form] = Form.useForm();

  // Seed state from initialFields once (wrap each with a stable id).
  const [items, setItems] = useState<BuilderItem[]>(() =>
    initialFields.map((field) => ({ id: crypto.randomUUID(), field })),
  );

  const schema = fieldsToSchema(items.map((i) => i.field));
  const hasFields = Object.keys(schema.properties).length > 0;

  const addField = (type: FieldType) =>
    setItems((prev) => [...prev, { id: crypto.randomUUID(), field: blankField(type) }]);

  const updateField = (id: string, next: FormFieldBuilder) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, field: next } : it)));

  const removeField = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const move = (id: string, dir: -1 | 1) =>
    setItems((prev) => {
      const i = prev.findIndex((it) => it.id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const renderEditor = (id: string, field: FormFieldBuilder) => {
    const onChange = (next: FormFieldBuilder) => updateField(id, next);
    switch (field.type) {
      case "text":
      case "textarea":
        return <TextFieldBuilderEditor value={field} onChange={onChange} />;
      case "select":
        return <SelectFieldBuilderEditor value={field} onChange={onChange} />;
      case "multiselect":
        return <MultiSelectFieldBuilderEditor value={field} onChange={onChange} />;
      case "number":
        return <NumberFieldBuilderEditor value={field} onChange={onChange} />;
      case "date":
        return <DateFieldBuilderEditor value={field} onChange={onChange} />;
      case "boolean":
        return <BooleanFieldBuilderEditor value={field} onChange={onChange} />;
      default: {
        return field;
      }
    }
  };

  const handleSave = () => {
    if (onSave) onSave(schema);
    else console.log("Generated schema:", JSON.stringify(schema, null, 2));
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* ---------------- LEFT: BUILDER ---------------- */}
      <div className="w-1/2 border-r border-gray-100 bg-white p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Builder</h2>
          <p className="text-sm text-gray-500">Create and manage form fields.</p>
        </div>

        <div className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <div key={item.id} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-lg">{typeLabel(item.field.type)}</p>
                <div className="flex gap-1">
                  <Button size="small" onClick={() => move(item.id, -1)} disabled={idx === 0}>
                    ↑
                  </Button>
                  <Button
                    size="small"
                    onClick={() => move(item.id, 1)}
                    disabled={idx === items.length - 1}
                  >
                    ↓
                  </Button>
                  <Button size="small" danger onClick={() => removeField(item.id)}>
                    ✕
                  </Button>
                </div>
              </div>
              {renderEditor(item.id, item.field)}
            </div>
          ))}
        </div>

        <Dropdown
          trigger={["click"]}
          menu={{
            items: ADD_OPTIONS.map((o) => ({
              key: o.type,
              label: o.label,
              onClick: () => addField(o.type),
            })),
          }}
        >
          <Button type="dashed" block className="mt-4 h-12">
            + Add field
          </Button>
        </Dropdown>

        <div className="mt-6 flex gap-3">
          <Button
            type="primary"
            className="flex-1"
            disabled={!hasFields}
            loading={saving}
            onClick={handleSave}
          >
            {saveLabel}
          </Button>
          <Button onClick={() => setItems([])} disabled={items.length === 0}>
            Clear
          </Button>
        </div>
      </div>

      {/* ---------------- RIGHT: PREVIEW ---------------- */}
      <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <p className="text-sm text-gray-500">
            This is how the form will be presented to users.
          </p>
        </div>

        <div className="rounded-lg  border-gray-100 bg-white p-6 shadow-2xs">
          {hasFields ? (
            <DynamicForm form={form} schema={schema} onSubmit={(data) => console.log("submit:", data)} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clipboard strokeWidth={0.8} className="mb-4 h-12 w-12 text-gray-300" />
              <p className="mt-1 text-sm text-gray-300">Add a field to preview the form.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}