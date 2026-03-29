package handlers

import (
	"encoding/json"
	"net/http"
	"time"
	"crypto/sha256"
	"encoding/hex"

	"minigallery/internal/models"
	"minigallery/internal/repository"
	"minigallery/internal/middleware"

	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	repo *repository.Repository
}

func NewAuthHandler(repo *repository.Repository) *AuthHandler {
	return &AuthHandler{repo: repo}
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
		return
	}

	user, err := h.repo.GetUserByName(req.Name)
	if err != nil || user == nil {
		http.Error(w, "Неверное имя или пароль", http.StatusUnauthorized)
		return
	}

	if user.Password != hashPassword(req.Password) {
		http.Error(w, "Неверное имя или пароль", http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &middleware.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(middleware.JwtKey)
	if err != nil {
		http.Error(w, "Ошибка создания токена", http.StatusInternalServerError)
		return
	}

	user.Password = ""

	response := models.LoginResponse{
		Token: tokenString,
		User:  *user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
		return
	}

	existing, _ := h.repo.GetUserByName(req.Name)
	if existing != nil {
		http.Error(w, "Пользователь уже существует", http.StatusBadRequest)
		return
	}

	hashedPassword := hashPassword(req.Password)

	err := h.repo.CreateUser(req.Name, hashedPassword, "user")
	if err != nil {
		http.Error(w, "Ошибка при создании пользователя", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Пользователь создан"})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Вы успешно вышли",
	})
}