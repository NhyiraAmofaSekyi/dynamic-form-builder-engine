# Dynamic Form Builder Engine

A configuration-driven engine that defines, validates, stores, and renders
dynamic forms. Forms are represented as JSON Schema documents rather than
static database tables, so new forms and fields require no schema migrations
or redeploys.

**Live demo:** https://formbuilder.nhyiraamofasekyi.com

**Test credentials:**

- Email: `test@example.com`
- Password: `hjvqyf2jn71727781`

## Running locally

See [run.md](./run.md) for full setup (database + API + frontend via Docker Compose).

## Data model

Three core tables:

- **forms** — the identity of a form (id, name, slug, owner, pointer to its current version).
- **form_versions** — append-only, immutable. Each row holds one JSON Schema document. A form can have many versions; the "live" one is referenced by `forms.current_version_id`.
- **form_submissions** — user responses, each pinned to the specific `form_version_id` it was submitted against.

### Why this shape

Editing a form never mutates an existing version — it creates a new one and
repoints `current_version_id`. Because every submission stores the exact
version that produced it, a stored response stays valid against the version that produced it
configuration even after the form evolves. This is how historical integrity is
guaranteed: a v1 submission is always read and validated against v1's schema,
never a later version's.

## Design decisions

### Rendering metadata lives in the schema

Form configuration and rendering hints are stored together in one JSON Schema
document, using `x-` prefixed properties (`x-widget`, `x-label`,
`x-placeholder`, `x-options`, `x-order`). This extends the JSON Schema spec:
the stored documents are intentionally not strictly spec-compliant, and the
validator is configured to ignore these annotation properties so they don't
cause compilation errors.

The trade-off: keeping render instructions next to validation rules makes each
schema self-describing and extensible, at the cost of strict spec purity. The
alternative — splitting validation rules and rendering config across separate
tables — was rejected as more complex for no real benefit at this scale.

### Validation engine

Validation rules are defined entirely by the stored JSON Schema, never
hardcoded in application code. The engine (`santhosh-tekuri/jsonschema` v6)
parses and runs them dynamically at runtime. Format assertion is enabled, so
`format: date` is enforced rather than treated as an annotation.

Supported field types: text/textarea (string), single + multi select (string
enum / array), number, date, and boolean. Each is covered by a table-driven
test suite in the `formengine_test` package — a passing case plus a failure
case per constraint.

### Frontend rendering

A single `DynamicForm` component renders any stored schema into antd inputs,
choosing the widget per field from its `x-widget` property. The same renderer
is reused read-only to display submitted responses against their pinned
version. A separate builder component constructs schemas, with a dedicated
editor per field type.

## Error handling

Validation failures return a structured 422 with per-field errors; the frontend
maps these onto the relevant inputs. Not-found, unauthorized, and bad-request
cases all return consistent structured responses. Authorization is enforced
server-side on every owner-scoped route.

## Testing

- `formengine_test`: table-driven validation matrix across all field types.
- <add: version-integrity test, auth test if present>

Run with: `go test ./...`

## Trade-offs & what I'd add with more time

- **Strict JSON Schema spec compliance** — I extended the spec with `x-` properties (`x-widget`, `x-label`, etc.) to keep rendering metadata next to the validation schema in a single document. The trade-off is that the stored schemas aren't strictly spec-compliant, and the validator has to be told to ignore those properties. With more time I'd evaluate separating rendering metadata from the validation schema into distinct objects per version — more correct, at the cost of more complexity.
- **Version naming and diffs** — versions are currently identified by id and timestamp. I'd add human-friendly version labels and a visual diff between versions, so an editor can see exactly what changed between v1 and v2.
- **No drag-and-drop designer** — fields are added and reordered with buttons rather than drag-and-drop. Not required by the assessment, but a smoother building experience.
- **Richer submission views** — responses render against their pinned version, but I'd add filtering and search across submissions, and honour custom boolean labels in the read-only view rather than defaulting to Yes/No.
- **Time and date-time inputs** — only plain dates (`format: date`) are supported. Time-only and combined date-time fields were left out; adding them means new widgets and the corresponding `format: time` / `format: date-time` validation.
- **Combobox for multi-select** — multi-selects use a standard dropdown. A combobox (type-to-filter with inline search) would scale better for fields with many options.

## Scaling in production

- **Cache compiled schemas** — each request currently compiles the JSON Schema before validating. In production I'd cache the compiled validator keyed by `form_version_id` (versions are immutable, so the cache never needs invalidating), removing redundant compilation on hot submit paths.

## AI tools

**Tool:** Claude (Opus 4.8)

**How it was used:**

- Researching standards for storing and validating forms as JSON Schema.
- Scaffolding endpoints from specs I provided.
- Generating the table-driven validation test suite.

**What I verified myself:** Every endpoint, the validation engine behaviour,
and all frontend components, hooks, and pages were tested and verified by me
