package email

import (
	"html"
	"strconv"
	"strings"
	"time"
)

type Message struct {
	Subject string
	Text    string
	HTML    string
}

type BrandConfig struct {
	AppName      string
	LogoURL      string
	PrimaryHex   string
	AccentHex    string
	BgHex        string
	TextHex      string
	MutedHex     string
	LinkHex      string
	SupportEmail string
	WebsiteURL   string
	FooterNote   string
}

var brand = BrandConfig{
	AppName:      "FTracker",
	LogoURL:      "",
	PrimaryHex:   "#0F172A",
	AccentHex:    "#2f89f0ff",
	BgHex:        "#F8FAFC",
	TextHex:      "#0F172A",
	MutedHex:     "#64748B",
	LinkHex:      "#2563EB",
	SupportEmail: "help.ftrackerapp@mail.com",
	WebsiteURL:   "https://ftrackerapp.co.uk",
	FooterNote:   "This is an automated message; please do not reply.",
}

func SetBrand(b BrandConfig) {
	if b.AppName == "" {
		b.AppName = brand.AppName
	}
	if b.PrimaryHex == "" {
		b.PrimaryHex = brand.PrimaryHex
	}
	if b.AccentHex == "" {
		b.AccentHex = brand.AccentHex
	}
	if b.BgHex == "" {
		b.BgHex = brand.BgHex
	}
	if b.TextHex == "" {
		b.TextHex = brand.TextHex
	}
	if b.MutedHex == "" {
		b.MutedHex = brand.MutedHex
	}
	if b.LinkHex == "" {
		b.LinkHex = brand.LinkHex
	}
	if b.SupportEmail == "" {
		b.SupportEmail = brand.SupportEmail
	}
	if b.WebsiteURL == "" {
		b.WebsiteURL = brand.WebsiteURL
	}
	if b.FooterNote == "" {
		b.FooterNote = brand.FooterNote
	}
	brand = b
}

func normalizeLang(lang string) string {
	lang = strings.ToLower(strings.TrimSpace(lang))
	switch {
	case strings.HasPrefix(lang, "en"):
		return "en"
	case strings.HasPrefix(lang, "ru"):
		return "ru"
	case strings.HasPrefix(lang, "zh"), strings.HasPrefix(lang, "zh-cn"), strings.HasPrefix(lang, "zh-hans"):
		return "zh"
	}
	return "en"
}

var t = map[string]map[string]string{
	"en": {
		"reset.subject":   "Password Reset Request",
		"reset.intro":     "We received a request to reset your password.",
		"reset.button":    "Reset Password",
		"reset.note":      "If the button doesn’t work, paste this URL into your browser:",
		"reset.expiry":    "This link will expire in 15 minutes.",
		"verify.subject":  "Your Verification Code",
		"verify.intro":    "Your code is:",
		"notif.subject":   "Notification",
		"footer.needHelp": "Need help?",
		"footer.note":     "This is an automated message; please do not reply.",
	},
	"ru": {
		"reset.subject":   "Запрос на сброс пароля",
		"reset.intro":     "Мы получили запрос на сброс вашего пароля.",
		"reset.button":    "Сбросить пароль",
		"reset.note":      "Если кнопка не работает, вставьте эту ссылку в адресную строку браузера:",
		"reset.expiry":    "Ссылка действительна 15 минут.",
		"verify.subject":  "Код подтверждения",
		"verify.intro":    "Ваш код:",
		"notif.subject":   "Уведомление",
		"footer.needHelp": "Нужна помощь?",
		"footer.note":     "Это автоматическое сообщение; пожалуйста, не отвечайте.",
	},
	"zh": {
		"reset.subject":   "密码重置请求",
		"reset.intro":     "我们收到了您的密码重置请求。",
		"reset.button":    "重置密码",
		"reset.note":      "如果按钮无效，请将以下链接复制到浏览器地址栏：",
		"reset.expiry":    "该链接将在 15 分钟后失效。",
		"verify.subject":  "您的验证码",
		"verify.intro":    "您的验证码：",
		"notif.subject":   "通知",
		"footer.needHelp": "需要帮助？",
		"footer.note":     "这是一封自动发送的邮件，请不要回复。",
	},
}

