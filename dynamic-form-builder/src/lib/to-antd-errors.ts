import type {FieldError} from "#/services/schema.ts";
import type {FormSchema} from "#/types/schema.ts";

// What antd's form.setFields expects.
export type AntdFieldError = { name: string; errors: string[] }

export type MappedErrors = {
  // per-field errors -> form.setFields(fieldErrors)
  fieldErrors: AntdFieldError[]
  // object-level errors with no single field (e.g. additionalProperties)
  formErrors: string[]
}

// Pull the human label for a field out of the schema's x-label, falling back
// to the raw key so messages still read sensibly if a label is missing.
function labelFor(schema: FormSchema, name: string): string {
  return schema.properties?.[name]?.['x-label'] ?? name
}

/**
 * Translate the backend's JSON-Pointer-keyed errors into antd's
 * field-name-keyed errors.
 *
 * Three shapes come back from the Go validator:
 *   { field: "/amount",  message: "minimum: got -5, want 0" }   -> field error
 *   { field: "(root)",   message: "missing property 'title'" }  -> REQUIRED: name is in the message
 *   { field: "(root)",   message: "additional properties ..." } -> form-level (no single field)
 */
export function toAntdErrors(
  errors: FieldError[],
  schema: FormSchema,
): MappedErrors {
  // group messages by field name, so multiple errors on one field merge
  const byField = new Map<string, string[]>()
  const formErrors: string[] = []

  const push = (name: string, msg: string) => {
    const list = byField.get(name) ?? []
    list.push(msg)
    byField.set(name, list)
  }

  for (const e of errors) {
    const isRoot = e.field === '(root)' || e.field === ''

    if (isRoot) {
      // required errors name the field inside the message: extract it
      const missing = e.message.match(/missing property '([^']+)'/)
      if (missing) {
        const name = missing[1]
        push(name, `${labelFor(schema, name)} is required`)
      } else {
        // e.g. "additional properties 'x' not allowed" — no single owner
        formErrors.push(e.message)
      }
      continue
    }

    // "/amount" -> "amount"; first segment also handles nested objects
    const name = e.field.replace(/^\//, '').split('/')[0]
    push(name, humanize(schema, name, e.message))
  }

  const fieldErrors: AntdFieldError[] = Array.from(byField, ([name, msgs]) => ({
    name,
    errors: msgs,
  }))

  return { fieldErrors, formErrors }
}

// Turn the validator's terse messages into friendlier copy. Optional — the raw
// message is always shown as a fallback so nothing is ever lost.
function humanize(schema: FormSchema, name: string, msg: string): string {
  const label = labelFor(schema, name)
  if (msg.startsWith('minimum:')) return `${label} is too small`
  if (msg.startsWith('maximum:')) return `${label} is too large`
  if (msg.startsWith('minLength:')) return `${label} is too short`
  if (msg.startsWith('maxLength:')) return `${label} is too long`
  if (msg.includes('want number')) return `${label} must be a number`
  if (msg.includes('want string')) return `${label} must be text`
  if (msg.includes('must be one of')) return `${label}: ${msg}`
  return `${label}: ${msg}` // fallback: at least prefix the field label
}