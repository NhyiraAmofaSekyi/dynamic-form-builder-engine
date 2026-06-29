import { Form, Input, InputNumber, Select, DatePicker, Button, Radio, Checkbox } from 'antd'
import type { FormInstance, Rule } from 'antd/es/form'
import dayjs from 'dayjs'
import type {FieldSchema, FieldValue, FormSchema, Response} from "#/types/schema.ts";


// ---- 1. Widget inference fallback  ----
export function inferWidget(prop: FieldSchema): string {
  if (prop.enum) return 'select'
  if (prop.format === 'date') return 'date'
  if (prop.type === 'number' || prop.type === 'integer') return 'number'
  return 'text'
}

// ---- 2. THE WIDGET MAPPER — the heart of the renderer --------------------
export function renderWidget(prop: FieldSchema) {
  const widget = prop['x-widget'] ?? inferWidget(prop)
  switch (widget) {
    case 'textarea':
      return <Input.TextArea
        rows={4} maxLength={prop.maxLength} showCount  placeholder={prop['x-placeholder']}/>
    case 'select':
      return (
        <Select
          allowClear
          placeholder={prop['x-placeholder']}
          options={
            prop['x-options'] ??
            prop.enum?.map((v) => ({ value: v, label: v }))
          }
        />
      )
    case 'multiselect':
      return (
        <Select
          mode="multiple"
          allowClear
          placeholder={prop['x-placeholder']}
          options={prop['x-options'] ?? prop.items?.enum?.map((v) => ({ value: v, label: v }))}
        />
      )
    case 'number':
      return (
        <InputNumber
          // min={prop.minimum}
          // max={prop.maximum}
          placeholder={prop['x-placeholder']}
          style={{ width: '100%' }}
        />
      )
    case 'date':
      return <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
    case 'checkboxes':  return <Checkbox.Group
      options={prop['x-options'] ?? prop.items?.enum?.map((v) => ({ value: v, label: v }))}
    />

    case 'radio':
      return <Radio.Group options={prop['x-options']} />

    case 'text':
    default:
      return <Input maxLength={prop.maxLength} placeholder={prop['x-placeholder']}  />
  }
}

// ---- 3. Derive antd form validation rules from schema keywords ----------------
function rulesFor(
  name: string,
  prop: FieldSchema,
  required: string[],
): Rule[] {
  const label = prop['x-label'] ?? name
  const rules: Rule[] = []

  if (required.includes(name)) {
    rules.push({ required: true, message: 'This question is required' })
  }
  if (prop.type === 'string') {
    if (prop.minLength != null)
      rules.push({
        type: 'string',
        min: prop.minLength,
        message: `${label} must be at least ${prop.minLength} character(s)`,
      })
    if (prop.maxLength != null)
      rules.push({
        type: 'string',
        max: prop.maxLength,
        message: `${label} must be at most ${prop.maxLength} characters`,
      })
  }
  if (prop.type === 'number' || prop.type === 'integer') {
    if (prop.minimum != null)
      rules.push({
        type: 'number',
        min: prop.minimum,
        message: `${label} must be ≥ ${prop.minimum}`,
      })
    if (prop.maximum != null)
      rules.push({
        type: 'number',
        max: prop.maximum,
        message: `${label} must be ≤ ${prop.maximum}`,
      })
  }


  if (prop.type === 'array') {
    // "required" on an array should mean "pick at least one", not just
    // "the key exists" — an empty [] would otherwise pass. So when required,
    // enforce a minimum of at least 1 (or the schema's minItems if higher).
    const min = required.includes(name)
      ? Math.max(1, prop.minItems ?? 1)
      : prop.minItems

    if (min != null) {
      rules.push({
        type: 'array',
        min,
        message: `Select at least ${min} option${min > 1 ? 's' : ''}`,
      })
    }
    if (prop.maxItems != null) {
      rules.push({
        type: 'array',
        max: prop.maxItems,
        message: `Select at most ${prop.maxItems} option${prop.maxItems > 1 ? 's' : ''}`,
      })
    }
  }
  return rules
}

// ---- 4. The component ----------------------------------------------------
type DynamicFormProps = {
  schema: FormSchema
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  // Optional: let a parent own the form instance (so it can call setFields
  // with server errors). Falls back to an internal instance if omitted.
  form?: FormInstance
  // Optional: show a loading spinner on the submit button while in flight.
  submitting?: boolean
}

export function DynamicForm({
                              schema,
                              onSubmit,
                              form,
                              submitting = false,
                            }: DynamicFormProps) {
  // Use the parent's form if provided; otherwise create our own.
  const [internalForm] = Form.useForm()
  const formInstance = form ?? internalForm

  const order = schema['x-order'] ?? Object.keys(schema.properties)
  const required = schema.required ?? []

  const handleFinish = (values: Record<string, unknown>) => {
    const response: Response = {};

    const out = { ...values };

    for (const name of order) {
      const prop = schema.properties[name];
      if (!prop) continue;

      const widget = prop["x-widget"] ?? inferWidget(prop);

      // normalize date
      if (widget === "date" && out[name]) {
        out[name] = (out[name] as dayjs.Dayjs).format("YYYY-MM-DD");
      }

      response[name] = out[name] as FieldValue;
    }

    onSubmit(response);
  };

  return (
    <Form form={formInstance} layout="vertical" onFinish={handleFinish}>
      {order.map((name) => {
        const prop = schema.properties[name]
        if (!prop) return null
        return (
          <Form.Item
            key={name}
            name={name}
            validateDebounce={500}
            label={prop['x-label'] ?? name}
            extra={prop['x-description']}
            rules={rulesFor(name, prop, required)}
          >
            {renderWidget(prop)}
          </Form.Item>
        )
      })}
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  )
}