func tr(lang, key string) (string, bool) {
	lang = normalizeLang(lang)
	if m, ok := t[lang]; ok {
		if v, ok := m[key]; ok {
			return v, true
		}
	}
	if v, ok := t["en"][key]; ok {
		return v, true
	}
	return "", false
}

func pickFooterNote(lang string) string {
	if v, ok := tr(lang, "footer.note"); ok && v != "" {
		return v
	}
	return brand.FooterNote
}

// func renderLocalized(baseName, lang string, data any) (string, bool) {
// 	lang = normalizeLang(lang)
// 	if s, ok := renderTemplate(baseName+"."+lang, data); ok {
// 		return s, true
// 	}
// 	if s, ok := renderTemplate(baseName+".en", data); ok {
// 		return s, true
// 	}
// 	return "", false
// }

func BuildNotification(subject, body, lang string) Message {
	needHelp, _ := tr(lang, "footer.needHelp")
	footerNote := pickFooterNote(lang)

	if htmlT, ok := renderTemplate("notification", map[string]any{
		"Subject":    subject,
		"Body":       paragraphize(body),
		"Brand":      brand,
		"NeedHelp":   needHelp,
		"FooterNote": footerNote,
		"Year":       time.Now().Year(),
	}); ok {
		return Message{Subject: subject, Text: body, HTML: htmlT}
	}
	return Message{
		Subject: subject,
		Text:    body,
		HTML:    wrapHTML(subject, paragraphize(body), "", needHelp, footerNote),
	}
}

func BuildVerification(code, lang string) Message {
	subject, _ := tr(lang, "verify.subject")
	intro, _ := tr(lang, "verify.intro")
	needHelp, _ := tr(lang, "footer.needHelp")
	footerNote := pickFooterNote(lang)
	text := intro + " " + code

	if htmlT, ok := renderTemplate("verification", map[string]any{
		"Subject":    subject,
		"Intro":      intro,
		"Code":       html.EscapeString(code),
		"Brand":      brand,
		"NeedHelp":   needHelp,
		"FooterNote": footerNote,
		"Year":       time.Now().Year(),
	}); ok {
		return Message{Subject: subject, Text: text, HTML: htmlT}
	}

	htmlBody := `<p>` + html.EscapeString(intro) + `</p>
<div style="font-size:24px;font-weight:700;letter-spacing:2px;padding:12px 16px;border-radius:8px;border:1px solid #E5E7EB;display:inline-block;">` + html.EscapeString(code) + `</div>`
	return Message{
		Subject: subject,
		Text:    text,
		HTML:    wrapHTML(subject, htmlBody, "", needHelp, footerNote),
	}
}

func BuildReset(link, lang string) Message {
	subject, _ := tr(lang, "reset.subject")
	intro, _ := tr(lang, "reset.intro")
	button, _ := tr(lang, "reset.button")
	note, _ := tr(lang, "reset.note")
	expiry, _ := tr(lang, "reset.expiry")
	needHelp, _ := tr(lang, "footer.needHelp")
	footerNote := pickFooterNote(lang)

	text := intro + " " + link

	if htmlT, ok := renderTemplate("reset_password", map[string]any{
		"Subject":    subject,
		"Intro":      intro,
		"Button":     button,
		"Note":       note,
		"Expiry":     expiry,
		"Link":       link,
		"LinkEsc":    html.EscapeString(link),
		"Brand":      brand,
		"NeedHelp":   needHelp,
		"FooterNote": footerNote,
		"Year":       time.Now().Year(),
	}); ok {
		return Message{Subject: subject, Text: text, HTML: htmlT}
	}

	// Inline fallback (localized)
	btn := Button{Label: button, URL: link}
	htmlBody := `<p>` + html.EscapeString(intro) + `</p>` + buttonHTML(btn) +
		`<p style="margin-top:16px;color:` + brand.MutedHex + `;font-size:13px;">` + html.EscapeString(note) + `<br>` +
		`<span style="word-break:break-all;color:` + brand.LinkHex + `;">` + html.EscapeString(link) + `</span></p>`
	return Message{
		Subject: subject,
		Text:    text,
		HTML:    wrapHTML(subject, htmlBody, expiry, needHelp, footerNote),
	}
}

