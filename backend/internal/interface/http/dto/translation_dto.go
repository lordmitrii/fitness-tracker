package dto

// swagger:model
type MissingTranslationsReportRequest struct {
	Namespace string   `json:"namespace" binding:"required" example:"common"`
	Languages []string `json:"languages" binding:"required" example:"[\"en\",\"de\",\"fr\"]"`
	Key       string   `json:"key" binding:"required" example:"welcome_message"`
}

// swagger:model
type MissingTranslationsReportBatchRequest struct {
	Items []MissingTranslationsReportRequest `json:"items" binding:"required,dive,required" example:"[{\"namespace\":\"common\",\"languages\":[\"en\",\"de\"],\"key\":\"welcome_message\"}]"`
}

// swagger:model
type CreateTranslationRequest struct {
	Namespace string `json:"namespace" binding:"required" example:"common"`
	Locale    string `json:"locale" binding:"required" example:"en"`
	Key       string `json:"key" binding:"required" example:"welcome_message"`
	Value     string `json:"value" binding:"required" example:"Welcome!"`
}

// swagger:model
type UpdateTranslationRequest struct {
	Value *string `json:"value" example:"Willkommen!"`
}

// swagger:model
type TranslationResponse struct {
	ID        uint   `json:"id" example:"101"`
	Namespace string `json:"namespace" example:"common"`
	Locale    string `json:"locale" example:"en"`
	Key       string `json:"key" example:"welcome_message"`
	Value     string `json:"value" example:"Welcome!"`
}

// swagger:model
type I18nMetaResponse struct {
	// example: {"en":{"translation":"1.0.0"},"ru":{"translation":"1.0.0"}}
	Versions map[string]map[string]string `json:"versions"`
}
