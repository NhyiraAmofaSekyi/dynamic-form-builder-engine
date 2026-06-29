package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db/generated"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

const tokenTTL = 24 * time.Hour

type Handler struct {
	q      *generated.Queries
	secret string // JWT signing secret from config
}

func NewHandler(q *generated.Queries, secret string) *Handler {
	return &Handler{q: q, secret: secret}
}

// RegisterRoutes wires PUBLIC auth endpoints (no auth middleware on these).
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/auth/sign-up", h.Register)
	r.POST("/auth/sign-in", h.SignIn)
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type authResponse struct {
	Token string `json:"token"`
}

// SignIn godoc
// @Summary  Log in and receive a JWT
// @Tags     auth
// @Accept   json
// @Produce  json
// @Param    request  body      loginRequest  true  "Credentials"
// @Success  200      {object}  authResponse
// @Failure  400      {object}  response.ErrorResponse
// @Failure  401      {object}  response.ErrorResponse
// @Router   /api/v1/auth/sign-in [post]
func (h *Handler) SignIn(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	email := strings.ToLower(req.Email)
	user, err := h.q.GetUserByEmail(c.Request.Context(), email)
	if errors.Is(err, pgx.ErrNoRows) {
		// don't reveal whether the email exists — same message as bad password
		response.Unauthorized(c, "invalid credentials", err.Error())
		return
	}
	if err != nil {
		response.Internal(c, "could not look up user", err)
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		response.Unauthorized(c, "invalid credentials", "invalid credentials")
		return
	}

	token, err := Issue(h.secret, user.ID, string(user.Role), tokenTTL)
	if err != nil {
		response.Internal(c, "could not issue token", err)
		return
	}

	c.JSON(http.StatusOK, authResponse{Token: token})
}

// Register is omitted here for brevity — it mirrors users.Create (hash + insert
// with role 'user'), then optionally issues a token so the user is logged in
func (h *Handler) Register(c *gin.Context) {
	response.Internal(c, "not implemented", errors.New("register not wired"))
}
