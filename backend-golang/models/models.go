package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ─── Custom JSONB type ────────────────────────────────────────────────────────

type MataKuliahItem struct {
	Kode  string  `json:"kode"`
	Nama  string  `json:"nama"`
	SKS   int     `json:"sks"`
	Nilai *string `json:"nilai"`
}

type MataKuliahSlice []MataKuliahItem

func (m MataKuliahSlice) Value() (driver.Value, error) {
	if m == nil {
		return "[]", nil
	}
	b, err := json.Marshal(m)
	return string(b), err
}

func (m *MataKuliahSlice) Scan(src interface{}) error {
	if src == nil {
		*m = MataKuliahSlice{}
		return nil
	}
	var data []byte
	switch v := src.(type) {
	case []byte:
		data = v
	case string:
		data = []byte(v)
	default:
		return fmt.Errorf("MataKuliahSlice.Scan: unsupported type %T", src)
	}
	if len(data) == 0 {
		*m = MataKuliahSlice{}
		return nil
	}
	return json.Unmarshal(data, m)
}

// ─── Admin ───────────────────────────────────────────────────────────────────

type Admin struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string    `gorm:"column:password_hash;size:255;not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}

func (Admin) TableName() string { return "admin" }

func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// ─── Dosen ───────────────────────────────────────────────────────────────────

type Dosen struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Nama         string    `gorm:"size:255;not null"`
	NIDN         string    `gorm:"column:nidn;size:20;uniqueIndex;not null"`
	Email        string    `gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string    `gorm:"column:password_hash;size:255;not null"`
	NoTelp       *string   `gorm:"column:no_telp;size:20"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`

	MahasiswaBimbingan []Mahasiswa `gorm:"foreignKey:DosenPAID" json:"-"`
}

func (Dosen) TableName() string { return "dosen" }

func (d *Dosen) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}

// ─── Mahasiswa ────────────────────────────────────────────────────────────────

type Mahasiswa struct {
	ID           uuid.UUID       `gorm:"type:uuid;primaryKey"`
	Nama         string          `gorm:"size:255;not null"`
	NIM          string          `gorm:"column:nim;size:20;uniqueIndex;not null"`
	Email        string          `gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string          `gorm:"column:password_hash;size:255;not null"`
	Semester     int             `gorm:"not null"`
	Jurusan      string          `gorm:"size:100;not null"`
	DosenPAID    *uuid.UUID      `gorm:"column:dosen_pa_id;type:uuid"`
	MataKuliah   MataKuliahSlice `gorm:"type:jsonb;default:'[]'"`
	CreatedAt    time.Time       `gorm:"autoCreateTime"`
	UpdatedAt    time.Time       `gorm:"autoUpdateTime"`

	DosenPA *Dosen `gorm:"foreignKey:DosenPAID;constraint:OnDelete:SET NULL" json:"-"`
}

func (Mahasiswa) TableName() string { return "mahasiswa" }

func (m *Mahasiswa) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// ─── Response structs (JSON output — identik dengan Flask to_dict()) ──────────

func fmtTime(t time.Time) *string {
	if t.IsZero() {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

type AdminResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	CreatedAt *string `json:"created_at"`
}

func (a *Admin) ToResponse() AdminResponse {
	return AdminResponse{
		ID:        a.ID.String(),
		Email:     a.Email,
		CreatedAt: fmtTime(a.CreatedAt),
	}
}

type DosenResponse struct {
	ID        string  `json:"id"`
	Nama      string  `json:"nama"`
	NIDN      string  `json:"nidn"`
	Email     string  `json:"email"`
	NoTelp    *string `json:"no_telp"`
	CreatedAt *string `json:"created_at"`
	UpdatedAt *string `json:"updated_at"`
}

func (d *Dosen) ToResponse() DosenResponse {
	return DosenResponse{
		ID:        d.ID.String(),
		Nama:      d.Nama,
		NIDN:      d.NIDN,
		Email:     d.Email,
		NoTelp:    d.NoTelp,
		CreatedAt: fmtTime(d.CreatedAt),
		UpdatedAt: fmtTime(d.UpdatedAt),
	}
}

type DosenPAInfo struct {
	Nama   string  `json:"nama"`
	NIDN   string  `json:"nidn"`
	Email  string  `json:"email"`
	NoTelp *string `json:"no_telp"`
}

type MahasiswaResponse struct {
	ID         string          `json:"id"`
	Nama       string          `json:"nama"`
	NIM        string          `json:"nim"`
	Email      string          `json:"email"`
	Semester   int             `json:"semester"`
	Jurusan    string          `json:"jurusan"`
	DosenPAID  *string         `json:"dosen_pa_id"`
	MataKuliah MataKuliahSlice `json:"mata_kuliah"`
	CreatedAt  *string         `json:"created_at"`
	UpdatedAt  *string         `json:"updated_at"`
	DosenPA    *DosenPAInfo    `json:"dosen_pa,omitempty"`
}

func (m *Mahasiswa) ToResponse(includeDosenPA bool) MahasiswaResponse {
	mk := m.MataKuliah
	if mk == nil {
		mk = MataKuliahSlice{}
	}

	resp := MahasiswaResponse{
		ID:         m.ID.String(),
		Nama:       m.Nama,
		NIM:        m.NIM,
		Email:      m.Email,
		Semester:   m.Semester,
		Jurusan:    m.Jurusan,
		MataKuliah: mk,
		CreatedAt:  fmtTime(m.CreatedAt),
		UpdatedAt:  fmtTime(m.UpdatedAt),
	}
	if m.DosenPAID != nil {
		s := m.DosenPAID.String()
		resp.DosenPAID = &s
	}
	if includeDosenPA && m.DosenPA != nil {
		resp.DosenPA = &DosenPAInfo{
			Nama:   m.DosenPA.Nama,
			NIDN:   m.DosenPA.NIDN,
			Email:  m.DosenPA.Email,
			NoTelp: m.DosenPA.NoTelp,
		}
	}
	return resp
}
