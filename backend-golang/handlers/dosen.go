package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"krs/backend/models"
	"krs/backend/services"
	"krs/backend/utils"
)

type DosenHandler struct {
	DB    *gorm.DB
	Cache *utils.CacheClient
}

func NewDosenHandler(db *gorm.DB, cache *utils.CacheClient) *DosenHandler {
	return &DosenHandler{DB: db, Cache: cache}
}

func (h *DosenHandler) Profile(c echo.Context) error {
	dosenID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	var dosen models.Dosen
	if err := h.DB.Where("id = ?", dosenID).First(&dosen).Error; err != nil {
		return utils.ErrorResponse(c, "Dosen tidak ditemukan", http.StatusNotFound)
	}
	return utils.SuccessResponse(c, dosen.ToResponse(), "Success", http.StatusOK)
}

func (h *DosenHandler) GetMahasiswaBimbingan(c echo.Context) error {
	dosenID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	cacheKey := "krs:dosen:" + dosenID.String() + ":bimbingan"
	if cached := h.Cache.GetCache(cacheKey); cached != nil {
		return utils.SuccessResponse(c, cached, "Success", http.StatusOK)
	}

	result, err := services.GetMahasiswaBimbingan(h.DB, dosenID)
	if err != nil {
		return utils.ErrorResponse(c, "Gagal mengambil data mahasiswa bimbingan", http.StatusInternalServerError)
	}

	h.Cache.SetCache(cacheKey, result, 300)
	return utils.SuccessResponse(c, result, "Success", http.StatusOK)
}

func (h *DosenHandler) GetDetailMahasiswa(c echo.Context) error {
	dosenID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	mahasiswaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	data, err := services.GetDetailMahasiswaBimbingan(h.DB, dosenID, mahasiswaID)
	if err != nil {
		switch err.Error() {
		case "not found":
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		case "forbidden":
			return utils.ErrorResponse(c, "Mahasiswa ini bukan bimbingan Anda", http.StatusForbidden)
		}
		return utils.ErrorResponse(c, "Gagal mengambil detail mahasiswa", http.StatusInternalServerError)
	}
	return utils.SuccessResponse(c, data, "Success", http.StatusOK)
}
