-- name: CreateUser :one
INSERT INTO users (email, password_hash, role, first_name, last_name)
VALUES ($1, $2, $3, $4, $5)
    RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at DESC
    LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT COUNT(*)::bigint FROM users;