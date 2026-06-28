import { Form } from 'antd'
import { cloneElement, isValidElement } from 'react'
import dayjs from 'dayjs'
import type { FieldSchema, Version } from '#/types/schema'
import { inferWidget, renderWidget } from '#/components/dynamic-form.tsx'

function lockProps(prop: FieldSchema): Record<string, unknown> {
  const widget = prop['x-widget'] ?? inferWidget(prop)
  const textLike = widget === 'text' || widget === 'textarea' || widget === 'number'
  return textLike ? { readOnly: true } : { disabled: true }
}

function seedValue(prop: FieldSchema, value: unknown): unknown {
  const widget = prop['x-widget'] ?? inferWidget(prop)
  if (widget === 'date' && value) return dayjs(value as string)
  return value
}

type SubmittedFormProps = {
  version: Version
  answers: Record<string, unknown>
}

export function SubmittedForm({ version, answers }: SubmittedFormProps) {
  const schema = version.schemaJson
  const order = schema['x-order'] ?? Object.keys(schema.properties)

  const initialValues: Record<string, unknown> = {}
  for (const name of order) {
    const prop = schema.properties[name]
    if (!prop) continue
    initialValues[name] = seedValue(prop, answers[name])
  }

  return (
    <div>
      <div className="mb-6 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Submitted against version
          </span>
          <code className="rounded-md border-0 bg-[rgba(79,184,178,0.1)] px-2 py-0.5 font-mono text-[8px] text-[#328f97]">
            {version.id.slice(0, 8)}
          </code>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Version created {dayjs(version.createdAt).format('MMM D, YYYY [at] h:mm A')}
        </p>
        {version.changeSummary && (
          <p className="mt-1 text-sm italic text-gray-500">{version.changeSummary}</p>
        )}
      </div>

      <Form layout="vertical" initialValues={initialValues}>
        {order.map((name) => {
          const prop = schema.properties[name]
          if (!prop) return null

          const widget = renderWidget(prop)
          const locked = isValidElement(widget)
            ? cloneElement(widget, lockProps(prop))
            : widget

          return (
            <Form.Item
              key={name}
              name={name}
              label={prop['x-label'] ?? name}
              extra={prop['x-description']}
            >
              {locked}
            </Form.Item>
          )
        })}
        {/* no submit button — view only */}
      </Form>
    </div>
  )
}