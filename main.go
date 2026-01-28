package main

import (
	"fmt"
	"log"

	"github.com/songtianlun/diaria/internal/api"
	_ "github.com/songtianlun/diaria/internal/migrations"
	"github.com/songtianlun/diaria/internal/static"

	"github.com/labstack/echo/v5"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/spf13/cobra"
)

func main() {
	app := pocketbase.New()

	// Register migrations
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true, // Auto-run migrations on startup
	})

	// Add version command
	app.RootCmd.AddCommand(&cobra.Command{
		Use:   "version",
		Short: "Print the version number",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("%s version %s\n", Name, Version)
		},
	})

	// Register custom routes and serve embedded frontend
	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Register API routes
		api.RegisterDiaryRoutes(app, e)

		// Serve embedded frontend static files
		staticFS, err := static.GetFS()
		if err != nil {
			log.Printf("Warning: Failed to get embedded static files: %v", err)
		} else {
			// Serve static files from embedded FS
			// Use a catch-all route for SPA support
			e.Router.GET("/*", echo.StaticDirectoryHandler(staticFS, false))
		}

		return nil
	})

	// Start the application
	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
