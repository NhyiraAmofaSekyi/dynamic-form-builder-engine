package submissions

import (
	"encoding/json"
	"errors"
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

// RegisterPublicRoutes wires the PUBLIC routes (no auth): render a form and
// submit an (anonymous) response.
func (h *Handler) RegisterPublicRoutes(r *gin.RouterGroup) {
	r.GET("/public/forms/:id", h.GetPublicForm)
	r.POST("/public/forms/:id/submissions", h.Submit)
}

// RegisterProtectedRoutes wires the PRIVATE routes (RequireAuth + ownership):
// the owner listing and reading responses.
func (h *Handler) RegisterProtectedRoutes(r *gin.RouterGroup) {
	r.GET("/forms/:id/submissions", h.ListByForm)
	r.GET("/forms/:id/submissions/:submissionId", h.GetByID)
}

// ---- DTOs ------------------------------------------------------------------

// PublicFormResponse is the MINIMAL render payload — only what an anonymous
type PublicFormResponse struct {
	ID          uuid.UUID       `json:"id"`
	Name        string          `json:"name"`
	Description *string         `json:"description,omitempty"`
	VersionID   uuid.UUID       `json:"versionId"`
	SchemaJSON  json.RawMessage `json:"schemaJson" swaggertype:"object"`
}

type submitRequest struct {
	Data json.RawMessage `json:"data" binding:"required" swaggertype:"object"`
}

type SubmissionResponse struct {
	ID            uuid.UUID       `json:"id"`
	FormID        uuid.UUID       `json:"formId"`
	FormVersionID uuid.UUID       `json:"formVersionId"`
	Data          json.RawMessage `json:"data" swaggertype:"object"`
	Status        string          `json:"status"`
	SubmittedBy   *uuid.UUID      `json:"submittedBy,omitempty"`
	CreatedAt     string          `json:"createdAt"`
}

// validationErrorResponse is the 422 body: structured field errors so the
// frontend can map them onto the right form fields.
type validationErrorResponse struct {
	Message string                  `json:"message"`
	Code    int                     `json:"code"`
	Errors  []formengine.FieldError `json:"errors"`
}

func toSubmissionResponse(s generated.FormSubmission) SubmissionResponse {
	return SubmissionResponse{
		ID:            s.ID,
		FormID:        s.FormID,
		FormVersionID: s.FormVersionID,
		Data:          s.SubmissionData,
		Status:        string(s.Status),
		SubmittedBy:   s.SubmittedBy,
		CreatedAt:     s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// ---- PUBLIC handlers -------------------------------------------------------

// GetPublicForm godoc
// @Summary  Get a form's current schema for public rendering
// @Tags     public
// @Produce  json
// @Param    id   path      string  true  "Form ID"
// @Success  200  {object}  PublicFormResponse
// @Failure  404  {object}  response.ErrorResponse
// @Router   /api/v1/public/forms/{id} [get]
func (h *Handler) GetPublicForm(c *gin.Context) {
	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
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
	if form.CurrentVersionID == nil {
		response.NotFound(c, "form is not published")
		return
	}

	version, err := h.q.GetVersionByID(ctx, *form.CurrentVersionID)
	if err != nil {
		response.Internal(c, "could not load form version", err)
		return
	}

	c.JSON(http.StatusOK, PublicFormResponse{
		ID:          form.ID,
		Name:        form.Name,
		Description: form.Description,
		VersionID:   version.ID,
		SchemaJSON:  version.SchemaJson,
	})
}

// Submit godoc
// @Summary  Submit a response to a form (anonymous, public)
// @Description Validates the payload against the form's CURRENT version and pins the submission to it.
// @Tags     public
// @Accept   json
// @Produce  json
// @Param    id       path      string         true  "Form ID"
// @Param    request  body      submitRequest  true  "Submission data"
// @Success  201      {object}  SubmissionResponse
// @Failure  400      {object}  response.ErrorResponse
// @Failure  404      {object}  response.ErrorResponse
// @Failure  422      {object}  validationErrorResponse
// @Failure  500      {object}  response.ErrorResponse
// @Router   /api/v1/public/forms/{id}/submissions [post]
func (h *Handler) Submit(c *gin.Context) {
	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}

	var req submitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request", err.Error())
		return
	}

	ctx := c.Request.Context()

	// resolve form -> CURRENT version (the server decides which version, never
	// the client) — this is what pins the submission to the right schema.
	form, err := h.q.GetFormByID(ctx, formID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "form not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load form", err)
		return
	}
	if form.CurrentVersionID == nil {
		response.NotFound(c, "form is not published")
		return
	}

	version, err := h.q.GetVersionByID(ctx, *form.CurrentVersionID)
	if err != nil {
		response.Internal(c, "could not load form version", err)
		return
	}

	// validate the payload against THAT version's schema.
	schema, err := formengine.Compile(version.SchemaJson)
	if err != nil {
		response.Internal(c, "stored schema failed to compile", err)
		return
	}
	fieldErrs, err := formengine.Validate(schema, req.Data)
	if err != nil {
		// payload wasn't parseable JSON
		response.BadRequest(c, "submission data is not valid JSON", err.Error())
		return
	}
	if len(fieldErrs) > 0 {
		// expected outcome: invalid submission -> 422 with structured field errors
		c.JSON(http.StatusUnprocessableEntity, validationErrorResponse{
			Message: "validation failed",
			Code:    http.StatusUnprocessableEntity,
			Errors:  fieldErrs,
		})
		return
	}

	// store, pinned to the current version. submitted_by = NULL (anonymous).
	sub, err := h.q.InsertSubmission(ctx, generated.InsertSubmissionParams{
		FormID:         formID,
		FormVersionID:  version.ID,
		SubmissionData: req.Data,
		Status:         generated.SubmissionStatusSubmitted,
		SubmittedBy:    nil, // anonymous
	})
	if err != nil {
		response.Internal(c, "could not save submission", err)
		return
	}

	c.JSON(http.StatusCreated, toSubmissionResponse(sub))
}

