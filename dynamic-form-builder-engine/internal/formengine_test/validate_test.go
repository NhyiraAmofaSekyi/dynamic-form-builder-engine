package formengine_test

import (
	"testing"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/formengine"
	"github.com/santhosh-tekuri/jsonschema/v6"
)

func mustCompile(t *testing.T, schemaJSON string) *jsonschema.Schema {
	t.Helper()
	s, err := formengine.Compile([]byte(schemaJSON))
	if err != nil {
		t.Fatalf("Compile: %v", err)
	}
	return s
}

type row struct {
	name      string
	payload   string
	wantValid bool
	wantField string // expected JSON pointer flagged; "" = expect failure, don't care where
}

func run(t *testing.T, schema *jsonschema.Schema, rows []row) {
	for _, r := range rows {
		t.Run(r.name, func(t *testing.T) {
			errs, perr := formengine.Validate(schema, []byte(r.payload))
			if perr != nil {
				t.Fatalf("payload did not parse: %v", perr)
			}
			if r.wantValid {
				if len(errs) != 0 {
					t.Fatalf("want valid, got errors: %v", errs)
				}
				return
			}
			if len(errs) == 0 {
				t.Fatalf("want invalid, got no errors")
			}
			if r.wantField != "" && !hasField(errs, r.wantField) {
				t.Fatalf("want an error at %q, got %v", r.wantField, errs)
			}
		})
	}
}

func hasField(errs []formengine.FieldError, ptr string) bool {
	for _, e := range errs {
		if e.Field == ptr {
			return true
		}
	}
	return false
}

// ── text / textarea: string, minLength, maxLength ───────────────────

func TestValidate_Text(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"required":["bio"],
		"properties":{ "bio":{"type":"string","minLength":3,"maxLength":10} }
	}`)
	run(t, s, []row{
		{"valid within bounds", `{"bio":"hello"}`, true, ""},
		{"missing when required", `{}`, false, "(root)"},
		{"shorter than minLength", `{"bio":"ab"}`, false, "/bio"},
		{"longer than maxLength", `{"bio":"way too long string"}`, false, "/bio"},
		{"wrong type (number)", `{"bio":42}`, false, "/bio"},
	})
}

// ── select / single: string + enum ──────────────────────────────────

func TestValidate_Select(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"required":["category"],
		"properties":{ "category":{"type":"string","enum":["a","b","c"]} }
	}`)
	run(t, s, []row{
		{"value in enum", `{"category":"a"}`, true, ""},
		{"value not in enum", `{"category":"z"}`, false, "/category"},
		{"missing when required", `{}`, false, "(root)"},
	})
}

// ── multiselect: array, items.enum, uniqueItems, minItems, maxItems ──

func TestValidate_Multiselect(t *testing.T) {
	// enum has 5 values so we can exceed maxItems(3) while staying unique.
	s := mustCompile(t, `{
		"type":"object",
		"properties":{
			"tags":{
				"type":"array",
				"items":{"type":"string","enum":["x","y","z","w","v"]},
				"uniqueItems":true,
				"minItems":1,
				"maxItems":3
			}
		}
	}`)
	run(t, s, []row{
		{"valid array of enums", `{"tags":["x","y"]}`, true, ""},
		{"item not in items-enum", `{"tags":["x","q"]}`, false, "/tags/1"},
		{"duplicate items", `{"tags":["x","x"]}`, false, "/tags"},
		{"fewer than minItems", `{"tags":[]}`, false, "/tags"},
		{"more than maxItems", `{"tags":["x","y","z","w"]}`, false, "/tags"},
		{"wrong type (string)", `{"tags":"x"}`, false, "/tags"},
	})
}

// ── number: number, minimum, maximum ─────────────────────────────────

func TestValidate_Number(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"required":["amount"],
		"properties":{ "amount":{"type":"number","minimum":0,"maximum":100} }
	}`)
	run(t, s, []row{
		{"within range", `{"amount":50}`, true, ""},
		{"below minimum", `{"amount":-5}`, false, "/amount"},
		{"above maximum", `{"amount":500}`, false, "/amount"},
		{"wrong type (string)", `{"amount":"5"}`, false, "/amount"},
		{"missing when required", `{}`, false, "(root)"},
	})
}

// ── date: string, format:date ────────────────────────────────────────
//
// assert "format" 
// As-is, "malformed date" will PASS validation and this subtest will fail.
// Two ways to make it real — pick one:
//  1. Enable format assertion on the compiler inside Compile, or
//  2. Replace `"format":"date"` below with a regex:
//     "pattern":"^\\d{4}-\\d{2}-\\d{2}$"   (works regardless of format vocab)
func TestValidate_Date(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"required":["start_date"],
		"properties":{ "start_date":{"type":"string","format":"date"} }
	}`)
	run(t, s, []row{
		{"valid YYYY-MM-DD", `{"start_date":"2026-01-15"}`, true, ""},
		{"malformed date", `{"start_date":"15/01/2026"}`, false, "/start_date"},
		{"missing when required", `{}`, false, "(root)"},
	})
}

// ── boolean ──────────────────────────────────────────────────────────

func TestValidate_Boolean(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"properties":{ "agree":{"type":"boolean"} }
	}`)
	run(t, s, []row{
		{"true", `{"agree":true}`, true, ""},
		{"false", `{"agree":false}`, true, ""},
		{"wrong type (string)", `{"agree":"true"}`, false, "/agree"},
	})
}

//422 collects every failure (what toAntdErrors maps over),
// rather than bailing on the first.

func TestValidate_MultipleErrors(t *testing.T) {
	s := mustCompile(t, `{
		"type":"object",
		"required":["category","amount"],
		"properties":{
			"bio":{"type":"string","minLength":3},
			"category":{"type":"string","enum":["a","b","c"]},
			"amount":{"type":"number","maximum":100}
		}
	}`)
	errs, perr := formengine.Validate(s, []byte(`{"bio":"x","category":"nope","amount":999}`))
	if perr != nil {
		t.Fatalf("parse: %v", perr)
	}
	if len(errs) < 3 {
		t.Fatalf("expected at least 3 errors (bio, category, amount), got %d: %v", len(errs), errs)
	}
}
