package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims is what we encode into the JWT. Embedding RegisteredClaims gives us
// standard fields (expiry, issued-at). We add the app-specific user id + role.
type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

// Issue creates a signed JWT for a user. secret comes from config (JWT_SECRET).
func Issue(secret string, userID uuid.UUID, role string, ttl time.Duration) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// Parse validates a token string and returns its claims. It rejects tokens
// signed with an unexpected algorithm (the classic "alg=none" attack guard).
func Parse(secret, tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
