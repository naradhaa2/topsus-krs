package utils

import "github.com/labstack/echo/v4"

// SuccessResponse format: {"data": ..., "message": "..."}
func SuccessResponse(c echo.Context, data interface{}, message string, code int) error {
	return c.JSON(code, map[string]interface{}{
		"data":    data,
		"message": message,
	})
}

// ErrorResponse format: {"error": "..."}
func ErrorResponse(c echo.Context, message string, code int) error {
	return c.JSON(code, map[string]string{"error": message})
}
