package dto

import (
	"bytes"
	"encoding/json"
)

type Optional[T any] struct {
	Set  bool // key present in JSON
	Null bool // explicit null
	Val  T    // valid when Set && !Null
}

func (o *Optional[T]) UnmarshalJSON(data []byte) error {
	o.Set = true
	if bytes.Equal(bytes.TrimSpace(data), []byte("null")) {
		o.Null = true
		return nil
	}
	var v T
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	o.Val = v
	o.Null = false
	return nil
}