// ================= Inline fallback wrapper/components =================

type Button struct{ Label, URL string }

func buttonHTML(b Button) string {
	return `<p style="margin:20px 0;">
  <a href="` + html.EscapeString(b.URL) + `"
     style="background:` + brand.AccentHex + `;color:#ffffff;text-decoration:none;
            font-weight:600;padding:12px 20px;border-radius:10px;display:inline-block;">
    ` + html.EscapeString(b.Label) + `
  </a>
</p>`
}

// wrapHTML now also receives localized NeedHelp + FooterNote strings.
func wrapHTML(title, innerHTML, smallNote, needHelp, footerNote string) string {
	now := time.Now().UTC().Format("Jan 2, 2006 15:04 UTC")
	logo := ""
	if brand.LogoURL != "" {
		logo = `<img src="` + html.EscapeString(brand.LogoURL) + `" alt="` + html.EscapeString(brand.AppName) + `" height="32" style="display:block;">`
	}
	if smallNote != "" {
		smallNote = `<div style="margin-top:6px;color:` + brand.MutedHex + `;font-size:13px;">` + html.EscapeString(smallNote) + `</div>`
	}
	return `<!doctype html><html><head><meta charset="utf-8"><title>` + html.EscapeString(title) + `</title>
<meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:` + brand.BgHex + `;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:` + brand.BgHex + `;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;box-shadow:0 4px 14px rgba(15,23,42,0.06);overflow:hidden;">
        <tr><td style="padding:20px 24px;border-bottom:1px solid #F1F5F9;">
          <table role="presentation" width="100%"><tr>
            <td style="text-align:left;vertical-align:middle;">` + logo + `</td>
            <td style="text-align:right;vertical-align:middle;">
              <div style="font-size:12px;color:` + brand.MutedHex + `;">` + html.EscapeString(brand.AppName) + ` · ` + now + `</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 28px 8px 28px;">
          <h1 style="margin:0 0 4px 0;font-size:20px;line-height:28px;color:` + brand.TextHex + `;">` + html.EscapeString(title) + `</h1>
          ` + smallNote + `
        </td></tr>
        <tr><td style="padding:4px 28px 28px 28px;color:` + brand.TextHex + `;font-size:15px;line-height:22px;">` + innerHTML + `</td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #F1F5F9;">
          <div style="font-size:13px;color:` + brand.MutedHex + `;">` + html.EscapeString(footerNote) + `<br>
            ` + html.EscapeString(needHelp) + ` <a href="mailto:` + html.EscapeString(brand.SupportEmail) + `" style="color:` + brand.LinkHex + `;text-decoration:none;">` + html.EscapeString(brand.SupportEmail) + `</a>
            · <a href="` + html.EscapeString(brand.WebsiteURL) + `" style="color:` + brand.LinkHex + `;text-decoration:none;">` + html.EscapeString(brand.WebsiteURL) + `</a>
          </div>
        </td></tr>
      </table>
      <div style="font-size:12px;color:` + brand.MutedHex + `;margin-top:14px;">© ` +
		html.EscapeString(brand.AppName) + ` – ` + strconv.Itoa(time.Now().Year()) + `</div>
    </td></tr>
  </table>
</body></html>`
}

func paragraphize(s string) string {
	esc := html.EscapeString(s)
	esc = strings.ReplaceAll(esc, "\r\n", "\n")
	esc = strings.ReplaceAll(esc, "\r", "\n")
	parts := strings.Split(esc, "\n")
	for i, p := range parts {
		if p == "" {
			parts[i] = "<p></p>"
		} else {
			parts[i] = "<p>" + p + "</p>"
		}
	}
	return strings.Join(parts, "\n")
}
