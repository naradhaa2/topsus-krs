package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"krs/backend/services"
	"krs/backend/utils"
)

type AdminHandler struct {
	DB    *gorm.DB
	Cache *utils.CacheClient
}

func NewAdminHandler(db *gorm.DB, cache *utils.CacheClient) *AdminHandler {
	return &AdminHandler{DB: db, Cache: cache}
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

func (h *AdminHandler) Dashboard(c echo.Context) error {
	const key = "krs:dashboard"
	if cached := h.Cache.GetCache(key); cached != nil {
		return utils.SuccessResponse(c, cached, "Success", http.StatusOK)
	}

	data, err := services.GetDashboard(h.DB)
	if err != nil {
		return utils.ErrorResponse(c, "Gagal mengambil data dashboard", http.StatusInternalServerError)
	}

	h.Cache.SetCache(key, data, 600)
	return utils.SuccessResponse(c, data, "Success", http.StatusOK)
}

// ─── Mahasiswa ────────────────────────────────────────────────────────────────

func (h *AdminHandler) ListMahasiswa(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.QueryParam("per_page"))
	if perPage < 1 {
		perPage = 10
	}
	search := c.QueryParam("search")

	cacheKey := "krs:admin:mahasiswa:page" + strconv.Itoa(page) +
		":per" + strconv.Itoa(perPage) + ":q" + search
	if cached := h.Cache.GetCache(cacheKey); cached != nil {
		return utils.SuccessResponse(c, cached, "Success", http.StatusOK)
	}

	result, err := services.ListMahasiswa(h.DB, page, perPage, search)
	if err != nil {
		return utils.ErrorResponse(c, "Gagal mengambil data mahasiswa", http.StatusInternalServerError)
	}

	data := map[string]interface{}{
		"mahasiswa": result.Mahasiswa,
		"total":     result.Total,
		"pages":     result.Pages,
		"page":      result.Page,
		"per_page":  result.PerPage,
	}
	h.Cache.SetCache(cacheKey, data, 300)
	return utils.SuccessResponse(c, data, "Success", http.StatusOK)
}

