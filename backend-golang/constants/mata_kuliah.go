package constants

type MataKuliahMaster struct {
	Kode string `json:"kode"`
	Nama string `json:"nama"`
	SKS  int    `json:"sks"`
}

var MataKuliahList = []MataKuliahMaster{
	{Kode: "MK001", Nama: "Algoritma & Pemrograman", SKS: 3},
	{Kode: "MK002", Nama: "Basis Data", SKS: 3},
	{Kode: "MK003", Nama: "Pemrograman Web", SKS: 3},
	{Kode: "MK004", Nama: "Jaringan Komputer", SKS: 3},
	{Kode: "MK005", Nama: "Sistem Operasi", SKS: 3},
	{Kode: "MK006", Nama: "Rekayasa Perangkat Lunak", SKS: 3},
	{Kode: "MK007", Nama: "Kecerdasan Buatan", SKS: 3},
	{Kode: "MK008", Nama: "Keamanan Sistem", SKS: 2},
	{Kode: "MK009", Nama: "Statistika & Probabilitas", SKS: 2},
	{Kode: "MK010", Nama: "Matematika Diskrit", SKS: 2},
	{Kode: "MK011", Nama: "Etika Profesi", SKS: 2},
	{Kode: "MK012", Nama: "Skripsi / Tugas Akhir", SKS: 6},
}

// ValidMKKode dan MKByKode diinisialisasi lewat init() untuk lookup O(1).
var ValidMKKode map[string]bool
var MKByKode map[string]MataKuliahMaster

const MaxSKS = 24

func init() {
	ValidMKKode = make(map[string]bool, len(MataKuliahList))
	MKByKode = make(map[string]MataKuliahMaster, len(MataKuliahList))
	for _, mk := range MataKuliahList {
		ValidMKKode[mk.Kode] = true
		MKByKode[mk.Kode] = mk
	}
}
