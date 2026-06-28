-- name: InsertVersion :one
-- previous_version_id is the form's current version before this insert (or NULL for v1).
INSERT INTO form_versions (
    form_id, previous_version_id, version_ref, schema_hash, schema_json, change_summary, created_by
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;

-- name: GetVersionByID :one
SELECT * FROM form_versions WHERE id = $1;

-- name: GetLatestVersion :one
-- newest version of a form
SELECT * FROM form_versions
WHERE form_id = $1
ORDER BY created_at DESC
    LIMIT 1;

-- name: ListVersionsByForm :many
-- newest first
SELECT * FROM form_versions
WHERE form_id = $1
ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;

-- name: CountVersionsByForm :one
SELECT COUNT(*)::bigint FROM form_versions
WHERE form_id = $1;

-- name: GetVersionByHash :one
-- dedupe: if an edit produced an identical schema, reuse the existing version
SELECT * FROM form_versions
WHERE form_id = $1 AND schema_hash = $2
ORDER BY created_at DESC
    LIMIT 1;