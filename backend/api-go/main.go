package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type WorkerResponse struct {
	Worker  string `json:"worker"`
	Message string `json:"message"`
}

func fetchWorker(url string) (WorkerResponse, error) {
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return WorkerResponse{}, err
	}
	defer resp.Body.Close()

	var result WorkerResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	return result, err
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	workers := []string{
		"http://localhost:8001/hello",
		"http://localhost:8002/hello",
	}

	results := []WorkerResponse{}

	for _, url := range workers {
		res, err := fetchWorker(url)
		if err != nil {
			results = append(results, WorkerResponse{
				Worker:  "unknown",
				Message: fmt.Sprintf("Failed to reach %s", url),
			})
			continue
		}
		results = append(results, res)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func main() {
	http.HandleFunc("/hello", helloHandler)

	fmt.Println("Go API running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
