package email

import (
	"gopkg.in/gomail.v2"
	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
)

type GmailSender struct {
	From    string
	AppPass string
}

func NewGmailSender(from, appPass string) email.EmailSender {
	return &GmailSender{
		From:    from,
		AppPass: appPass,
	}
}

func (g *GmailSender) SendNotificationEmail(to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)
	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}

func (g *GmailSender) SendVerificationEmail(to, code string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Your Verification Code")
	m.SetBody("text/plain", "Your code is: "+code)

	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}

func (g *GmailSender) SendResetPasswordEmail(to, link string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Password Reset Request")
	m.SetBody("text/plain", "Your password reset link: "+link)


	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}
