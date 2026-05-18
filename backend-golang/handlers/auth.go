package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"krs/backend/config"
	"krs/backend/models"
	"krs/backend/services"
	"krs/backend/utils"
)

type AuthHandler struct {
	DB  *gorm.DB
	Cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{DB: db, Cfg: cfg}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := req.Password
	role := strings.ToLower(strings.TrimSpace(req.Role))

	if email == "" || password == "" || role == "" {
		return utils.ErrorResponse(c, "email, password, dan role wajib diisi", http.StatusBadRequest)
	}
	if role != "admin" && role != "mahasiswa" && role != "dosen" {
		return utils.ErrorResponse(c, "role harus salah satu dari: admin, dosen, mahasiswa", http.StatusBadRequest)
	}

	// Query user yang sesuai dengan role
	var (
		userID   string
		pwHash   string
		nama     string
		userDict interface{}
	)

	switch role {
	case "admin":
		var user models.Admin
		if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "Email atau password salah", http.StatusUnauthorized)
		}
		userID, pwHash, nama = user.ID.String(), user.PasswordHash, "Admin"
		userDict = user.ToResponse()
	case "dosen":
		var user models.Dosen
		if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "Email atau password salah", http.StatusUnauthorized)
		}
		userID, pwHash, nama = user.ID.String(), user.PasswordHash, user.Nama
		userDict = user.ToResponse()
	case "mahasiswa":
		var user models.Mahasiswa
		if err := h.DB.Where("email = ?", email).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "Email atau password salah", http.StatusUnauthorized)
		}
		userID, pwHash, nama = user.ID.String(), user.PasswordHash, user.Nama
		userDict = user.ToResponse(false)
	}

	if !services.VerifyPassword(password, pwHash) {
		return utils.ErrorResponse(c, "Email atau password salah", http.StatusUnauthorized)
	}

	token, err := services.GenerateToken(h.Cfg, userID, role, nama)
	if err != nil {
		return utils.ErrorResponse(c, "Gagal membuat token", http.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, map[string]interface{}{
		"access_token": token,
		"user":         mergeRole(userDict, role),
	}, "Login berhasil", http.StatusOK)
}

func (h *AuthHandler) GetMe(c echo.Context) error {
	userID := c.Get("userID").(string)
	role := c.Get("role").(string)

	var userDict interface{}
	switch role {
	case "admin":
		var user models.Admin
		if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "User tidak ditemukan", http.StatusNotFound)
		}
		userDict = user.ToResponse()
	case "dosen":
		var user models.Dosen
		if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "User tidak ditemukan", http.StatusNotFound)
		}
		userDict = user.ToResponse()
	case "mahasiswa":
		var user models.Mahasiswa
		if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
			return utils.ErrorResponse(c, "User tidak ditemukan", http.StatusNotFound)
		}
		userDict = user.ToResponse(false)
	default:
		return utils.ErrorResponse(c, "Role tidak valid", http.StatusBadRequest)
	}

	return utils.SuccessResponse(c, mergeRole(userDict, role), "Success", http.StatusOK)
}

// mergeRole menambahkan field "role" ke dalam map response user.
func mergeRole(user interface{}, role string) map[string]interface{} {
	b, _ := json.Marshal(user)
	var m map[string]interface{}
	_ = json.Unmarshal(b, &m)
	m["role"] = role
	return m
}
