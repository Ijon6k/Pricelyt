package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

// ──────────────────────────────────────────────
// Models
// ──────────────────────────────────────────────

type User struct {
	ID                 string     `db:"id" json:"id"`
	Email              string     `db:"email" json:"email"`
	Username           *string    `db:"username" json:"username"`
	PasswordHash       string     `db:"password_hash" json:"-"`
	EmailVerified      bool       `db:"email_verified" json:"email_verified"`
	VerificationToken  *string    `db:"verification_token" json:"-"`
	VerificationSentAt *time.Time `db:"verification_sent_at" json:"-"`
	CreatedAt          time.Time  `db:"created_at" json:"created_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type UpdateProfileRequest struct {
	Username string `json:"username"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// ──────────────────────────────────────────────
// Repository
// ──────────────────────────────────────────────

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

// generateVerificationToken creates a cryptographically random 32-char hex token.
func generateVerificationToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// CreateUser registers a new user.
func (r *Repository) CreateUser(ctx context.Context, email, password, username string) (*User, error) {
	// Check for existing user
	var existingID string
	err := r.db.GetContext(ctx, &existingID, "SELECT id FROM users WHERE email = $1", email)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if err == nil {
		return nil, errors.New("email already registered")
	}

	// Check username uniqueness if provided
	if username != "" {
		var existingUsername string
		err := r.db.GetContext(ctx, &existingUsername, "SELECT id FROM users WHERE username = $1", username)
		if err != nil && err != sql.ErrNoRows {
			return nil, err
		}
		if err == nil {
			return nil, errors.New("username already taken")
		}
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate verification token
	token := generateVerificationToken()

	// Insert user
	var user User
	var usernamePtr *string
	if username != "" {
		usernamePtr = &username
	}
	query := `
		INSERT INTO users (email, password_hash, email_verified, verification_token, verification_sent_at, username)
		VALUES ($1, $2, FALSE, $3, NOW(), $4)
		RETURNING id, email, username, password_hash, email_verified, created_at
	`
	err = r.db.GetContext(ctx, &user, query, email, string(hash), token, usernamePtr)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// VerifyEmail marks a user's email as verified if the token is valid.
func (r *Repository) VerifyEmail(ctx context.Context, token string) (*User, error) {
	var user User
	query := `
		UPDATE users
		SET email_verified = TRUE, verification_token = NULL, verification_sent_at = NULL
		WHERE verification_token = $1 AND email_verified = FALSE
		RETURNING id, email, username, email_verified, created_at
	`
	err := r.db.GetContext(ctx, &user, query, token)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("invalid or expired verification token")
		}
		return nil, err
	}
	return &user, nil
}

// ResendVerification generates a new token for an unverified user.
func (r *Repository) ResendVerification(ctx context.Context, email string) (string, error) {
	token := generateVerificationToken()
	query := `
		UPDATE users
		SET verification_token = $1, verification_sent_at = NOW()
		WHERE email = $2 AND email_verified = FALSE
		RETURNING id
	`
	var id string
	err := r.db.GetContext(ctx, &id, query, token, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("user not found or already verified")
		}
		return "", err
	}
	return token, nil
}

// FindByEmail returns a user by email.
func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	query := `SELECT id, email, username, password_hash, email_verified, created_at FROM users WHERE email = $1`
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID returns a user by ID.
func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	var user User
	query := `SELECT id, email, username, password_hash, email_verified, created_at FROM users WHERE id = $1`
	err := r.db.GetContext(ctx, &user, query, id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// ChangePassword verifies the current password and sets a new one.
func (r *Repository) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := r.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", string(hash), userID)
	return err
}

// UpdateUsername updates the user's display name.
func (r *Repository) UpdateUsername(ctx context.Context, userID, username string) error {
	if username == "" {
		return errors.New("username cannot be empty")
	}
	if len(username) < 3 {
		return errors.New("username must be at least 3 characters")
	}
	if len(username) > 32 {
		return errors.New("username must not exceed 32 characters")
	}

	// Check uniqueness
	var existingID string
	err := r.db.GetContext(ctx, &existingID, "SELECT id FROM users WHERE username = $1 AND id != $2", username, userID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == nil {
		return errors.New("username already taken")
	}

	_, err = r.db.ExecContext(ctx, "UPDATE users SET username = $1 WHERE id = $2", username, userID)
	return err
}
