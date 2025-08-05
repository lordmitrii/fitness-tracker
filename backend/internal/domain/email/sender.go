package email

type EmailSender interface {
	SendVerificationEmail(to, code string) error
	SendResetPasswordEmail(to, link string) error
	SendNotificationEmail(to, subject, body string) error
}
