package forms

import (
	"regexp"
	"strings"
)

var (
	nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`) // runs of non-alphanumerics
	trimDashes  = regexp.MustCompile(`^-+|-+$`)    // leading/trailing dashes
)

// slugify turns a human name into a URL-safe slug:
//
//	"Contact Us!" -> "contact-us"
//	"  Q3   Survey  " -> "q3-survey"
//
// Lowercased, non-alphanumerics collapsed to single dashes, edges trimmed.
func Slugify(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = nonAlphaNum.ReplaceAllString(s, "_")
	s = trimDashes.ReplaceAllString(s, "")
	return s
}
