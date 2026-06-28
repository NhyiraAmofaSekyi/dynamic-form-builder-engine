package middleware

import (
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/auth"
	"strings"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// context keys for the authenticated principal
const (
	CtxUserID = "userID"
	CtxRole   = "role"
)

// RequireAuth validates the Bearer token and stashes the user id + role on the
// context. On failure it aborts with 401 — the handler never runs.
func RequireAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			response.Unauthorized(c, "missing authorization header")
			c.Abort()
			return
		}

		// expect "Bearer <token>"
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Unauthorized(c, "malformed authorization header")
			c.Abort()
			return
		}

		claims, err := auth.Parse(secret, parts[1])
		if err != nil {
			response.Unauthorized(c, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxRole, claims.Role)
		c.Next()
	}
}

// RequireAdmin must run AFTER RequireAuth. It checks the role on context.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		if role != "admin" {
			response.Forbidden(c, "admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// UserID is a typed helper for handlers to read the authenticated user.
func UserID(c *gin.Context) uuid.UUID {
	v, _ := c.Get(CtxUserID)
	id, _ := v.(uuid.UUID)
	return id
}
