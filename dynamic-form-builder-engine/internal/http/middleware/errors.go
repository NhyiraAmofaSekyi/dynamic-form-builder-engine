package middleware

import (
	"errors"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 {
			return
		}

		err := c.Errors.Last().Err

		var validationErrors validator.ValidationErrors
		if errors.As(err, &validationErrors) {
			errs := make([]string, len(validationErrors))
			for i, e := range validationErrors {
				errs[i] = strings.ToLower(e.Field()) + ": " + e.Tag()
			}
			response.BadRequest(c, "validation failed", errs...)
			return
		}

		response.Internal(c, "something went wrong", err)
	}
}
