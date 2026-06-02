package tracker

import (
	"encoding/json"
	"net/http"

	"api/internal/contextkeys"
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
	w.Header().Set("Content-Type", "application/json")

	query := r.URL.Query().Get("q")

	// MODE SEARCH
	if query != "" {
		resp, err := h.service.SearchTracker(r.Context(), query)
		if err != nil {
			http.Error(w, `{"error":"search failed"}`, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(resp)
		return
	}

	// MODE LIST ALL
	trackers, err := h.service.ListTrackers()
	if err != nil {
		http.Error(w, `{"error":"failed to fetch trackers"}`, http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(trackers)
}

func (h *Handler) GetTrackerByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.NotFound(w, r)
		return
	}

	trackerDetail, err := h.service.GetTrackerDetailByID(id)
	if err != nil {
		http.Error(w, `{"error":"tracker not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trackerDetail)
}

func (h *Handler) AddTracker(w http.ResponseWriter, r *http.Request) {
	var req AddTrackerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Get user ID from auth context (may be empty for anonymous)
	var userID *string
	if uid := contextkeys.GetUserID(r.Context()); uid != "" {
		userID = &uid
	}

	result, err := h.service.AddTracker(r.Context(), req.Keyword, userID)
	if err != nil {
		if err.Error() == "keyword cannot be empty" || err.Error() == "keyword must not exceed 200 characters" {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
			return
		}
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

func (h *Handler) DeleteTracker(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"id is required"}`, http.StatusBadRequest)
		return
	}

	err := h.service.DeleteTracker(r.Context(), id)
	if err != nil {
		if err.Error() == "tracker not found" {
			http.Error(w, `{"error":"tracker not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type UpdateIntervalRequest struct {
	ScrapeIntervalMinutes int `json:"scrape_interval_minutes"`
}

func (h *Handler) UpdateScrapeInterval(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"id is required"}`, http.StatusBadRequest)
		return
	}

	var req UpdateIntervalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if err := h.service.UpdateScrapeInterval(r.Context(), id, req.ScrapeIntervalMinutes); err != nil {
		if err.Error() == "tracker not found" {
			http.Error(w, `{"error":"tracker not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "scrape interval updated",
	})
}

// --- Share handlers ---

func (h *Handler) CreateShareLink(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"id is required"}`, http.StatusBadRequest)
		return
	}

	token, err := h.service.CreateShareLink(r.Context(), id)
	if err != nil {
		if err.Error() == "tracker not found" {
			http.Error(w, `{"error":"tracker not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error":"failed to create share link"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"token":   token,
		"url":     "/s/" + token,
	})
}

func (h *Handler) GetShareLink(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"id is required"}`, http.StatusBadRequest)
		return
	}

	share, err := h.service.GetShareLink(id)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch share link"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if share == nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"shared": false,
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"shared": true,
		"token":  share.Token,
		"url":    "/s/" + share.Token,
	})
}

func (h *Handler) DeleteShareLink(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, `{"error":"id is required"}`, http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteShareLink(r.Context(), id); err != nil {
		http.Error(w, `{"error":"share link not found"}`, http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) GetSharedTracker(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	if token == "" {
		http.NotFound(w, r)
		return
	}

	detail, err := h.service.GetSharedTracker(token)
	if err != nil {
		http.Error(w, `{"error":"share link not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(detail)
}

// --- Profile handlers ---

func (h *Handler) GetProfileStats(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	stats, err := h.service.GetUserStats(r.Context(), userID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch stats"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func (h *Handler) GetUserTrackers(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	trackers, err := h.service.GetUserTrackers(r.Context(), userID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch trackers"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trackers)
}
