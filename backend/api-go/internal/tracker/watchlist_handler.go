package tracker

import (
	"encoding/json"
	"net/http"

	"api/internal/contextkeys"
)

type WatchlistHandler struct {
	repo *WatchlistRepository
}

func NewWatchlistHandler(repo *WatchlistRepository) *WatchlistHandler {
	return &WatchlistHandler{repo: repo}
}

func (h *WatchlistHandler) AddToWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"login required"}`, http.StatusUnauthorized)
		return
	}

	trackerID := r.PathValue("id")
	if trackerID == "" {
		http.Error(w, `{"error":"tracker id required"}`, http.StatusBadRequest)
		return
	}

	if err := h.repo.Add(r.Context(), userID, trackerID); err != nil {
		http.Error(w, `{"error":"failed to add to watchlist"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"watched":    true,
		"tracker_id": trackerID,
	})
}

func (h *WatchlistHandler) RemoveFromWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"login required"}`, http.StatusUnauthorized)
		return
	}

	trackerID := r.PathValue("id")
	if trackerID == "" {
		http.Error(w, `{"error":"tracker id required"}`, http.StatusBadRequest)
		return
	}

	if err := h.repo.Remove(r.Context(), userID, trackerID); err != nil {
		http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *WatchlistHandler) GetWatchlist(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"login required"}`, http.StatusUnauthorized)
		return
	}

	trackers, err := h.repo.GetUserWatchlist(userID)
	if err != nil {
		http.Error(w, `{"error":"failed to fetch watchlist"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(trackers)
}

func (h *WatchlistHandler) GetWatchlistStatus(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"watched": false})
		return
	}

	trackerID := r.PathValue("id")
	if trackerID == "" {
		http.Error(w, `{"error":"tracker id required"}`, http.StatusBadRequest)
		return
	}

	watched, err := h.repo.IsWatched(userID, trackerID)
	if err != nil {
		http.Error(w, `{"error":"failed"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"watched": watched})
}
