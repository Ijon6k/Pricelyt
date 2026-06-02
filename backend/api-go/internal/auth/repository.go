package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           string    `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, email, password string) (*User, error) {
	// Check if user already exists
	var existing User
	err := r.db.GetContext(ctx, &existing, "SELECT id FROM users WHERE email = $1", email)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if err == nil {
		return nil, errors.New("email already registered")
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Insert user
	var user User
	query := `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id, email, created_at
	`
	err = r.db.GetContext(ctx, &user, query, email, string(hash))
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	err := r.db.GetContext(ctx, &user, "SELECT id, email, password_hash, created_at FROM users WHERE email = $1", email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	var user User
	err := r.db.GetContext(ctx, &user, "SELECT id, email, password_hash, created_at FROM users WHERE id = $1", id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := r.FindByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = r.db.ExecContext(ctx, "UPDATE users SET password_hash = $1 WHERE id = $2", string(hash), userID)
	return err
}
