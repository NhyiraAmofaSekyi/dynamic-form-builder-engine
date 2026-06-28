package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	Port        string
	JWTSecret   string
}

// Load reads configuration from the environment. In development it first loads
// a .env file if present; in production the file is absent and values come
// from injected env vars. A missing .env is NOT an error.
func Load() (*Config, error) {
	// optional: load .env if it exists (dev). Ignore "not found".
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        getOr("PORT", "8080"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}

	// fail fast on required secrets — better a clear startup error than a
	// confusing nil-pointer mid-request.
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
