package db

import (
	"embed"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	//_ "github.com/golang-migrate/migrate/v4/database/pgx/v5" // pgx driver for migrate
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

// Embed the migration files into the binary so the app is self-contained —
// no need to ship the .sql files alongside it. The path is relative to THIS
// source file (internal/db/), so the migrations must be reachable from here.
//
//go:embed migrations/*.sql
var migrationFS embed.FS

// RunMigrations applies all pending up-migrations at startup. It records what
// it has applied in a schema_migrations table and is a no-op when already
// current. This is the AutoMigrate equivalent — schema is correct before the
// app serves a single request.
func RunMigrations(databaseURL string) error {
	src, err := iofs.New(migrationFS, "migrations")
	if err != nil {
		return fmt.Errorf("migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, databaseURL)
	if err != nil {
		return fmt.Errorf("migrate init: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migrate up: %w", err)
	}
	return nil
}
