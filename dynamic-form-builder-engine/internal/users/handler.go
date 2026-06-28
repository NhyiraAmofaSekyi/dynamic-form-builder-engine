package users

import (
	"errors"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db"
	"net/http"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db/generated"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	q *generated.Queries
}

func NewHandler(q *generated.Queries) *Handler {
	return &Handler{q: q}
}

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/users", h.Create)
	r.GET("/users", h.List)
	r.GET("/users/:id", h.GetByID)
}

type createUserRequest struct {
	Email     string  `json:"email" binding:"required,email"`
	Password  string  `json:"password" binding:"required,min=8"`
	FirstName *string `json:"firstName"`
	LastName  *string `json:"lastName"`
}

type userResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	FirstName *string   `json:"firstName,omitempty"`
	LastName  *string   `json:"lastName,omitempty"`
}

func toUserResponse(u generated.User) userResponse {
	return userResponse{
		ID:        u.ID,
		Email:     u.Email,
		Role:      string(u.Role),
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

// Create godoc
// @Summary      Register a new user
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        request  body      createUserRequest  true  "User registration payload"
// @Success      201      {object}  userResponse
// @Failure      400      {object}  response.ErrorResponse
// @Failure      409      {object}  response.ErrorResponse
// @Failure      500      {object}  response.ErrorResponse
// @Router       /api/v1/users [post]
func (h *Handler) Create(c *gin.Context) {
	var req createUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, "could not hash password", err)
		return
	}

	user, err := h.q.CreateUser(c.Request.Context(), generated.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         generated.UserRoleUser,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
	})
	if err != nil {
		if db.IsUniqueViolation(err) {
			response.Conflict(c, "email already in use")
			return
		}
		response.Internal(c, "could not create user", err) // real cause logged
		return
	}

	c.JSON(http.StatusCreated, toUserResponse(user))
}

// GetByID godoc
// @Summary      Get a user by ID
// @Tags         users
// @Produce      json
// @Param        id   path      string  true  "User ID (UUID)"
// @Success      200  {object}  userResponse
// @Failure      400  {object}  response.ErrorResponse
// @Failure      404  {object}  response.ErrorResponse
// @Failure      500  {object}  response.ErrorResponse
// @Router       /api/v1/users/{id} [get]
func (h *Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	user, err := h.q.GetUserByID(c.Request.Context(), id)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "user not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not fetch user", err)
		return
	}

	c.JSON(http.StatusOK, toUserResponse(user))
}

// List godoc
// @Summary      List all users
// @Tags         users
// @Produce      json
// @Param        page       query     int  false  "Page number (1-based)"     default(1)
// @Param        page_size  query     int  false  "Items per page (max 100)"  default(20)
// @Success      200  {object}  response.Page[userResponse]
// @Failure      500  {object}  response.ErrorResponse
// @Router       /api/v1/users [get]
func (h *Handler) List(c *gin.Context) {
	p := response.FromQuery(c)

	rows, err := h.q.ListUsers(c.Request.Context(), generated.ListUsersParams{
		Limit:  p.Limit(),
		Offset: p.Offset(),
	})
	if err != nil {
		response.Internal(c, "could not list users", err)
		return
	}

	total, err := h.q.CountUsers(c.Request.Context())
	if err != nil {
		response.Internal(c, "could not count users", err)
		return
	}

	items := make([]userResponse, len(rows))
	for i, u := range rows {
		items[i] = toUserResponse(u)
	}

	c.JSON(http.StatusOK, response.NewPage(items, p, total))
}
