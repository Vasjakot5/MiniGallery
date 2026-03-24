package models

import (
	"time"
)

type Role string

const (
	RoleAdmin Role = "admin"
	RoleUser  Role = "user"
)

type User struct {
	ID       int    `db:"id" json:"id"`
	Name     string `db:"name" json:"name"`
	Password string `db:"password" json:"-"`
	Role     Role   `db:"role" json:"role"`
}

type Category struct {
	ID   int    `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

type Image struct {
	ID          int       `db:"id" json:"id"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	FilePath    string    `db:"file_path" json:"file_path"`
	CategoryID  int       `db:"category_id" json:"category_id"`
	UploadedBy  int       `db:"uploaded_by" json:"uploaded_by"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

type LoginRequest struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}