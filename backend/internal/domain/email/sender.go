package email

type EmailSender interface {
	SendVerificationEmail(to, code, lang string) error
	SendResetPasswordEmail(to, link, lang string) error
	SendNotificationEmail(to, subject, body, lang string) error
}
