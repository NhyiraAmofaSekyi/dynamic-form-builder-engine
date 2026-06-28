package forms

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db"
	"net/http"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db/generated"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/formengine"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/middleware"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	pool *pgxpool.Pool
	q    *generated.Queries
}

func NewHandler(pool *pgxpool.Pool, q *generated.Queries) *Handler {
	return &Handler{pool: pool, q: q}
}

// RegisterRoutes wires the PROTECTED form routes. Attach this to a group that
// already has RequireAuth, so middleware.UserID(c) is always populated.
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/forms", h.Create)
	r.GET("/forms", h.ListMine)
	r.GET("/forms/:id", h.GetByID)
	r.POST("/forms/:id/versions", h.CreateVersion)
	r.GET("/forms/:id/versions/current", h.GetCurrentVersion)
	r.GET("/forms/:id/versions/:versionId", h.GetVersionByID)
}

// ---- DTOs ------------------------------------------------------------------

type createFormRequest struct {
	Name        string          `json:"name" binding:"required"`
	Description *string         `json:"description"`
	Schema      json.RawMessage `json:"schema" binding:"required" swaggertype:"object"`
}

type createVersionRequest struct {
	SchemaJson    json.RawMessage `json:"schemaJson" binding:"required" swaggertype:"object"`
	ChangeSummary *string         `json:"changeSummary"`
}

type FormResponse struct {
	ID               uuid.UUID  `json:"id"`
	Name             string     `json:"name"`
	Slug             string     `json:"slug"`
	Description      *string    `json:"description,omitempty"`
	CurrentVersionID *uuid.UUID `json:"currentVersionId,omitempty"`
	CreatedAt        string     `json:"createdAt"`
}

type VersionResponse struct {
	ID            uuid.UUID       `json:"id"`
	FormID        uuid.UUID       `json:"formId"`
	SchemaJson    json.RawMessage `json:"schemaJson" swaggertype:"object"`
	ChangeSummary *string         `json:"changeSummary,omitempty"`
	CreatedAt     string          `json:"createdAt"`
}

func toFormResponse(f generated.Form) FormResponse {
	return FormResponse{
		ID:               f.ID,
		Name:             f.Name,
		Slug:             f.Slug,
		Description:      f.Description,
		CurrentVersionID: f.CurrentVersionID,
		CreatedAt:        f.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func toVersionResponse(v generated.FormVersion) VersionResponse {
	return VersionResponse{
		ID:            v.ID,
		FormID:        v.FormID,
		SchemaJson:    v.SchemaJson,
		ChangeSummary: v.ChangeSummary,
		CreatedAt:     v.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// hashSchema produces a stable hash of the schema bytes for version dedupe.
func hashSchema(schema []byte) string {
	sum := sha256.Sum256(schema)
	return hex.EncodeToString(sum[:])
}

// ---- handlers --------------------------------------------------------------

// Create godoc
// @Summary  Create a form with its first version
// @Tags     forms
// @Accept   json
// @Produce  json
// @Param    request  body      createFormRequest  true  "Form + initial schema"
// @Success  201      {object}  FormResponse
// @Failure  400      {object}  response.ErrorResponse
// @Failure  409      {object}  response.ErrorResponse
// @Failure  500      {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms [post]
func (h *Handler) Create(c *gin.Context) {
	userID := middleware.UserID(c)

	var req createFormRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	// validate the schema is itself a well-formed JSON SchemaJson before storing.
	if _, err := formengine.Compile(req.Schema); err != nil {
		response.BadRequest(c, "invalid form schema", err.Error())
		return
	}

	ctx := c.Request.Context()

	slug := Slugify(req.Name)
	if slug == "" {
		response.BadRequest(c, "name must contain at least one letter or number")
		return
	}

	// transaction: insert form -> insert v1 -> point form at v1. All-or-nothing.
	var form generated.Form
	err := h.withTx(ctx, func(qtx *generated.Queries) error {
		f, err := qtx.CreateForm(ctx, generated.CreateFormParams{
			UserID:      userID,
			Name:        req.Name,
			Description: req.Description,
			Slug:        slug,
		})
		if err != nil {
			return err
		}

		v, err := qtx.InsertVersion(ctx, generated.InsertVersionParams{
			FormID:            f.ID,
			PreviousVersionID: nil, // first version
			SchemaHash:        hashSchema(req.Schema),
			SchemaJson:        req.Schema,
			CreatedBy:         &userID,
		})
		if err != nil {
			return err
		}

		if err := qtx.SetCurrentVersion(ctx, generated.SetCurrentVersionParams{
			ID:               f.ID,
			CurrentVersionID: &v.ID,
		}); err != nil {
			return err
		}

		f.CurrentVersionID = &v.ID // reflect the pointer in the returned struct
		form = f
		return nil
	})
	if err != nil {
		if db.IsUniqueViolation(err) {
			response.Conflict(c, "a form with that slug already exists")
			return
		}
		response.Internal(c, "could not create form", err)
		return
	}

	c.JSON(http.StatusCreated, toFormResponse(form))
}

// CreateVersion godoc
// @Summary  Create a new version of a form (becomes current)
// @Tags     forms
// @Accept   json
// @Produce  json
// @Param    id       path      string                true  "Form ID"
// @Param    request  body      createVersionRequest  true  "New schema"
// @Success  201      {object}  VersionResponse
// @Failure  400      {object}  response.ErrorResponse
// @Failure  403      {object}  response.ErrorResponse
// @Failure  404      {object}  response.ErrorResponse
// @Failure  500      {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id}/versions [post]
func (h *Handler) CreateVersion(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}

	var req createVersionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	if _, err := formengine.Compile(req.SchemaJson); err != nil {
		response.BadRequest(c, "invalid form schema", err.Error())
		return
	}

	ctx := c.Request.Context()

	form, err := h.q.GetFormByID(ctx, formID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "form not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load form", err)
		return
	}
	// ownership: only the owner may version their form.
	if form.UserID != userID {
		response.Forbidden(c, "you do not own this form")
		return
	}

	var version generated.FormVersion
	err = h.withTx(ctx, func(qtx *generated.Queries) error {
		v, err := qtx.InsertVersion(ctx, generated.InsertVersionParams{
			FormID:            formID,
			PreviousVersionID: form.CurrentVersionID, // chain to the prior current
			SchemaHash:        hashSchema(req.SchemaJson),
			SchemaJson:        req.SchemaJson,
			ChangeSummary:     req.ChangeSummary,
			CreatedBy:         &userID,
		})
		if err != nil {
			return err
		}
		if err := qtx.SetCurrentVersion(ctx, generated.SetCurrentVersionParams{
			ID:               formID,
			CurrentVersionID: &v.ID,
		}); err != nil {
			return err
		}
		version = v
		return nil
	})
	if err != nil {
		response.Internal(c, "could not create version", err)
		return
	}

	c.JSON(http.StatusCreated, toVersionResponse(version))
}

// ListMine godoc
// @Summary  List the authenticated user's forms
// @Tags     forms
// @Produce  json
// @Param    page       query     int  false  "Page number (1-based)"     default(1)
// @Param    page_size  query     int  false  "Items per page (max 100)"  default(20)
// @Success  200  {object}  response.Page[FormResponse]
// @Failure  500  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms [get]
func (h *Handler) ListMine(c *gin.Context) {
	userID := middleware.UserID(c)
	p := response.FromQuery(c)
	ctx := c.Request.Context()

	forms, err := h.q.ListFormsByUser(ctx, generated.ListFormsByUserParams{
		UserID: userID,
		Limit:  p.Limit(),
		Offset: p.Offset(),
	})
	if err != nil {
		response.Internal(c, "could not list forms", err)
		return
	}

	total, err := h.q.CountFormsByUser(ctx, userID)
	if err != nil {
		response.Internal(c, "could not count forms", err)
		return
	}

	items := make([]FormResponse, len(forms))
	for i, f := range forms {
		items[i] = toFormResponse(f)
	}
	c.JSON(http.StatusOK, response.NewPage(items, p, total))
}

// GetByID godoc
// @Summary  Get a form by ID
// @Tags     forms
// @Produce  json
// @Param    id   path      string  true  "Form ID"
// @Success  200  {object}  FormResponse
// @Failure  403  {object}  response.ErrorResponse
// @Failure  404  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id} [get]
func (h *Handler) GetByID(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}

	form, err := h.q.GetFormByID(c.Request.Context(), formID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "form not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load form", err)
		return
	}
	if form.UserID != userID {
		response.Forbidden(c, "you do not own this form")
		return
	}

	c.JSON(http.StatusOK, toFormResponse(form))
}

