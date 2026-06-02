package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"api/internal/db"
	"api/internal/auth"
	apihttp "api/internal/http"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	_ = godotenv.Load("../../.env")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	conn, err := db.NewPostgres(dsn)
	if err != nil {
		log.Fatal(err)
	}

	var addr, dbname string
	err = conn.QueryRow(
		"SELECT inet_server_addr()::text, current_database()",
	).Scan(&addr, &dbname)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("API CONNECTED TO DB:")
	log.Println("  address :", addr)
	log.Println("  database:", dbname)

	router := apihttp.NewRouter(conn)

	// Init JWT secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "pricelyt-jwt-secret-change-in-production"
	}
	auth.Init(jwtSecret)


	// Allowed CORS origins come from env (comma-separated). Behind the
	// nginx reverse proxy the frontend and API share an origin, so CORS
	// is effectively a no-op there, but keep it configurable for dev.
	origins := []string{"http://localhost:3000", "http://localhost:4444"}
	if env := os.Getenv("CORS_ORIGINS"); env != "" {
		origins = strings.Split(env, ",")
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Authorization", "X-Admin-Key"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("API running on :" + port)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
