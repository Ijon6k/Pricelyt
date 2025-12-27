package main

import (
	"log"
	"net/http"
	"os"

	"api/internal/db"
	apihttp "api/internal/http"

	"github.com/joho/godotenv"
)

func main() {
	// load env
	_ = godotenv.Load("../../.env") // ignore error, env bisa dari OS

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// connect db
	conn, err := db.NewPostgres(dsn)
	if err != nil {
		log.Fatal(err)
	}

	// 🔴 DEBUG: pastikan DB yang dipakai API
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

	// http server
	router := apihttp.NewRouter(conn)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("API running on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