// GetCurrentVersion godoc
// @Summary  Get the current (live) version of a form
// @Tags     forms
// @Produce  json
// @Param    id   path      string  true  "Form ID"
// @Success  200  {object}  VersionResponse
// @Failure  404  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id}/versions/current [get]
func (h *Handler) GetCurrentVersion(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}

	form, err := h.q.GetFormByID(c.Request.Context(), formID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "form not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load form", err)
		return
	}
	if form.UserID != userID {
		response.Forbidden(c, "you do not own this form")
		return
	}
	if form.CurrentVersionID == nil {
		response.NotFound(c, "form has no current version")
		return
	}

	v, err := h.q.GetVersionByID(c.Request.Context(), *form.CurrentVersionID)
	if err != nil {
		response.Internal(c, "could not load version", err)
		return
	}

	c.JSON(http.StatusOK, toVersionResponse(v))
}

// GetVersionByID godoc
// @Summary  Get a specific version of a form by version ID
// @Tags     forms
// @Produce  json
// @Param    id         path      string  true  "Form ID"
// @Param    versionId  path      string  true  "Version ID"
// @Success  200  {object}  VersionResponse
// @Failure  400  {object}  response.ErrorResponse
// @Failure  403  {object}  response.ErrorResponse
// @Failure  404  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id}/versions/{versionId} [get]
func (h *Handler) GetVersionByID(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}
	versionID, err := uuid.Parse(c.Param("versionId"))
	if err != nil {
		response.BadRequest(c, "invalid version id")
		return
	}

	ctx := c.Request.Context()

	// ownership: load the form first so we can check the caller owns it.
	form, err := h.q.GetFormByID(ctx, formID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "form not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load form", err)
		return
	}
	if form.UserID != userID {
		response.Forbidden(c, "you do not own this form")
		return
	}

	v, err := h.q.GetVersionByID(ctx, versionID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "version not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load version", err)
		return
	}

	// guard: the version must belong to the form in the path, otherwise a
	// user could read any version id by pairing it with a form they own.
	if v.FormID != formID {
		response.NotFound(c, "version not found")
		return
	}

	c.JSON(http.StatusOK, toVersionResponse(v))
}

// withTx runs fn inside a transaction, committing on success and rolling back
// on any error. The fn receives a Queries bound to the tx so all its writes
// are atomic together.
func (h *Handler) withTx(ctx context.Context, fn func(q *generated.Queries) error) error {
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) // no-op if already committed

	if err := fn(h.q.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
