// ---- Types describing the shape of our stored schema --------------------
export interface FieldSchema  {
  type: string
  items?: FieldSchema
  format?: string
  enum?: string[]
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  uniqueItems?: boolean
  minItems?: number
  maxItems?: number
  'x-widget'?: string
  'x-label'?: string
  'x-placeholder'?: string
  'x-description'?: string
  "x-options"?: { value: string | number | boolean; label: string }[];
}

export interface FormSchema  {
  type: 'object'
  properties: Record<string, FieldSchema>
  required?: string[]
  'x-order'?: string[]
  'additionalProperties'?: boolean
}

export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null;

export type Response = Record<string, FieldValue>;


export  interface CreateForm {
  name: string
  description: string
  schema: FormSchema
}

export  interface Form {
  id: string
  name: string
  slug: string
  description: string
  schemaJson: FormSchema
  currentVersionId: string
  createdAt: string
}

export interface PublicForm {
  id: string
  name: string
  description?: string
  versionId: string
  schemaJson: FormSchema
}

export  interface Version {
  name: string
  description: string
  schemaJson: FormSchema
}



export interface Submission {
  id: string
  formId: string
  formVersionId: string
  data: Record<string, unknown>
  status: string
  submittedBy?: string | null
  createdAt: string
}


export interface Version {
  id: string
  formId: string
  schemaJson: FormSchema
  changeSummary?: string
  createdAt: string
}