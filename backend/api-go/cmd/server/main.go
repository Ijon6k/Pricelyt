package main

import (
	"log"
	"net/http"

	internalhttp "api/internal/http"
)

func main() {
	router := internalhttp.NewRouter()

	log.Println("API running on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
