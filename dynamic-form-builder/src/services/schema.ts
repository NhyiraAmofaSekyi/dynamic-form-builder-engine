
// Mirror of the backend's response shapes.
import {apiClient} from "#/lib/axios.ts";
import type {FormSchema} from "#/types/schema.ts";

export type FieldError = { field: string; message: string }
export type ValidationResponse = { valid: boolean; errors?: FieldError[] }

const BASE = '/api/v1/example-schema'

// GET the form schema the frontend renders.
export async function getExampleSchema(): Promise<FormSchema> {
  const { data } = await apiClient.get<FormSchema>(BASE)
  return data
}

// POST a submission for validation.
//
// field errors — not an exception. axios throws on non-2xx by default, so we
// whitelist 200 and 422 as non-throwing and read the body either way.
// 400 (bad JSON) and 500 still throw, surfacing as real errors.
export async function validateSubmission(
  payload: Record<string, unknown>,
): Promise<ValidationResponse> {
  console.log("Payload: ",JSON.stringify(payload, null, 2))
  const res = await apiClient.post<ValidationResponse>(`${BASE}/validate`, payload, {
    validateStatus: (status) => status === 200 || status === 422,
  })
  return res.data
}



export async function updateExampleSchema(schema: FormSchema): Promise<void> {
  await apiClient.put("/api/v1/example-schema", schema);
}