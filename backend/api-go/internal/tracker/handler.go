package tracker

import (
	"encoding/json"
	"net/http"
	"strings"
)

type Handler struct {
	service *Service
}
type AddTrackerRequest struct {
	Keyword string `json:"keyword"`
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetTrackers(w http.ResponseWriter, r *http.Request) {
	trackers, err := h.service.ListTrackers()
	if err != nil {
		http.Error(w, "failed to fetch trackers", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trackers)
}

func (h *Handler) GetTrackerByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 2 {
		http.NotFound(w, r)
		return
	}

	id := parts[1]

	trackerDetail, err := h.service.GetTrackerDetailByID(id)
	if err != nil {
		http.Error(w, "tracker not found or error fetching data", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trackerDetail)
}

func (h *Handler) AddTracker(w http.ResponseWriter, r *http.Request) {
	var req AddTrackerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Wrong Format Json", http.StatusBadRequest)
	}

	result, err := h.service.AddTracker(r.Context(), req.Keyword)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) DeleteTracker(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	err := h.service.DeleteTracker(r.Context(), id)
	if err != nil {
		if err.Error() == "tracker not found" {
			http.Error(w, "Tracker not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
