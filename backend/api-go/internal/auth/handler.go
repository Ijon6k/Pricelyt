package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	"api/internal/contextkeys"

	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Password = strings.TrimSpace(req.Password)
	req.Username = strings.TrimSpace(req.Username)

	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error":"email and password are required"}`, http.StatusBadRequest)
		return
	}
	if len(req.Password) < 8 {
		http.Error(w, `{"error":"password must be at least 8 characters"}`, http.StatusBadRequest)
		return
	}
	if len(req.Password) > 128 {
		http.Error(w, `{"error":"password must not exceed 128 characters"}`, http.StatusBadRequest)
		return
	}
	if !strings.Contains(req.Email, "@") || !strings.Contains(req.Email, ".") {
		http.Error(w, `{"error":"invalid email format"}`, http.StatusBadRequest)
		return
	}
	if req.Username != "" {
		if len(req.Username) < 3 {
			http.Error(w, `{"error":"username must be at least 3 characters"}`, http.StatusBadRequest)
			return
		}
		if len(req.Username) > 32 {
			http.Error(w, `{"error":"username must not exceed 32 characters"}`, http.StatusBadRequest)
			return
		}
	}

	user, err := h.repo.CreateUser(r.Context(), req.Email, req.Password, req.Username)
	if err != nil {
		if err.Error() == "email already registered" || err.Error() == "username already taken" {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	token, err := GenerateToken(user.ID, user.Email)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error":"email and password are required"}`, http.StatusBadRequest)
		return
	}

	user, err := h.repo.FindByEmail(r.Context(), req.Email)
	if err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, `{"error":"invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	token, err := GenerateToken(user.ID, user.Email)
	if err != nil {
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AuthResponse{
		Token: token,
		User:  *user,
	})
}

// GetProfile returns the authenticated user's profile.
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := h.repo.FindByID(r.Context(), userID)
	if err != nil {
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"username":   user.Username,
		"created_at": user.CreatedAt,
	})
}

// UpdateProfile updates the authenticated user's profile (username).
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateUsername(r.Context(), userID, req.Username); err != nil {
		if err.Error() == "username already taken" {
			http.Error(w, `{"error":"username already taken"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"username": req.Username,
	})
}

// ChangePassword changes the authenticated user's password.
func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := contextkeys.GetUserID(r.Context())
	if userID == "" {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"invalid request body"}`, http.StatusBadRequest)
		return
	}

	req.CurrentPassword = strings.TrimSpace(req.CurrentPassword)
	req.NewPassword = strings.TrimSpace(req.NewPassword)

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, `{"error":"current and new password are required"}`, http.StatusBadRequest)
		return
	}
	if len(req.NewPassword) < 8 {
		http.Error(w, `{"error":"new password must be at least 8 characters"}`, http.StatusBadRequest)
		return
	}
	if len(req.NewPassword) > 128 {
		http.Error(w, `{"error":"new password must not exceed 128 characters"}`, http.StatusBadRequest)
		return
	}

	if err := h.repo.ChangePassword(r.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		if err.Error() == "current password is incorrect" {
			http.Error(w, `{"error":"current password is incorrect"}`, http.StatusBadRequest)
			return
		}
		http.Error(w, `{"error":"failed to change password"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "password changed successfully",
	})
}
