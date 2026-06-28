package formengine

import (
	"bytes"
	"errors"
	"github.com/santhosh-tekuri/jsonschema/v6"
)

// FieldError is one validation failure, keyed by a JSON Pointer to the field.
type FieldError struct {
	Field   string // e.g. "/title"; "(root)" for object-level errors like missing-required
	Message string
}

// Compile turns a JSON SchemaJson document (as it would live in a JSONB column)
// into a reusable compiled schema. Compile once, validate many times.
func Compile(schemaJSON []byte) (*jsonschema.Schema, error) {
	// Use jsonschema.UnmarshalJSON (not encoding/json) so numbers decode as
	// json.Number — required for integer / multipleOf rules to validate right.
	doc, err := jsonschema.UnmarshalJSON(bytes.NewReader(schemaJSON))
	if err != nil {
		return nil, err
	}
	c := jsonschema.NewCompiler()
	c.AssertFormat()
	if err := c.AddResource("mem://schema", doc); err != nil {
		return nil, err
	}
	return c.Compile("mem://schema")
}

// Validate checks a submission payload against a compiled schema.
// Returns (nil, nil) when valid; a list of field errors when invalid.
// A non-nil error is reserved for "couldn't even parse the payload".
func Validate(schema *jsonschema.Schema, payload []byte) ([]FieldError, error) {
	inst, err := jsonschema.UnmarshalJSON(bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	if err := schema.Validate(inst); err != nil {
		var ve *jsonschema.ValidationError
		if errors.As(err, &ve) {
			out := []FieldError{}
			collect(ve.DetailedOutput(), &out)
			return out, nil
		}
		return nil, err
	}
	return nil, nil
}

// collect walks the DetailedOutput tree and gathers leaf errors.
func collect(u *jsonschema.OutputUnit, out *[]FieldError) {
	if u.Error != nil {
		loc := u.InstanceLocation
		if loc == "" {
			loc = "(root)"
		}
		*out = append(*out, FieldError{Field: loc, Message: u.Error.String()})
	}
	for i := range u.Errors {
		collect(&u.Errors[i], out)
	}
}
