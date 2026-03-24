package middleware

import (
	"context"
	"net/http"
	"strings"

	"minigallery/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

var JwtKey []byte

type Claims struct {
	UserID int         `json:"user_id"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

func InitJWT(secret string) {
	JwtKey = []byte(secret)
}

func Auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Требуется авторизация", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Неверный формат токена", http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(parts[1], claims, func(token *jwt.Token) (interface{}, error) {
			return JwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Недействительный токен", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user_id", claims.UserID)
		ctx = context.WithValue(ctx, "user_role", claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := r.Context().Value("user_role")
		if role != models.RoleAdmin {
			http.Error(w, "Доступ запрещен", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	}
}