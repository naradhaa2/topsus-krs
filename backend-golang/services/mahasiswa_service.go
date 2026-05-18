package services

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"krs/backend/constants"
	"krs/backend/models"
)

type KRSData struct {
	MataKuliah models.MataKuliahSlice `json:"mata_kuliah"`
	TotalSKS   int                    `json:"total_sks"`
	JumlahMK   int                    `json:"jumlah_mk"`
}

func GetKRS(db *gorm.DB, mahasiswaID uuid.UUID) (*KRSData, error) {
	var mhs models.Mahasiswa
	if err := db.Select("id, mata_kuliah").Where("id = ?", mahasiswaID).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	mk := mhs.MataKuliah
	if mk == nil {
		mk = models.MataKuliahSlice{}
	}
	totalSKS := 0
	for _, item := range mk {
		totalSKS += item.SKS
	}
	return &KRSData{MataKuliah: mk, TotalSKS: totalSKS, JumlahMK: len(mk)}, nil
}

type UpdateKRSReq struct {
	MataKuliah []struct {
		Kode string `json:"kode"`
	} `json:"mata_kuliah"`
}

func UpdateKRS(db *gorm.DB, mahasiswaID uuid.UUID, newMK []string) (*KRSData, *uuid.UUID, error) {
	// Validasi kode
	for _, kode := range newMK {
		if !constants.ValidMKKode[kode] {
			return nil, nil, fmt.Errorf("Kode mata kuliah '%s' tidak valid", kode)
		}
	}

	// Validasi duplikat
	seen := make(map[string]bool, len(newMK))
	for _, kode := range newMK {
		if seen[kode] {
			return nil, nil, errors.New("Terdapat mata kuliah duplikat")
		}
		seen[kode] = true
	}

	// Hitung total SKS
	totalSKS := 0
	for _, kode := range newMK {
		totalSKS += constants.MKByKode[kode].SKS
	}
	if totalSKS > constants.MaxSKS {
		return nil, nil, fmt.Errorf("Total SKS (%d) melebihi batas maksimal %d SKS", totalSKS, constants.MaxSKS)
	}

	var mhs models.Mahasiswa
	if err := db.Where("id = ?", mahasiswaID).First(&mhs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("not found")
		}
		return nil, nil, err
	}

	// Merge: preserve nilai yang sudah ada
	existingMap := make(map[string]models.MataKuliahItem, len(mhs.MataKuliah))
	for _, mk := range mhs.MataKuliah {
		existingMap[mk.Kode] = mk
	}

	merged := make(models.MataKuliahSlice, 0, len(newMK))
	for _, kode := range newMK {
		master := constants.MKByKode[kode]
		var nilai *string
		if existing, ok := existingMap[kode]; ok {
			nilai = existing.Nilai
		}
		merged = append(merged, models.MataKuliahItem{
			Kode:  master.Kode,
			Nama:  master.Nama,
			SKS:   master.SKS,
			Nilai: nilai,
		})
	}

	// Update dengan raw SQL untuk JSONB agar pasti terdeteksi perubahan
	if err := db.Model(&mhs).Update("mata_kuliah", merged).Error; err != nil {
		return nil, nil, err
	}

	return &KRSData{
		MataKuliah: merged,
		TotalSKS:   totalSKS,
		JumlahMK:   len(merged),
	}, mhs.DosenPAID, nil
}
