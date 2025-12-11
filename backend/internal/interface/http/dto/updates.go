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

		jsonKey := strings.Split(sf.Tag.Get("json"), ",")[0]
		if jsonKey == "" || jsonKey == "-" {
			continue
		}

		fv := v.Field(i)

		// Case 1: *T pointer fields
		if sf.Type.Kind() == reflect.Pointer {
			if fv.IsNil() {
				continue // key absent => skip
			}
			updates[jsonKey] = fv.Elem().Interface()
			continue
		}

		// Case 2: Optional[T]
		if fv.Kind() == reflect.Struct {
			setF := fv.FieldByName("Set")
			nullF := fv.FieldByName("Null")
			valF := fv.FieldByName("Val")
			if setF.IsValid() && nullF.IsValid() && valF.IsValid() &&
				setF.Kind() == reflect.Bool && nullF.Kind() == reflect.Bool {
				if !setF.Bool() {
					continue // absent => skip
				}
				if nullF.Bool() {
					updates[jsonKey] = nil // explicit null
				} else {
					updates[jsonKey] = valF.Interface()
				}
				continue
			}
		}
	}
	return updates
}
