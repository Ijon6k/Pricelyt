package tracker

import (
	"encoding/json"
	"net/http"
	"strings"
)

type Handler struct {
	service *Service
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
	// Path: /trackers/{id}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) != 2 {
		http.NotFound(w, r)
		return
	}

	id := parts[1]

	tracker, err := h.service.GetTrackerByID(id)
	if err != nil {
		http.Error(w, "tracker not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracker)
}
