-- name: CreateForm :one
INSERT INTO forms (user_id, name, slug, description)
VALUES ($1, $2, $3, $4)
    RETURNING *;

-- name: GetFormByID :one
SELECT * FROM forms
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetFormBySlug :one
-- slug is unique per user, so both user_id and slug are needed
SELECT * FROM forms
WHERE user_id = $1 AND slug = $2 AND deleted_at IS NULL;

-- name: ListFormsByUser :many
SELECT * FROM forms
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;

-- name: CountFormsByUser :one
SELECT COUNT(*)::bigint FROM forms
WHERE user_id = $1 AND deleted_at IS NULL;

-- name: UpdateFormMetadata :one
-- updates editable metadata only; never touches current_version_id
UPDATE forms
SET name = $2, slug = $3, description = $4
WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;

-- name: SetCurrentVersion :exec
-- moves the form's pointer to a newly created version (versioning flow only)
UPDATE forms
SET current_version_id = $2
WHERE id = $1;

-- name: SoftDeleteForm :exec
UPDATE forms
SET deleted_at = now()
WHERE id = $1 AND deleted_at IS NULL;