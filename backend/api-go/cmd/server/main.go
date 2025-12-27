package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"api/internal/db"
	internalhttp "api/internal/http"
)

func main() {
	// load .env (safe: ignore error di production)
	_ = godotenv.Load("../../.env")

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// init database
	database, err := db.NewPostgres(databaseURL)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// init router (inject db)
	router := internalhttp.NewRouter(database)

	log.Printf("API running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
