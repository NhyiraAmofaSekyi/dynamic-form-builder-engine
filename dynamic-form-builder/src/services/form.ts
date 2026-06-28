import type {CreateForm, Form, FormSchema, PublicForm, Submission, Version} from '#/types/schema'
import type {Page} from '#/types/common'
import {apiClient, handleApiError} from "#/lib/axios.ts";

const BASE = '/forms'
const PUBLIC = '/public/forms'


// createForm posts name + description + schema; the server derives the slug
// and creates the first version, returning the full form.
export async function createForm(data: CreateForm): Promise<PublicForm> {
  try {
    const { data: form } = await apiClient.post<PublicForm>(BASE, data)
    return form
  } catch (err) {
    handleApiError(err, 'Could not create form')
  }
}

// listForms fetches the authenticated user's forms, paginated.
export async function listForms(page = 1, pageSize = 20): Promise<Page<Form>> {
  try {
    const { data } = await apiClient.get<Page<Form>>(BASE, {
      params: { page, page_size: pageSize },
    })
    return data
  } catch (err) {
    handleApiError(err, 'Could not load forms')
  }
}

// getForm fetches a single form by id.
export async function getForm(id: string): Promise<Form> {
  try {
    const { data } = await apiClient.get<Form>(`${BASE}/${id}`)
    return data
  } catch (err) {
    handleApiError(err, 'Could not load form')
  }
}

// getCurrentVersion fetches a form's live (current) version — the schema to render.
export async function getCurrentVersion(
  id: string,
): Promise<{ schemaJson: FormSchema }> {
  try {
    const { data } = await apiClient.get<{ schemaJson: FormSchema }>(
      `${BASE}/${id}/versions/current`,
    )
    return data
  } catch (err) {
    handleApiError(err, 'Could not load form version')
  }
}


// createVersion creates a NEW version of a form (editing = new version, never
// mutating an old one). The new version becomes the form's current version.
export async function createVersion(
  id: string,
  schema: FormSchema,
  changeSummary?: string,
): Promise<Version> {
  try {
    const { data } = await apiClient.post<Version>(`${BASE}/${id}/versions`, {
      schemaJson: schema,
      changeSummary,
    })
    return data
  } catch (err) {
    handleApiError(err, 'Could not save changes')
  }
}


// getPublicForm fetches a form's current schema for anonymous rendering.
export async function getPublicForm(id: string): Promise<Form> {
  try {
    const { data } = await apiClient.get<Form>(`${PUBLIC}/${id}`)
    return data
  } catch (err) {
    handleApiError(err, 'Could not load form')
  }
}

// submitResponse posts an anonymous submission. The server validates against
// the form's current version and pins the submission to it.
// NOTE: a 422 (validation failure) is an EXPECTED outcome here — we do NOT
// route it through handleApiError. We let it reject so the caller can read
// the structured field errors from the 422 body.
export async function submitResponse(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await apiClient.post(`${PUBLIC}/${id}/submissions`, { data })
}



// listSubmissions fetches responses for a form (owner only), paginated.
// Optional versionId filters to a single version.
export async function listSubmissions(
  formId: string,
  page = 1,
  pageSize = 20,
  versionId?: string,
): Promise<Page<Submission>> {
  try {
    const { data } = await apiClient.get<Page<Submission>>(
      `${BASE}/${formId}/submissions`,
      { params: { page, page_size: pageSize, version_id: versionId } },
    )
    return data
  } catch (err) {
    handleApiError(err, 'Could not load responses')
  }
}

