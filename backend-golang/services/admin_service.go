package services

import (
	"errors"
	"math"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"krs/backend/models"
)

// ─── Dashboard ───────────────────────────────────────────────────────────────

type DistribusiJurusan struct {
	Jurusan string `json:"jurusan"`
	Total   int64  `json:"total"`
}

type DashboardData struct {
	TotalMahasiswa    int64               `json:"total_mahasiswa"`
	TotalDosen        int64               `json:"total_dosen"`
	DistribusiJurusan []DistribusiJurusan `json:"distribusi_jurusan"`
	RataRataSKS       float64             `json:"rata_rata_sks"`
}

func GetDashboard(db *gorm.DB) (*DashboardData, error) {
	var totalMhs, totalDosen int64
	if err := db.Model(&models.Mahasiswa{}).Count(&totalMhs).Error; err != nil {
		return nil, err
	}
	if err := db.Model(&models.Dosen{}).Count(&totalDosen).Error; err != nil {
		return nil, err
	}

	var distribusi []DistribusiJurusan
	if err := db.Model(&models.Mahasiswa{}).
		Select("jurusan, COUNT(id) as total").
		Group("jurusan").
		Find(&distribusi).Error; err != nil {
		return nil, err
	}

	var allMhs []models.Mahasiswa
	if err := db.Select("mata_kuliah").Find(&allMhs).Error; err != nil {
		return nil, err
	}
	var totalSKS int
	for _, m := range allMhs {
		for _, mk := range m.MataKuliah {
			totalSKS += mk.SKS
		}
	}
	var rataRataSKS float64
	if len(allMhs) > 0 {
		rataRataSKS = math.Round(float64(totalSKS)/float64(len(allMhs))*100) / 100
	}

	return &DashboardData{
		TotalMahasiswa:    totalMhs,
		TotalDosen:        totalDosen,
		DistribusiJurusan: distribusi,
		RataRataSKS:       rataRataSKS,
	}, nil
}

// ─── Pagination helper ────────────────────────────────────────────────────────

type PaginationMeta struct {
	Total   int64
	Pages   int
	Page    int
	PerPage int
}

func paginate(db *gorm.DB, page, perPage int, out interface{}) (PaginationMeta, error) {
	var total int64
	if err := db.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return PaginationMeta{}, err
	}
	offset := (page - 1) * perPage
	if err := db.Session(&gorm.Session{}).Offset(offset).Limit(perPage).Find(out).Error; err != nil {
		return PaginationMeta{}, err
	}
	pages := 0
	if perPage > 0 {
		pages = int(math.Ceil(float64(total) / float64(perPage)))
	}
	return PaginationMeta{Total: total, Pages: pages, Page: page, PerPage: perPage}, nil
}

// ─── Mahasiswa CRUD ──────────────────────────────────────────────────────────

type ListMahasiswaResult struct {
	Mahasiswa []models.MahasiswaResponse `json:"mahasiswa"`
	PaginationMeta
}

func ListMahasiswa(db *gorm.DB, page, perPage int, search string) (*ListMahasiswaResult, error) {
	query := db.Model(&models.Mahasiswa{}).Order("created_at DESC")
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(nama) LIKE ? OR LOWER(nim) LIKE ?", like, like)
	}

	var items []models.Mahasiswa
	meta, err := paginate(query, page, perPage, &items)
	if err != nil {
		return nil, err
	}

	responses := make([]models.MahasiswaResponse, len(items))
	for i := range items {
		responses[i] = items[i].ToResponse(false)
	}
	return &ListMahasiswaResult{Mahasiswa: responses, PaginationMeta: meta}, nil
}

type CreateMahasiswaReq struct {
	Nama      string     `json:"nama"`
	NIM       string     `json:"nim"`
	Email     string     `json:"email"`
	Password  string     `json:"password"`
	Semester  int        `json:"semester"`
	Jurusan   string     `json:"jurusan"`
	DosenPAID *uuid.UUID `json:"dosen_pa_id"`
}

func CreateMahasiswa(db *gorm.DB, req *CreateMahasiswaReq) (*models.Mahasiswa, error) {
	var existing models.Mahasiswa
	if err := db.Where("nim = ?", req.NIM).First(&existing).Error; err == nil {
		return nil, errors.New("NIM sudah terdaftar")
	}
	if err := db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return nil, errors.New("Email sudah terdaftar")
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	mhs := &models.Mahasiswa{
		Nama:         req.Nama,
		NIM:          req.NIM,
		Email:        strings.ToLower(req.Email),
		PasswordHash: hash,
		Semester:     req.Semester,
		Jurusan:      req.Jurusan,
		DosenPAID:    req.DosenPAID,
		MataKuliah:   models.MataKuliahSlice{},
	}
	if err := db.Create(mhs).Error; err != nil {
		return nil, err
	}
	return mhs, nil
}

type UpdateMahasiswaReq struct {
	Nama      *string    `json:"nama"`
	NIM       *string    `json:"nim"`
	Email     *string    `json:"email"`
	Semester  *int       `json:"semester"`
	Jurusan   *string    `json:"jurusan"`
	DosenPAID *uuid.UUID `json:"dosen_pa_id"`
}

