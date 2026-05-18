package middleware

import (
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"

	"krs/backend/config"
)

// JWTMiddleware memvalidasi token Bearer dan menyimpan claims ke Echo context.
func JWTMiddleware(cfg *config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token tidak valid atau tidak ditemukan",
				})
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token tidak valid atau tidak ditemukan",
				})
			}

			token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(cfg.JWTSecretKey), nil
			})
			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token tidak valid atau tidak ditemukan",
				})
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{
					"error": "Token tidak valid atau tidak ditemukan",
				})
			}

			c.Set("userID", asString(claims["sub"]))
			c.Set("role", asString(claims["role"]))
			c.Set("nama", asString(claims["nama"]))

			return next(c)
		}
	}
}

func AdminRequired(next echo.HandlerFunc) echo.HandlerFunc {
	return roleGuard("admin", next)
}

func MahasiswaRequired(next echo.HandlerFunc) echo.HandlerFunc {
	return roleGuard("mahasiswa", next)
}

func DosenRequired(next echo.HandlerFunc) echo.HandlerFunc {
	return roleGuard("dosen", next)
}

func roleGuard(role string, next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if c.Get("role") != role {
			return c.JSON(http.StatusForbidden, map[string]string{
				"error": "Akses '" + role + "' diperlukan",
			})
		}
		return next(c)
	}
}

func asString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
