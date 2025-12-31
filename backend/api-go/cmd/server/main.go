package main

import (
	"log"
	"net/http"
	"os"

	"api/internal/db"
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

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,

		Debug: true,
	})

	handler := c.Handler(router)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("API running on :" + port)

	log.Fatal(http.ListenAndServe(":"+port, handler))
}
