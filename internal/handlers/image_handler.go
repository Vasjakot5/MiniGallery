package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"minigallery/internal/middleware"
	"minigallery/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

type ImageHandler struct {
	repo       *repository.Repository
	uploadPath string
}

func NewImageHandler(repo *repository.Repository, uploadPath string) *ImageHandler {
	return &ImageHandler{
		repo:       repo,
		uploadPath: uploadPath,
	}
}

func (h *ImageHandler) getUserIDFromToken(tokenString string) (int, error) {
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

func (h *ImageHandler) GetAllImages(w http.ResponseWriter, r *http.Request) {
	categoryID := r.URL.Query().Get("category")
	authorID := r.URL.Query().Get("author")
	search := r.URL.Query().Get("search")
	limit := r.URL.Query().Get("limit")
	offset := r.URL.Query().Get("offset")

	images, err := h.repo.GetAllImages(categoryID, authorID, search, limit, offset)
	if err != nil {
		http.Error(w, "Ошибка при получении изображений", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(images)
}

func (h *ImageHandler) GetImageByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	image, err := h.repo.GetImageByID(id)
	if err != nil {
		http.Error(w, "Ошибка при получении изображения", http.StatusInternalServerError)
		return
	}

	if image == nil {
		http.Error(w, "Изображение не найдено", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(image)
}

func (h *ImageHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		http.Error(w, "Неверный формат токена", http.StatusUnauthorized)
		return
	}
	tokenString := parts[1]

	userID, err := h.getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Файл слишком большой", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Ошибка при получении файла", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		http.Error(w, "Неверный формат файла. Допустимы: JPG, PNG, WEBP", http.StatusBadRequest)
		return
	}

	if handler.Size > 5<<20 {
		http.Error(w, "Файл слишком большой (макс. 5 MB)", http.StatusBadRequest)
		return
	}

	if err := os.MkdirAll(h.uploadPath, 0755); err != nil {
		http.Error(w, "Ошибка сервера", http.StatusInternalServerError)
		return
	}

	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(h.uploadPath, filename)

	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Ошибка при сохранении файла", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Ошибка при сохранении файла", http.StatusInternalServerError)
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	categoryID, _ := strconv.Atoi(r.FormValue("category_id"))

	err = h.repo.CreateImage(title, description, "/uploads/images/"+filename, categoryID, userID)
	if err != nil {
		http.Error(w, "Ошибка при сохранении в БД", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Изображение успешно загружено",
		"path":    "/uploads/images/" + filename,
	})
}

func (h *ImageHandler) UpdateImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	userID, err := h.getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	image, err := h.repo.GetImageByID(id)
	if err != nil || image == nil {
		http.Error(w, "Изображение не найдено", http.StatusNotFound)
		return
	}

	if image.UploadedBy != userID {
		http.Error(w, "Нет прав для редактирования", http.StatusForbidden)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Файл слишком большой", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	description := r.FormValue("description")
	categoryID, _ := strconv.Atoi(r.FormValue("category_id"))

	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		ext := strings.ToLower(filepath.Ext(handler.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
			http.Error(w, "Неверный формат файла", http.StatusBadRequest)
			return
		}

		if handler.Size > 5<<20 {
			http.Error(w, "Файл слишком большой", http.StatusBadRequest)
			return
		}

		oldFilename := filepath.Base(image.FilePath)
		oldPath := filepath.Join(h.uploadPath, oldFilename)
		os.Remove(oldPath)

		filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
		filePath := filepath.Join(h.uploadPath, filename)

		dst, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Ошибка при сохранении файла", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		_, err = io.Copy(dst, file)
		if err != nil {
			http.Error(w, "Ошибка при сохранении файла", http.StatusInternalServerError)
			return
		}

		err = h.repo.UpdateImageWithFile(id, title, description, categoryID, "/uploads/images/"+filename)
	} else {
		err = h.repo.UpdateImage(id, title, description, categoryID)
	}

	if err != nil {
		http.Error(w, "Ошибка при обновлении", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Изображение обновлено"})
}

func (h *ImageHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Неверный ID", http.StatusBadRequest)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Не авторизован", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	userID, err := h.getUserIDFromToken(tokenString)
	if err != nil {
		http.Error(w, "Недействительный токен", http.StatusUnauthorized)
		return
	}

	image, err := h.repo.GetImageByID(id)
	if err != nil || image == nil {
		http.Error(w, "Изображение не найдено", http.StatusNotFound)
		return
	}

	if image.UploadedBy != userID {
		http.Error(w, "Нет прав для удаления", http.StatusForbidden)
		return
	}

	filename := filepath.Base(image.FilePath)
	filePath := filepath.Join(h.uploadPath, filename)
	os.Remove(filePath)

	err = h.repo.DeleteImage(id)
	if err != nil {
		http.Error(w, "Ошибка при удалении изображения", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Изображение удалено"})
}