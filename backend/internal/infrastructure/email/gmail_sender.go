package email

import (
	"github.com/lordmitrii/golang-web-gin/internal/domain/email"
	gomail "gopkg.in/gomail.v2"
)

type GmailSender struct {
	From    string
	AppPass string
}

func NewGmailSender(from, appPass string) email.EmailSender {
	return &GmailSender{From: from, AppPass: appPass}
}

func (g *GmailSender) SendNotificationEmail(to, subject, body, lang string) error {
	msg := BuildNotification(subject, body, lang)
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", msg.Subject)
	m.SetBody("text/plain", msg.Text)
	m.AddAlternative("text/html", msg.HTML)

	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}

func (g *GmailSender) SendVerificationEmail(to, code, lang string) error {
	msg := BuildVerification(code, lang)
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", msg.Subject)
	m.SetBody("text/plain", msg.Text)
	m.AddAlternative("text/html", msg.HTML)

	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}

func (g *GmailSender) SendResetPasswordEmail(to, link, lang string) error {
	msg := BuildReset(link, lang)
	m := gomail.NewMessage()
	m.SetHeader("From", g.From)
	m.SetHeader("To", to)
	m.SetHeader("Subject", msg.Subject)
	m.SetBody("text/plain", msg.Text)
	m.AddAlternative("text/html", msg.HTML)

	d := gomail.NewDialer("smtp.gmail.com", 587, g.From, g.AppPass)
	return d.DialAndSend(m)
}
