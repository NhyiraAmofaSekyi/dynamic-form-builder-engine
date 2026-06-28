
// -----------------------------
// Shared primitives
// -----------------------------

export interface Option {
  value: string | boolean | number;
  label: string;
}

// -----------------------------
// Base field
// -----------------------------

export interface BaseFieldBuilder {
  name: string;
  label: string;
  required: boolean;
  description?: string;
  placeholder?: string;
}

// -----------------------------
// Shared text-like constraints
// (used by text + textarea)
// -----------------------------

export interface TextConstraints {
  minLength?: number;
  maxLength?: number;
}

// -----------------------------
// Field types
// -----------------------------

export interface TextFieldBuilder extends BaseFieldBuilder, TextConstraints {
  type: "text" | "textarea";
}

export interface SelectFieldBuilder extends BaseFieldBuilder {
  type: "select";
  options: Option[];
}

export interface MultiSelectFieldBuilder extends BaseFieldBuilder {
  type: "multiselect";
  options: Option[];
  minItems?: number;
  maxItems?: number;
}
export interface NumberFieldBuilder extends BaseFieldBuilder {
  type: "number";
  minimum?: number;
  maximum?: number;
}

export interface DateFieldBuilder extends BaseFieldBuilder {
  type: "date";
  minDate?: string;
  maxDate?: string;
}

export interface BooleanFieldBuilder extends BaseFieldBuilder {
  type: "boolean";
  "x-options"?: {
    value: any;
    label: string;
  }[];
}

// -----------------------------
//  types
// -----------------------------

export type FormFieldBuilder =
  | TextFieldBuilder
  | SelectFieldBuilder
  | MultiSelectFieldBuilder
  | NumberFieldBuilder
  | DateFieldBuilder
  | BooleanFieldBuilder;

// -----------------------------
// Form container
// -----------------------------

export interface FormBuilder {
  fields: FormFieldBuilder[];
}