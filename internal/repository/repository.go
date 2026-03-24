package repository

import (
	"database/sql"
	"errors"
	"minigallery/internal/models"
	"strconv"

	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db  *sqlx.DB
	sql squirrel.StatementBuilderType
}

func New(db *sqlx.DB) *Repository {
	return &Repository{
		db:  db,
		sql: squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar),
	}
}

var ErrCategoryHasImages = errors.New("категория содержит изображения")

func (r *Repository) GetAllUsers() ([]models.User, error) {
	query, args, err := r.sql.
		Select("id", "name", "role").
		From("users").
		OrderBy("name").
		ToSql()
	if err != nil {
		return nil, err
	}

	var users []models.User
	err = r.db.Select(&users, query, args...)
	return users, err
}

func (r *Repository) GetUserByName(name string) (*models.User, error) {
	query, args, err := r.sql.
		Select("id", "name", "password", "role").
		From("users").
		Where(squirrel.Eq{"name": name}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.db.Get(&user, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *Repository) GetUserByID(id int) (*models.User, error) {
	query, args, err := r.sql.
		Select("id", "name", "role").
		From("users").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.db.Get(&user, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *Repository) CreateUser(name, password, role string) error {
	query, args, err := r.sql.
		Insert("users").
		Columns("name", "password", "role").
		Values(name, password, role).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) GetAllCategories() ([]models.Category, error) {
	query, args, err := r.sql.
		Select("id", "name").
		From("categories").
		OrderBy("name").
		ToSql()
	if err != nil {
		return nil, err
	}

	var categories []models.Category
	err = r.db.Select(&categories, query, args...)
	return categories, err
}

func (r *Repository) GetCategoryByID(id int) (*models.Category, error) {
	query, args, err := r.sql.
		Select("id", "name").
		From("categories").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var category models.Category
	err = r.db.Get(&category, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &category, err
}

func (r *Repository) CreateCategory(name string) error {
	query, args, err := r.sql.
		Insert("categories").
		Columns("name").
		Values(name).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) UpdateCategory(id int, name string) error {
	query, args, err := r.sql.
		Update("categories").
		Set("name", name).
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) DeleteCategory(id int) error {
	var count int
	countQuery, countArgs, err := r.sql.
		Select("COUNT(*)").
		From("images").
		Where(squirrel.Eq{"category_id": id}).
		ToSql()
	if err != nil {
		return err
	}

	err = r.db.Get(&count, countQuery, countArgs...)
	if err != nil {
		return err
	}

	if count > 0 {
		return ErrCategoryHasImages
	}

	deleteQuery, deleteArgs, err := r.sql.
		Delete("categories").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(deleteQuery, deleteArgs...)
	return err
}

func (r *Repository) GetAllImages(categoryID, authorID, search, limit, offset string) ([]models.Image, error) {
	q := r.sql.
		Select(
			"id", "title", "description", "file_path",
			"category_id", "uploaded_by", "created_at",
		).
		From("images").
		OrderBy("created_at DESC")

	if categoryID != "" && categoryID != "0" {
		q = q.Where(squirrel.Eq{"category_id": categoryID})
	}

	if authorID != "" && authorID != "0" {
		q = q.Where(squirrel.Eq{"uploaded_by": authorID})
	}

	if search != "" {
		q = q.Where(squirrel.ILike{"title": "%" + search + "%"})
	}

	if limit != "" {
		if limitVal, err := strconv.ParseUint(limit, 10, 64); err == nil {
			q = q.Limit(limitVal)
		}
	}

	if offset != "" {
		if offsetVal, err := strconv.ParseUint(offset, 10, 64); err == nil {
			q = q.Offset(offsetVal)
		}
	}

	query, args, err := q.ToSql()
	if err != nil {
		return nil, err
	}

	var images []models.Image
	err = r.db.Select(&images, query, args...)
	return images, err
}

func (r *Repository) GetImageByID(id int) (*models.Image, error) {
	query, args, err := r.sql.
		Select(
			"id", "title", "description", "file_path",
			"category_id", "uploaded_by", "created_at",
		).
		From("images").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, err
	}

	var image models.Image
	err = r.db.Get(&image, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &image, err
}

func (r *Repository) CreateImage(title, description, filePath string, categoryID, uploadedBy int) error {
	query, args, err := r.sql.
		Insert("images").
		Columns("title", "description", "file_path", "category_id", "uploaded_by").
		Values(title, description, filePath, categoryID, uploadedBy).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) UpdateImage(id int, title, description string, categoryID int) error {
	query, args, err := r.sql.
		Update("images").
		Set("title", title).
		Set("description", description).
		Set("category_id", categoryID).
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) UpdateImageWithFile(id int, title, description string, categoryID int, filePath string) error {
	query, args, err := r.sql.
		Update("images").
		Set("title", title).
		Set("description", description).
		Set("category_id", categoryID).
		Set("file_path", filePath).
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) DeleteImage(id int) error {
	query, args, err := r.sql.
		Delete("images").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, args...)
	return err
}

func (r *Repository) GetImagesByUserID(userID int) ([]models.Image, error) {
	query, args, err := r.sql.
		Select(
			"id", "title", "description", "file_path",
			"category_id", "uploaded_by", "created_at",
		).
		From("images").
		Where(squirrel.Eq{"uploaded_by": userID}).
		OrderBy("created_at DESC").
		ToSql()
	if err != nil {
		return nil, err
	}

	var images []models.Image
	err = r.db.Select(&images, query, args...)
	return images, err
}