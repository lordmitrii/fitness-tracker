package email

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"

	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
)

type SESSender struct {
	From   string
	client *sesv2.Client
}

func NewSESSender(accessKey, secretKey, region, from string) email.EmailSender {
	cfg, err := config.LoadDefaultConfig(
		context.Background(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		panic(fmt.Errorf("failed to load AWS config: %w", err))
	}
	return &SESSender{From: from, client: sesv2.NewFromConfig(cfg)}
}

func (s *SESSender) send(to string, msg Message) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := s.client.SendEmail(ctx, &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(s.From),
		Destination: &types.Destination{ToAddresses: []string{to}},
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{Data: aws.String(msg.Subject)},
				Body: &types.Body{
					Text: &types.Content{Data: aws.String(msg.Text)},
					Html: &types.Content{Data: aws.String(msg.HTML)},
				},
			},
		},
	})
	if err != nil {
		return fmt.Errorf("ses send failed: %w", err)
	}
	return nil
}

func (s *SESSender) SendNotificationEmail(to, subject, body, lang string) error {
	return s.send(to, BuildNotification(subject, body, lang))
}

func (s *SESSender) SendVerificationEmail(to, code, lang string) error {
	return s.send(to, BuildVerification(code, lang))
}

func (s *SESSender) SendResetPasswordEmail(to, link, lang string) error {
	return s.send(to, BuildReset(link, lang))
}
