package formengine

//
//import (
//	"bytes"
//	_ "embed"
//	"encoding/json"
//	"github.com/gin-gonic/gin"
//	"log"
//	"net/http"
//)
//
//// Handler exposes the schema endpoints over a Store (no more embedding).
//type Handler struct {
//	store *Store
//}
//
//// NewHandler takes a ready Store (built with NewStore).
//func NewHandler(store *Store) *Handler {
//	return &Handler{store: store}
//}
//
//// RegisterRoutes wires the endpoints onto an existing group (e.g. /api/v1).
//func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
//	rg.GET("/example-schema", h.getSchema)
//	rg.PUT("/example-schema", h.updateSchema)
//	rg.POST("/example-schema/validate", h.validate)
//}
//
//// ValidationResponse is the body returned by the validate endpoint.
//type ValidationResponse struct {
//	Valid  bool         `json:"valid"`
//	Errors []FieldError `json:"errors,omitempty"`
//}
//
//// getSchema godoc
//// @Summary      Get the example form schema
//// @Description  Returns the current JSON SchemaJson (with x-order/x-widget/x-label hints) for the frontend to render.
//// @Tags         forms
//// @Produce      json
//// @Success      200  {object}  map[string]interface{}
//// @Router       /api/v1/example-schema [get]
//func (h *Handler) getSchema(c *gin.Context) {
//	// Serve raw bytes verbatim so render hints and key order survive untouched.
//	c.Data(http.StatusOK, "application/json; charset=utf-8", h.store.Raw())
//}
//
//// updateSchema godoc
//// @Summary      Replace the example form schema
//// @Description  Validates the posted JSON SchemaJson and, if valid, persists it. Invalid schemas are rejected and the existing schema is left unchanged.
//// @Tags         forms
//// @Accept       json
//// @Produce      json
//// @Param        schema  body      object  true  "A JSON SchemaJson document"
//// @Success      200     {object}  map[string]string
//// @Failure      422     {object}  map[string]string
//// @Failure      400     {object}  map[string]string
//// @Router       /api/v1/example-schema [put]
//func (h *Handler) updateSchema(c *gin.Context) {
//	body, err := c.GetRawData()
//	if err != nil {
//		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read request body"})
//		return
//	}
//	if err := h.store.Update(body); err != nil {
//		// Update validates before writing, so a failure means a bad schema.
//		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
//		return
//	}
//	c.JSON(http.StatusOK, gin.H{"status": "schema updated"})
//}
//
//// validate godoc
//// @Summary      Validate a submission against the current schema
//// @Description  Validates the posted JSON. 200 when valid; 422 with field-level errors when not; 400 when the body isn't valid JSON.
//// @Tags         forms
//// @Accept       json
//// @Produce      json
//// @Param        payload  body      object              true  "Submission payload"
//// @Success      200      {object}  ValidationResponse
//// @Failure      422      {object}  ValidationResponse
//// @Failure      400      {object}  map[string]string
//// @Router       /api/v1/example-schema/validate [post]
//func (h *Handler) validate(c *gin.Context) {
//	body, err := c.GetRawData()
//	if err != nil {
//		c.JSON(http.StatusBadRequest, gin.H{"error": "could not read request body"})
//		return
//	}
//	var pretty bytes.Buffer
//	if err := json.Indent(&pretty, body, "", "  "); err == nil {
//		log.Printf("Received payload:\n%s", pretty.String())
//	} else {
//		log.Printf("Received payload (invalid JSON): %s", string(body))
//	}
//
//	errs, perr := Validate(h.store.Schema(), body)
//	if perr != nil {
//		c.JSON(http.StatusBadRequest, gin.H{"error": "payload is not valid JSON"})
//		return
//	}
//	if len(errs) > 0 {
//		c.JSON(http.StatusUnprocessableEntity, ValidationResponse{Valid: false, Errors: errs})
//		return
//	}
//	c.JSON(http.StatusOK, ValidationResponse{Valid: true})
//}
