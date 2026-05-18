package services

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"krs/backend/models"
)

type MahasiswaBimbinganItem struct {
	models.MahasiswaResponse
	RingkasanKRS map[string]int `json:"ringkasan_krs"`
}

func GetMahasiswaBimbingan(db *gorm.DB, dosenID uuid.UUID) ([]MahasiswaBimbinganItem, error) {
	var list []models.Mahasiswa
	if err := db.Where("dosen_pa_id = ?", dosenID).Find(&list).Error; err != nil {
		return nil, err
	}

	result := make([]MahasiswaBimbinganItem, 0, len(list))
	for _, mhs := range list {
		mk := mhs.MataKuliah
		if mk == nil {
			mk = models.MataKuliahSlice{}
		}
		totalSKS := 0
		for _, item := range mk {
			totalSKS += item.SKS
		}
		result = append(result, MahasiswaBimbinganItem{
			MahasiswaResponse: mhs.ToResponse(false),
			RingkasanKRS: map[string]int{
				"jumlah_mk": len(mk),
				"total_sks": totalSKS,
			},
		})
	}
	return result, nil
}

type DetailMahasiswaData struct {
	models.MahasiswaResponse
	KRS map[string]interface{} `json:"krs"`
}

func GetDetailMahasiswaBimbingan(db *gorm.DB, dosenID, mahasiswaID uuid.UUID) (*DetailMahasiswaData, error) {
	var mhs models.Mahasiswa
	if err := db.Where("id = ?", mahasiswaID).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	if mhs.DosenPAID == nil || *mhs.DosenPAID != dosenID {
		return nil, errors.New("forbidden")
	}

	mk := mhs.MataKuliah
	if mk == nil {
		mk = models.MataKuliahSlice{}
	}
	totalSKS := 0
	for _, item := range mk {
		totalSKS += item.SKS
	}

	return &DetailMahasiswaData{
		MahasiswaResponse: mhs.ToResponse(false),
		KRS: map[string]interface{}{
			"mata_kuliah": mk,
			"total_sks":   totalSKS,
			"jumlah_mk":   len(mk),
		},
	}, nil
}
