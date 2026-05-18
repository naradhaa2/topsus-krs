package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"krs/backend/constants"
	"krs/backend/models"
	"krs/backend/services"
	"krs/backend/utils"
)

type MahasiswaHandler struct {
	DB    *gorm.DB
	Cache *utils.CacheClient
}

func NewMahasiswaHandler(db *gorm.DB, cache *utils.CacheClient) *MahasiswaHandler {
	return &MahasiswaHandler{DB: db, Cache: cache}
}

func (h *MahasiswaHandler) Profile(c echo.Context) error {
	userID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	var mhs models.Mahasiswa
	if err := h.DB.Preload("DosenPA").Where("id = ?", userID).First(&mhs).Error; err != nil {
		return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
	}
	return utils.SuccessResponse(c, mhs.ToResponse(true), "Success", http.StatusOK)
}

func (h *MahasiswaHandler) GetKRS(c echo.Context) error {
	userID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	data, err := services.GetKRS(h.DB, userID)
	if err != nil {
		if err.Error() == "not found" {
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Gagal mengambil KRS", http.StatusInternalServerError)
	}
	return utils.SuccessResponse(c, data, "Success", http.StatusOK)
}

func (h *MahasiswaHandler) UpdateKRS(c echo.Context) error {
	userID, err := uuid.Parse(c.Get("userID").(string))
	if err != nil {
		return utils.ErrorResponse(c, "User ID tidak valid", http.StatusBadRequest)
	}

	var body struct {
		MataKuliah []map[string]interface{} `json:"mata_kuliah"`
	}
	if err := c.Bind(&body); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}
	if body.MataKuliah == nil {
		return utils.ErrorResponse(c, "mata_kuliah harus berupa array", http.StatusBadRequest)
	}

	// Ekstrak slice kode dari array input
	kodePairs := make([]string, 0, len(body.MataKuliah))
	for _, item := range body.MataKuliah {
		kode, _ := item["kode"].(string)
		kodePairs = append(kodePairs, kode)
	}

	krsData, dosenPAID, err := services.UpdateKRS(h.DB, userID, kodePairs)
	if err != nil {
		switch err.Error() {
		case "not found":
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		}
		return utils.ErrorResponse(c, err.Error(), http.StatusBadRequest)
	}

	if dosenPAID != nil {
		h.Cache.DeleteCache("krs:dosen:" + dosenPAID.String() + ":bimbingan")
	}
	return utils.SuccessResponse(c, krsData, "KRS berhasil diupdate", http.StatusOK)
}

func (h *MahasiswaHandler) GetMKTersedia(c echo.Context) error {
	return utils.SuccessResponse(c, constants.MataKuliahList, "Success", http.StatusOK)
}
