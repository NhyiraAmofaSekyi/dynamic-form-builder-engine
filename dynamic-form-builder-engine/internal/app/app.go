package app

import (
	"context"
	"fmt"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/cfg"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db/generated"
	"github.com/jackc/pgx/v5/pgxpool"
	"log"
	"os"
)

type App struct {
	Cfg     *config.Config
	Pool    *pgxpool.Pool
	Queries *generated.Queries
	//SchemaStore *formengine.Store
}

// New builds the App and its dependencies. It loads the schema store from the
// configured path; a failure here is fatal at startup (the service can't serve
// forms without a schema), so we return the error and let main decide.
func New(ctx context.Context, cfg *config.Config) (*App, error) {
	//validators.Register()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("db pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("db ping: %w", err)
	}
	log.Println("database connection verified (ping ok)")

	//store, err := formengine.NewStore(schemaPath())
	//if err != nil {
	//	return nil, fmt.Errorf("init schema store: %w", err)
	//}

	return &App{
		Cfg:     cfg,
		Pool:    pool,
		Queries: generated.New(pool),
		//SchemaStore: store,
	}, nil
}

// Close releases resources held by the App (the connection pool).
func (a *App) Close() {
	if a.Pool != nil {
		a.Pool.Close()
	}
}

// schemaPath resolves the schema file location: SCHEMA_PATH env var if set,
// otherwise a sensible default relative to the working directory.
func schemaPath() string {
	if p := os.Getenv("SCHEMA_PATH"); p != "" {
		return p
	}
	return "data/example.schema.json"
}
