package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"

	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"

	"krs/backend/config"
	"krs/backend/database"
	"krs/backend/handlers"
	"krs/backend/middleware"
	"krs/backend/utils"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)
	cache := utils.NewCacheClient(cfg)

	e := echo.New()
	e.HideBanner = true

	// Global middleware
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORSWithConfig(echomiddleware.CORSConfig{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Custom error handler — format identik dengan Flask
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		msg := "Internal server error"
		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
			if m, ok := he.Message.(string); ok {
				msg = m
			} else if code == http.StatusNotFound {
				msg = "Resource tidak ditemukan"
			} else if code == http.StatusMethodNotAllowed {
				msg = "Method tidak diizinkan"
			}
		}
		if !c.Response().Committed {
			_ = c.JSON(code, map[string]string{"error": msg})
		}
	}

	// Initialize handlers
	authH := handlers.NewAuthHandler(db, cfg)
	adminH := handlers.NewAdminHandler(db, cache)
	mhsH := handlers.NewMahasiswaHandler(db, cache)
	dosenH := handlers.NewDosenHandler(db, cache)

	// JWT middleware
	jwtMW := middleware.JWTMiddleware(cfg)

	// Routes
	api := e.Group("/api")

	// Health check
	api.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{"data": nil, "message": "ok"})
	})

	// Auth
	auth := api.Group("/auth")
	auth.POST("/login", authH.Login)
	auth.GET("/me", authH.GetMe, jwtMW)

	// Admin
	admin := api.Group("/admin", jwtMW, middleware.AdminRequired)
	admin.GET("/dashboard", adminH.Dashboard)
	admin.GET("/mahasiswa", adminH.ListMahasiswa)
	admin.POST("/mahasiswa", adminH.CreateMahasiswa)
	admin.PUT("/mahasiswa/:id", adminH.UpdateMahasiswa)
	admin.DELETE("/mahasiswa/:id", adminH.DeleteMahasiswa)
	admin.PUT("/mahasiswa/:id/dosen-pa", adminH.AssignDosenPA)
	admin.GET("/dosen", adminH.ListDosen)
	admin.POST("/dosen", adminH.CreateDosen)
	admin.PUT("/dosen/:id", adminH.UpdateDosen)
	admin.DELETE("/dosen/:id", adminH.DeleteDosen)

	// Mahasiswa
	mhs := api.Group("/mahasiswa", jwtMW, middleware.MahasiswaRequired)
	mhs.GET("/profile", mhsH.Profile)
	mhs.GET("/krs", mhsH.GetKRS)
	mhs.PUT("/krs", mhsH.UpdateKRS)
	mhs.GET("/mata-kuliah-tersedia", mhsH.GetMKTersedia)

	// Dosen
	dosen := api.Group("/dosen", jwtMW, middleware.DosenRequired)
	dosen.GET("/profile", dosenH.Profile)
	dosen.GET("/mahasiswa-bimbingan", dosenH.GetMahasiswaBimbingan)
	dosen.GET("/mahasiswa-bimbingan/:id", dosenH.GetDetailMahasiswa)

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	go func() {
		slog.Info("server starting", "port", cfg.Port)
		if err := e.Start(":" + cfg.Port); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down server...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10e9)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
}
