-- name: InsertSubmission :one
-- submitted_by is nullable: NULL = anonymous. The handler passes NULL for
-- submissions submissions (no authenticated user). The submission is pinned to the
-- exact form_version_id that validated it — the historical-integrity guarantee.
INSERT INTO form_submissions (
    form_id, form_version_id, submission_data, status, submitted_by
)
VALUES ($1, $2, $3, $4, $5)
    RETURNING *;

-- name: GetSubmissionByID :one
SELECT * FROM form_submissions
WHERE id = $1;

-- name: ListSubmissionsByForm :many
-- all submissions for a form, across every version, newest first
SELECT * FROM form_submissions
WHERE form_id = $1
ORDER BY submitted_at DESC NULLS LAST, created_at DESC
    LIMIT $2 OFFSET $3;

-- name: CountSubmissionsByForm :one
SELECT COUNT(*)::bigint FROM form_submissions
WHERE form_id = $1;

-- name: ListSubmissionsByVersion :many
-- submissions for ONE specific version of a form
SELECT * FROM form_submissions
WHERE form_id = $1 AND form_version_id = $2
ORDER BY submitted_at DESC NULLS LAST, created_at DESC
    LIMIT $3 OFFSET $4;

-- name: CountSubmissionsByVersion :one
SELECT COUNT(*)::bigint FROM form_submissions
WHERE form_id = $1 AND form_version_id = $2;