package dto

import (
	"reflect"
	"strings"
)

func BuildUpdatesFromPatchDTO(payload any) map[string]any {
	updates := map[string]any{}
	if payload == nil {
		return updates
	}

	v := reflect.ValueOf(payload)
	if v.Kind() == reflect.Pointer {
		if v.IsNil() {
			return updates
		}
		v = v.Elem()
	}
	if !v.IsValid() || v.Kind() != reflect.Struct {
		return updates
	}

	t := v.Type()
	for i := 0; i < t.NumField(); i++ {
		sf := t.Field(i)
		if sf.PkgPath != "" { // unexported
			continue
		}

		key := sf.Tag.Get("db")
		if key == "" {
			key = strings.Split(sf.Tag.Get("json"), ",")[0]
		}
		if key == "" || key == "-" {
			continue
		}

		fv := v.Field(i)

		if sf.Type.Kind() == reflect.Pointer {
			if fv.IsNil() {
				continue
			}
			updates[key] = fv.Elem().Interface()
			continue
		}
	}
	return updates
}
