package db

import (
	"context"
	"github.com/NhyiraAmofaSekyi/dynamic-form-builder-engine/internal/db/generated"
	"golang.org/x/crypto/bcrypt"
	"log/slog"
	"os"
)

func SeedTestAccount(ctx context.Context, q *generated.Queries) error {
	const email = "test@example.com"

	password := os.Getenv("SEED_TEST_PASSWORD")
	if password == "" {
		slog.Warn("seed: SEED_TEST_PASSWORD not set, skipping test account")
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	firstName := "Test"
	lastName := "User"

	_, err = q.CreateUser(ctx, generated.CreateUserParams{
		Email:        email,
		PasswordHash: string(hash),
		Role:         generated.UserRoleUser,
		FirstName:    &firstName,
		LastName:     &lastName,
	})
	if err != nil {
		if IsUniqueViolation(err) {
			slog.Info("seed: test account already exists, skipping")
			return nil
		}
		return err
	}

	slog.Info("seed: created test account", "email", email)
	return nil
}
