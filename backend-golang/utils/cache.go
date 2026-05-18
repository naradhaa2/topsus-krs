package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"krs/backend/config"
)

type CacheClient struct {
	baseURL string
	token   string
	http    *http.Client
}

func NewCacheClient(cfg *config.Config) *CacheClient {
	return &CacheClient{
		baseURL: cfg.UpstashRedisRESTURL,
		token:   cfg.UpstashRedisRESTToken,
		http:    &http.Client{Timeout: 3 * time.Second},
	}
}

func (c *CacheClient) enabled() bool {
	return c.baseURL != "" && c.token != ""
}

// do menjalankan satu Redis command via Upstash REST API.
func (c *CacheClient) do(args ...interface{}) (interface{}, error) {
	if !c.enabled() {
		return nil, nil
	}

	body, err := json.Marshal(args)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Result interface{} `json:"result"`
		Error  string      `json:"error"`
	}
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, err
	}
	if result.Error != "" {
		return nil, fmt.Errorf("redis error: %s", result.Error)
	}
	return result.Result, nil
}

// GetCache mengambil nilai dari cache. Return nil jika miss atau Redis down.
func (c *CacheClient) GetCache(key string) interface{} {
	result, err := c.do("GET", key)
	if err != nil {
		slog.Warn("cache get failed", "key", key, "error", err)
		return nil
	}
	if result == nil {
		return nil
	}
	strVal, ok := result.(string)
	if !ok {
		return nil
	}
	var data interface{}
	if err := json.Unmarshal([]byte(strVal), &data); err != nil {
		return nil
	}
	return data
}

// SetCache menyimpan value sebagai JSON string dengan TTL detik.
func (c *CacheClient) SetCache(key string, value interface{}, ttl int) {
	b, err := json.Marshal(value)
	if err != nil {
		return
	}
	if _, err := c.do("SET", key, string(b), "EX", strconv.Itoa(ttl)); err != nil {
		slog.Warn("cache set failed", "key", key, "error", err)
	}
}

// DeleteCache menghapus satu key.
func (c *CacheClient) DeleteCache(key string) {
	if _, err := c.do("DEL", key); err != nil {
		slog.Warn("cache delete failed", "key", key, "error", err)
	}
}

// DeletePattern menghapus semua key yang cocok dengan prefix*.
func (c *CacheClient) DeletePattern(prefix string) {
	result, err := c.do("KEYS", prefix+"*")
	if err != nil || result == nil {
		return
	}
	keysRaw, ok := result.([]interface{})
	if !ok || len(keysRaw) == 0 {
		return
	}
	args := make([]interface{}, 1+len(keysRaw))
	args[0] = "DEL"
	copy(args[1:], keysRaw)
	if _, err := c.do(args...); err != nil {
		slog.Warn("cache delete pattern failed", "prefix", prefix, "error", err)
	}
}
