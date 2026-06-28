package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ErrorResponse struct {
	Message string   `json:"message"`
	Code    int      `json:"code"`
	Errors  []string `json:"errors,omitempty"`
}

// --- client errors (4xx): logged at Warn ------------------------------------

func BadRequest(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusBadRequest, message, errs)
	c.JSON(http.StatusBadRequest, ErrorResponse{Message: message, Code: http.StatusBadRequest, Errors: errs})
}

func Unauthorized(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusUnauthorized, message, errs)
	c.JSON(http.StatusUnauthorized, ErrorResponse{Message: message, Code: http.StatusUnauthorized, Errors: errs})
}

func Forbidden(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusForbidden, message, errs)
	c.JSON(http.StatusForbidden, ErrorResponse{Message: message, Code: http.StatusForbidden, Errors: errs})
}

func NotFound(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusNotFound, message, errs)
	c.JSON(http.StatusNotFound, ErrorResponse{Message: message, Code: http.StatusNotFound, Errors: errs})
}

func Conflict(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusConflict, message, errs)
	c.JSON(http.StatusConflict, ErrorResponse{Message: message, Code: http.StatusConflict, Errors: errs})
}

func UnprocessableEntity(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusUnprocessableEntity, message, errs)
	c.JSON(http.StatusUnprocessableEntity, ErrorResponse{Message: message, Code: http.StatusUnprocessableEntity, Errors: errs})
}

func MethodNotAllowed(c *gin.Context, message string, errs ...string) {
	logClient(c, http.StatusMethodNotAllowed, message, errs)
	c.JSON(http.StatusMethodNotAllowed, ErrorResponse{Message: message, Code: http.StatusMethodNotAllowed, Errors: errs})
}

// --- server errors (5xx): take the underlying error, log it at Error --------

// Internal sends a safe 500 to the client and logs the REAL cause server-side.
// Always pass the underlying err so it lands in the logs (client never sees it).
func Internal(c *gin.Context, message string, err error) {
	logServer(c, message, err)
	c.JSON(http.StatusInternalServerError, ErrorResponse{Message: message, Code: http.StatusInternalServerError})
}

// --- logging helpers --------------------------------------------------------

func loggerFor(c *gin.Context) *zap.Logger {
	return zap.L().With(
		zap.String("method", c.Request.Method),
		zap.String("path", c.Request.URL.Path),
	)
}

func logClient(c *gin.Context, code int, message string, errs []string) {
	loggerFor(c).Warn("client error",
		zap.Int("status", code),
		zap.String("message", message),
		zap.Strings("errors", errs),
	)
}

func logServer(c *gin.Context, message string, err error) {
	loggerFor(c).Error("server error",
		zap.Int("status", http.StatusInternalServerError),
		zap.String("message", message),
		zap.Error(err),
	)
}
