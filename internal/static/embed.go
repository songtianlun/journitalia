package static

import (
	"embed"
	"io/fs"
)

// EmbedFS embeds the frontend build directory
//
//go:embed all:build
var embedFS embed.FS

// GetFS returns the embedded filesystem with the build prefix stripped
func GetFS() (fs.FS, error) {
	return fs.Sub(embedFS, "build")
}
