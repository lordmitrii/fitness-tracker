package translations

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/translations"
)

type DeeplTranslator struct {
	AuthKey string
	URL     string
}

func NewDeepLTranslator(authKey string, url string) translations.Translator {
	return &DeeplTranslator{
		AuthKey: authKey,
		URL:     url,
	}
}

type deeplResponse struct {
	Translations []struct {
		Text string `json:"text"`
	} `json:"translations"`
}

func (t *DeeplTranslator) Translate(ctx context.Context, key, lang string) (string, error) {
	if t.AuthKey == "" {
		return "", errors.New("missing API key for Deepl translator")
	}

	form := url.Values{}
	form.Set("text", key)
	form.Set("target_lang", strings.ToUpper(lang))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, t.URL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "DeepL-Auth-Key "+t.AuthKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("deepl translate failed: %s", resp.Status)
	}

	var deeplResp deeplResponse
	if err := json.NewDecoder(resp.Body).Decode(&deeplResp); err != nil {
		return "", fmt.Errorf("failed to decode deepl response: %w", err)
	}

	if len(deeplResp.Translations) == 0 {
		return "", errors.New("no translations found in deepl response")
	}

	return deeplResp.Translations[0].Text, nil

}
