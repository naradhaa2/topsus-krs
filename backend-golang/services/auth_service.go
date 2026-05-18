package services

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"krs/backend/config"
	"krs/backend/models"
)

type AuthUser struct {
	ID           uuid.UUID
	PasswordHash string
	Nama         string
}

// FindUserByEmail mencari user berdasarkan email dan role di tabel yang sesuai.
func FindUserByEmail(db *gorm.DB, email, role string) (*AuthUser, error) {
	switch role {
	case "admin":
		var user models.Admin
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("not found")
			}
			return nil, err
		}
		return &AuthUser{ID: user.ID, PasswordHash: user.PasswordHash, Nama: "Admin"}, nil

	case "dosen":
		var user models.Dosen
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("not found")
			}
			return nil, err
		}
		return &AuthUser{ID: user.ID, PasswordHash: user.PasswordHash, Nama: user.Nama}, nil

	case "mahasiswa":
		var user models.Mahasiswa
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("not found")
			}
			return nil, err
		}
		return &AuthUser{ID: user.ID, PasswordHash: user.PasswordHash, Nama: user.Nama}, nil

	default:
		return nil, errors.New("invalid role")
	}
}

func VerifyPassword(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(hash), err
}

func GenerateToken(cfg *config.Config, id, role, nama string) (string, error) {
	claims := jwt.MapClaims{
		"sub":  id,
		"role": role,
		"nama": nama,
		"exp":  time.Now().Add(cfg.JWTAccessTokenExpires).Unix(),
		"iat":  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecretKey))
}
