package utils

import "strconv"

func HandleCalculation(v1, v2, s string) float64 {
	var result float64
	floatV1, err1 := strconv.ParseFloat(v1, 64)
	floatV2, err2 := strconv.ParseFloat(v2, 64)
	if err1 != nil || err2 != nil {
		return 0
	}
	switch s {
	case "+":
		result = floatV1 + floatV2
	case "-":
		result = floatV1 - floatV2
	case "*":
		result = floatV1 * floatV2
	case "/":
		if floatV2 != 0 {
			result = floatV1 / floatV2
		} else {
			result = 0 
		}
	}
	return result
}