package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"minigallery/internal/config"
	"minigallery/internal/handlers"
	"minigallery/internal/middleware"
	"minigallery/internal/repository"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	"github.com/rs/cors"
	_ "github.com/lib/pq"
)

func main() {
	cfg := config.Load()

	middleware.InitJWT(cfg.JWTSecret)
	log.Println("JWT инициализирован")

	if err := os.MkdirAll(cfg.UploadPath, 0755); err != nil {
		log.Fatal("Не удалось создать папку для загрузок:", err)
	}

	db, err := sqlx.Connect("postgres", cfg.GetDBConnString())
	if err != nil {
		log.Fatal("Не удалось подключиться к БД:", err)
	}
	defer db.Close()

	log.Println("Подключение к БД успешно!")

	repo := repository.New(db)

	authHandler := handlers.NewAuthHandler(repo)
	userHandler := handlers.NewUserHandler(repo)
	categoryHandler := handlers.NewCategoryHandler(repo)
	imageHandler := handlers.NewImageHandler(repo, cfg.UploadPath)

	r := mux.NewRouter()

	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasSuffix(r.URL.Path, ".js") {
				w.Header().Set("Content-Type", "application/javascript")
			}
			next.ServeHTTP(w, r)
		})
	})

	r.PathPrefix("/web/").Handler(http.StripPrefix("/web/", http.FileServer(http.Dir("./web"))))
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))

	api := r.PathPrefix("/api").Subrouter()

	api.HandleFunc("/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/users", userHandler.GetAllUsers).Methods("GET")
	api.HandleFunc("/users/{id}", userHandler.GetUserByID).Methods("GET")
	api.HandleFunc("/categories", categoryHandler.GetAllCategories).Methods("GET")
	api.HandleFunc("/images", imageHandler.GetAllImages).Methods("GET")
	api.HandleFunc("/images/upload", imageHandler.UploadImage).Methods("POST")
	api.HandleFunc("/images/{id}", imageHandler.GetImageByID).Methods("GET")
	api.HandleFunc("/images/{id}", imageHandler.UpdateImage).Methods("PUT")
	api.HandleFunc("/images/{id}", imageHandler.DeleteImage).Methods("DELETE")
	api.HandleFunc("/categories", categoryHandler.CreateCategory).Methods("POST")
	api.HandleFunc("/categories/{id}", categoryHandler.UpdateCategory).Methods("PUT")
	api.HandleFunc("/categories/{id}", categoryHandler.DeleteCategory).Methods("DELETE")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-User-Id"},
		AllowCredentials: true,
	})
	handler := c.Handler(r)

	log.Printf("Сервер запущен на порту %s", cfg.ServerPort)
	log.Printf("Папка для загрузок: %s", cfg.UploadPath)
	log.Fatal(http.ListenAndServe(":"+cfg.ServerPort, handler))
}