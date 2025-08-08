package redis

import (
	"context"
	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
	"time"
)

type RedisLimiter struct {
	limiter *redis_rate.Limiter
}

func NewRedisLimiter(addr, password string, db int) *RedisLimiter {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisLimiter{
		limiter: redis_rate.NewLimiter(client),
	}
}

func (r *RedisLimiter) Allow(ctx context.Context, key string, limit int, per time.Duration) (bool, time.Duration, error) {
	res, err := r.limiter.Allow(ctx, key, redis_rate.Limit{
		Rate:   limit,
		Period: per,
		Burst:  limit,
	})
	if err != nil {
		return false, 0, err
	}
	return res.Allowed > 0, res.RetryAfter, nil
}