func (h *AdminHandler) CreateMahasiswa(c echo.Context) error {
	var req services.CreateMahasiswaReq
	if err := c.Bind(&req); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}

	if req.Nama == "" || req.NIM == "" || req.Email == "" || req.Password == "" || req.Jurusan == "" {
		return utils.ErrorResponse(c, "nama, nim, email, password, dan jurusan wajib diisi", http.StatusBadRequest)
	}
	if req.Semester < 1 || req.Semester > 14 {
		return utils.ErrorResponse(c, "Semester harus antara 1 sampai 14", http.StatusBadRequest)
	}

	mhs, err := services.CreateMahasiswa(h.DB, &req)
	if err != nil {
		if err.Error() == "NIM sudah terdaftar" || err.Error() == "Email sudah terdaftar" {
			return utils.ErrorResponse(c, err.Error(), http.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Gagal membuat mahasiswa", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:mahasiswa:")
	h.Cache.DeleteCache("krs:dashboard")
	return utils.SuccessResponse(c, mhs.ToResponse(false), "Mahasiswa berhasil ditambahkan", http.StatusCreated)
}

func (h *AdminHandler) UpdateMahasiswa(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	var req services.UpdateMahasiswaReq
	if err := c.Bind(&req); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}

	if req.Semester != nil && (*req.Semester < 1 || *req.Semester > 14) {
		return utils.ErrorResponse(c, "Semester harus antara 1 sampai 14", http.StatusBadRequest)
	}

	mhs, err := services.UpdateMahasiswa(h.DB, id, &req)
	if err != nil {
		switch err.Error() {
		case "not found":
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		case "NIM sudah digunakan mahasiswa lain", "Email sudah digunakan mahasiswa lain":
			return utils.ErrorResponse(c, err.Error(), http.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Gagal update mahasiswa", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:mahasiswa:")
	h.Cache.DeleteCache("krs:dashboard")
	return utils.SuccessResponse(c, mhs.ToResponse(false), "Data mahasiswa berhasil diupdate", http.StatusOK)
}

func (h *AdminHandler) DeleteMahasiswa(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	if err := services.DeleteMahasiswa(h.DB, id); err != nil {
		if err.Error() == "not found" {
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Gagal menghapus mahasiswa", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:mahasiswa:")
	h.Cache.DeleteCache("krs:dashboard")
	return utils.SuccessResponse(c, nil, "Mahasiswa berhasil dihapus", http.StatusOK)
}

func (h *AdminHandler) AssignDosenPA(c echo.Context) error {
	mahasiswaID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	var body struct {
		DosenID string `json:"dosen_id"`
	}
	if err := c.Bind(&body); err != nil || body.DosenID == "" {
		return utils.ErrorResponse(c, "dosen_id wajib diisi", http.StatusBadRequest)
	}
	dosenID, err := uuid.Parse(body.DosenID)
	if err != nil {
		return utils.ErrorResponse(c, "dosen_id tidak valid", http.StatusBadRequest)
	}

	mhs, dosen, err := services.AssignDosenPA(h.DB, mahasiswaID, dosenID)
	if err != nil {
		switch err.Error() {
		case "mahasiswa not found":
			return utils.ErrorResponse(c, "Mahasiswa tidak ditemukan", http.StatusNotFound)
		case "dosen not found":
			return utils.ErrorResponse(c, "Dosen tidak ditemukan", http.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Gagal assign dosen PA", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:mahasiswa:")
	h.Cache.DeleteCache("krs:dashboard")
	h.Cache.DeleteCache("krs:dosen:" + dosenID.String() + ":bimbingan")
	return utils.SuccessResponse(c,
		mhs.ToResponse(true),
		"Dosen PA berhasil diassign ke "+dosen.Nama,
		http.StatusOK,
	)
}

// ─── Dosen ────────────────────────────────────────────────────────────────────

func (h *AdminHandler) ListDosen(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.QueryParam("per_page"))
	if perPage < 1 {
		perPage = 10
	}
	search := c.QueryParam("search")

	cacheKey := "krs:admin:dosen:page" + strconv.Itoa(page) +
		":per" + strconv.Itoa(perPage) + ":q" + search
	if cached := h.Cache.GetCache(cacheKey); cached != nil {
		return utils.SuccessResponse(c, cached, "Success", http.StatusOK)
	}

	result, err := services.ListDosen(h.DB, page, perPage, search)
	if err != nil {
		return utils.ErrorResponse(c, "Gagal mengambil data dosen", http.StatusInternalServerError)
	}

	data := map[string]interface{}{
		"dosen":    result.Dosen,
		"total":    result.Total,
		"pages":    result.Pages,
		"page":     result.Page,
		"per_page": result.PerPage,
	}
	h.Cache.SetCache(cacheKey, data, 300)
	return utils.SuccessResponse(c, data, "Success", http.StatusOK)
}

func (h *AdminHandler) CreateDosen(c echo.Context) error {
	var req services.CreateDosenReq
	if err := c.Bind(&req); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}

	if req.Nama == "" || req.NIDN == "" || req.Email == "" || req.Password == "" {
		return utils.ErrorResponse(c, "nama, nidn, email, dan password wajib diisi", http.StatusBadRequest)
	}

	dosen, err := services.CreateDosen(h.DB, &req)
	if err != nil {
		if err.Error() == "NIDN sudah terdaftar" || err.Error() == "Email sudah terdaftar" {
			return utils.ErrorResponse(c, err.Error(), http.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Gagal membuat dosen", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:dosen:")
	h.Cache.DeleteCache("krs:dashboard")
	return utils.SuccessResponse(c, dosen.ToResponse(), "Dosen berhasil ditambahkan", http.StatusCreated)
}

func (h *AdminHandler) UpdateDosen(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	var req services.UpdateDosenReq
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return utils.ErrorResponse(c, "Request tidak valid", http.StatusBadRequest)
	}

	dosen, err := services.UpdateDosen(h.DB, id, &req)
	if err != nil {
		switch err.Error() {
		case "not found":
			return utils.ErrorResponse(c, "Dosen tidak ditemukan", http.StatusNotFound)
		case "NIDN sudah digunakan dosen lain", "Email sudah digunakan dosen lain":
			return utils.ErrorResponse(c, err.Error(), http.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Gagal update dosen", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:dosen:")
	return utils.SuccessResponse(c, dosen.ToResponse(), "Data dosen berhasil diupdate", http.StatusOK)
}

func (h *AdminHandler) DeleteDosen(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return utils.ErrorResponse(c, "ID tidak valid", http.StatusBadRequest)
	}

	if err := services.DeleteDosen(h.DB, id); err != nil {
		if err.Error() == "not found" {
			return utils.ErrorResponse(c, "Dosen tidak ditemukan", http.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Gagal menghapus dosen", http.StatusInternalServerError)
	}

	h.Cache.DeletePattern("krs:admin:dosen:")
	h.Cache.DeleteCache("krs:dashboard")
	return utils.SuccessResponse(c, nil, "Dosen berhasil dihapus", http.StatusOK)
}
