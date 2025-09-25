package dto

type MissingTranslationsReportRequest struct {
	Namespace string   `json:"namespace" binding:"required"`
	Languages []string `json:"languages" binding:"required"`
	Key       string   `json:"key" binding:"required"`
}

type MissingTranslationsReportBatchRequest struct {
	Items []MissingTranslationsReportRequest `json:"items" binding:"required,dive,required"`
}

type CreateTranslationRequest struct {
	Namespace string `json:"namespace" binding:"required"`
	Locale    string `json:"locale" binding:"required"`
	Key       string `json:"key" binding:"required"`
	Value     string `json:"value" binding:"required"`
}

type UpdateTranslationRequest struct {
	Value *string `json:"value"`
}

type TranslationResponse struct {
	ID        uint   `json:"id"`
	Namespace string `json:"namespace"`
	Locale    string `json:"locale"`
	Key       string `json:"key"`
	Value     string `json:"value"`
}
