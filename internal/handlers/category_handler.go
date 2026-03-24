package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"minigallery/internal/middleware"
	"minigallery/internal/models"
	"minigallery/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

type CategoryHandler struct {
	repo *repository.Repository
}

func NewCategoryHandler(repo *repository.Repository) *CategoryHandler {
	return &CategoryHandler{repo: repo}
}

func getUserIDFromToken(tokenString string) (int, error) {
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return middleware.JwtKey, nil
	})

	if err != nil || !token.Valid {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fmt.Errorf("неверный формат claims")
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fmt.Errorf("user_id не найден в токене")
	}

	return int(userID), nil
}

func (h *CategoryHandler) GetAllCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.repo.GetAllCategories()
	if err != nil {
		http.Error(w, "Ошибка при получении категорий", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *CategoryHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	userID, err := getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	user, err := h.repo.GetUserByID(userID)
	if err != nil || user == nil || user.Role != models.RoleAdmin {
		http.Error(w, "Доступ запрещен", http.StatusForbidden)
		return
	}

	var category models.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
		return
	}

	if category.Name == "" {
		http.Error(w, "Название категории обязательно", http.StatusBadRequest)
		return
	}

	err = h.repo.CreateCategory(category.Name)
	if err != nil {
		http.Error(w, "Ошибка при создании категории", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Категория создана"})
}

func (h *CategoryHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	userID, err := getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	user, err := h.repo.GetUserByID(userID)
	if err != nil || user == nil || user.Role != models.RoleAdmin {
		http.Error(w, "Доступ запрещен", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	var category models.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, "Неверный формат запроса", http.StatusBadRequest)
		return
	}

	if category.Name == "" {
		http.Error(w, "Название категории обязательно", http.StatusBadRequest)
		return
	}

	err = h.repo.UpdateCategory(id, category.Name)
	if err != nil {
		http.Error(w, "Ошибка при обновлении категории", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Категория обновлена"})
}

func (h *CategoryHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	userID, err := getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	user, err := h.repo.GetUserByID(userID)
	if err != nil || user == nil || user.Role != models.RoleAdmin {
		http.Error(w, "Доступ запрещен", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	err = h.repo.DeleteCategory(id)
	if err != nil {
		http.Error(w, "Ошибка при удалении категории", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Категория удалена"})
}