func UpdateMahasiswa(db *gorm.DB, id uuid.UUID, req *UpdateMahasiswaReq) (*models.Mahasiswa, error) {
	var mhs models.Mahasiswa
	if err := db.Where("id = ?", id).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	if req.NIM != nil {
		var conflict models.Mahasiswa
		if err := db.Where("nim = ? AND id != ?", *req.NIM, id).First(&conflict).Error; err == nil {
			return nil, errors.New("NIM sudah digunakan mahasiswa lain")
		}
		mhs.NIM = *req.NIM
	}
	if req.Email != nil {
		email := strings.ToLower(*req.Email)
		var conflict models.Mahasiswa
		if err := db.Where("email = ? AND id != ?", email, id).First(&conflict).Error; err == nil {
			return nil, errors.New("Email sudah digunakan mahasiswa lain")
		}
		mhs.Email = email
	}
	if req.Semester != nil {
		mhs.Semester = *req.Semester
	}
	if req.Nama != nil {
		mhs.Nama = *req.Nama
	}
	if req.Jurusan != nil {
		mhs.Jurusan = *req.Jurusan
	}
	if req.DosenPAID != nil {
		mhs.DosenPAID = req.DosenPAID
	}

	if err := db.Save(&mhs).Error; err != nil {
		return nil, err
	}
	return &mhs, nil
}

func DeleteMahasiswa(db *gorm.DB, id uuid.UUID) error {
	result := db.Where("id = ?", id).Delete(&models.Mahasiswa{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("not found")
	}
	return nil
}

func AssignDosenPA(db *gorm.DB, mahasiswaID, dosenID uuid.UUID) (*models.Mahasiswa, *models.Dosen, error) {
	var mhs models.Mahasiswa
	if err := db.Where("id = ?", mahasiswaID).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("mahasiswa not found")
		}
		return nil, nil, err
	}

	var dosen models.Dosen
	if err := db.Where("id = ?", dosenID).First(&dosen).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("dosen not found")
		}
		return nil, nil, err
	}

	mhs.DosenPAID = &dosenID
	if err := db.Save(&mhs).Error; err != nil {
		return nil, nil, err
	}
	mhs.DosenPA = &dosen
	return &mhs, &dosen, nil
}

// ─── Dosen CRUD ──────────────────────────────────────────────────────────────

type ListDosenResult struct {
	Dosen []models.DosenResponse `json:"dosen"`
	PaginationMeta
}

func ListDosen(db *gorm.DB, page, perPage int, search string) (*ListDosenResult, error) {
	query := db.Model(&models.Dosen{}).Order("created_at DESC")
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(nama) LIKE ? OR LOWER(nidn) LIKE ?", like, like)
	}

	var items []models.Dosen
	meta, err := paginate(query, page, perPage, &items)
	if err != nil {
		return nil, err
	}

	responses := make([]models.DosenResponse, len(items))
	for i := range items {
		responses[i] = items[i].ToResponse()
	}
	return &ListDosenResult{Dosen: responses, PaginationMeta: meta}, nil
}

type CreateDosenReq struct {
	Nama     string  `json:"nama"`
	NIDN     string  `json:"nidn"`
	Email    string  `json:"email"`
	Password string  `json:"password"`
	NoTelp   *string `json:"no_telp"`
}

func CreateDosen(db *gorm.DB, req *CreateDosenReq) (*models.Dosen, error) {
	var existing models.Dosen
	if err := db.Where("nidn = ?", req.NIDN).First(&existing).Error; err == nil {
		return nil, errors.New("NIDN sudah terdaftar")
	}
	if err := db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return nil, errors.New("Email sudah terdaftar")
	}

	hash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	dosen := &models.Dosen{
		Nama:         req.Nama,
		NIDN:         req.NIDN,
		Email:        strings.ToLower(req.Email),
		PasswordHash: hash,
		NoTelp:       req.NoTelp,
	}
	if err := db.Create(dosen).Error; err != nil {
		return nil, err
	}
	return dosen, nil
}

type UpdateDosenReq struct {
	Nama   *string `json:"nama"`
	NIDN   *string `json:"nidn"`
	Email  *string `json:"email"`
	NoTelp *string `json:"no_telp"`
}

func UpdateDosen(db *gorm.DB, id uuid.UUID, req *UpdateDosenReq) (*models.Dosen, error) {
	var dosen models.Dosen
	if err := db.Where("id = ?", id).First(&dosen).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	if req.NIDN != nil {
		var conflict models.Dosen
		if err := db.Where("nidn = ? AND id != ?", *req.NIDN, id).First(&conflict).Error; err == nil {
			return nil, errors.New("NIDN sudah digunakan dosen lain")
		}
		dosen.NIDN = *req.NIDN
	}
	if req.Email != nil {
		email := strings.ToLower(*req.Email)
		var conflict models.Dosen
		if err := db.Where("email = ? AND id != ?", email, id).First(&conflict).Error; err == nil {
			return nil, errors.New("Email sudah digunakan dosen lain")
		}
		dosen.Email = email
	}
	if req.Nama != nil {
		dosen.Nama = *req.Nama
	}
	if req.NoTelp != nil {
		dosen.NoTelp = req.NoTelp
	}

	if err := db.Save(&dosen).Error; err != nil {
		return nil, err
	}
	return &dosen, nil
}

func DeleteDosen(db *gorm.DB, id uuid.UUID) error {
	result := db.Where("id = ?", id).Delete(&models.Dosen{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("not found")
	}
	return nil
}
