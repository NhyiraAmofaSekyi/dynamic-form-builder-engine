export type FieldError = { field: string; message: string }
export type ValidationResponse = { valid: boolean; errors?: FieldError[] }
