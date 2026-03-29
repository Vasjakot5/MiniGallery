package tests

import (
	"testing"
)

type TestCategory struct {
	ID   int
	Name string
}

type TestCategoryImage struct {
	ID         int
	CategoryID int
}

func TestCategoryDeleteWithImages(t *testing.T) {
	tests := []struct {
		name       string
		categoryID int
		images     []TestCategoryImage
		canDelete  bool
	}{
		{
			name:       "Разрешено удалять пустую категорию",
			categoryID: 1,
			images:     []TestCategoryImage{},
			canDelete:  true,
		},
		{
			name:       "Запрещено удалять категорию с изображениями",
			categoryID: 1,
			images: []TestCategoryImage{
				{ID: 1, CategoryID: 1},
				{ID: 2, CategoryID: 1},
			},
			canDelete: false,
		},
		{
			name:       "Запрещено удалять категорию с одним изображением",
			categoryID: 2,
			images: []TestCategoryImage{
				{ID: 3, CategoryID: 2},
			},
			canDelete: false,
		},
		{
			name:       "Разрешено удалять другую категорию без изображений",
			categoryID: 3,
			images: []TestCategoryImage{
				{ID: 1, CategoryID: 1},
				{ID: 2, CategoryID: 2},
			},
			canDelete: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			count := 0
			for _, img := range tt.images {
				if img.CategoryID == tt.categoryID {
					count++
				}
			}

			canDelete := count == 0

			if canDelete != tt.canDelete {
				t.Errorf("Категория: %d; Ожидаемый результат удаления=%v, Получаем: %v (Количество изображение: %d)",
					tt.categoryID, tt.canDelete, canDelete, count)
			} else {
				t.Logf("Категория: %d; Количество изображение=%d, Можно удалить?=%v",
					tt.categoryID, count, canDelete)
			}
		})
	}
}

func TestMultipleCategoriesWithImages(t *testing.T) {
	categories := []TestCategory{
		{ID: 1, Name: "Природа"},
		{ID: 2, Name: "Города"},
		{ID: 3, Name: "Люди"},
	}

	images := []TestCategoryImage{
		{ID: 1, CategoryID: 1},
		{ID: 2, CategoryID: 1},
		{ID: 3, CategoryID: 2},
	}

	expectedResults := map[int]bool{
		1: false,
		2: false,
		3: true,
	}

	for _, cat := range categories {
		count := 0
		for _, img := range images {
			if img.CategoryID == cat.ID {
				count++
			}
		}

		canDelete := count == 0
		expected := expectedResults[cat.ID]

		if canDelete != expected {
			t.Errorf("Категория: %s (%d); Ожидаемый: %v, Получаемый: %v", cat.Name, cat.ID, expected, canDelete)
		} else {
			t.Logf("Категория: %s; %d изображений, возможность удаления: %v", cat.Name, count, canDelete)
		}
	}
}