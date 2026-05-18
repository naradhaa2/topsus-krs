package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL           string
	JWTSecretKey          string
	JWTAccessTokenExpires time.Duration
	UpstashRedisRESTURL   string
	UpstashRedisRESTToken string
	CORSOrigins           []string
	Port                  string
}

func Load() *Config {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if strings.HasPrefix(dbURL, "postgres://") {
		dbURL = strings.Replace(dbURL, "postgres://", "postgresql://", 1)
	}

	jwtSecret := os.Getenv("JWT_SECRET_KEY")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET_KEY is required")
	}

	expSeconds, _ := strconv.Atoi(os.Getenv("JWT_ACCESS_TOKEN_EXPIRES"))
	if expSeconds == 0 {
		expSeconds = 3600
	}

	corsOrigins := []string{"http://localhost:5173"}
	if raw := os.Getenv("CORS_ORIGINS"); raw != "" {
		corsOrigins = nil
		for _, o := range strings.Split(raw, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				corsOrigins = append(corsOrigins, trimmed)
			}
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		DatabaseURL:           dbURL,
		JWTSecretKey:          jwtSecret,
		JWTAccessTokenExpires: time.Duration(expSeconds) * time.Second,
		UpstashRedisRESTURL:   os.Getenv("UPSTASH_REDIS_REST_URL"),
		UpstashRedisRESTToken: os.Getenv("UPSTASH_REDIS_REST_TOKEN"),
		CORSOrigins:           corsOrigins,
		Port:                  port,
	}
}
