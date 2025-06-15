package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"api-gateway/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UsernameKey contextKey = "username"
	RolesKey    contextKey = "roles"
)

func JWTAuthMiddleware(cfg *config.Config, logger *logrus.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if isPublicPath(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				logger.Warn("Authorization header is missing")
				http.Error(w, "Authorization header is required", http.StatusUnauthorized)
				return
			}

			if !strings.HasPrefix(authHeader, "Bearer ") {
				logger.Warn("Invalid authorization format")
				http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(cfg.JWT.SecretKey), nil
			})

			if err != nil {
				logger.WithError(err).Warn("Failed to parse token")
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			if !token.Valid {
				logger.Warn("Token is invalid")
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				logger.Warn("Failed to extract claims")
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			if issuer, ok := claims["iss"].(string); !ok || issuer != cfg.JWT.Issuer {
				logger.Warn("Invalid issuer")
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			if audience, ok := claims["aud"].(string); !ok || audience != cfg.JWT.Audience {
				logger.Warn("Invalid audience")
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			userID, _ := claims["nameid"].(string)
			username, _ := claims["unique_name"].(string)
			email, _ := claims["email"].(string)

			var roles []string
			if rolesClaim, ok := claims["role"]; ok {
				if roleStr, ok := rolesClaim.(string); ok {
					roles = []string{roleStr}
				} else if rolesArr, ok := rolesClaim.([]interface{}); ok {
					for _, role := range rolesArr {
						if roleStr, ok := role.(string); ok {
							roles = append(roles, roleStr)
						}
					}
				}
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UsernameKey, username)
			ctx = context.WithValue(ctx, RolesKey, roles)

			r.Header.Set("X-User-ID", userID)
			r.Header.Set("X-Username", username)
			r.Header.Set("X-User-Email", email)
			if len(roles) > 0 {
				r.Header.Set("X-User-Roles", strings.Join(roles, ","))
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func isPublicPath(path string) bool {
	// Authentication routes
	publicPaths := []string{
		"/api/v1/auth/login",
		"/api/v1/auth/register",
		"/api/v1/auth/logout",
		"/health",
		"/ping",
	}

	for _, publicPath := range publicPaths {
		if path == publicPath {
			return true
		}
	}

	publicPrefixes := []string{
		"/api/v1/products",
		"/api/v1/categories",
		"/api/v1/brands",
		"/api/v1/reviews",
		"/swagger",
		"/api/v1/chat",
	}

	// Check prefixes
	for _, prefix := range publicPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}

	protectedPrefixes := []string{
		"/api/v1/cart",
		"/api/v1/wishlist",
		"/api/v1/user",
		"/api/v1/auth/change-password",
	}

	for _, prefix := range protectedPrefixes {
		if strings.HasPrefix(path, prefix) {
			return false
		}
	}

	return false
}
