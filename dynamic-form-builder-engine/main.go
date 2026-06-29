package main

import (
	"context"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/docs"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/app"
	config "github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/cfg"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/http/server"
	"go.uber.org/zap"
	"log"
)

// @title           Dynamic Form Builder API
// @version         1.0
// @description     Configuration-driven form engine: define, validate, and store dynamic forms.
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer " followed by your JWT.
func main() {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	if err := db.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	if cfg.Host != "" {
		docs.SwaggerInfo.Host = cfg.Host
	}

	a, err := app.New(ctx, cfg)
	if err != nil {
		log.Fatalf("app init: %v", err)
	}
	defer a.Close()
	log.Println("database connected successfully")

	if err := db.SeedTestAccount(context.Background(), a.Queries); err != nil {
		log.Fatalf("seeding test account failed: %v", err)
	}

	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatal(err)
	}
	defer logger.Sync()

	zap.ReplaceGlobals(logger)

	router := server.New(a)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server: %v", err)
	}
}
