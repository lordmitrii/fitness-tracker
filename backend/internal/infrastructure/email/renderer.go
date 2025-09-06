package email

import (
	"bytes"
	"html/template"
	"path/filepath"
)

var tpl *template.Template

func LoadTemplates(basePath string) error {
	var err error
	tpl, err = template.ParseGlob(filepath.Join(basePath, "templates/email/*.html"))
	return err
}

func renderTemplate(name string, data any) (string, bool) {
	if tpl == nil {
		return "", false
	}
	var buf bytes.Buffer
	if err := tpl.ExecuteTemplate(&buf, name, data); err != nil {
		return "", false
	}
	return buf.String(), true
}
