package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
)

type SendGridSender struct {
	From   string
	APIKey string
}

func NewSendGridSender(from, apiKey string) email.EmailSender {
	return &SendGridSender{From: from, APIKey: apiKey}
}

func (s *SendGridSender) send(to string, msg Message) error {
	payload := map[string]any{
		"personalizations": []map[string]any{
			{"to": []map[string]string{{"email": to}}},
		},
		"from":    map[string]string{"email": s.From},
		"subject": msg.Subject,
		"content": []map[string]string{
			{"type": "text/plain", "value": msg.Text},
			{"type": "text/html", "value": msg.HTML},
		},
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequestWithContext(context.Background(),
		"POST", "https://api.sendgrid.com/v3/mail/send", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+s.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("sendgrid request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("sendgrid send failed: %s", resp.Status)
	}
	return nil
}

func (s *SendGridSender) SendNotificationEmail(to, subject, body, lang string) error {
	return s.send(to, BuildNotification(subject, body, lang))
}

func (s *SendGridSender) SendVerificationEmail(to, code, lang string) error {
	return s.send(to, BuildVerification(code, lang))
}

func (s *SendGridSender) SendResetPasswordEmail(to, link, lang string) error {
	return s.send(to, BuildReset(link, lang))
}
