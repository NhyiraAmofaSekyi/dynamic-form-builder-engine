// Each field in state is wrapped with a stable id (for React keys and updates),
// since field names can be empty or duplicated mid-edit.
import type {FormFieldBuilder} from "#/types/fields.ts";

export type BuilderItem = { id: string; field: FormFieldBuilder };