// ---- PRIVATE handlers (owner only) -----------------------------------------

// ListByForm godoc
// @Summary  List responses for a form (owner only)
// @Tags     submissions
// @Produce  json
// @Param    id          path      string  true   "Form ID"
// @Param    version_id  query     string  false  "Filter by a specific version"
// @Param    page        query     int     false  "Page number"      default(1)
// @Param    page_size   query     int     false  "Items per page"   default(20)
// @Success  200  {object}  response.Page[SubmissionResponse]
// @Failure  403  {object}  response.ErrorResponse
// @Failure  404  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id}/submissions [get]
func (h *Handler) ListByForm(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}

	ctx := c.Request.Context()

	// ownership: load the form, confirm the caller owns it.
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

	p := response.FromQuery(c)

	// optional ?version_id= filter: two distinct queries (clean index plans)
	// instead of one query with a nullable predicate.
	if vid := c.Query("version_id"); vid != "" {
		versionID, err := uuid.Parse(vid)
		if err != nil {
			response.BadRequest(c, "invalid version_id")
			return
		}
		rows, err := h.q.ListSubmissionsByVersion(ctx, generated.ListSubmissionsByVersionParams{
			FormID:        formID,
			FormVersionID: versionID,
			Limit:         p.Limit(),
			Offset:        p.Offset(),
		})
		if err != nil {
			response.Internal(c, "could not list submissions", err)
			return
		}
		total, err := h.q.CountSubmissionsByVersion(ctx, generated.CountSubmissionsByVersionParams{
			FormID:        formID,
			FormVersionID: versionID,
		})
		if err != nil {
			response.Internal(c, "could not count submissions", err)
			return
		}
		c.JSON(http.StatusOK, response.NewPage(mapSubmissions(rows), p, total))
		return
	}

	rows, err := h.q.ListSubmissionsByForm(ctx, generated.ListSubmissionsByFormParams{
		FormID: formID,
		Limit:  p.Limit(),
		Offset: p.Offset(),
	})
	if err != nil {
		response.Internal(c, "could not list submissions", err)
		return
	}
	total, err := h.q.CountSubmissionsByForm(ctx, formID)
	if err != nil {
		response.Internal(c, "could not count submissions", err)
		return
	}
	c.JSON(http.StatusOK, response.NewPage(mapSubmissions(rows), p, total))
}

// GetByID godoc
// @Summary  Get a single response (owner only)
// @Tags     submissions
// @Produce  json
// @Param    id            path      string  true  "Form ID"
// @Param    submissionId  path      string  true  "Submission ID"
// @Success  200  {object}  SubmissionResponse
// @Failure  403  {object}  response.ErrorResponse
// @Failure  404  {object}  response.ErrorResponse
// @Security BearerAuth
// @Router   /api/v1/forms/{id}/submissions/{submissionId} [get]
func (h *Handler) GetByID(c *gin.Context) {
	userID := middleware.UserID(c)

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid form id")
		return
	}
	subID, err := uuid.Parse(c.Param("submissionId"))
	if err != nil {
		response.BadRequest(c, "invalid submission id")
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
	if form.UserID != userID {
		response.Forbidden(c, "you do not own this form")
		return
	}

	sub, err := h.q.GetSubmissionByID(ctx, subID)
	if errors.Is(err, pgx.ErrNoRows) {
		response.NotFound(c, "submission not found")
		return
	}
	if err != nil {
		response.Internal(c, "could not load submission", err)
		return
	}
	// guard: the submission must belong to the form in the path.
	if sub.FormID != formID {
		response.NotFound(c, "submission not found")
		return
	}

	c.JSON(http.StatusOK, toSubmissionResponse(sub))
}

// ---- helpers ---------------------------------------------------------------

func mapSubmissions(rows []generated.FormSubmission) []SubmissionResponse {
	out := make([]SubmissionResponse, len(rows))
	for i, s := range rows {
		out[i] = toSubmissionResponse(s)
	}
	return out
}
