package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port        string
	DatabaseURL string
	DefaultUser int64
}

func Load() (Config, error) {
	defaultUserID, err := int64ValueOrDefault("DEFAULT_USER_ID", 1)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		Port:        valueOrDefault("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		DefaultUser: defaultUserID,
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func (c Config) ServerAddress() string {
	return ":" + c.Port
}

func valueOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func int64ValueOrDefault(key string, fallback int64) (int64, error) {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback, nil
	}

	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}

	return value, nil
}
