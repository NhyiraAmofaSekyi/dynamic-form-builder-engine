package server

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/app"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/forms"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/auth"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/middleware"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/response"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/submissions"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/users"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	scalar "github.com/MarceloPetrucio/go-scalar-api-reference"
	"github.com/gin-contrib/cors"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/swaggo/swag"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func New(a *app.App) *gin.Engine {
	router := gin.New()
	router.Use(ginzap.GinzapWithConfig(zap.L(), &ginzap.Config{
		UTC:        true,
		TimeFormat: time.RFC3339,
		Context: ginzap.Fn(func(c *gin.Context) []zapcore.Field {
			fields := []zapcore.Field{}
			if trace.SpanFromContext(c.Request.Context()).SpanContext().IsValid() {
				fields = append(fields,
					zap.String("trace_id", trace.SpanFromContext(c.Request.Context()).SpanContext().TraceID().String()),
					zap.String("span_id", trace.SpanFromContext(c.Request.Context()).SpanContext().SpanID().String()),
				)
			}
			return fields
		}),
		// skip swagger and docs routes
		Skipper: func(c *gin.Context) bool {
			return c.Request.URL.Path == "/docs" ||
				len(c.Request.URL.Path) >= 8 && c.Request.URL.Path[:8] == "/swagger"
		},
	}))

	allowedOrigins := []string{
		"https://api-formbuilder.nhyiraamofasekyi.com",
		"https://formbuilder.nhyiraamofasekyi.com",
		"http://localhost:3000",
		"http://localhost:5173",
	}
	if env := os.Getenv("CORS_ORIGINS"); env != "" {
		allowedOrigins = strings.Split(env, ",")
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// zap recovery middleware
	router.Use(ginzap.RecoveryWithZap(zap.L(), true))
	router.Use(otelgin.Middleware("payment-gateway-api"))
	router.Use(middleware.ErrorHandler())

	// docs
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	router.GET("/docs", scalarHandler)

	router.NoRoute(func(c *gin.Context) {
		response.NotFound(c, "route not found")
	})
	router.NoMethod(func(c *gin.Context) {
		response.MethodNotAllowed(c, "method not allowed")
	})

	// api routes
	v1 := router.Group("/api/v1")

	auth.NewHandler(a.Queries, a.Cfg.JWTSecret).RegisterRoutes(v1) // /auth/login, /auth/register

	users.NewHandler(a.Queries).RegisterRoutes(v1)
	protected := v1.Group("")
	protected.Use(middleware.RequireAuth(a.Cfg.JWTSecret))
	{
		forms.NewHandler(a.Pool, a.Queries).RegisterRoutes(protected)
	}
	subs := submissions.NewHandler(a.Pool, a.Queries)
	subs.RegisterPublicRoutes(v1)
	subs.RegisterProtectedRoutes(protected)

	return router
}

func scalarHandler(c *gin.Context) {
	specJSON, err := swag.ReadDoc()
	if err != nil {
		response.Internal(c, "failed to load api docs", err)
		return
	}
	html, err := scalar.ApiReferenceHTML(&scalar.Options{
		SpecContent: specJSON,
		Theme:       scalar.ThemeDefault,
		DarkMode:    true,
		CustomOptions: scalar.CustomOptions{
			PageTitle: "ZedFleet API",
		},
	})
	if err != nil {
		response.Internal(c, "failed to render api docs", err)
		return
	}
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}
