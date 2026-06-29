import type {
  FormFieldBuilder, Option,
} from "#/types/fields.ts";
import type { FieldSchema, FormSchema } from "#/types/schema.ts";

function fieldToSchema(field: FormFieldBuilder): FieldSchema {
  const common = {
    "x-label": field.label,
    "x-placeholder": field.placeholder || undefined,
    "x-description": field.description || undefined,
  };

  switch (field.type) {
    case "text":
    case "textarea":
      return {
        type: "string",
        "x-widget": field.type,
        minLength: field.minLength,
        maxLength: field.maxLength,
        ...common,
      };

    case "select":
      return {
        type: "string",
        enum: field.options.map((o) => o.value),
        "x-widget": "select",
        "x-options": field.options,
        ...common,
      };

    case "multiselect":
      return {
        type: "array",
        items: { type: "string", enum: field.options.map((o) => o.value) },
        uniqueItems: true,
        minItems: field.minItems,
        maxItems: field.maxItems,
        "x-widget": "multiselect",
        "x-options": field.options,
        ...common,
      };

    case "number":
      return {
        type: "number",
        minimum: field.minimum,
        maximum: field.maximum,
        "x-widget": "number",
        ...common,
      };

    case "date":
      return {
        type: "string",
        format: "date",
        "x-widget": "date",
        ...common,
      };

    case "boolean": {

      const labels = field["x-options"] ?? [];
      return {
        type: "boolean",
        "x-widget": "radio",
        "x-options": [
          { value: true, label: labels[0]?.label ?? "Yes" },
          { value: false, label: labels[1]?.label ?? "No" },
        ],
        ...common,
      };
    }

    default: {
      // exhaustiveness guard: if a new field type is added to the union,
      // TypeScript errors here until this switch handles it.
      const _never: never = field;
      return _never;
    }
  }
}

// Derive the FULL form schema from the ordered list of field builders.
export function fieldsToSchema(fields: FormFieldBuilder[]): FormSchema {
  const properties: Record<string, FieldSchema> = {};
  const order: string[] = [];
  const required: string[] = [];
  const used = new Set<string>();

  for (const field of fields) {
    // Skip fields not ready yet (no label typed -> no key). Keeps the preview
    // clean while the user is mid-edit.
    if (!field.name) continue;

    // Deduplicate keys: labels can collide, and the user can't see/override
    // the key, so "Name" + "Name" must become name + name_2 automatically.
    let key = field.name;
    let n = 2;
    while (used.has(key)) key = `${field.name}_${n++}`;
    used.add(key);

    properties[key] = fieldToSchema(field);
    order.push(key);
    if (field.required) required.push(key);
  }

  return {
    type: "object",
    properties,
    required,
    "x-order": order,
    additionalProperties: false,
  };
}




// Parse ONE schema property back into a field builder.
// per-field logic in fieldsToSchema.
function propToField(name: string, prop: FieldSchema, required: boolean): FormFieldBuilder {
  const base = {
    name,
    label: prop["x-label"] ?? name,
    required,
    description: prop["x-description"] ?? "",
    placeholder: prop["x-placeholder"] ?? "",
  };

  const widget = prop["x-widget"];
  const options: Option[] = prop["x-options"] ?? [];

  // Decide the builder type from x-widget first, falling back to the schema type.
  switch (widget) {
    case "textarea":
      return { ...base, type: "textarea", minLength: prop.minLength, maxLength: prop.maxLength };
    case "text":
      return { ...base, type: "text", minLength: prop.minLength, maxLength: prop.maxLength };
    case "select":
      return { ...base, type: "select", options };
    case "multiselect":
      return {
        ...base,
        type: "multiselect",
        options,
        minItems: prop.minItems,
        maxItems: prop.maxItems,
      };
    case "number":
      return { ...base, type: "number", minimum: prop.minimum, maximum: prop.maximum };
    case "date":
      return { ...base, type: "date" };
    case "radio": // boolean rendered as radio
      return { ...base, type: "boolean", "x-options": options };
  }

  // No x-widget hint -> infer from the raw schema type (legacy / hand-written schemas)
  if (prop.type === "array")
    return { ...base, type: "multiselect", options, minItems: prop.minItems, maxItems: prop.maxItems };
  if (prop.type === "number" || prop.type === "integer")
    return { ...base, type: "number", minimum: prop.minimum, maximum: prop.maximum };
  if (prop.type === "boolean")
    return { ...base, type: "boolean", "x-options": options };
  if (prop.enum)
    return { ...base, type: "select", options };
  if (prop.format === "date")
    return { ...base, type: "date" };
  // default: plain text
  return { ...base, type: "text", minLength: prop.minLength, maxLength: prop.maxLength };
}

// Order follows x-order when present, else the property keys.
export function schemaToFields(schema: FormSchema): FormFieldBuilder[] {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const order = schema["x-order"] ?? Object.keys(props);

  return order
    .filter((key) => props[key]) // skip keys in x-order with no property
    .map((key) => propToField(key, props[key], required.has(key)));
}